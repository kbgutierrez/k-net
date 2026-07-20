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

        $activeFund = $this->getActiveFundForUser((int) $user_id);

        $data = array(
            'title' => 'K-Net',
            'is_support' => $is_support,
            'main_view' => $set_view,
            'user_id' => $user_id,
            'company_id' => $user_info['company'],
            'section_id' => $sectionID,
            'module_group' => $this->module_group,
            'module' => $this->module,
            'hasActiveFund' => $activeFund !== null,
            'revolvingFundBalance' => $activeFund['available_balance'] ?? null,
            'revolvingFundCode' => $activeFund['fund_code'] ?? null,
            'scripts' => array(
                'index.js',
            ),
        );

        // echo '<pre>';
        // print_r($data);
        // echo '</pre>';
        $this->load->view('main', $data);
    }

    private function getActiveFundForUser($userId)
    {
        $row = $this->sp->readData(
            build_sp('sp_fetch_user_active_revolving_fund', 1),
            array('UserId' => $userId),
            'row'
        );

        return !empty($row) ? $row : null;
    }

    public function api_get_summary()
    {
        try {
            $this->output->set_content_type('application/json');

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                return $this->respondError('User not authenticated.');
            }

            $scope = $this->input->post('Scope');
            $scope = in_array($scope, array('today', 'week', 'month'), true) ? $scope : 'month';

            $summary = $this->sp->readData(
                build_sp('sp_fetch_dashboard_summary', 2),
                array('UserId' => $userId, 'Scope' => $scope),
                'row'
            );

            $recent = $this->sp->readData(
                build_sp('sp_fetch_dashboard_recent', 2),
                array('UserId' => $userId, 'Take' => 10),
                'result'
            );

            $statusOverview = $this->sp->readData(
                build_sp('sp_fetch_dashboard_status_overview', 1),
                array('UserId' => $userId),
                'result'
            );

            $attention = $this->sp->readData(
                build_sp('sp_fetch_dashboard_attention', 1),
                array('UserId' => $userId),
                'result'
            );

            // Reuses the same SP the Approvals module's own pending queue
            // uses — capped at 50 for a dashboard widget, not a full list.
            // Absence of rows simply means this user isn't an approver on
            // anything right now, which is a real and valid state, not an
            // error to work around.
            $pendingApprovals = array();
            try {
                $pendingApprovals = $this->sp->readData(
                    build_sp('sp_fetch_pending_approvals_header', 3),
                    array('UserId' => $userId, 'CursorId' => null, 'Take' => 50),
                    'result'
                );
            } catch (\Throwable $e) {
                $pendingApprovals = array();
            }
            $pendingApprovals = is_array($pendingApprovals) ? $pendingApprovals : array();

            return $this->respondSuccess('OK', array(
                'summary' => is_array($summary) ? $summary : array(),
                'recent' => is_array($recent) ? $recent : array(),
                'status_overview' => is_array($statusOverview) ? $statusOverview : array(),
                'attention' => is_array($attention) ? $attention : array(),
                'pending_approvals' => array_slice($pendingApprovals, 0, 5),
                'pending_approvals_count' => count($pendingApprovals),
                'pending_approvals_has_more' => count($pendingApprovals) >= 50,
            ));
        } catch (\Throwable $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    private function respondSuccess($message, $data = array())
    {
        echo json_encode(array(
            'status' => 'success',
            'response' => $message,
            'data' => $data,
        ));
        return;
    }

    private function respondError($message)
    {
        echo json_encode(array(
            'status' => 'error',
            'response' => $message,
        ));
        return;
    }
}
