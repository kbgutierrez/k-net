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
        $costCenters = $this->sp->fetchData('sp_fetch_active_cost_centers');
        if (!is_array($costCenters)) {
            $costCenters = array();
        }

        $expenseTypes = $this->sp->fetchData('sp_fetch_expense_types');
        if (!is_array($expenseTypes)) {
            $expenseTypes = array();
        }

        $data = array(
            'title' => 'Review Approval',
            'main_view' => '../modules/approvals/views/review',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'approval_id' => $approval_id,
            'cost_centers' => $costCenters,
            'expense_types' => $expenseTypes,
            'scripts' => array('review.js'),
        );
        $this->load->view('main', $data);
    }

    // ─── HELPER: Get transaction info from approval_per_item_id ───
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

    // ─── HELPER: Fetch CA attachments by CA ID ───
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
            $takeRaw = $this->input->post('Take');

            $take = (int) $takeRaw;
            if ($take <= 0)
                $take = 20;

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
            if ($hasMore)
                array_pop($result);

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

                 if ($transactionType === 'CASH_ADVANCE' || $transactionType === 'LIQUIDATION') {
                    $caId = isset($firstRow['reference_no']) ? $firstRow['reference_no'] : 0;
                    if ($caId) {
                        $attachments = $this->fetchCaAttachments($caId);
                        $hasAttachments = count($attachments) > 0;
                    }
                }
            }

            return $this->respondSuccess("Details fetched successfully.", array(
                'items' => $result,
                'attachments' => $attachments,
                'has_attachments' => $hasAttachments,
            ));
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
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

        $actualChanged = $this->normalizeAuditDecimal($beforeRow['actual_amount'] ?? '') !== $this->normalizeAuditDecimal($afterValues['actual_amount'] ?? '');
        $vatableChanged = $this->normalizeAuditValue($beforeRow['is_vatable'] ?? '') !== $this->normalizeAuditValue($afterValues['is_vatable'] ?? '');

        $fieldMap = array(
            'description' => 'description',
            'invoice_receipt_no' => 'invoice_receipt_no',
            'document_date' => 'document_date',
            'actual_amount' => 'actual_amount',
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

            if (($auditField === 'net_amount' || $auditField === 'vat_amount') && !$actualChanged && !$vatableChanged) {
                continue;
            }

            if ($auditField === 'document_date') {
                $oldValue = $oldValue !== '' ? date('Y-m-d', strtotime($oldValue)) : '';
                $newValue = $newValue !== '' ? date('Y-m-d', strtotime($newValue)) : '';
            }

            if ($auditField === 'actual_amount' || $auditField === 'net_amount' || $auditField === 'vat_amount') {
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

    /**
     * Persist approver-side liquidation item edits during final review submission.
     */
    private function updateLiquidationEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin)
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
        );

        return $this->sp->createData(
            build_sp('sp_update_liquidation_detail_review', count($params)),
            $params
        ) === TRUE;
    }

    /**
     * Update CA header fields (cost_center, payable_to, address) in one batch
     */
    public function api_update_ca_header()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $referenceNo  = isset($data['reference_no'])  ? trim((string) $data['reference_no'])  : '';
            $costCenterId = isset($data['cost_center_id']) ? trim((string) $data['cost_center_id']) : '';
            $payableTo    = isset($data['payable_to'])    ? trim((string) $data['payable_to'])    : '';
            $address      = isset($data['address'])      ? trim((string) $data['address'])      : '';
            $io           = isset($data['io'])           ? trim((string) $data['io'])           : '';

            if ($referenceNo === '') {
                throw new Exception('Missing required field: reference_no');
            }

            $userId = (int) $this->session->userdata('user_id');
            if ($userId <= 0) {
                throw new Exception('User not authenticated.');
            }

            $params = array(
                'ReferenceNo'  => $referenceNo,
                'CostCenterId' => $costCenterId,
                'PayableTo'    => $payableTo,
                'Address'      => $address,
                'UpdatedBy'    => $userId,
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

    /**
     * Per-item decision (before final submit)
     */
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

    /**
     * Final submit of all decisions
     */
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

            if ($transactionType === 'LIQUIDATION') {
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
                        $beforeRow = $this->getLiquidationDetailById($detailId);
                        $updated = $this->updateLiquidationEditableFields($detailId, $description, $invoiceReceiptNo, $documentDate, $actualAmount, $expenseCategory, $isVatable, $netAmount, $vatAmount, $vendorName, $vendorAddress, $vendorTin);
                        if ($updated) {
                            $this->logLiquidationDetailFieldChanges($referenceNo, $detailId, $beforeRow, array(
                                'description' => $description,
                                'invoice_receipt_no' => $invoiceReceiptNo,
                                'document_date' => $documentDate,
                                'actual_amount' => $actualAmount,
                                'expense_category' => $expenseCategory,
                                'is_vatable' => $isVatable,
                                'net_amount' => $netAmount,
                                'vat_amount' => $vatAmount,
                                'vendor_name' => $vendorName,
                                'vendor_address' => $vendorAddress,
                                'vendor_tin' => $vendorTin,
                            ));
                        }
                    }
                }
            }

            $overallDecision = 'APPROVED';
            $rejectionReason = null;

            if ($transactionType === 'LIQUIDATION') {
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

    /**
     * Fetch approval timeline for review page
     */
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

    private function getRequestPayload()
    {
        $raw = $this->input->raw_input_stream;
        if (!empty($raw)) {
            $json = json_decode($raw, true);
            if (is_array($json))
                return $json;
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