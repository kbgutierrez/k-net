<?php

date_default_timezone_set('Asia/Manila');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/* load the MX_Router class */
require APPPATH . "third_party/MX/Controller.php";

/**
 * Description of my_controller
 *
 * @author Administrator
 */
class MY_Controller extends MX_Controller
{
    public $module_name;
    public $module_group = [];
    public $module = [];
    public $tableau_url;

    public function __construct()
    {
        parent::__construct();

        $this->output
            ->set_header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0')
            ->set_header('Cache-Control: post-check=0, pre-check=0', false)
            ->set_header('Pragma: no-cache')
            ->set_header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

        if (version_compare(CI_VERSION, '2.1.0', '<')) {
            $this->load->library('security');
        }

        $this->module_name = strtolower($this->router->fetch_module());
        $this->tableau_url = 'tableau.lemonsquare.com.ph';

        // Load module_group and module for all controllers if user is logged in
        if ($this->session->userdata('user_info')) {
            $this->load->model('SPModel', 'sp');
             $this->sp->setDatabase('dbknet');
     
          $params = array(
                'id' => $this->session->userdata('user_id')
            );
            $this->module_group = $this->sp->readData(
                build_sp('sp_fetch_module_group', count($params)),
                $params,
                'result'
            );
            $this->module = $this->sp->readData(
                build_sp('sp_fetch_module', count($params)),
                $params,
                'result'
            );
        }
    }
}


