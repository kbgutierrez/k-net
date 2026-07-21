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
            'hasPaymentCapability' => $this->userHasAnyPaymentCapability(),
            'scripts' => array('index.js'),
        );
        $this->load->view('main', $data);
    }

    private function userHasAnyPaymentCapability()
    {
        $userId = (int) $this->session->userdata('user_id');

        $row = $this->sp->db->select('D.id')
            ->from('tbl_approval_matrix_details D')
            ->join('tbl_approval_matrix_header H', 'H.id = D.matrix_header_id')
            ->where('D.approver_id', $userId)
            ->where('H.is_active', 1)
            ->group_start()
                ->where('D.is_payment_advisory', 1)
                ->or_where('D.is_payment_release', 1)
            ->group_end()
            ->limit(1)
            ->get()
            ->row_array();

        return !empty($row);
    }

    public function consolidation()
    {
        $data = array(
            'title' => 'Batch Approval',
            'main_view' => '../modules/approvals/views/consolidation',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array('consolidation.js'),
        );
        $this->load->view('main', $data);
    }

    public function api_get_consolidation_pivot()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $dateFrom = isset($data['date_from']) ? trim((string) $data['date_from']) : '';
            $dateTo = isset($data['date_to']) ? trim((string) $data['date_to']) : '';
            $salesOfficeCode = !empty($data['sales_office_code']) ? trim((string) $data['sales_office_code']) : null;
            $salesDistrictCode = !empty($data['sales_district_code']) ? trim((string) $data['sales_district_code']) : null;
            $transactionType = !empty($data['transaction_type']) ? strtoupper(trim((string) $data['transaction_type'])) : 'REIMBURSEMENT';

            if ($dateFrom === '' || $dateTo === '') {
                throw new Exception('Date range is required.');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $params = array(
                'ApproverId' => $userId,
                'DateFrom' => $dateFrom,
                'DateTo' => $dateTo,
                'SalesOfficeCode' => $salesOfficeCode,
                'SalesDistrictCode' => $salesDistrictCode,
                'TransactionType' => $transactionType,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_reimbursement_pivot_for_approver', count($params)),
                $params,
                'result'
            );

            return $this->respondSuccess('OK', is_array($result) ? $result : array());
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_bulk_decision()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNumbers = isset($data['reference_numbers']) && is_array($data['reference_numbers'])
                ? $data['reference_numbers']
                : array();
            $remarks = isset($data['remarks']) ? trim((string) $data['remarks']) : '';

            if (count($referenceNumbers) === 0) {
                throw new Exception('No reimbursements selected.');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $approved = array();
            $errors = array();

            foreach ($referenceNumbers as $referenceNo) {
                $referenceNo = trim((string) $referenceNo);
                if ($referenceNo === '') {
                    continue;
                }

                try {
                    $spParams = array(
                        'ReferenceId' => $referenceNo,
                        'ApproverId' => $userId,
                        'Status' => 'APPROVED',
                        'Remarks' => $remarks,
                        'RejectionReason' => null,
                    );

                    $result = $this->sp->readData(
                        build_sp('sp_approval_decision', count($spParams)),
                        $spParams,
                        'result'
                    );

                    if (!is_array($result) || count($result) === 0) {
                        throw new Exception('Decision processing returned no result.');
                    }

                    $this->logAuditTrail(
                        'REIMBURSEMENT',
                        $referenceNo,
                        'APPROVED',
                        'HEADER',
                        $referenceNo,
                        null,
                        null,
                        $remarks
                    );

                    $this->notifyDecisionOutcome('REIMBURSEMENT', $referenceNo, 'APPROVED', $userId, $result[0], $remarks);

                    $approved[] = $referenceNo;
                } catch (Throwable $e) {
                    $errors[] = array(
                        'reference_no' => $referenceNo,
                        'message' => $e->getMessage(),
                    );
                }
            }

            return $this->respondSuccess('Bulk decision processed.', array(
                'approved' => $approved,
                'errors' => $errors,
            ));
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function review($approval_id = 0)
    {
        $costCenters = $this->sp->fetchData('sp_fetch_active_cost_centers');
        if (!is_array($costCenters)) {
            $costCenters = array();
        }

        $expenseTypes = $this->sp->fetchData('sp_fetch_expense_types');
        if (!is_array($expenseTypes)) {
            $expenseTypes = array();
        }

        $reviewMode = ($this->input->get('mode') === 'past') ? 'past' : 'pending';

        $data = array(
            'title' => 'Review Approval',
            'main_view' => '../modules/approvals/views/review',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'approval_id' => $approval_id,
            'review_mode' => $reviewMode,
            'cost_centers' => $costCenters,
            'expense_types' => $expenseTypes,
            'scripts' => array('review.js'),
        );
        $this->load->view('main', $data);
    }

    private function getTransactionInfoFromApprovalItem($approvalPerItemId)
    {
        $params = array(
            'ApprovalPerItemId' => (int) $approvalPerItemId,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_transaction_info_by_item', count($params)),
            $params,
            'row'
        );

        return $result ?: null;
    }

    private function fetchCaAttachments($caId)
    {
        if (empty($caId)) {
            return array();
        }

        $params = array(
            'CaId' => $caId,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_ca_attachments_by_caid', count($params)),
            $params,
            'result'
        );

        if (!is_array($result)) {
            return array();
        }

        $attachments = array();
        foreach ($result as $row) {
            $fileName = isset($row['file_name']) ? trim((string) $row['file_name']) : '';
            $originalName = isset($row['original_name']) ? trim((string) $row['original_name']) : $fileName;
            $fileSize = isset($row['file_size']) ? (int) $row['file_size'] : 0;
            $uploadedDate = isset($row['uploaded_date']) ? trim((string) $row['uploaded_date']) : '';

            if (!$fileName)
                continue;

            $viewUrl = base_url('transactions/cash-advance/attachment/view?ca=' . urlencode($caId) . '&file=' . urlencode($fileName));
            $downloadUrl = base_url('transactions/cash-advance/attachment/view?ca=' . urlencode($caId) . '&file=' . urlencode($fileName) . '&download=1');

            $attachments[] = array(
                'file_name' => $fileName,
                'original_name' => $originalName,
                'file_size' => $fileSize,
                'uploaded_date' => $uploadedDate,
                'view_url' => $viewUrl,
                'download_url' => $downloadUrl,
            );
        }

        return $attachments;
    }

    public function api_get_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $take = $this->resolvePaginationTake($this->input->post('Take'));

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

            $payload = $this->buildPaginationResult($result, $take, 'approval_detail_id');

            echo json_encode(array(
                'status' => 'success',
                'data' => $payload['data'],
                'pagination' => $payload['pagination'],
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function api_get_past_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $take = $this->resolvePaginationTake($this->input->post('Take'));

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
                build_sp('sp_fetch_past_approvals_header', count($params)),
                $params,
                'result'
            );

            $payload = $this->buildPaginationResult($result, $take, 'approval_detail_id');

            echo json_encode(array(
                'status' => 'success',
                'data' => $payload['data'],
                'pagination' => $payload['pagination'],
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

            $params = array(
                "ReferenceNo" => $refereceNo,
                "ApproverId" => $this->session->userdata('user_id'),
            );
            $result = $this->sp->readData(
                build_sp('sp_fetch_transaction_details', count($params)),
                $params,
                'result'
            );

            if (is_array($result)) {
                foreach ($result as &$row) {
                    if (!is_array($row)) {
                        continue;

                        if (!isset($row['approved_amount'])) {
                            $row['approved_amount'] = null;
                        }
                        if (!isset($row['approved_amount_in_words'])) {
                            $row['approved_amount_in_words'] = '';
                        }
                    }

                    $finalPath = isset($row['final_pdf_path']) ? $this->normalizeRelativeAssetPath($row['final_pdf_path']) : '';
                    $generatedPath = isset($row['generated_pdf_path']) ? $this->normalizeRelativeAssetPath($row['generated_pdf_path']) : '';

                    $row['final_pdf_path'] = $finalPath;
                    $row['generated_pdf_path'] = $generatedPath;
                    $row['final_pdf_url'] = $this->buildPublicUrlFromRelativePath($finalPath);
                    $row['generated_pdf_url'] = $this->buildPublicUrlFromRelativePath($generatedPath);

                    $activePath = $finalPath !== '' ? $finalPath : $generatedPath;
                    $row['active_pdf_url'] = $this->buildPublicUrlFromRelativePath($activePath);
                }
                unset($row);
            }

            $attachments = array();
            $hasAttachments = false;

            if (is_array($result) && count($result) > 0) {
                $firstRow = $result[0];
                $transactionType = isset($firstRow['transaction_type']) ? strtoupper(trim((string) $firstRow['transaction_type'])) : '';

                if ($transactionType === 'CASH_ADVANCE' || $transactionType === 'LIQUIDATION' || $transactionType === 'REIMBURSEMENT') {
                    $caId = isset($firstRow['reference_no']) ? $firstRow['reference_no'] : 0;
                    if ($caId) {
                        $attachments = $this->fetchCaAttachments($caId);
                        $hasAttachments = count($attachments) > 0;
                    }
                }
            }

            $paymentCapability = null;
            if (is_array($result) && count($result) > 0) {
                $capParams = array(
                    'ReferenceNo' => $refereceNo,
                    'UserId' => $this->session->userdata('user_id'),
                );
                $capResult = $this->sp->readData(
                    build_sp('sp_fetch_user_payment_capability', count($capParams)),
                    $capParams,
                    'row'
                );
                $paymentCapability = is_array($capResult) ? $capResult : null;
            }

            $pettyCashSlipCapability = false;
            if (is_array($result) && count($result) > 0) {
                $firstRow = $result[0];
                $txnType = isset($firstRow['transaction_type']) ? strtoupper(trim((string) $firstRow['transaction_type'])) : '';
                if (in_array($txnType, array('REIMBURSEMENT', 'CASH_ADVANCE', 'LIQUIDATION'), true)) {
                    $pettyCashSlipCapability = $this->userHasPettyCashSlipCapability($refereceNo, $this->session->userdata('user_id'));
                }
            }

            return $this->respondSuccess("Details fetched successfully.", array(
                'items' => $result,
                'attachments' => $attachments,
                'has_attachments' => $hasAttachments,
                'payment_capability' => $paymentCapability,
                'petty_cash_slip_capability' => $pettyCashSlipCapability,
            ));
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_get_payment_queue()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $take = $this->resolvePaginationTake($this->input->post('Take'));

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
                build_sp('sp_fetch_payment_queue_header', count($params)),
                $params,
                'result'
            );

            $payload = $this->buildPaginationResult($result, $take, 'approval_detail_id');

            echo json_encode(array(
                'status' => 'success',
                'data' => $payload['data'],
                'pagination' => $payload['pagination'],
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function api_advise_payment()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['reference_no']) ? trim((string) $data['reference_no']) : '';
            $remarks = isset($data['remarks']) ? trim((string) $data['remarks']) : '';

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $result = $this->runAdvisePayment($referenceNo, $userId, $remarks);

            return $this->respondSuccess('Payment advised successfully.', $result);
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_release_payment()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['reference_no']) ? trim((string) $data['reference_no']) : '';
            $remarks = isset($data['remarks']) ? trim((string) $data['remarks']) : '';

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $result = $this->runReleasePayment($referenceNo, $userId, $remarks);

            return $this->respondSuccess('Payment released successfully.', $result);
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_bulk_payment_action()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNumbers = isset($data['reference_numbers']) && is_array($data['reference_numbers'])
                ? $data['reference_numbers']
                : array();
            $doAdvise = !empty($data['do_advise']);
            $doRelease = !empty($data['do_release']);
            $remarks = isset($data['remarks']) ? trim((string) $data['remarks']) : '';

            if (count($referenceNumbers) === 0) {
                throw new Exception('No transactions selected.');
            }
            if (!$doAdvise && !$doRelease) {
                throw new Exception('Select at least one action: Payment Advisory or Payment Release.');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $advised = array();
            $released = array();
            $errors = array();

            foreach ($referenceNumbers as $referenceNo) {
                $referenceNo = trim((string) $referenceNo);
                if ($referenceNo === '') {
                    continue;
                }

                if ($doAdvise) {
                    try {
                        $this->runAdvisePayment($referenceNo, $userId, $remarks);
                        $advised[] = $referenceNo;
                    } catch (Throwable $e) {
                        $errors[] = array('reference_no' => $referenceNo, 'action' => 'ADVISE', 'message' => $e->getMessage());
                    }
                }

                if ($doRelease) {
                    try {
                        $this->runReleasePayment($referenceNo, $userId, $remarks);
                        $released[] = $referenceNo;
                    } catch (Throwable $e) {
                        $errors[] = array('reference_no' => $referenceNo, 'action' => 'RELEASE', 'message' => $e->getMessage());
                    }
                }
            }

            return $this->respondSuccess('Batch payment action completed.', array(
                'advised' => $advised,
                'released' => $released,
                'errors' => $errors,
            ));
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    private function runAdvisePayment($referenceNo, $userId, $remarks)
    {
        $spParams = array(
            'ReferenceId' => $referenceNo,
            'UserId' => $userId,
            'Remarks' => $remarks,
        );

        $result = $this->sp->readData(
            build_sp('sp_advise_payment', count($spParams)),
            $spParams,
            'row'
        );

        if (!is_array($result) || empty($result['new_status'])) {
            throw new Exception('Advise payment did not return a result.');
        }

        $transactionType = $this->resolveTransactionTypeFromReference($referenceNo);
        $this->logAuditTrail($transactionType, $referenceNo, $result['new_status'], 'HEADER', $referenceNo, null, null, $remarks);
        $this->notifyPaymentEvent('PAYMENT_ADVISED', $transactionType, $referenceNo, $userId, $remarks, true);

        return $result;
    }

    private function runReleasePayment($referenceNo, $userId, $remarks)
    {
        $spParams = array(
            'ReferenceId' => $referenceNo,
            'UserId' => $userId,
            'Remarks' => $remarks,
        );

        $result = $this->sp->readData(
            build_sp('sp_release_payment', count($spParams)),
            $spParams,
            'row'
        );

        if (!is_array($result) || empty($result['new_status'])) {
            throw new Exception('Release payment did not return a result.');
        }

        $transactionType = $this->resolveTransactionTypeFromReference($referenceNo);
        $this->logAuditTrail($transactionType, $referenceNo, $result['new_status'], 'HEADER', $referenceNo, null, null, $remarks);
        $this->notifyPaymentEvent('PAYMENT_RELEASED', $transactionType, $referenceNo, $userId, $remarks, false);

        return $result;
    }

    private function userHasPettyCashSlipCapability($referenceNo, $userId)
    {
        $row = $this->sp->db->select('D.id')
            ->from('tbl_approval_matrix_details D')
            ->join('tbl_approval_header H', 'H.approval_matrix_id = D.matrix_header_id')
            ->where('H.reference_id', $referenceNo)
            ->where('H.is_active', 1)
            ->where('D.approver_id', (int) $userId)
            ->where('D.is_petty_cash_slip', 1)
            ->limit(1)
            ->get()
            ->row_array();

        return !empty($row);
    }

    public function download_petty_cash_slip($referenceNo = '')
    {
        $referenceNo = trim((string) $referenceNo);
        $userId = (int) $this->session->userdata('user_id');

        if ($referenceNo === '' || !$this->userHasPettyCashSlipCapability($referenceNo, $userId)) {
            show_error('You are not authorized to download this slip.', 403);
            return;
        }

        $prefix = strtoupper(substr($referenceNo, 0, 3)) === 'RMB' ? 'RMB' : strtoupper(substr($referenceNo, 0, 2));
        if ($prefix === 'CA') {
            $spName = 'sp_fetch_cash_advance_petty_cash_data';
            $paramName = 'CashAdvanceId';
        } elseif ($prefix === 'LQ') {
            $spName = 'sp_fetch_liquidation_petty_cash_data';
            $paramName = 'LiquidationId';
        } elseif ($prefix === 'RMB') {
            $spName = 'sp_fetch_reimbursement_petty_cash_data';
            $paramName = 'ReimbursementId';
        } else {
            show_error('Unrecognized reference id.', 400);
            return;
        }

        $slipData = $this->sp->readData(
            build_sp($spName, 1),
            array($paramName => $referenceNo),
            'row'
        );

        if (!is_array($slipData) || empty($slipData)) {
            show_error('Transaction not found.', 404);
            return;
        }

        $approverInfo = get_user_info($userId);
        $approverName = trim((string) ($approverInfo['firstname'] ?? '') . ' ' . (string) ($approverInfo['lastname'] ?? ''));

        $this->load->helper('petty_cash_slip');
        $html = build_petty_cash_slip_html($slipData, array(
            'name' => $approverName,
            'date' => date('M d, Y'),
        ));

        $this->load->library('pdf_generator', null, 'pdf');
        $pdfContent = $this->pdf->generateInline($html);

        $this->output
            ->set_content_type('application/pdf')
            ->set_header('Content-Disposition: attachment; filename="PettyCashSlip_' . $referenceNo . '.pdf"')
            ->set_output($pdfContent);
    }

    private function resolveTransactionTypeFromReference($referenceNo)
    {
        if (strpos($referenceNo, 'RMB') === 0) {
            return 'REIMBURSEMENT';
        }
        if (strpos($referenceNo, 'RPL') === 0) {
            return 'REPLENISHMENT';
        }
        if (strpos($referenceNo, 'LQ') === 0) {
            return 'LIQUIDATION';
        }
        if (strpos($referenceNo, 'CA') === 0) {
            return 'CASH_ADVANCE';
        }
        return '';
    }

    private function normalizeRelativeAssetPath($path)
    {
        $value = trim((string) $path);
        if ($value === '') {
            return '';
        }

        $value = str_replace('\\', '/', $value);

        if (preg_match('#^https?://#i', $value)) {
            return $value;
        }

        if (strpos($value, 'assets/') === 0) {
            return $value;
        }

        $assetsPos = stripos($value, '/assets/');
        if ($assetsPos !== false) {
            return ltrim(substr($value, $assetsPos + 1), '/');
        }

        return '';
    }

    private function buildPublicUrlFromRelativePath($relativePath)
    {
        $relative = $this->normalizeRelativeAssetPath($relativePath);
        if ($relative === '') {
            return '';
        }

        if (preg_match('#^https?://#i', $relative)) {
            return $relative;
        }

        return base_url($relative);
    }

    private function getLiquidationDetailById($detailId)
    {
        $detailId = (int) $detailId;
        if ($detailId <= 0 || !$this->sp || !$this->sp->db) {
            return null;
        }

        $query = $this->sp->db->get_where('tbl_liquidation_details', array('id' => $detailId), 1);
        if (!$query) {
            return null;
        }

        $row = $query->row_array();
        return is_array($row) ? $row : null;
    }

    private function getReimbursementDetailById($detailId)
    {
        $detailId = (int) $detailId;
        if ($detailId <= 0 || !$this->sp || !$this->sp->db) {
            return null;
        }

        $query = $this->sp->db->get_where('tbl_reimbursement_details', array('id' => $detailId), 1);
        if (!$query) {
            return null;
        }

        $row = $query->row_array();
        return is_array($row) ? $row : null;
    }

    private function getCashAdvanceByReferenceNo($referenceNo)
    {
        $referenceNo = trim((string) $referenceNo);
        if ($referenceNo === '' || !$this->sp || !$this->sp->db) {
            return null;
        }

        $query = $this->sp->db->get_where('tbl_cash_advance', array('cash_advance_id' => $referenceNo), 1);
        if (!$query) {
            return null;
        }

        $row = $query->row_array();
        return is_array($row) ? $row : null;
    }

    private function getTransactionRequesterAndAmount($referenceNo, $transactionType)
    {
        $default = array('user_id' => 0, 'amount' => 0, 'description' => '');

        if (!$this->sp || !$this->sp->db) {
            return $default;
        }

        if ($transactionType === 'CASH_ADVANCE') {
            $row = $this->sp->db->get_where('tbl_cash_advance', array('cash_advance_id' => $referenceNo), 1)->row_array();
            if (!is_array($row)) {
                return $default;
            }
            return array(
                'user_id' => (int) ($row['user_id'] ?? 0),
                'amount' => (float) ($row['amount'] ?? 0),
                'description' => (string) ($row['description'] ?? ''),
            );
        }

        if ($transactionType === 'LIQUIDATION') {
            $row = $this->sp->db->get_where('tbl_liquidation_header', array('liquidation_id' => $referenceNo), 1)->row_array();
            if (!is_array($row)) {
                return $default;
            }
            return array(
                'user_id' => (int) ($row['created_by'] ?? 0),
                'amount' => (float) ($row['total_amount_spent'] ?? 0),
                'description' => '',
            );
        }

        if ($transactionType === 'REIMBURSEMENT') {
            $row = $this->sp->db->get_where('tbl_reimbursement_header', array('reimbursement_id' => $referenceNo), 1)->row_array();
            if (!is_array($row)) {
                return $default;
            }
            return array(
                'user_id' => (int) ($row['user_id'] ?? 0),
                'amount' => (float) ($row['total_amount'] ?? 0),
                'description' => (string) ($row['description'] ?? ''),
            );
        }

        if ($transactionType === 'REPLENISHMENT') {
            $row = $this->sp->db->get_where('tbl_replenishment_header', array('replenishment_id' => $referenceNo), 1)->row_array();
            if (!is_array($row)) {
                return $default;
            }
            return array(
                'user_id' => (int) ($row['user_id'] ?? 0),
                'amount' => (float) ($row['total_amount'] ?? 0),
                'description' => (string) ($row['remarks'] ?? ''),
            );
        }

        return $default;
    }

    private function buildNotificationRecipient($userId)
    {
        $userId = (int) $userId;
        if ($userId <= 0) {
            return null;
        }

        $info = get_user_info($userId);
        if (!is_array($info) || empty($info['email'])) {
            return null;
        }

        $name = trim((string) ($info['firstname'] ?? '') . ' ' . (string) ($info['lastname'] ?? ''));

        return array(
            'email' => $info['email'],
            'name' => $name !== '' ? $name : $info['email'],
            'department' => (string) ($info['short_name'] ?? ''),
            'user_id' => $userId,
        );
    }

    private function notifyDecisionOutcome($transactionType, $referenceNo, $overallDecision, $decidedByUserId, $decisionRow, $remarksForMerge)
    {
        $txInfo = $this->getTransactionRequesterAndAmount($referenceNo, $transactionType);
        $requesterRecipient = $this->buildNotificationRecipient($txInfo['user_id']);
        $deciderRecipient = $this->buildNotificationRecipient($decidedByUserId);

        $mergeData = array(
            'amount' => number_format((float) $txInfo['amount'], 2),
            'status' => $overallDecision,
            'remarks' => (string) $remarksForMerge,
            'action_date' => date('Y-m-d H:i:s'),
            'requester_name' => $requesterRecipient['name'] ?? '',
            'requester_department' => $requesterRecipient['department'] ?? '',
            'approver_name' => $deciderRecipient['name'] ?? '',
        );

        if ($overallDecision === 'REJECTED') {
            if ($requesterRecipient) {
                notify_event('TXN_REJECTED', $transactionType, $referenceNo, array($requesterRecipient), $mergeData);
            }
            return;
        }

        $nextApproverId = isset($decisionRow['next_approver_id']) ? (int) $decisionRow['next_approver_id'] : 0;
        if ($nextApproverId > 0) {
            $nextApproverRecipient = $this->buildNotificationRecipient($nextApproverId);
            if ($nextApproverRecipient) {
                notify_event('TXN_STEP_APPROVED', $transactionType, $referenceNo, array($nextApproverRecipient), $mergeData);
            }
            return;
        }

        if ($requesterRecipient) {
            notify_event('TXN_FULLY_APPROVED', $transactionType, $referenceNo, array($requesterRecipient), $mergeData);
        }
    }

    private function getPaymentReleaseApproverIds($referenceNo)
    {
        if (!$this->sp || !$this->sp->db) {
            return array();
        }

        $header = $this->sp->db->get_where('tbl_approval_header', array('reference_id' => $referenceNo, 'is_active' => 1), 1)->row_array();
        if (!is_array($header) || empty($header['approval_matrix_id'])) {
            return array();
        }

        $query = $this->sp->db->select('approver_id')
            ->from('tbl_approval_matrix_details')
            ->where('matrix_header_id', $header['approval_matrix_id'])
            ->where('is_payment_release', 1)
            ->get();

        if (!$query) {
            return array();
        }

        $ids = array();
        foreach ($query->result_array() as $row) {
            $ids[] = (int) $row['approver_id'];
        }
        return $ids;
    }

    private function notifyPaymentEvent($eventCode, $transactionType, $referenceNo, $actingUserId, $remarks, $includeReleaseApprovers)
    {
        $txInfo = $this->getTransactionRequesterAndAmount($referenceNo, $transactionType);
        $requesterRecipient = $this->buildNotificationRecipient($txInfo['user_id']);
        $actorRecipient = $this->buildNotificationRecipient($actingUserId);

        $mergeData = array(
            'amount' => number_format((float) $txInfo['amount'], 2),
            'status' => $eventCode,
            'remarks' => (string) $remarks,
            'action_date' => date('Y-m-d H:i:s'),
            'requester_name' => $requesterRecipient['name'] ?? '',
            'requester_department' => $requesterRecipient['department'] ?? '',
            'approver_name' => $actorRecipient['name'] ?? '',
        );

        $recipients = array();
        if ($requesterRecipient) {
            $recipients[] = $requesterRecipient;
        }

        if ($includeReleaseApprovers) {
            foreach ($this->getPaymentReleaseApproverIds($referenceNo) as $approverId) {
                $recipient = $this->buildNotificationRecipient($approverId);
                if ($recipient) {
                    $recipients[] = $recipient;
                }
            }
        }

        if (!empty($recipients)) {
            notify_event($eventCode, $transactionType, $referenceNo, $recipients, $mergeData);
        }
    }

    private function normalizeAuditValue($value)
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_numeric($value)) {
            return (string) $value;
        }

        return trim((string) $value);
    }

    private function normalizeAuditDecimal($value, $scale = 2)
    {
        if ($value === null || $value === '') {
            return '';
        }

        if (!is_numeric($value)) {
            return $this->normalizeAuditValue($value);
        }

        return number_format((float) $value, $scale, '.', '');
    }

    private function logLiquidationDetailFieldChanges($referenceNo, $detailId, $beforeRow, $afterValues)
    {
        if (!is_array($beforeRow) || !is_array($afterValues) || $referenceNo === '' || (int) $detailId <= 0) {
            return;
        }

        $approvedChanged = $this->normalizeAuditDecimal($beforeRow['approved_amount'] ?? '') !== $this->normalizeAuditDecimal($afterValues['approved_amount'] ?? '');
        $vatableChanged = $this->normalizeAuditValue($beforeRow['is_vatable'] ?? '') !== $this->normalizeAuditValue($afterValues['is_vatable'] ?? '');

        $fieldMap = array(
            'description' => 'description',
            'invoice_receipt_no' => 'invoice_receipt_no',
            'document_date' => 'document_date',
            'approved_amount' => 'approved_amount',
            'expense_category' => 'expense_category',
            'is_vatable' => 'is_vatable',
            'net_amount' => 'net_amount',
            'vat_amount' => 'vat_amount',
            'vendor_name' => 'vendor_name',
            'vendor_address' => 'vendor_address',
            'vendor_tin' => 'vendor_tin',
        );

        foreach ($fieldMap as $auditField => $rowField) {
            $oldValue = array_key_exists($rowField, $beforeRow) ? $this->normalizeAuditValue($beforeRow[$rowField]) : '';
            $newValue = array_key_exists($auditField, $afterValues) ? $this->normalizeAuditValue($afterValues[$auditField]) : '';

            if (($auditField === 'net_amount' || $auditField === 'vat_amount') && !$approvedChanged && !$vatableChanged) {
                continue;
            }

            if ($auditField === 'document_date') {
                $oldValue = $oldValue !== '' ? date('Y-m-d', strtotime($oldValue)) : '';
                $newValue = $newValue !== '' ? date('Y-m-d', strtotime($newValue)) : '';
            }

            if ($auditField === 'approved_amount' || $auditField === 'net_amount' || $auditField === 'vat_amount') {
                $oldValue = $this->normalizeAuditDecimal($oldValue);
                $newValue = $this->normalizeAuditDecimal($newValue);
            }

            if ($auditField === 'is_vatable') {
                $oldValue = $oldValue === '' ? '' : ((int) $oldValue === 1 ? '1' : '0');
                $newValue = $newValue === '' ? '' : ((int) $newValue === 1 ? '1' : '0');
            }

            if ($oldValue === $newValue) {
                continue;
            }

            $this->logAuditTrail(
                'LIQUIDATION',
                $referenceNo,
                'UPDATED_ITEM',
                'ITEM',
                (int) $detailId,
                $auditField,
                $oldValue,
                $newValue
            );
        }
    }

    private function logReimbursementDetailFieldChanges($referenceNo, $detailId, $beforeRow, $afterValues)
    {
        if (!is_array($beforeRow) || !is_array($afterValues) || $referenceNo === '' || (int) $detailId <= 0) {
            return;
        }

        $approvedChanged = $this->normalizeAuditDecimal($beforeRow['approved_amount'] ?? '') !== $this->normalizeAuditDecimal($afterValues['approved_amount'] ?? '');
        $vatableChanged = $this->normalizeAuditValue($beforeRow['is_vatable'] ?? '') !== $this->normalizeAuditValue($afterValues['is_vatable'] ?? '');

        $fieldMap = array(
            'description' => 'description',
            'invoice_receipt_no' => 'invoice_receipt_no',
            'document_date' => 'document_date',
            'approved_amount' => 'approved_amount',
            'expense_category' => 'expense_category',
            'is_vatable' => 'is_vatable',
            'net_amount' => 'net_amount',
            'vat_amount' => 'vat_amount',
            'vendor_name' => 'vendor_name',
            'vendor_address' => 'vendor_address',
            'vendor_tin' => 'vendor_tin',
        );

        foreach ($fieldMap as $auditField => $rowField) {
            $oldValue = array_key_exists($rowField, $beforeRow) ? $this->normalizeAuditValue($beforeRow[$rowField]) : '';
            $newValue = array_key_exists($auditField, $afterValues) ? $this->normalizeAuditValue($afterValues[$auditField]) : '';

            if (($auditField === 'net_amount' || $auditField === 'vat_amount') && !$approvedChanged && !$vatableChanged) {
                continue;
            }

            if ($auditField === 'document_date') {
                $oldValue = $oldValue !== '' ? date('Y-m-d', strtotime($oldValue)) : '';
                $newValue = $newValue !== '' ? date('Y-m-d', strtotime($newValue)) : '';
            }

            if ($auditField === 'approved_amount' || $auditField === 'net_amount' || $auditField === 'vat_amount') {
                $oldValue = $this->normalizeAuditDecimal($oldValue);
                $newValue = $this->normalizeAuditDecimal($newValue);
            }

            if ($auditField === 'is_vatable') {
                $oldValue = $oldValue === '' ? '' : ((int) $oldValue === 1 ? '1' : '0');
                $newValue = $newValue === '' ? '' : ((int) $newValue === 1 ? '1' : '0');
            }

            if ($oldValue === $newValue) {
                continue;
            }

            $this->logAuditTrail(
                'REIMBURSEMENT',
                $referenceNo,
                'UPDATED_ITEM',
                'ITEM',
                (int) $detailId,
                $auditField,
                $oldValue,
                $newValue
            );
        }
    }

    private function logCashAdvanceFieldChanges($referenceNo, $beforeRow, $afterValues)
    {
        if (!is_array($beforeRow) || !is_array($afterValues) || $referenceNo === '') {
            return;
        }

        $fieldMap = array(
            'description' => 'description',
            'amount' => 'amount',
        );

        foreach ($fieldMap as $auditField => $rowField) {
            $oldValue = array_key_exists($rowField, $beforeRow) ? $this->normalizeAuditValue($beforeRow[$rowField]) : '';
            $newValue = array_key_exists($auditField, $afterValues) ? $this->normalizeAuditValue($afterValues[$auditField]) : '';

            if ($auditField === 'amount') {
                $oldValue = $this->normalizeAuditDecimal($oldValue);
                $newValue = $this->normalizeAuditDecimal($newValue);
            }

            if ($oldValue === $newValue) {
                continue;
            }

            $this->logAuditTrail(
                'CASH_ADVANCE',
                $referenceNo,
                'UPDATED_ITEM',
                'HEADER',
                $referenceNo,
                $auditField,
                $oldValue,
                $newValue
            );
        }
    }

    private function updateLiquidationEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin, $approvedGrossAmount = null)
    {
        $detailId = (int) $detailId;
        if ($detailId <= 0) {
            return false;
        }

        $params = array(
            'DetailId' => $detailId,
            'Description' => trim((string) $description),
            'InvoiceReceiptNo' => trim((string) $invoiceReceiptNo),
            'ActualAmount' => (float) $actualAmount,
            'DocumentDate' => trim((string) $documentDate),
            'ExpenseCategory' => trim((string) $expenseCategory),
            'IsVatable' => (int) (bool) $isVatable,
            'NetAmount' => (float) $netAmount,
            'VatAmount' => (float) $vatAmount,
            'VendorName' => trim((string) $vendorName),
            'VendorAddress' => trim((string) $vendorAddress),
            'VendorTin' => trim((string) $vendorTin),
            'ApprovedGrossAmount' => $approvedGrossAmount !== null ? (float) $approvedGrossAmount : (float) $actualAmount,
        );

        return $this->sp->createData(
            build_sp('sp_update_liquidation_detail_review', count($params)),
            $params
        ) === TRUE;
    }

    private function updateReimbursementEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin, $approvedGrossAmount = null)
    {
        $detailId = (int) $detailId;
        if ($detailId <= 0) {
            return false;
        }

        $params = array(
            'DetailId' => $detailId,
            'Description' => trim((string) $description),
            'InvoiceReceiptNo' => trim((string) $invoiceReceiptNo),
            'ActualAmount' => (float) $actualAmount,
            'DocumentDate' => trim((string) $documentDate),
            'ExpenseCategory' => trim((string) $expenseCategory),
            'IsVatable' => (int) (bool) $isVatable,
            'NetAmount' => (float) $netAmount,
            'VatAmount' => (float) $vatAmount,
            'VendorName' => trim((string) $vendorName),
            'VendorAddress' => trim((string) $vendorAddress),
            'VendorTin' => trim((string) $vendorTin),
            'ApprovedGrossAmount' => $approvedGrossAmount !== null ? (float) $approvedGrossAmount : (float) $actualAmount,
        );

        return $this->sp->createData(
            build_sp('sp_update_reimbursement_detail_review', count($params)),
            $params
        ) === TRUE;
    }

    private function updateCashAdvanceEditableFields($referenceNo, $description, $amount, $updatedBy, $approvedAmount = null, $approvedAmountInWords = '')
    {
        $referenceNo = trim((string) $referenceNo);
        if ($referenceNo === '') {
            return false;
        }

        $params = array(
            'ReferenceNo' => $referenceNo,
            'Description' => trim((string) $description),
            'Amount' => (float) $amount,
            'UpdatedBy' => (int) $updatedBy,
        );

        if ($approvedAmount !== null) {
            $params['ApprovedAmount'] = (float) $approvedAmount;
            $params['ApprovedAmountInWords'] = trim((string) $approvedAmountInWords);
        }

        return $this->sp->createData(
            build_sp('sp_update_ca_detail_review', count($params)),
            $params
        ) === TRUE;
    }

    public function api_update_ca_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['reference_no']) ? trim((string) $data['reference_no']) : '';
            $costCenterId = isset($data['cost_center_id']) ? trim((string) $data['cost_center_id']) : '';
            $payableTo = isset($data['payable_to']) ? trim((string) $data['payable_to']) : '';
            $address = isset($data['address']) ? trim((string) $data['address']) : '';
            $io = isset($data['io']) ? trim((string) $data['io']) : '';

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $params = array(
                'ReferenceNo' => $referenceNo,
                'CostCenterId' => $costCenterId,
                'PayableTo' => $payableTo,
                'Address' => $address,
                'UpdatedBy' => $userId,
            );

            $result = false;
            if ($io !== '') {
                $paramsWithIo = $params;
                $paramsWithIo['IO'] = $io;

                try {
                    $result = $this->sp->createData(
                        build_sp('sp_update_ca_header_fields', count($paramsWithIo)),
                        $paramsWithIo,
                        'result'
                    );
                } catch (Throwable $e) {
                    $result = false;
                }
            }

            if ($result !== TRUE) {
                $result = $this->sp->createData(
                    build_sp('sp_update_ca_header_fields', count($params)),
                    $params,
                    'result'
                );
            }

            return $this->respondSuccess('Cash advance details updated successfully.');
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_update_rmb_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['reference_no']) ? trim((string) $data['reference_no']) : '';
            $costCenterId = isset($data['cost_center_id']) ? trim((string) $data['cost_center_id']) : '';
            $payableTo = isset($data['payable_to']) ? trim((string) $data['payable_to']) : '';
            $address = isset($data['address']) ? trim((string) $data['address']) : '';
            $io = isset($data['io']) ? trim((string) $data['io']) : '';

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $params = array(
                'ReferenceNo' => $referenceNo,
                'CostCenterId' => $costCenterId,
                'PayableTo' => $payableTo,
                'Address' => $address,
                'UpdatedBy' => $userId,
                'IO' => $io,
            );

            $result = $this->sp->createData(
                build_sp('sp_update_reimbursement_header_fields', count($params)),
                $params,
                'result'
            );

            return $this->respondSuccess('Reimbursement details updated successfully.');
        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_per_item_decision()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $approvalPerItemId = isset($data['approval_per_item_id']) ? (int) $data['approval_per_item_id'] : 0;
            $status = isset($data['status']) ? trim((string) $data['status']) : '';
            $remarks = isset($data['remarks']) ? trim((string) $data['remarks']) : '';
            $isNotify = isset($data['is_notify']) ? (int) (bool) $data['is_notify'] : 0;

            if ($approvalPerItemId <= 0) {
                throw new Exception('Missing approval_per_item_id');
            }
            if ($status === '') {
                throw new Exception('Missing status');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $txInfo = $this->getTransactionInfoFromApprovalItem($approvalPerItemId);
            $referenceNo = $txInfo ? ($txInfo['reference_id'] ?? '') : '';
            $oldStatus = $txInfo ? ($txInfo['status'] ?? 'PENDING') : 'PENDING';

            $spParams = array(
                'ApprovalPerItemId' => $approvalPerItemId,
                'ApproverId' => $userId,
                'Status' => $status,
                'Remarks' => $remarks,
                'IsNotify' => $isNotify,
            );

            $result = $this->sp->readData(
                build_sp('sp_approval_per_item_decision', count($spParams)),
                $spParams,
                'result'
            );

            if (!is_array($result) || count($result) === 0) {
                throw new Exception('Per-item decision returned no result.');
            }

            $transactionType = '';
            if (strpos($referenceNo, 'CA') === 0) {
                $transactionType = 'CASH_ADVANCE';
            } elseif (strpos($referenceNo, 'LQ') === 0) {
                $transactionType = 'LIQUIDATION';
            } elseif (strpos($referenceNo, 'RMB') === 0) {
                $transactionType = 'REIMBURSEMENT';
            }

            if ($transactionType !== '' && $oldStatus !== $status) {
                $this->logAuditTrail(
                    $transactionType,
                    $referenceNo,
                    $status,
                    'ITEM',
                    $approvalPerItemId,
                    'status',
                    $oldStatus,
                    $status
                );
            }

            return $this->respondSuccess('Item decision recorded.', $result[0]);

        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_submit_decisions()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['reference_no']) ? trim((string) $data['reference_no']) : '';
            $transactionType = isset($data['transaction_type']) ? strtoupper(trim((string) $data['transaction_type'])) : '';
            $overallRemarks = isset($data['overall_remarks']) ? trim((string) $data['overall_remarks']) : '';
            $decisions = isset($data['decisions']) && is_array($data['decisions']) ? $data['decisions'] : array();

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

            if ($transactionType === 'LIQUIDATION' || $transactionType === 'REIMBURSEMENT') {
                foreach ($decisions as $d) {
                    $detailId = isset($d['detail_id']) ? (int) $d['detail_id'] : 0;
                    $isVatable = isset($d['is_vatable']) ? (int) (bool) $d['is_vatable'] : 0;
                    $netAmount = isset($d['net_amount']) ? (float) $d['net_amount'] : 0;
                    $vatAmount = isset($d['vat_amount']) ? (float) $d['vat_amount'] : 0;
                    $description = isset($d['description']) ? (string) $d['description'] : '';
                    $invoiceReceiptNo = isset($d['invoice_receipt_no']) ? (string) $d['invoice_receipt_no'] : '';
                    $documentDate = isset($d['document_date']) ? (string) $d['document_date'] : '';
                    $actualAmount = isset($d['actual_amount']) ? (float) $d['actual_amount'] : 0;
                    $expenseCategory = isset($d['expense_category']) ? (string) $d['expense_category'] : '';
                    $vendorName = isset($d['vendor_name']) ? (string) $d['vendor_name'] : '';
                    $vendorAddress = isset($d['vendor_address']) ? (string) $d['vendor_address'] : '';
                    $vendorTin = isset($d['vendor_tin']) ? (string) $d['vendor_tin'] : '';

                    if ($detailId > 0) {
                        $approvedGross = isset($d['approved_amount']) ? (float) $d['approved_amount'] : $actualAmount;

                        if ($transactionType === 'LIQUIDATION') {
                            $beforeRow = $this->getLiquidationDetailById($detailId);
                            $updated = $this->updateLiquidationEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin, $approvedGross);
                        } else {
                            $beforeRow = $this->getReimbursementDetailById($detailId);
                            $updated = $this->updateReimbursementEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin, $approvedGross);
                        }

                        if ($updated) {
                            $afterValues = array(
                                'description' => $description,
                                'invoice_receipt_no' => $invoiceReceiptNo,
                                'document_date' => $documentDate,
                                'actual_amount' => $actualAmount,
                                'approved_amount' => $approvedGross,
                                'expense_category' => $expenseCategory,
                                'is_vatable' => $isVatable,
                                'net_amount' => $netAmount,
                                'vat_amount' => $vatAmount,
                                'vendor_name' => $vendorName,
                                'vendor_address' => $vendorAddress,
                                'vendor_tin' => $vendorTin,
                            );

                            if ($transactionType === 'LIQUIDATION') {
                                $this->logLiquidationDetailFieldChanges($referenceNo, $detailId, $beforeRow, $afterValues);
                            } else {
                                $this->logReimbursementDetailFieldChanges($referenceNo, $detailId, $beforeRow, $afterValues);
                            }
                        }
                    }
                }
            } elseif ($transactionType === 'CASH_ADVANCE') {
                $firstDecision = $decisions[0];
                $description = isset($firstDecision['description']) ? (string) $firstDecision['description'] : '';
                $amount = isset($firstDecision['amount']) ? (float) $firstDecision['amount'] : 0;
                $originalAmount = isset($firstDecision['original_amount']) ? (float) $firstDecision['original_amount'] : $amount;
                $approvedAmount = isset($firstDecision['approved_amount']) ? (float) $firstDecision['approved_amount'] : $amount;
                $approvedAmountInWords = isset($firstDecision['approved_amount_in_words']) ? (string) $firstDecision['approved_amount_in_words'] : '';

                if ($approvedAmountInWords === '' && $approvedAmount > 0) {
                    $approvedAmountInWords = $this->amountToWords($approvedAmount);
                }

                $beforeRow = $this->getCashAdvanceByReferenceNo($referenceNo);
                $updated = $this->updateCashAdvanceEditableFields($referenceNo, $description, $amount, $userId, $approvedAmount, $approvedAmountInWords);

                if ($updated) {
                    $this->logCashAdvanceFieldChanges($referenceNo, $beforeRow, array(
                        'description' => $description,
                        'amount' => $amount,
                        'approved_amount' => $approvedAmount,
                    ));
                }
            }

            $overallDecision = 'APPROVED';
            $rejectionReason = null;

            if ($transactionType === 'LIQUIDATION' || $transactionType === 'REIMBURSEMENT') {
                foreach ($decisions as $d) {
                    $rawDecision = isset($d['decision']) ? strtolower(trim((string) $d['decision'])) : '';
                    if ($rawDecision === 'reject' || $rawDecision === 'rejected') {
                        $overallDecision = 'REJECTED';
                        $rejectionReason = isset($d['remark']) ? trim((string) $d['remark']) : '';
                        break;
                    }
                }
            } else {
                $rawDecision = isset($decisions[0]['decision']) ? strtolower(trim((string) $decisions[0]['decision'])) : '';
                if ($rawDecision === 'approve' || $rawDecision === 'approved') {
                    $overallDecision = 'APPROVED';
                } elseif ($rawDecision === 'reject' || $rawDecision === 'rejected') {
                    $overallDecision = 'REJECTED';
                    $rejectionReason = isset($decisions[0]['remark']) ? trim((string) $decisions[0]['remark']) : '';
                } else {
                    throw new Exception('Invalid decision value: ' . $rawDecision);
                }
            }

            $spParams = array(
                'ReferenceId' => $referenceNo,
                'ApproverId' => $userId,
                'Status' => $overallDecision,
                'Remarks' => $overallRemarks,
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

            $this->logAuditTrail(
                $transactionType,
                $referenceNo,
                $overallDecision,
                'HEADER',
                $referenceNo,
                null,
                null,
                $overallRemarks ?: $rejectionReason
            );

            $this->notifyDecisionOutcome($transactionType, $referenceNo, $overallDecision, $userId, $row, $overallRemarks ?: $rejectionReason);

            return $this->respondSuccess('Decision submitted successfully.', array(
                'next_approver_id' => isset($row['next_approver_id']) ? (int) $row['next_approver_id'] : null,
                'header_status' => isset($row['header_status']) ? $row['header_status'] : null,
                'approval_header_id' => isset($row['approval_header_id']) ? (int) $row['approval_header_id'] : null,
                'reference_id' => isset($row['reference_id']) ? $row['reference_id'] : $referenceNo,
            ));

        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    public function api_get_approval_timeline()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo = isset($data['ReferenceNo']) ? trim((string) $data['ReferenceNo']) : '';
            if ($referenceNo === '') {
                return $this->respondError('Missing ReferenceNo');
            }

            $transactionType = '';
            if (strpos($referenceNo, 'CA') === 0) {
                $transactionType = 'CASH_ADVANCE';
            } elseif (strpos($referenceNo, 'LQ') === 0) {
                $transactionType = 'LIQUIDATION';
            } elseif (strpos($referenceNo, 'RMB') === 0) {
                $transactionType = 'REIMBURSEMENT';
            } elseif (strpos($referenceNo, 'RPL') === 0) {
                $transactionType = 'REPLENISHMENT';
            }

            $auditParams = array(
                'TransactionId' => $referenceNo,
            );
            $auditTrail = $this->sp->readData(
                build_sp('sp_fetch_audit_trail', count($auditParams)),
                $auditParams,
                'result'
            );

            $matrixParams = array(
                'ReferenceId' => $referenceNo,
            );
            $approvalMatrix = $this->sp->readData(
                build_sp('sp_fetch_approval_matrix', count($matrixParams)),
                $matrixParams,
                'result'
            );

            return $this->respondSuccess('Timeline fetched', array(
                'transaction_type' => $transactionType,
                'audit_trail' => is_array($auditTrail) ? $auditTrail : array(),
                'approval_matrix' => is_array($approvalMatrix) ? $approvalMatrix : array(),
            ));

        } catch (Throwable $e) {
            return $this->respondError($e->getMessage());
        }
    }

    private function amountToWords($amount)
    {
        $num = (float) $amount;
        if ($num <= 0) return '';
        
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        $convertLessThanOneThousand = function($n) use (&$ones, &$tens) {
            $result = '';
            if ($n >= 100) {
                $result .= $ones[(int)($n / 100)] . ' Hundred';
                $n %= 100;
                if ($n > 0) $result .= ' ';
            }
            if ($n < 20) {
                $result .= $ones[$n];
            } else {
                $result .= $tens[(int)($n / 10)];
                if ($n % 10 !== 0) $result .= '-' . $ones[$n % 10];
            }
            return trim($result);
        };
        
        $convert = function($n) use (&$convertLessThanOneThousand, &$convert) {
            if ($n == 0) return 'Zero';
            $result = '';
            $billion = (int)($n / 1000000000);
            $million = (int)(($n % 1000000000) / 1000000);
            $thousand = (int)(($n % 1000000) / 1000);
            $remainder = $n % 1000;
            if ($billion) $result .= $convert($billion) . ' Billion ';
            if ($million) $result .= $convert($million) . ' Million ';
            if ($thousand) $result .= $convert($thousand) . ' Thousand ';
            if ($remainder) $result .= $convertLessThanOneThousand($remainder);
            return trim($result);
        };
        
        $pesos = (int)$num;
        $centavos = (int)round(($num - $pesos) * 100);
        $words = $convert($pesos) . ' Pesos';
        if ($centavos > 0) {
            $words .= ' and ' . $convert($centavos) . ' Centavos';
        }
        $words .= ' Only';
        return $words;
    }
}