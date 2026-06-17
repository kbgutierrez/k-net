<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Approvals extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    public function index()
    {
        $data = array(
            'title' => 'Approvals',
            'main_view' => '../modules/approvals/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array('index.js'),
        );
        $this->load->view('main', $data);
    }

    public function review($approval_id = 0)
    {
        $data = array(
            'title' => 'Review Approval',
            'main_view' => '../modules/approvals/views/review',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'approval_id' => $approval_id,
            'scripts' => array('review.js'),
        );
        $this->load->view('main', $data);
    }

    public function api_get_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $takeRaw = $this->input->post('Take');

            $take = (int) $takeRaw;
            if ($take <= 0) $take = 20;
            
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
                build_sp('sp_fetch_pending_approvals_header', count($params)),
                $params,
                'result'
            );

            $hasMore = count($result) > $take;
            if ($hasMore) array_pop($result);
            
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

    public function api_get_details()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();
            $refereceNo = isset($data['ReferenceNo']) ? $data['ReferenceNo'] : null;
    
            $params = array("ReferenceNo" => $refereceNo);
            $result = $this->sp->readData(
                build_sp('sp_fetch_transaction_details', count($params)),
                $params,
                'result'
            );
            
            return $this->respondSuccess("Details fetched successfully.", $result);
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_submit_decisions()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo     = isset($data['reference_no'])     ? trim((string)$data['reference_no']) : '';
            $transactionType = isset($data['transaction_type']) ? strtoupper(trim((string)$data['transaction_type'])) : '';
            $overallRemarks  = isset($data['overall_remarks'])  ? trim((string)$data['overall_remarks']) : '';
            $decisions       = isset($data['decisions']) && is_array($data['decisions']) ? $data['decisions'] : array();

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }
            if ($transactionType === '') {
                throw new Exception('Missing required field: transaction_type');
            }
            if (count($decisions) === 0) {
                throw new Exception('No decisions provided.');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            // LIQUIDATION: Update VAT per line item first
            if ($transactionType === 'LIQUIDATION') {
                foreach ($decisions as $d) {
                    $detailId  = isset($d['detail_id'])  ? (int)$d['detail_id'] : 0;
                    $isVatable = isset($d['is_vatable']) ? (int)(bool)$d['is_vatable'] : 0;

                    if ($detailId > 0) {
                        $vatParams = array(
                            'DetailId'   => $detailId,
                            'IsVattable' => $isVatable,
                        );
                        $this->sp->createData(
                            build_sp('sp_update_liquidation_detail_vat', count($vatParams)),
                            $vatParams
                        );
                    }
                }
            }

            // Determine overall decision
            $overallDecision = 'APPROVED';
            $rejectionReason = null;

            if ($transactionType === 'LIQUIDATION') {
                foreach ($decisions as $d) {
                    $rawDecision = isset($d['decision']) ? strtolower(trim((string)$d['decision'])) : '';
                    if ($rawDecision === 'reject' || $rawDecision === 'rejected') {
                        $overallDecision = 'REJECTED';
                        $rejectionReason = isset($d['remark']) ? trim((string)$d['remark']) : '';
                        break;
                    }
                }
            } else {
                $rawDecision = isset($decisions[0]['decision']) ? strtolower(trim((string)$decisions[0]['decision'])) : '';
                if ($rawDecision === 'approve' || $rawDecision === 'approved') {
                    $overallDecision = 'APPROVED';
                } elseif ($rawDecision === 'reject' || $rawDecision === 'rejected') {
                    $overallDecision = 'REJECTED';
                    $rejectionReason = isset($decisions[0]['remark']) ? trim((string)$decisions[0]['remark']) : '';
                } else {
                    throw new Exception('Invalid decision value: ' . $rawDecision);
                }
            }

            // Call main approval decision SP
            $spParams = array(
                'ReferenceId'     => $referenceNo,
                'ApproverId'      => $userId,
                'Status'          => $overallDecision,
                'Remarks'         => $overallRemarks,
                'RejectionReason' => $rejectionReason,
            );

            $result = $this->sp->readData(
                build_sp('sp_approval_decision', count($spParams)),
                $spParams,
                'result'
            );

            if (!is_array($result) || count($result) === 0) {
                throw new Exception('Decision processing returned no result.');
            }

            $row = $result[0];

            return $this->respondSuccess('Decision submitted successfully.', array(
                'next_approver_id'    => isset($row['next_approver_id']) ? (int)$row['next_approver_id'] : null,
                'header_status'       => isset($row['header_status']) ? $row['header_status'] : null,
                'approval_header_id'  => isset($row['approval_header_id']) ? (int)$row['approval_header_id'] : null,
                'reference_id'        => isset($row['reference_id']) ? $row['reference_id'] : $referenceNo,
            ));

        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    private function getRequestPayload()
    {
        $raw = $this->input->raw_input_stream;
        if (!empty($raw)) {
            $json = json_decode($raw, true);
            if (is_array($json)) return $json;
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