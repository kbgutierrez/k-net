<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');
class Cash_Advance extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    public function index()
    {
        $userId = $this->session->userdata('user_id');
        $pendingCa = $this->getPendingCashAdvance($userId);

        $data = array(
            'title' => 'Cash Advance',
            'main_view' => '../modules/cash-advance/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'has_pending_ca' => !empty($pendingCa),
            'pending_ca_id' => $pendingCa ? $pendingCa['cash_advance_id'] : '',
            'pending_ca_status' => $pendingCa ? $pendingCa['status_name'] : '',
            'scripts' => array(
                '../cash-advance/index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function getPendingCashAdvance($userId)
    {
        $params = array(
            'UserId' => $userId,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_pending_ca_by_user', count($params)),
            $params,
            'row'
        );

        if (is_array($result) && isset($result['cash_advance_id']) && !empty($result['cash_advance_id'])) {
            return $result;
        }

        return null;
    }

    public function add()
    {
        $userId = $this->session->userdata('user_id');
        $pendingCa = $this->getPendingCashAdvance($userId);

        if (!empty($pendingCa)) {
            redirect('transactions/cash-advance');
            return;
        }

        $data = array(
            'title' => 'New Cash Advance',
            'main_view' => '../modules/cash-advance/views/add',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
           
                '../cash-advance/add.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function view($cash_advance_no = '')
    {
        $data = array(
            'title' => 'Cash Advance Details',
            'main_view' => '../modules/cash-advance/views/detail',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'cash_advance_no' => $cash_advance_no,
            'scripts' => array(

                '../cash-advance/detail.js',
                '../cash-advance/index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_save()
    {
        try {
            $this->output->set_content_type('application/json');

            $data = $this->getRequestPayload();
            $requiredFields = array('Amount', 'Description', 'NeededDate');
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    return $this->respondError("Missing required field: {$field}");
                }
            }

            $params = array(
                "UserId" => $this->session->userdata('user_id'),
                "Amount" => $data['Amount'],
                "Description" => $data['Description'],
                "NeededDate" => $data['NeededDate'],
            );

            $result = $this->sp->createReturnId(
                build_sp('sp_insert_ca', count($params)),
                $params,
                'result'
            );

            if ($result > 0) {
                $caRef = is_array($result) ? ($result['GeneratedCashAdvanceID'] ?? '') : (string) $result;
                return $this->respondSuccess("Cash advance request created successfully", array('id' => $result, 'cash_advance_id' => $caRef));
            } else {
                return $this->respondError("Failed to create cash advance request");
            }
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $takeRaw = $this->input->post('Take');

            $take = (int) $takeRaw;
            if ($take <= 0) {
                $take = 20;
            }

            $cursorId = null;
            if ($cursorIdRaw !== null && $cursorIdRaw !== '') {
                $cursorId = (int) $cursorIdRaw;
            }

            $params = array(
                "UserId" => $userId,
                "CursorId" => $cursorId,
                "Take" => $take,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_ca', count($params)),
                $params,
                'result'
            );

            $hasMore = count($result) > $take;
            if ($hasMore) {
                array_pop($result);
            }

            $nextCursorId = null;
            if (!empty($result)) {
                $lastRow = end($result);
                $nextCursorId = isset($lastRow['id']) ? (int) $lastRow['id'] : null;
            }

            echo json_encode(array(
                'status' => 'success',
                'data' => $result,
                'pagination' => array(
                    'take' => $take,
                    'hasMore' => $hasMore,
                    'nextCursorId' => $nextCursorId,
                ),
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function api_get_detail()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $cashAdvanceId = isset($data['CashAdvanceId']) ? trim((string) $data['CashAdvanceId']) : '';
            if ($cashAdvanceId === '') {
                return $this->respondError('Missing required field: CashAdvanceId');
            }

            $params = array(
                'CashAdvanceId' => $cashAdvanceId,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_pending_ca_details_by_ca_no', count($params)),
                $params,
                'row'
            );

            if (!$result) {
                return $this->respondError('Cash advance not found.');
            }

            return $this->respondSuccess('success', $result);
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_get_timeline()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['ReferenceNo']) ? trim((string) $data['ReferenceNo']) : '';
            if ($referenceNo === '') {
                return $this->respondError('Missing ReferenceNo');
            }

            $auditParams = array(
                'TransactionId' => $referenceNo,
            );
            $auditTrail = $this->sp->readData(
                build_sp('sp_fetch_audit_trail', count($auditParams)),
                $auditParams,
                'result'
            );

            return $this->respondSuccess('Timeline fetched', array(
                'audit_trail' => is_array($auditTrail) ? $auditTrail : array(),
            ));
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    private function getRequestPayload()
    {
        $contentType = $this->input->server('CONTENT_TYPE');
        if (is_string($contentType) && stripos($contentType, 'application/json') !== false) {
            $data = json_decode($this->input->raw_input_stream, true);
            return is_array($data) ? $data : array();
        }

        $postData = $this->input->post();
        return is_array($postData) ? $postData : array();
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
?>