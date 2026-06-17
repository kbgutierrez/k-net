<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Reports extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
    }

    public function index($reportKey = 'ca-vs-liquidation')
    {
        $map = array(
            'ca-vs-liquidation' => 'CA vs Liquidation',
            'liquidation-register' => 'Liquidation Register',
            'reimbursement-register' => 'Reimbursement Register',
            'revolving-fund-ledger' => 'Revolving Fund Ledger',
            'pending-approvals' => 'Pending Approvals',
            'approval-trail' => 'Approval Trail',
            'department-spend' => 'Department Spend Analysis',
        );

        $safeKey = isset($map[$reportKey]) ? $reportKey : 'ca-vs-liquidation';

        $data = array(
            'title' => 'Reports - ' . $map[$safeKey],
            'main_view' => '../modules/reports/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'report_key' => $safeKey,
            'report_label' => $map[$safeKey],
            'scripts' => array(
                'finance-center.js',
            ),
        );

        $this->load->view('main', $data);
    }
}
