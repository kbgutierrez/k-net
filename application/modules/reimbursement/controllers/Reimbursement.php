<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Reimbursement extends MY_Controller
{
    private $draftEditWindowDays = 7;

    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    public function index()
    {
        $data = array(
            'title' => 'Reimbursement',
            'main_view' => '../modules/reimbursement/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                '../reimbursement/index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function add($reimbursement_no = '')
    {
        $ref = trim((string) $reimbursement_no);
        $isEditMode = $ref !== '';
        $data = array(
            'title' => $isEditMode ? 'Edit Draft Reimbursement' : 'New Reimbursement',
            'main_view' => '../modules/reimbursement/views/add',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'reimbursement_no' => $ref,
            'is_edit_mode' => $isEditMode,
            'draft_edit_window_days' => $this->draftEditWindowDays,
            'scripts' => array(
                '../shared/receipt-ocr.js',
                '../reimbursement/index.js',
                '../reimbursement/add.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function view($reimbursement_no = '')
    {
        $data = array(
            'title' => 'Reimbursement Details',
            'main_view' => '../modules/reimbursement/views/detail',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'reimbursement_no' => $reimbursement_no,
            'scripts' => array(
                '../reimbursement/index.js',
                '../reimbursement/detail.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function edit($reimbursement_no = '')
    {
        $ref = trim((string) $reimbursement_no);
        if ($ref === '') {
            redirect('transactions/reimbursement');
            return;
        }

        $data = array(
            'title' => 'Edit Reimbursement',
            'main_view' => '../modules/reimbursement/views/edit',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'reimbursement_no' => $ref,
            'scripts' => array(
                '../shared/receipt-ocr.js',
                '../reimbursement/edit.js',
            ),
        );

        $this->load->view('main', $data);
    }

    // ========== API METHODS ==========

    public function api_get_expense_categories()
    {
        try {
            $this->output->set_content_type('application/json');

            $authHeader = $this->input->get_request_header('Authorization', TRUE);
            if (!$authHeader || !preg_match('/Bearer\\s(\\S+)/', $authHeader, $matches)) {
                return $this->respondError("Unauthorized: Token missing", 401);
            }

            $token = $matches[1];
            $secureToken = "12345678";

            if ($token !== $secureToken) {
                return $this->respondError("Unauthorized: Invalid token.", 401);
            }

            $result = $this->sp->fetchData('sp_fetch_expense_types');
            return $this->respondSuccess("success", $result);
        } catch (Exception $e) {
            return $this->respondError("error: " . $e->getMessage());
        }
    }

    public function api_get_reimbursement()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $reimbursementId = isset($data['ReimbursementId']) ? trim((string) $data['ReimbursementId']) : '';
            if ($reimbursementId === '') {
                return $this->respondError('Missing required field: ReimbursementId');
            }

            $header = $this->getDraftHeaderByReimbursementId($reimbursementId);
            if (!$header) {
                return $this->respondError('Reimbursement not found.');
            }

            $userId = (int) $this->session->userdata('user_id');
            $createdById = isset($header['created_by_id']) ? (int) $header['created_by_id'] : 0;
            if ($createdById !== $userId) {
                return $this->respondError('You are not allowed to access this reimbursement.');
            }

            $ageDays = $this->getDraftAgeDays(isset($header['created_date']) ? $header['created_date'] : '');
            $canEdit = $ageDays <= $this->draftEditWindowDays;
            $statusCode = isset($header['status_code']) ? trim((string) $header['status_code']) : '';

            $detailParams = array(
                'ReimbursementId' => $reimbursementId,
            );
            $details = $this->sp->readData(
                build_sp('sp_fetch_reimbursement_details', count($detailParams)),
                $detailParams,
                'result'
            );

            return $this->respondSuccess('success', array(
                'header' => $header,
                'details' => is_array($details) ? $details : array(),
                'canEdit' => $canEdit,
                'draftAgeDays' => $ageDays,
                'draftEditWindowDays' => $this->draftEditWindowDays,
            ));
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_save_reimbursement()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            if (isset($data['Expenses']) && is_string($data['Expenses'])) {
                $decodedExpenses = json_decode($data['Expenses'], true);
                if (is_array($decodedExpenses)) {
                    $data['Expenses'] = $decodedExpenses;
                }
            }

            $requestedReimbursementId = isset($data['ReimbursementId']) ? trim((string) $data['ReimbursementId']) : '';

            if (!isset($data['Expenses']) || !is_array($data['Expenses']) || count($data['Expenses']) === 0) {
                return $this->respondError("Missing required field: Expenses");
            }

            $totalAmount = isset($data['TotalAmount']) ? (float) $data['TotalAmount'] : 0;
            if ($totalAmount <= 0) {
                return $this->respondError("Missing required field: TotalAmount");
            }

            $description = isset($data['Description']) ? trim((string) $data['Description']) : '';
            $statusCode = isset($data['StatusCode']) && $data['StatusCode'] !== '' ? trim((string) $data['StatusCode']) : 'RMB_DRAFT';
            if ($statusCode !== 'RMB_DRAFT' && $statusCode !== 'RMB_SUBMITTED') {
                $statusCode = 'RMB_DRAFT';
            }

            $reimbursementId = '';
            $currentUserId = (int) $this->session->userdata('user_id');

            // Update existing draft
            if ($requestedReimbursementId !== '') {
                $existingHeader = $this->getDraftHeaderByReimbursementId($requestedReimbursementId);
                if (!$existingHeader) {
                    return $this->respondError('Draft reimbursement not found.');
                }

                $createdById = isset($existingHeader['created_by_id']) ? (int) $existingHeader['created_by_id'] : 0;
                if ($createdById !== $currentUserId) {
                    return $this->respondError('You are not allowed to update this draft.');
                }

                $existingStatus = isset($existingHeader['status_code']) ? trim((string) $existingHeader['status_code']) : '';
                if ($existingStatus !== 'RMB_DRAFT') {
                    return $this->respondError('Only draft reimbursement can be updated.');
                }

                $ageDays = $this->getDraftAgeDays(isset($existingHeader['created_date']) ? $existingHeader['created_date'] : '');
                if ($ageDays > $this->draftEditWindowDays) {
                    return $this->respondError('Draft edit window has expired.');
                }

                $updateHeaderParams = array(
                    'ReimbursementId' => $requestedReimbursementId,
                    'UserId' => $currentUserId,
                    'TotalAmount' => $totalAmount,
                    'StatusCode' => $statusCode,
                    'Description' => $description,
                );

                $updateHeaderResult = $this->sp->createData(
                    build_sp('sp_update_reimbursement_header_draft', count($updateHeaderParams)),
                    $updateHeaderParams
                );

                if ($updateHeaderResult !== TRUE) {
                    return $this->respondError('Failed to update draft reimbursement header.');
                }

                $deleteDetailParams = array(
                    'ReimbursementId' => $requestedReimbursementId,
                );
                $deleteDetailResult = $this->sp->createData(
                    build_sp('sp_delete_reimbursement_details_by_reimbursement_id', count($deleteDetailParams)),
                    $deleteDetailParams
                );

                if ($deleteDetailResult !== TRUE) {
                    return $this->respondError('Failed to refresh draft expense details.');
                }

                $reimbursementId = $requestedReimbursementId;

                $this->logAuditTrail(
                    'REIMBURSEMENT',
                    $reimbursementId,
                    'UPDATED_DRAFT',
                    'HEADER',
                    $reimbursementId
                );
            }

            // Create new
            if ($reimbursementId === '') {
                $headerParams = array(
                    "UserId" => $currentUserId,
                    "TotalAmount" => $totalAmount,
                    "StatusCode" => $statusCode,
                    "Description" => $description,
                );

                $headerResult = $this->sp->createReturnId(
                    build_sp('sp_insert_reimbursement_header', count($headerParams)),
                    $headerParams
                );

                if (!is_array($headerResult) || !isset($headerResult['GeneratedReimbursementID']) || $headerResult['GeneratedReimbursementID'] === '') {
                    return $this->respondError("Failed to create reimbursement");
                }

                $reimbursementId = $headerResult['GeneratedReimbursementID'];

                $this->logAuditTrail(
                    'REIMBURSEMENT',
                    $reimbursementId,
                    'SAVED_DRAFT',
                    'HEADER',
                    $reimbursementId
                );
            }

            // Insert details
            foreach ($data['Expenses'] as $index => $expense) {
                $actualAmount = isset($expense['ActualAmount']) ? (float) $expense['ActualAmount'] : (isset($expense['amount']) ? (float) $expense['amount'] : 0);
                $expenseCategory = isset($expense['ExpenseCategory']) ? (int) $expense['ExpenseCategory'] : (isset($expense['expenseType']) ? (int) $expense['expenseType'] : 0);
                $isVatable = isset($expense['IsVatable']) ? (bool) $expense['IsVatable'] : (isset($expense['isVattable']) ? (bool) $expense['isVattable'] : false);

                if ($actualAmount <= 0 || $expenseCategory <= 0) {
                    return $this->respondError("Invalid expense item at index {$index}");
                }

                $vatAmount = isset($expense['VatAmount']) ? (float) $expense['VatAmount'] : ($isVatable ? round($actualAmount * 0.12 / 1.12, 2) : 0);
                $netAmount = isset($expense['NetAmount']) ? (float) $expense['NetAmount'] : ($isVatable ? round($actualAmount - $vatAmount, 2) : $actualAmount);

                $attachment = $this->collectAttachmentPaths($expense, $index);

                $detailParams = array(
                    "ReimbursementId" => $reimbursementId,
                    "Description" => isset($expense['Description']) ? $expense['Description'] : '',
                    "InvoiceReceiptNo" => isset($expense['InvoiceReceiptNo']) ? $expense['InvoiceReceiptNo'] : '',
                    "ActualAmount" => $actualAmount,
                    "DocumentDate" => isset($expense['DocumentDate']) ? $expense['DocumentDate'] : '',
                    "ExpenseCategory" => $expenseCategory,
                    "IsVatable" => $isVatable ? 1 : 0,
                    "NetAmount" => $netAmount,
                    "VatAmount" => $vatAmount,
                    "Attachment" => $attachment,
                );

                $detailResult = $this->sp->createData(
                    build_sp('sp_insert_reimbursement_details', count($detailParams)),
                    $detailParams
                );

                if ($detailResult !== TRUE) {
                    return $this->respondError("Failed to save expense detail at index {$index}");
                }
            }

            // If submitted (not draft), create approval entries
            if ($statusCode === 'RMB_SUBMITTED') {
                $this->createApprovalEntries($reimbursementId, $totalAmount);
                $this->logAuditTrail(
                    'REIMBURSEMENT',
                    $reimbursementId,
                    'SUBMITTED',
                    'HEADER',
                    $reimbursementId
                );
            }

            $message = $statusCode === 'RMB_DRAFT'
                ? 'Reimbursement draft saved successfully'
                : 'Reimbursement submitted successfully';

            return $this->respondSuccess($message, array('id' => $reimbursementId));
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_update_reimbursement()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            if (isset($data['Expenses']) && is_string($data['Expenses'])) {
                $decodedExpenses = json_decode($data['Expenses'], true);
                if (is_array($decodedExpenses)) {
                    $data['Expenses'] = $decodedExpenses;
                }
            }

            $reimbursementId = isset($data['ReimbursementId']) ? trim((string) $data['ReimbursementId']) : '';
            if ($reimbursementId === '') {
                return $this->respondError('Missing required field: ReimbursementId');
            }

            $existingHeader = $this->getDraftHeaderByReimbursementId($reimbursementId);
            if (!$existingHeader) {
                return $this->respondError('Reimbursement not found.');
            }

            $currentUserId = (int) $this->session->userdata('user_id');
            $createdById = isset($existingHeader['created_by_id']) ? (int) $existingHeader['created_by_id'] : 0;
            if ($createdById !== $currentUserId) {
                return $this->respondError('You are not allowed to update this reimbursement.');
            }

            $existingStatus = isset($existingHeader['status_code']) ? trim((string) $existingHeader['status_code']) : '';
            if ($existingStatus !== 'RMB_SUBMITTED' && $existingStatus !== 'RMB_REJECTED') {
                return $this->respondError('Only submitted or rejected reimbursements can be updated.');
            }

            if (!isset($data['Expenses']) || !is_array($data['Expenses']) || count($data['Expenses']) === 0) {
                return $this->respondError('Missing required field: Expenses');
            }

            $totalAmount = isset($data['TotalAmount']) ? (float) $data['TotalAmount'] : 0;
            if ($totalAmount <= 0) {
                return $this->respondError('Missing required field: TotalAmount');
            }

            $description = isset($data['Description']) ? trim((string) $data['Description']) : '';
            $statusCode = isset($data['StatusCode']) && $data['StatusCode'] !== '' ? trim((string) $data['StatusCode']) : 'RMB_SUBMITTED';

            // Update header
            $updateHeaderParams = array(
                'ReimbursementId' => $reimbursementId,
                'UserId' => $currentUserId,
                'TotalAmount' => $totalAmount,
                'StatusCode' => $statusCode,
                'Description' => $description,
            );

            $updateHeaderResult = $this->sp->createData(
                build_sp('sp_update_reimbursement_header_submitted', count($updateHeaderParams)),
                $updateHeaderParams
            );

            if ($updateHeaderResult !== TRUE) {
                return $this->respondError('Failed to update reimbursement header.');
            }

            // Get approval status per item
            $approvalParams = array(
                'ReimbursementId' => $reimbursementId,
            );
            $approvals = $this->sp->readData(
                build_sp('sp_fetch_reimbursement_approvals', count($approvalParams)),
                $approvalParams,
                'result'
            );

            $approvedItemIds = array();
            $itemApprovalStatus = array();
            if (is_array($approvals)) {
                foreach ($approvals as $approval) {
                    $lineItemId = isset($approval['line_item_id']) ? (int) $approval['line_item_id'] : 0;
                    $status = isset($approval['status']) ? trim((string) $approval['status']) : '';
                    if ($lineItemId > 0) {
                        if (!isset($itemApprovalStatus[$lineItemId])) {
                            $itemApprovalStatus[$lineItemId] = array();
                        }
                        $itemApprovalStatus[$lineItemId][] = $status;
                    }
                }
            }

            foreach ($itemApprovalStatus as $itemId => $statuses) {
                $allApproved = true;
                foreach ($statuses as $status) {
                    if ($status !== 'APPROVED') {
                        $allApproved = false;
                        break;
                    }
                }
                if ($allApproved && count($statuses) > 0) {
                    $approvedItemIds[] = $itemId;
                }
            }

            // Delete non-approved details
            $deleteDetailParams = array(
                'ReimbursementId' => $reimbursementId,
                'KeepItemIds' => implode(',', $approvedItemIds),
            );
            $deleteDetailResult = $this->sp->createData(
                build_sp('sp_delete_reimbursement_details_except_approved', count($deleteDetailParams)),
                $deleteDetailParams
            );

            if ($deleteDetailResult !== TRUE) {
                return $this->respondError('Failed to refresh expense details.');
            }

            // Insert new/updated details
            foreach ($data['Expenses'] as $index => $expense) {
                $itemId = isset($expense['Id']) ? trim((string) $expense['Id']) : '';
                $isNew = isset($expense['IsNew']) ? (bool) $expense['IsNew'] : false;

                if (!$isNew && $itemId !== '') {
                    $itemIdNum = (int) $itemId;
                    if (in_array($itemIdNum, $approvedItemIds)) {
                        continue;
                    }
                }

                $actualAmount = isset($expense['ActualAmount']) ? (float) $expense['ActualAmount'] : 0;
                $expenseCategory = isset($expense['ExpenseCategory']) ? (int) $expense['ExpenseCategory'] : 0;
                $isVatable = isset($expense['IsVatable']) ? (bool) $expense['IsVatable'] : false;

                if ($actualAmount <= 0 || $expenseCategory <= 0) {
                    return $this->respondError('Invalid expense item at index ' . $index);
                }

                $vatAmount = $isVatable ? round($actualAmount * 0.12 / 1.12, 2) : 0;
                $netAmount = $isVatable ? round($actualAmount - $vatAmount, 2) : $actualAmount;
                $attachment = $this->collectAttachmentPaths($expense, $index);

                $detailParams = array(
                    'ReimbursementId' => $reimbursementId,
                    'Description' => isset($expense['Description']) ? $expense['Description'] : '',
                    'InvoiceReceiptNo' => isset($expense['InvoiceReceiptNo']) ? $expense['InvoiceReceiptNo'] : '',
                    'ActualAmount' => $actualAmount,
                    'DocumentDate' => isset($expense['DocumentDate']) ? $expense['DocumentDate'] : '',
                    'ExpenseCategory' => $expenseCategory,
                    'IsVatable' => $isVatable ? 1 : 0,
                    'NetAmount' => $netAmount,
                    'VatAmount' => $vatAmount,
                    'Attachment' => $attachment,
                );

                $detailResult = $this->sp->createData(
                    build_sp('sp_insert_reimbursement_details', count($detailParams)),
                    $detailParams
                );

                if ($detailResult !== TRUE) {
                    return $this->respondError('Failed to save expense detail at index ' . $index);
                }
            }

            // Log resubmitted
            $this->logAuditTrail(
                'REIMBURSEMENT',
                $reimbursementId,
                'RESUBMITTED',
                'HEADER',
                $reimbursementId
            );

            // Re-create approval entries if submitted
            if ($statusCode === 'RMB_SUBMITTED') {
                $this->createApprovalEntries($reimbursementId, $totalAmount);
            }

            $message = $statusCode === 'RMB_DRAFT'
                ? 'Reimbursement saved as draft successfully'
                : 'Reimbursement updated and resubmitted successfully';

            return $this->respondSuccess($message, array('id' => $reimbursementId));
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_get_list()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $takeRaw = $this->input->post('Take');
            $search = $this->input->post('Search');
            $statusFilter = $this->input->post('StatusFilter');

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
                "Search" => $search !== null ? trim((string) $search) : '',
                "StatusFilter" => $statusFilter !== null ? trim((string) $statusFilter) : '',
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_reimbursement_list', count($params)),
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

    public function api_delete_draft()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $reimbursementId = isset($data['ReimbursementId']) ? trim((string) $data['ReimbursementId']) : '';
            if ($reimbursementId === '') {
                return $this->respondError('Missing required field: ReimbursementId');
            }

            $header = $this->getDraftHeaderByReimbursementId($reimbursementId);
            if (!$header) {
                return $this->respondError('Reimbursement not found.');
            }

            $currentUserId = (int) $this->session->userdata('user_id');
            $createdById = isset($header['created_by_id']) ? (int) $header['created_by_id'] : 0;
            if ($createdById !== $currentUserId) {
                return $this->respondError('You are not allowed to delete this reimbursement.');
            }

            $statusCode = isset($header['status_code']) ? trim((string) $header['status_code']) : '';
            if ($statusCode !== 'RMB_DRAFT') {
                return $this->respondError('Only draft reimbursements can be deleted.');
            }

            $params = array(
                'ReimbursementId' => $reimbursementId,
            );

            $result = $this->sp->createData(
                build_sp('sp_delete_reimbursement_draft', count($params)),
                $params
            );

            if ($result !== TRUE) {
                return $this->respondError('Failed to delete reimbursement draft.');
            }

            return $this->respondSuccess('Reimbursement draft deleted successfully');
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

    // ========== PRIVATE HELPERS ==========

    private function createApprovalEntries($reimbursementId, $totalAmount)
    {
        // This should match the existing approval flow pattern
        // Implementation depends on your existing approval module
        // Typically this calls sp_create_approval_entries or similar
        $params = array(
            'TransactionType' => 'REIMBURSEMENT',
            'TransactionId' => $reimbursementId,
            'TotalAmount' => $totalAmount,
            'UserId' => $this->session->userdata('user_id'),
        );

        // Call your existing approval creation SP
        // $this->sp->createData(build_sp('sp_create_approval_entries', count($params)), $params);
    }

    private function getDraftHeaderByReimbursementId($reimbursementId)
    {
        $params = array(
            'ReimbursementId' => $reimbursementId,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_reimbursement_header_by_reimbursement_id', count($params)),
            $params,
            'result'
        );

        if (!is_array($result) || count($result) === 0) {
            return null;
        }

        return $result[0];
    }

    private function getDraftAgeDays($createdDate)
    {
        $createdTimestamp = strtotime((string) $createdDate);
        if ($createdTimestamp === false) {
            return 999999;
        }

        $seconds = time() - $createdTimestamp;
        if ($seconds < 0) {
            $seconds = 0;
        }

        return (int) floor($seconds / 86400);
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

    private function ensureAttachmentDir()
    {
        $targetDir = 'assets/uploads/attachments/';
        $absoluteDir = rtrim(FCPATH, '/\\\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $targetDir);

        if (!is_dir($absoluteDir)) {
            mkdir($absoluteDir, 0777, true);
        }

        return array($targetDir, $absoluteDir);
    }

    private function normalizeSingleFileFromInput($fileInput, $index = null)
    {
        if (!isset($fileInput['name'])) {
            return null;
        }

        if (is_array($fileInput['name'])) {
            if ($index === null || !isset($fileInput['name'][$index]) || $fileInput['name'][$index] === '') {
                return null;
            }

            return array(
                'name' => $fileInput['name'][$index],
                'type' => isset($fileInput['type'][$index]) ? $fileInput['type'][$index] : '',
                'tmp_name' => isset($fileInput['tmp_name'][$index]) ? $fileInput['tmp_name'][$index] : '',
                'error' => isset($fileInput['error'][$index]) ? $fileInput['error'][$index] : UPLOAD_ERR_NO_FILE,
                'size' => isset($fileInput['size'][$index]) ? $fileInput['size'][$index] : 0,
            );
        }

        return $fileInput;
    }

    private function saveUploadedFile($file, $targetDir, $absoluteDir)
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return null;
        }

        $originalName = isset($file['name']) ? $file['name'] : '';
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $safeName = uniqid('att_', true) . ($extension ? '.' . strtolower($extension) : '');
        $targetPath = $absoluteDir . $safeName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            return null;
        }

        return $safeName;
    }

    private function saveBase64Attachment($base64Data, $targetDir, $absoluteDir)
    {
        if (!is_string($base64Data) || stripos($base64Data, 'data:') !== 0) {
            return null;
        }

        $parts = explode(',', $base64Data, 2);
        if (count($parts) !== 2) {
            return null;
        }

        $meta = $parts[0];
        $payload = base64_decode($parts[1], true);
        if ($payload === false) {
            return null;
        }

        $extension = 'bin';
        if (preg_match('#^data:([^;]+);base64$#i', $meta, $matches)) {
            $mime = strtolower($matches[1]);
            if (strpos($mime, 'image/jpeg') === 0) {
                $extension = 'jpg';
            } elseif (strpos($mime, 'image/png') === 0) {
                $extension = 'png';
            } elseif (strpos($mime, 'image/webp') === 0) {
                $extension = 'webp';
            } elseif (strpos($mime, 'application/pdf') === 0) {
                $extension = 'pdf';
            }
        }

        $safeName = uniqid('att_', true) . '.' . $extension;
        $targetPath = $absoluteDir . $safeName;
        $written = file_put_contents($targetPath, $payload);
        if ($written === false) {
            return null;
        }

        return $safeName;
    }

    private function collectAttachmentPaths($expense, $index)
    {
        list($targetDir, $absoluteDir) = $this->ensureAttachmentDir();
        $savedPaths = array();
        $hasNewUpload = false;

        $fileCandidates = array(
            'Attachment_' . $index,
            'attachments_' . $index,
            'Attachment',
            'attachments',
        );

        foreach ($fileCandidates as $fieldName) {
            if (!isset($_FILES[$fieldName])) {
                continue;
            }

            $singleFile = $this->normalizeSingleFileFromInput($_FILES[$fieldName], null);
            if ($singleFile && isset($singleFile['error']) && (int) $singleFile['error'] === UPLOAD_ERR_OK) {
                $savedPath = $this->saveUploadedFile($singleFile, $targetDir, $absoluteDir);
                if ($savedPath) {
                    $savedPaths[] = $savedPath;
                    $hasNewUpload = true;
                }
            }

            if (is_array($_FILES[$fieldName]['name'])) {
                foreach ($_FILES[$fieldName]['name'] as $fileIndex => $ignored) {
                    $file = $this->normalizeSingleFileFromInput($_FILES[$fieldName], $fileIndex);
                    if ($file && isset($file['error']) && (int) $file['error'] === UPLOAD_ERR_OK) {
                        $savedPath = $this->saveUploadedFile($file, $targetDir, $absoluteDir);
                        if ($savedPath) {
                            $savedPaths[] = $savedPath;
                            $hasNewUpload = true;
                        }
                    }
                }
            }
        }

        if (isset($_FILES['attachments']) && isset($_FILES['attachments']['name']) && is_array($_FILES['attachments']['name'])) {
            if (isset($_FILES['attachments']['name'][$index])) {
                $itemNames = $_FILES['attachments']['name'][$index];
                if (is_array($itemNames)) {
                    foreach ($itemNames as $innerIndex => $ignored) {
                        $file = array(
                            'name' => $_FILES['attachments']['name'][$index][$innerIndex],
                            'type' => isset($_FILES['attachments']['type'][$index][$innerIndex]) ? $_FILES['attachments']['type'][$index][$innerIndex] : '',
                            'tmp_name' => isset($_FILES['attachments']['tmp_name'][$index][$innerIndex]) ? $_FILES['attachments']['tmp_name'][$index][$innerIndex] : '',
                            'error' => isset($_FILES['attachments']['error'][$index][$innerIndex]) ? $_FILES['attachments']['error'][$index][$innerIndex] : UPLOAD_ERR_NO_FILE,
                            'size' => isset($_FILES['attachments']['size'][$index][$innerIndex]) ? $_FILES['attachments']['size'][$index][$innerIndex] : 0,
                        );
                        if ((int) $file['error'] === UPLOAD_ERR_OK) {
                            $savedPath = $this->saveUploadedFile($file, $targetDir, $absoluteDir);
                            if ($savedPath) {
                                $savedPaths[] = $savedPath;
                                $hasNewUpload = true;
                            }
                        }
                    }
                }
            }
        }

        if (!$hasNewUpload) {
            $base64Candidates = array();
            if (isset($expense['Attachment'])) {
                $base64Candidates[] = $expense['Attachment'];
            }
            if (isset($expense['attachments']) && is_array($expense['attachments'])) {
                foreach ($expense['attachments'] as $attachmentItem) {
                    if (is_string($attachmentItem)) {
                        $base64Candidates[] = $attachmentItem;
                    } elseif (is_array($attachmentItem) && isset($attachmentItem['data'])) {
                        $base64Candidates[] = $attachmentItem['data'];
                    }
                }
            }

            foreach ($base64Candidates as $candidate) {
                $candidateText = is_string($candidate) ? trim($candidate) : '';
                if ($candidateText === '') {
                    continue;
                }

                if (stripos($candidateText, 'data:') === 0) {
                    $savedPath = $this->saveBase64Attachment($candidateText, $targetDir, $absoluteDir);
                    if ($savedPath) {
                        $savedPaths[] = $savedPath;
                    }
                    continue;
                }

                $existingNames = explode(',', $candidateText);
                foreach ($existingNames as $existingName) {
                    $trimmedName = trim($existingName);
                    if ($trimmedName === '') {
                        continue;
                    }

                    if (preg_match('/^[A-Za-z0-9._-]+$/', $trimmedName)) {
                        $savedPaths[] = $trimmedName;
                    }
                }
            }
        }

        if (!count($savedPaths)) {
            return null;
        }

        $savedPaths = array_values(array_unique($savedPaths));
        if (count($savedPaths) === 1) {
            return $savedPaths[0];
        }

        return implode(',', $savedPaths);
    }

    private function getGroqApiKey()
    {
        $key = getenv('GROQ_API_KEY');
        if ($key) {
            return trim($key);
        }

        if (defined('GROQ_API_KEY')) {
            return trim(GROQ_API_KEY);
        }

        return '';
    }

    private function normalizeOcrDate($value)
    {
        $raw = is_string($value) ? trim($value) : '';
        if ($raw === '') {
            return '';
        }

        if (preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $raw)) {
            return $raw;
        }

        $timestamp = strtotime($raw);
        if ($timestamp === false) {
            return '';
        }

        return date('Y-m-d', $timestamp);
    }

    private function parseOcrJsonFromText($text)
    {
        if (!is_string($text) || trim($text) === '') {
            return null;
        }

        $trimmed = trim($text);
        $decoded = json_decode($trimmed, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\\{[\\s\\S]*\\}/', $trimmed, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    public function api_ocr_receipt()
    {
        try {
            $this->output->set_content_type('application/json');

            $apiKey = $this->getGroqApiKey();
            if ($apiKey === '') {
                return $this->respondError('OCR is not configured. Missing GROQ_API_KEY.');
            }

            if (!isset($_FILES['image'])) {
                return $this->respondError('Missing image file.');
            }

            $file = $_FILES['image'];
            if (!isset($file['error']) || (int) $file['error'] !== UPLOAD_ERR_OK) {
                return $this->respondError('Image upload failed.');
            }

            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                return $this->respondError('Invalid uploaded image.');
            }

            $mimeType = isset($file['type']) ? strtolower($file['type']) : '';
            if (strpos($mimeType, 'image/') !== 0) {
                return $this->respondError('Only image files are supported for OCR.');
            }

            $binary = file_get_contents($file['tmp_name']);
            if ($binary === false || $binary === '') {
                return $this->respondError('Unable to read uploaded image.');
            }

            $imageDataUrl = 'data:' . $mimeType . ';base64,' . base64_encode($binary);

            $prompt = "Extract receipt fields and respond with STRICT JSON only. Use keys: document_date, invoice_receipt_no, actual_amount, description, expense_category_name, is_vatable. document_date must be YYYY-MM-DD if possible. actual_amount must be number only. is_vatable must be true or false. If unknown, return empty string for text fields and 0 for amount.";

            $payload = array(
                'model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'temperature' => 0.2,
                'max_completion_tokens' => 700,
                'top_p' => 1,
                'stream' => false,
                'messages' => array(
                    array(
                        'role' => 'user',
                        'content' => array(
                            array(
                                'type' => 'text',
                                'text' => $prompt,
                            ),
                            array(
                                'type' => 'image_url',
                                'image_url' => array(
                                    'url' => $imageDataUrl,
                                ),
                            ),
                        ),
                    ),
                ),
            );

            $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ));
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);

            $rawResponse = curl_exec($ch);
            $curlError = curl_error($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($rawResponse === false || $curlError) {
                return $this->respondError('OCR provider request failed: ' . $curlError);
            }

            $response = json_decode($rawResponse, true);
            if (!is_array($response) || $httpCode >= 400) {
                return $this->respondError('OCR provider returned an error.');
            }

            $content = '';
            if (isset($response['choices'][0]['message']['content']) && is_string($response['choices'][0]['message']['content'])) {
                $content = $response['choices'][0]['message']['content'];
            }

            $ocr = $this->parseOcrJsonFromText($content);
            if (!is_array($ocr)) {
                return $this->respondError('OCR response could not be parsed.');
            }

            $result = array(
                'document_date' => $this->normalizeOcrDate(isset($ocr['document_date']) ? $ocr['document_date'] : ''),
                'invoice_receipt_no' => isset($ocr['invoice_receipt_no']) ? (string) $ocr['invoice_receipt_no'] : '',
                'actual_amount' => isset($ocr['actual_amount']) ? (float) $ocr['actual_amount'] : 0,
                'description' => isset($ocr['description']) ? (string) $ocr['description'] : '',
                'expense_category_name' => isset($ocr['expense_category_name']) ? (string) $ocr['expense_category_name'] : '',
                'is_vatable' => isset($ocr['is_vatable']) ? (bool) $ocr['is_vatable'] : false,
            );

            return $this->respondSuccess('success', $result);
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }
}
