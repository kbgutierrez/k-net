<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Reimbursement extends MY_Controller
{
    private $draftEditWindowDays = 7;

    public function __construct()
    {
        parent::__construct();
    }

    public function index()
    {
        $data = array(
            'title' => 'Reimbursement',
            'main_view' => '../modules/reimbursement/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
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
                'index.js',
                'add.js',
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
            'reimbursement_no' => trim((string)$reimbursement_no),
            'scripts' => array(
                'index.js',
                'detail.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_get_header()
    {
        $this->output->set_content_type('application/json');

        $all = $this->readStore();
        usort($all, function ($a, $b) {
            return strcmp((string)$b['createdAt'], (string)$a['createdAt']);
        });

        $rows = array();
        foreach ($all as $item) {
            $header = isset($item['header']) && is_array($item['header']) ? $item['header'] : array();
            $rows[] = array(
                'id' => isset($header['id']) ? $header['id'] : '',
                'reimbursement_id' => isset($header['reimbursement_id']) ? $header['reimbursement_id'] : '',
                'total_amount' => isset($header['total_amount']) ? $header['total_amount'] : 0,
                'submitted_date' => isset($header['submitted_date']) ? $header['submitted_date'] : '',
                'status_code' => isset($header['status_code']) ? $header['status_code'] : 'RB_DRAFT',
                'status_name' => isset($header['status_name']) ? $header['status_name'] : 'Draft',
                'purpose' => isset($header['purpose']) ? $header['purpose'] : '',
                'expense_range_from' => isset($header['expense_range_from']) ? $header['expense_range_from'] : '',
                'expense_range_to' => isset($header['expense_range_to']) ? $header['expense_range_to'] : '',
                'has_vat' => isset($header['has_vat']) ? $header['has_vat'] : 0,
                'attachment_count' => isset($header['attachment_count']) ? $header['attachment_count'] : 0,
            );
        }

        return $this->respondSuccess('success', $rows, array('hasMore' => false, 'nextCursorId' => null));
    }

    public function api_get_details()
    {
        $this->output->set_content_type('application/json');
        $id = trim((string)$this->input->post('ReimbursementId'));
        if ($id === '') {
            return $this->respondError('ReimbursementId is required.');
        }

        $record = $this->findRecordById($id);
        if (!$record) {
            return $this->respondError('Record not found.');
        }

        return $this->respondSuccess('success', isset($record['details']) ? $record['details'] : array());
    }

    public function api_get_draft()
    {
        $this->output->set_content_type('application/json');
        $id = trim((string)$this->input->post('ReimbursementId'));
        if ($id === '') {
            return $this->respondError('ReimbursementId is required.');
        }

        $record = $this->findRecordById($id);
        if (!$record) {
            return $this->respondError('Draft not found.');
        }

        $created = isset($record['createdAt']) ? strtotime($record['createdAt']) : false;
        $ageDays = $created ? (int) floor((time() - $created) / 86400) : 0;
        $canEdit = $ageDays <= $this->draftEditWindowDays;

        return $this->respondSuccess('success', array(
            'header' => isset($record['header']) ? $record['header'] : array(),
            'details' => isset($record['details']) ? $record['details'] : array(),
            'canEdit' => $canEdit,
            'draftAgeDays' => $ageDays,
            'draftEditWindowDays' => $this->draftEditWindowDays,
        ));
    }

    public function api_save_reimbursement()
    {
        $this->output->set_content_type('application/json');

        $id = trim((string)$this->input->post('ReimbursementId'));
        $statusCode = trim((string)$this->input->post('StatusCode'));
        $statusCode = $statusCode !== '' ? $statusCode : 'RB_DRAFT';
        $statusName = $statusCode === 'RB_SUBMITTED' ? 'Submitted' : 'Draft';

        $purpose = trim((string)$this->input->post('Purpose'));
        $expenseRangeFrom = trim((string)$this->input->post('ExpenseRangeFrom'));
        $expenseRangeTo = trim((string)$this->input->post('ExpenseRangeTo'));
        $totalAmount = (float)$this->input->post('TotalAmount', true);

        $expensesRaw = $this->input->post('Expenses');
        $expenses = json_decode($expensesRaw, true);
        if (!is_array($expenses)) {
            $expenses = array();
        }

        if ($purpose === '' || !$expenses || $totalAmount <= 0) {
            return $this->respondError('Incomplete reimbursement payload.');
        }

        if ($id === '') {
            $id = $this->nextReimbursementId();
        }

        $savedDetails = array();
        $hasVat = 0;
        $attachmentCount = 0;

        foreach ($expenses as $index => $expense) {
            $attachmentCsv = $this->collectAttachmentPaths($expense, $index);
            $attachmentNames = trim((string)$attachmentCsv);
            $attachmentArr = $attachmentNames !== '' ? explode(',', $attachmentNames) : array();
            $attachmentCount += count($attachmentArr);

            $isVatable = !empty($expense['IsVatable']) ? 1 : 0;
            if ($isVatable) {
                $hasVat = 1;
            }

            $amount = isset($expense['ActualAmount']) ? (float)$expense['ActualAmount'] : 0;

            $savedDetails[] = array(
                'document_date' => isset($expense['DocumentDate']) ? $expense['DocumentDate'] : '',
                'reference_no' => isset($expense['ReferenceNo']) ? $expense['ReferenceNo'] : '',
                'actual_amount' => $amount,
                'is_vatable' => $isVatable,
                'description' => isset($expense['Description']) ? $expense['Description'] : '',
                'attachment' => $attachmentNames,
            );
        }

        $now = date('Y-m-d H:i:s');
        $header = array(
            'id' => $id,
            'reimbursement_id' => $id,
            'total_amount' => $totalAmount,
            'submitted_date' => date('Y-m-d'),
            'status_code' => $statusCode,
            'status_name' => $statusName,
            'purpose' => $purpose,
            'expense_range_from' => $expenseRangeFrom,
            'expense_range_to' => $expenseRangeTo,
            'has_vat' => $hasVat,
            'attachment_count' => $attachmentCount,
        );

        $store = $this->readStore();
        $found = false;
        foreach ($store as $idx => $row) {
            if (isset($row['header']['id']) && (string)$row['header']['id'] === (string)$id) {
                $store[$idx]['header'] = $header;
                $store[$idx]['details'] = $savedDetails;
                $store[$idx]['updatedAt'] = $now;
                $found = true;
                break;
            }
        }

        if (!$found) {
            $store[] = array(
                'header' => $header,
                'details' => $savedDetails,
                'createdAt' => $now,
                'updatedAt' => $now,
            );
        }

        $this->writeStore($store);

        return $this->respondSuccess('saved', array('id' => $id));
    }

    private function storeFilePath()
    {
        return APPPATH . 'logs/reimbursement_mock_store.json';
    }

    private function readStore()
    {
        $path = $this->storeFilePath();
        if (!file_exists($path)) {
            return $this->seedStore();
        }

        $raw = @file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return $this->seedStore();
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $this->seedStore();
        }

        return $decoded;
    }

    private function writeStore($rows)
    {
        $path = $this->storeFilePath();
        @file_put_contents($path, json_encode(array_values($rows), JSON_PRETTY_PRINT));
    }

    private function seedStore()
    {
        $seed = array(
            array(
                'header' => array(
                    'id' => 'RB-2026-001',
                    'reimbursement_id' => 'RB-2026-001',
                    'total_amount' => 3250.00,
                    'submitted_date' => '2026-05-27',
                    'status_code' => 'RB_SUBMITTED',
                    'status_name' => 'Submitted',
                    'purpose' => 'Emergency transport reimbursement',
                    'expense_range_from' => '2026-05-27',
                    'expense_range_to' => '2026-05-27',
                    'has_vat' => 1,
                    'attachment_count' => 1,
                ),
                'details' => array(
                    array(
                        'document_date' => '2026-05-27',
                        'reference_no' => 'OR-TR-9821',
                        'actual_amount' => 3250.00,
                        'is_vatable' => 1,
                        'description' => 'Transport',
                        'attachment' => 'transport-or-001.jpg',
                    ),
                ),
                'createdAt' => date('Y-m-d H:i:s', strtotime('2026-05-27 09:00:00')),
                'updatedAt' => date('Y-m-d H:i:s', strtotime('2026-05-27 09:00:00')),
            ),
            array(
                'header' => array(
                    'id' => 'RB-2026-002',
                    'reimbursement_id' => 'RB-2026-002',
                    'total_amount' => 1880.00,
                    'submitted_date' => '2026-05-29',
                    'status_code' => 'RB_DRAFT',
                    'status_name' => 'Draft',
                    'purpose' => 'Client lunch reimbursement',
                    'expense_range_from' => '2026-05-29',
                    'expense_range_to' => '2026-05-29',
                    'has_vat' => 0,
                    'attachment_count' => 1,
                ),
                'details' => array(
                    array(
                        'document_date' => '2026-05-29',
                        'reference_no' => 'OR-LN-1041',
                        'actual_amount' => 1880.00,
                        'is_vatable' => 0,
                        'description' => 'Client lunch',
                        'attachment' => 'lunch-receipt-002.jpg',
                    ),
                ),
                'createdAt' => date('Y-m-d H:i:s', strtotime('2026-05-29 10:30:00')),
                'updatedAt' => date('Y-m-d H:i:s', strtotime('2026-05-29 10:30:00')),
            ),
        );

        $this->writeStore($seed);
        return $seed;
    }

    private function findRecordById($id)
    {
        $store = $this->readStore();
        foreach ($store as $row) {
            if (isset($row['header']['id']) && (string)$row['header']['id'] === (string)$id) {
                return $row;
            }
        }
        return null;
    }

    private function nextReimbursementId()
    {
        $store = $this->readStore();
        $max = 0;
        foreach ($store as $row) {
            $id = isset($row['header']['id']) ? (string)$row['header']['id'] : '';
            if (preg_match('/RB\-\d{4}\-(\d+)$/', $id, $m)) {
                $num = (int)$m[1];
                if ($num > $max) {
                    $max = $num;
                }
            }
        }

        return 'RB-' . date('Y') . '-' . str_pad((string)($max + 1), 3, '0', STR_PAD_LEFT);
    }

    private function respondSuccess($message, $data = array(), $pagination = null)
    {
        $payload = array(
            'status' => 'success',
            'response' => $message,
            'data' => $data,
        );

        if (is_array($pagination)) {
            $payload['pagination'] = $pagination;
        }

        echo json_encode($payload);
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

    private function ensureAttachmentDir()
    {
        $targetDir = 'assets/uploads/attachments/';
        $absoluteDir = rtrim(FCPATH, '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $targetDir);

        if (!is_dir($absoluteDir)) {
            mkdir($absoluteDir, 0777, true);
        }

        return array($targetDir, $absoluteDir);
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
            return '';
        }

        return implode(',', array_values(array_unique($savedPaths)));
    }
}
