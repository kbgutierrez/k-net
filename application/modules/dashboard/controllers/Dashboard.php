<?php
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');
class Dashboard extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
            $this->load->model('SPModel', 'sp');
            $this->sp->setDatabase('dbknet');
    }
    public function index()
    {
        $set_view = '../modules/dashboard/views/dashboard';
        $user_info = $this->session->userdata('user_info');
        $is_support = $user_info['is_support'];
        $sectionID = $user_info['SectionID'];
        $is_maintenance_mode = 0;
        $user_id = $this->session->userdata('user_id');
    
        if ($is_maintenance_mode && $user_id != 11592 && $user_id != 11318) {
          
            $this->load->view('wait_maintenance');
            return;
        }


        $data = array(
            'title' => 'K-Net',
            'is_support' => $is_support,
            'main_view' => $set_view,
            'user_id' => $user_id,
            'company_id' => $user_info['company'],
            'section_id' => $sectionID,
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        // echo '<pre>';
        // print_r($data);
        // echo '</pre>';
        $this->load->view('main', $data);
    }



  
}
