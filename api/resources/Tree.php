<?php

require_once VOCERO_API_ROOT . 'resources/BaseResource.php';

class Tree extends BaseResource
{
    public $endpoint = '/repos/$GH_USER/$GH_REPO/git/trees';

    protected $cache_key = 'tree';

    public function __construct($sha = null)
    {
        $this->sha = $sha;
        parent::__construct();
    }

    public function post($payload = null)
    {
        $sha = parent::post($payload)['sha'];
        $this->cache->truncate();
        return (new Tree($sha))->get();
    }

    protected function get_endpoint($method)
    {
        switch ($method) {
            case 'GET':
                return $this->endpoint . '/' . $this->sha . '?recursive=1';
            default:
                return $this->endpoint;
        }
    }

    protected function get_payload($method, $data = null)
    {
        if (!$data) return null;

        $output = [
            'tree' => $data['changes']
        ];

        if (isset($data['base_sha'])) {
            $output['base_tree'] = $data['base_sha'];
        }

        return $output;
    }

    protected function decorate($data = null)
    {
        $tree = $this->build_tree();

        return [
            'sha' => $tree['sha'],
            'children' => $this->get_children($tree)
        ];
    }

    private function get_children($tree)
    {
        $items = [];
        foreach ($tree['children'] as $name => $node) {
            $item = array();
            $item['name'] = $name;
            $item['sha'] = $node['sha'];
            $item['path'] = $node['path'];
            $item['is_file'] = $node['mode'] != '040000' && sizeof($node['children']) == 0;

            $item['children'] = $this->get_children($node);
            $items[] = $item;
        }

        return $items;
    }

    private function build_tree()
    {
        $data = $this->get();
        $tree = ['children' => [], 'sha' => $data['sha']];

        $items = $data['tree'];
        for ($i = 0; $i < sizeof($items); $i++) {
            $item = $items[$i];
            $path = explode('/', $item['path']);
            $path_length = sizeof($path);

            $node = &$tree;
            for ($j = 0; $j < $path_length; $j++) {
                $level = $path[$j];
                if (!in_array($level, array_keys($node['children']))) {
                    $node['children'][$level] = array('children' => array());
                }
                $node = &$node['children'][$level];
            }

            foreach ($item as $key => $value) {
                $node[$key] = $value;
            }
        }

        return $this->prune_tree($tree);
    }

    private function prune_tree($tree)
    {
        $paths = [
            '_posts',
            '_drafts',
        ];

        $children = [];
        foreach (array_keys($tree['children']) as $name) {
            if ($tree['children'][$name]['type'] == 'blob' || in_array($name, $paths)) {
                array_push($children, $tree['children'][$name]);
            }
        }

        $children = array_filter($children, array($this, 'prune_branch'));
        $named_children = array();
        foreach ($children as $child) {
            foreach ($tree['children'] as $name => $node) {
                if ($node['sha'] == $child['sha']) {
                    $named_children[preg_replace('/^_/', '', $name)] = $node;
                }
            }
        }

        if (in_array('_data', array_keys($tree['children']))) {
            $data = $tree['children']['_data'];
            $data['children'] = array_filter($data['children'], function ($node) {
                return $this->prune_branch($node, ["yml"]);
            });
            $named_children['data'] = $data;
        }

        if (in_array('assets', array_keys($tree['children']))) {
            $assets = $tree['children']['assets'];
            $assets['children'] = array_filter($assets['children'], function ($node) {
                return $this->prune_branch($node, ['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'jpe', 'gif', 'svg', 'bmp', 'ico', 'svgz']);
            });
            $named_children['assets'] = $assets;
        }
        $tree['children'] = $named_children;
        $tree['is_file'] = false;

        return $tree;
    }

    private function match_extension($path, $ext)
    {
        return preg_match('/\.' . $ext . '$/', $path);
    }

    private function prune_branch($node, $file_types = ["md"])
    {
        if ($node['type'] == 'blob') {
            return array_reduce($file_types, function ($carry, $ext) use ($node) {
                return $carry || $this->match_extension($node['path'], $ext);
            }, false);
        }
        $children = array_filter($node['children'], function ($node) use ($file_types) {
            return $this->prune_tree($node, $file_types);
        });
        $named_children = array();
        foreach ($children as $child) {
            foreach ($node['children'] as $name => $_node) {
                if ($_node['sha'] == $child['sha']) {
                    $named_children[preg_replace('/^_/', '', $name)] = $node;
                }
            }
        }
        $node['children'] = $named_children;
        return true;
    }

    public function find_file($sha)
    {
        $tree = $this->get()['tree'];
        $file = array_pop(array_filter($tree, function ($file) use ($sha) {
            return $file['sha'] === $sha;
        }));

        return $file;
    }

    public function drop_leaf($sha, $path)
    {
        $tree = $this->get();
        $leafs = [];
        $directory = dirname($path);
        foreach ($tree['tree'] as $leaf) {
            if ($leaf['sha'] !== $sha) {
                $leaf_path = $leaf['path'];
                if ($directory !== '.' && preg_match("/^$directory/", $leaf_path)) {
                    $leaf['pruned'] = true;
                }
                if ($leaf['type'] !== 'tree') $leafs[] = $leaf;
            }
        }

        return $leafs;
    }
}
