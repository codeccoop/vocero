<?php

require_once VOCERO_API_ROOT . 'resources/BaseResource.php';
require_once VOCERO_API_ROOT . 'resources/Workflow.php';
require_once VOCERO_API_ROOT . 'resources/Commit.php';
require_once VOCERO_API_ROOT . 'lib/Cache.php';

class WorkflowCache extends Cache
{
    private $key = 'worflow_run';
    private $commit_sha;
    private $workflow_id;

    public function __construct($commit, $workflow)
    {
        parent::__construct($this->key);
        $this->commit_sha = $commit['sha'];
        $this->workflow_id = $workflow['id'];
    }

    public function is_cached()
    {
        $cache = new Cache($this->key);
        if ($cache->is_cached()) {
            $data = $cache->get();
            return $data['head_sha'] == $this->commit_sha && $data['workflow_id'] === $this->workflow_id;
        }

        return false;
    }

    public function get()
    {
        $data = (new Cache($this->key))->get();
        if ($data['conclusion'] === null) {
            return null;
        }

        return $data;
    }

    public function get_run_id()
    {
        return (new Cache($this->key))->get()['id'];
    }
}

class WorkflowRun extends BaseResource
{
    protected $cached = false;
    // protected $endpoint = '/repos/$GH_USER/$GH_REPO/actions/runs';
    protected $endpoint = '/repos/$GH_USER/$GH_REPO/actions/workflows/$WF_ID/runs';

    private $id = null;
    private $commit = null;

    protected $custom_cache;

    public function __construct()
    {
        parent::__construct();

        $this->commit = (new Commit())->get();
        $workflow = (new Workflow())->get();
        $this->custom_cache = new WorkflowCache($this->commit, $workflow);
        $this->endpoint = str_replace('$WF_ID', $workflow['id'], $this->endpoint);
    }

    public function get()
    {
        if ($this->custom_cache->is_cached()) {
            $run = $this->custom_cache->get();
            if ($run) return $run;
            else $this->id = $this->custom_cache->get_run_id();
            return $this->get_one();
        }

        return $this->get_all();
    }

    protected function get_endpoint($method)
    {
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'ONE':
                return $this->get_single_endpoint($this->id);
            default:
                return $this->endpoint;
        }
    }

    protected function get_query($method)
    {
        if ($method !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'ALL') return null;

        return [
            'created' => '>=' . preg_replace('/T.*$/', '', date('c', strtotime($this->commit['committer']['date']))),
        ];
    }

    private function get_single_endpoint($run_id)
    {
        return preg_replace('/workflows\/.+$/', 'runs/' . $run_id, $this->endpoint);
    }

    private function get_one()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $_SERVER['REQUEST_METHOD'] = 'ONE';
        try {
            $data = parent::get();
        } catch (Exception $e) {
            throw $e;
        } finally {
            $_SERVER['REQUEST_METHOD'] = $method;
        }

        return $this->custom_cache->post($data);
    }

    private function get_all()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $_SERVER['REQUEST_METHOD'] = 'ALL';
        try {
            $data = parent::get();
        } catch (Exception $e) {
            throw $e;
        } finally {
            $_SERVER['REQUEST_METHOD'] = $method;
        }

        $workflow_run = null;
        if ($data['total_count'] > 0) {
            foreach ($data['workflow_runs'] as $run) {
                if ($run['head_sha'] === $this->commit['sha']) {
                    $workflow_run = $run;
                    break;
                }
            }
        }

        if ($workflow_run === null) {
            throw new Exception('WorkflowRun not found', 404);
        }

        return $this->custom_cache->post($workflow_run);
    }
}
