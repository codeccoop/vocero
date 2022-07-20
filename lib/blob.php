<?php

require_once 'lib/dotfile.php';
require_once 'vendor/autoload.php';

use GuzzleHttp\Client;
use Symfony\Component\Yaml\Yaml;

class Blob
{
    public $sha = null;
    public $data = null;
    private $env = null;
    private $base_url = 'https://api.github.com';
    private $endpoint = '/repos/$GH_USER/$GH_REPO/git/blobs';

    function __construct($sha)
    {
        $this->sha = $sha;
        $this->env = (new Dotenv())->get();
        $this->endpoint = str_replace('$GH_USER', $this->env['GH_USER'], $this->endpoint);
        $this->endpoint = str_replace('$GH_REPO', $this->env['GH_REPO'], $this->endpoint);
    }

    public function get()
    {
        if ($this->data) {
            return $this->data;
        }

        $client = new Client(array('base_uri' => $this->base_url));
        $response = $client->request('GET', $this->endpoint . '/' . $this->sha . '?recursive=1', array(
            'headers' => array(
                'Accept' => 'application/vnd.github+json',
                'Authorization' => 'token ' . $this->env['GH_ACCESS_TOKEN']
            )
        ));

        $this->data = json_decode($response->getBody()->getContents(), true);
        return $this->data;
    }

    public function post($content)
    {
        $payload = array(
            'content' => str_replace(PHP_EOL, '\n', $content),
            'encoding' => 'base64'
        );

        $client = new Client(array('base_uri' => $this->base_url));
        $response = $client->request('POST', $this->endpoint, array(
            'json' => $payload,
            'headers' => array(
                'Accept' => 'application/vnd.github+json',
                'Authorization' => 'token ' . $this->env['GH_ACCESS_TOKEN']
            )
        ));

        return json_decode($response->getBody()->getContents(), true);
    }

    private function content()
    {
        $blob = $this->get();
        $decoded = base64_decode($blob['content']);
        return preg_replace('/---(\n|.)*---/m', '', $decoded);
    }

    private function frontmatter()
    {
        $blob = $this->get();
        $decoded = base64_decode($blob['content']);
        preg_match_all('/---(\n|.)*---/m', $decoded, $matches);
        return Yaml::parse(str_replace('---', '', $matches[0][0]));
    }

    private function filename()
    {
        $blob = $this->get();
        echo $blob['path'];
        return end(explode('/', $blob['path']));
    }

    public function render()
    {
        $content = $this->content();
        $frontmatter = $this->frontmatter();
        $filename = $this->filename();
        echo "<template id='blob' data-filename='{$filename}' data-sha='{$this->sha}'>" . $content . '</template>';
        echo "<ul>";
        foreach ($frontmatter as $key => $value) {
            $this->_render_item($key, $value);
        }
        echo "</ul>";
    }

    private function _render_item($key, $value)
    {
        if (is_array($value)) {
            echo "<li><strong>" . $key . "</strong>:<ul>";
            foreach ($value as $key => $value) {
                $this->_render_item($key, $value);
            }
            echo "</ul></li>";
        } else {
            echo "<li><strong>" . $key . "</strong>:<input type='text' value='" . $value . "'></li>";
        }
    }
}