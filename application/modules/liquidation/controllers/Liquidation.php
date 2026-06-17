<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');
class Liquidation extends MY_Controller
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
            'title' => 'Liquidation',
            'main_view' => '../modules/liquidation/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                '../liquidation/index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function add($liquidation_no = '')
    {
        $ref = trim((string) $liquidation_no);
        $isEditMode = $ref !== '';
        $data = array(
            'title' => $isEditMode ? 'Edit Draft Liquidation' : 'New Liquidation',
            'main_view' => '../modules/liquidation/views/add',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'liquidation_no' => $ref,
            'is_edit_mode' => $isEditMode,
            'draft_edit_window_days' => $this->draftEditWindowDays,
            'scripts' => array(
                '../shared/receipt-ocr.js',
                '../liquidation/index.js',
                '../liquidation/add.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function view($liquidation_no = '')
    {
        $data = array(
            'title' => 'Liquidation Details',
            'main_view' => '../modules/liquidation/views/detail',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'liquidation_no' => $liquidation_no,
            'scripts' => array(
                '../liquidation/index.js',
                '../liquidation/detail.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_get_pending_ca_nums_by_userid(){
        try{
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $params = array(
                "UserId" => $userId,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_pending_ca_nums_by_userid', count($params)),
                $params,
                'result'
            );

            return $this->respondSuccess("success", $result);


        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
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
        $absoluteDir = rtrim(FCPATH, '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $targetDir);

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
            if ($singleFile && isset($singleFile['error']) && (int)$singleFile['error'] === UPLOAD_ERR_OK) {
                $savedPath = $this->saveUploadedFile($singleFile, $targetDir, $absoluteDir);
                if ($savedPath) {
                    $savedPaths[] = $savedPath;
                }
            }

            if (is_array($_FILES[$fieldName]['name'])) {
                foreach ($_FILES[$fieldName]['name'] as $fileIndex => $ignored) {
                    $file = $this->normalizeSingleFileFromInput($_FILES[$fieldName], $fileIndex);
                    if ($file && isset($file['error']) && (int)$file['error'] === UPLOAD_ERR_OK) {
                        $savedPath = $this->saveUploadedFile($file, $targetDir, $absoluteDir);
                        if ($savedPath) {
                            $savedPaths[] = $savedPath;
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
                        if ((int)$file['error'] === UPLOAD_ERR_OK) {
                            $savedPath = $this->saveUploadedFile($file, $targetDir, $absoluteDir);
                            if ($savedPath) {
                                $savedPaths[] = $savedPath;
                            }
                        }
                    }
                }
            }
        }

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

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
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

        if (preg_match('/\{[\s\S]*\}/', $trimmed, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function getDraftHeaderByLiquidationId($liquidationId)
    {
        $params = array(
            'LiquidationId' => $liquidationId,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_liquidation_header_by_liquidation_id', count($params)),
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

    public function api_get_draft()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $liquidationId = isset($data['LiquidationId']) ? trim((string) $data['LiquidationId']) : '';
            if ($liquidationId === '') {
                return $this->respondError('Missing required field: LiquidationId');
            }

            $header = $this->getDraftHeaderByLiquidationId($liquidationId);
            if (!$header) {
                return $this->respondError('Draft liquidation not found.');
            }

            $userId = (int) $this->session->userdata('user_id');
            $createdById = isset($header['created_by_id']) ? (int) $header['created_by_id'] : 0;
            if ($createdById !== $userId) {
                return $this->respondError('You are not allowed to edit this draft.');
            }

            $statusCode = isset($header['status_code']) ? trim((string) $header['status_code']) : '';
            if ($statusCode !== 'LQ_DRAFT') {
                return $this->respondError('Only draft liquidation can be edited.');
            }

            $ageDays = $this->getDraftAgeDays(isset($header['created_date']) ? $header['created_date'] : '');
            $canEdit = $ageDays <= $this->draftEditWindowDays;

            $detailParams = array(
                'LiquidationId' => $liquidationId,
            );
            $details = $this->sp->readData(
                build_sp('sp_fetch_liquidation_details', count($detailParams)),
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
            if (!isset($file['error']) || (int)$file['error'] !== UPLOAD_ERR_OK) {
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
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
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
                'invoice_receipt_no' => isset($ocr['invoice_receipt_no']) ? (string)$ocr['invoice_receipt_no'] : '',
                'actual_amount' => isset($ocr['actual_amount']) ? (float)$ocr['actual_amount'] : 0,
                'description' => isset($ocr['description']) ? (string)$ocr['description'] : '',
                'expense_category_name' => isset($ocr['expense_category_name']) ? (string)$ocr['expense_category_name'] : '',
                'is_vatable' => isset($ocr['is_vatable']) ? (bool)$ocr['is_vatable'] : false,
            );

            return $this->respondSuccess('success', $result);
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_get_ca_details_by_ca_no(){
        try{
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();
            $requiredFields = array('CashAdvanceId');
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    return $this->respondError("Missing required field: {$field}");
                }
            }

            $params = array(
                "CashAdvanceId" => $data['CashAdvanceId'],
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_pending_ca_details_by_ca_no', count($params)),
                $params,
                'row'
            );
  
            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_get_expense_types(){
        try{
            $this->output->set_content_type('application/json');
            $result = $this->sp->fetchData('sp_fetch_expense_types');
         
  
            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_save_liquidation()
    {
        try{

            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();
            if (isset($data['Expenses']) && is_string($data['Expenses'])) {
                $decodedExpenses = json_decode($data['Expenses'], true);
                if (is_array($decodedExpenses)) {
                    $data['Expenses'] = $decodedExpenses;
                }
            }
            $requestedLiquidationId = isset($data['LiquidationId']) ? trim((string)$data['LiquidationId']) : '';
            if (!isset($data['CashAdvanceId']) || $data['CashAdvanceId'] === '') {
                return $this->respondError("Missing required field: CashAdvanceId");
            }
            if (!isset($data['Expenses']) || !is_array($data['Expenses']) || count($data['Expenses']) === 0) {
                return $this->respondError("Missing required field: Expenses");
            }

            $totalAmountSpent = isset($data['TotalAmountSpent']) ? (float)$data['TotalAmountSpent'] : (isset($data['TotalAmount']) ? (float)$data['TotalAmount'] : 0);
            if ($totalAmountSpent <= 0) {
                return $this->respondError("Missing required field: TotalAmountSpent");
            }

            $cashAdvanceAmount = isset($data['CashAdvanceAmount']) ? (float)$data['CashAdvanceAmount'] : 0;
            $refundAmount = isset($data['RefundAmount']) ? (float)$data['RefundAmount'] : 0;
            $reimburseAmount = isset($data['ReimburseAmount']) ? (float)$data['ReimburseAmount'] : 0;
            $expenseRangeFrom = isset($data['ExpenseRangeFrom']) ? trim((string)$data['ExpenseRangeFrom']) : '';
            $expenseRangeTo = isset($data['ExpenseRangeTo']) ? trim((string)$data['ExpenseRangeTo']) : '';

            if ($expenseRangeFrom === '' || $expenseRangeTo === '') {
                $validExpenseDates = array();
                foreach ($data['Expenses'] as $expenseItem) {
                    $docDate = isset($expenseItem['DocumentDate']) ? trim((string)$expenseItem['DocumentDate']) : '';
                    if ($docDate !== '' && strtotime($docDate) !== false) {
                        $validExpenseDates[] = date('Y-m-d', strtotime($docDate));
                    }
                }

                if (count($validExpenseDates) > 0) {
                    sort($validExpenseDates);
                    if ($expenseRangeFrom === '') {
                        $expenseRangeFrom = $validExpenseDates[0];
                    }
                    if ($expenseRangeTo === '') {
                        $expenseRangeTo = $validExpenseDates[count($validExpenseDates) - 1];
                    }
                }
            }

            if ($cashAdvanceAmount > 0 && !isset($data['RefundAmount']) && !isset($data['ReimburseAmount'])) {
                $variance = $cashAdvanceAmount - $totalAmountSpent;
                $refundAmount = $variance > 0 ? $variance : 0;
                $reimburseAmount = $variance < 0 ? abs($variance) : 0;
            }

            $statusCode = isset($data['StatusCode']) && $data['StatusCode'] !== '' ? trim((string)$data['StatusCode']) : 'LQ_DRAFT';
            if ($statusCode !== 'LQ_DRAFT' && $statusCode !== 'LQ_SUBMITTED') {
                $statusCode = 'LQ_DRAFT';
            }

            $liquidationId = '';
            if ($requestedLiquidationId !== '') {
                $existingHeader = $this->getDraftHeaderByLiquidationId($requestedLiquidationId);
                if (!$existingHeader) {
                    return $this->respondError('Draft liquidation not found.');
                }

                $currentUserId = (int)$this->session->userdata('user_id');
                $createdById = isset($existingHeader['created_by_id']) ? (int)$existingHeader['created_by_id'] : 0;
                if ($createdById !== $currentUserId) {
                    return $this->respondError('You are not allowed to update this draft.');
                }

                $existingStatus = isset($existingHeader['status_code']) ? trim((string)$existingHeader['status_code']) : '';
                if ($existingStatus !== 'LQ_DRAFT') {
                    return $this->respondError('Only draft liquidation can be updated.');
                }

                $ageDays = $this->getDraftAgeDays(isset($existingHeader['created_date']) ? $existingHeader['created_date'] : '');
                if ($ageDays > $this->draftEditWindowDays) {
                    return $this->respondError('Draft edit window has expired.');
                }

                $updateHeaderParams = array(
                    'LiquidationId' => $requestedLiquidationId,
                    'UserId' => $currentUserId,
                    'TotalAmountSpent' => $totalAmountSpent,
                    'RefundAmount' => $refundAmount,
                    'ReimburseAmount' => $reimburseAmount,
                    'StatusCode' => $statusCode,
                );

                $updateHeaderResult = $this->sp->createData(
                    build_sp('sp_update_liquidation_header_draft', count($updateHeaderParams)),
                    $updateHeaderParams
                );

                if ($updateHeaderResult !== TRUE) {
                    return $this->respondError('Failed to update draft liquidation header.');
                }

                $deleteDetailParams = array(
                    'LiquidationId' => $requestedLiquidationId,
                );
                $deleteDetailResult = $this->sp->createData(
                    build_sp('sp_delete_liquidation_details_by_liquidation_id', count($deleteDetailParams)),
                    $deleteDetailParams
                );

                if ($deleteDetailResult !== TRUE) {
                    return $this->respondError('Failed to refresh draft expense details.');
                }

                $liquidationId = $requestedLiquidationId;
            }

            if ($liquidationId === '') {
                $headerParams = array(
                    "UserId" => $this->session->userdata('user_id'),
                    "CashAdvanceId" => $data['CashAdvanceId'],
                    "TotalAmountSpent" => $totalAmountSpent,
                    "RefundAmount" => $refundAmount,
                    "ReimburseAmount" => $reimburseAmount,
                    "StatusCode" => $statusCode,
                );

                $headerResult = $this->sp->createReturnId(
                    build_sp('sp_insert_liquidation_header', count($headerParams)),
                    $headerParams
                );

                if (!is_array($headerResult) || !isset($headerResult['GeneratedLiquidationID']) || $headerResult['GeneratedLiquidationID'] === '') {
                    return $this->respondError("Failed to create liquidation");
                }

                $liquidationId = $headerResult['GeneratedLiquidationID'];
            }

            foreach ($data['Expenses'] as $index => $expense) {
                $actualAmount = isset($expense['ActualAmount']) ? (float)$expense['ActualAmount'] : (isset($expense['amount']) ? (float)$expense['amount'] : 0);
                $expenseCategory = isset($expense['ExpenseCategory']) ? (int)$expense['ExpenseCategory'] : (isset($expense['expenseType']) ? (int)$expense['expenseType'] : 0);
                $isVatable = isset($expense['IsVatable']) ? (bool)$expense['IsVatable'] : (isset($expense['isVattable']) ? (bool)$expense['isVattable'] : false);

                if ($actualAmount <= 0 || $expenseCategory <= 0) {
                    return $this->respondError("Invalid expense item at index {$index}");
                }

                $vatAmount = isset($expense['VatAmount']) ? (float)$expense['VatAmount'] : ($isVatable ? round($actualAmount * 0.12 / 1.12, 2) : 0);
                $netAmount = isset($expense['NetAmount']) ? (float)$expense['NetAmount'] : ($isVatable ? round($actualAmount - $vatAmount, 2) : $actualAmount);

                $attachment = $this->collectAttachmentPaths($expense, $index);

                $detailParams = array(
                    "LiquidationId" => $liquidationId,
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
                    build_sp('sp_insert_liquidation_details', count($detailParams)),
                    $detailParams
                );

                if ($detailResult !== TRUE) {
                    return $this->respondError("Failed to save expense detail at index {$index}");
                }
            }

            $message = $statusCode === 'LQ_DRAFT'
                ? 'Liquidation draft saved successfully'
                : 'Liquidation submitted successfully';

            return $this->respondSuccess($message, array('id' => $liquidationId));

        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }
    public function api_get_header(){
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
                build_sp('sp_fetch_liquidation_header', count($params)),
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

    public function api_get_details(){
        try{
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();
            $requiredFields = array('LiquidationId');
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    return $this->respondError("Missing required field: {$field}");
                }
            }

            $params = array(
                "LiquidationId" => $data['LiquidationId'],
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_liquidation_details', count($params)),
                $params,
                'result'
            );
  
            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }
}