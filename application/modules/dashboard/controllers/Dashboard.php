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
            'allowSelfCashIn' => !empty($activeFund['allow_self_cash_in']),
            'revolvingFundLimit' => $activeFund['opening_balance'] ?? null,
            'scripts' => array(
                'index.js',
            ),
        );

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

    public function api_fund_cash_in()
    {
        try {
            $this->output->set_content_type('application/json');

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                return $this->respondError('User not authenticated.');
            }

            $fund = $this->getActiveFundForUser($userId);
            if (empty($fund)) {
                return $this->respondError('You do not hold an active revolving fund.');
            }
            if (empty($fund['allow_self_cash_in'])) {
                return $this->respondError('Self cash in is not enabled for your fund. Please contact your administrator.');
            }

            $amount = (float) $this->input->post('Amount');
            if ($amount <= 0) {
                return $this->respondError('Amount must be greater than zero.');
            }

            $remarks = trim((string) $this->input->post('Remarks'));
            if ($remarks === '') {
                $remarks = 'Cash in by fund holder';
            }

            $capacity = (float) ($fund['opening_balance'] ?? 0) - (float) ($fund['available_balance'] ?? 0);
            if ($amount > $capacity) {
                return $this->respondError(
                    'Cash in exceeds your fund limit of ₱' . number_format((float) ($fund['opening_balance'] ?? 0), 2)
                    . '. You can add up to ₱' . number_format(max($capacity, 0), 2) . ' only.'
                );
            }

            $params = array(
                'FundId' => (int) $fund['id'],
                'Amount' => $amount,
                'Remarks' => $remarks,
                'CreatedBy' => $userId,
            );

            $result = $this->sp->readData(
                build_sp('sp_revolving_fund_self_cash_in', count($params)),
                $params,
                'row'
            );

            if (!is_array($result) || !isset($result['new_balance'])) {
                return $this->respondError('Failed to record cash in.');
            }

            return $this->respondSuccess('Cash in recorded.', array(
                'new_balance' => $result['new_balance'],
            ));
        } catch (\Throwable $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_fund_passbook()
    {
        try {
            $this->output->set_content_type('application/json');

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                return $this->respondError('User not authenticated.');
            }

            $fund = $this->getActiveFundForUser($userId);
            if (empty($fund)) {
                return $this->respondError('You do not hold an active revolving fund.');
            }

            $cursorIdRaw = $this->input->post('CursorId');
            $cursorId = ($cursorIdRaw !== null && $cursorIdRaw !== '') ? (int) $cursorIdRaw : null;
            $take = (int) $this->input->post('Take');
            if ($take < 1) {
                $take = 20;
            }

            $params = array(
                'CursorId' => $cursorId,
                'Take' => $take,
                'FundId' => (int) $fund['id'],
                'TrxType' => null,
                'DateFrom' => null,
                'DateTo' => null,
            );

            $rows = $this->sp->readData(
                build_sp('sp_fetch_revolving_fund_ledger_list', count($params)),
                $params,
                'result'
            );
            $rows = is_array($rows) ? $rows : array();

            $hasMore = count($rows) > $take;
            if ($hasMore) {
                $rows = array_slice($rows, 0, $take);
            }

            return $this->respondSuccess('OK', array(
                'fund_code' => $fund['fund_code'] ?? '',
                'balance' => $fund['available_balance'] ?? 0,
                'rows' => $rows,
                'has_more' => $hasMore,
                'next_cursor' => $hasMore && !empty($rows) ? end($rows)['id'] : null,
            ));
        } catch (\Throwable $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
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

}
