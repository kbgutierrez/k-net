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

        $costCenters = $this->sp->fetchData('sp_fetch_active_cost_centers');

        $data = array(
            'title' => 'New Cash Advance',
            'main_view' => '../modules/cash-advance/views/add',
            'module_group' => $this->module_group,
            'cost_centers' => $costCenters,
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
    public function api_save()
    {
        try {
            $this->output->set_content_type('application/json');

            // Use input->post() because we are sending multipart/form-data
            $data = $this->input->post();

            $requiredFields = array('Amount', 'Description', 'NeededDate', 'PayableTo', 'Address', 'CostCenterId', 'AmountInWords');
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || trim($data[$field]) === '') {
                    return $this->respondError("Missing required field: {$field}");
                }
            }

            $userId = $this->session->userdata('user_id');
            $userFullName = $this->session->userdata('user_full_name') ?? 'Employee';

            // 1. Insert into DB (use your new SP that accepts extra fields)
            $params = array(
                "UserId" => $userId,
                "Amount" => $data['Amount'],
                "AmountInWords" => $data['AmountInWords'],
                "Description" => $data['Description'],
                "NeededDate" => $data['NeededDate'],
                "PayableTo" => $data['PayableTo'],
                "Address" => $data['Address'],
                "CostCenterId" => $data['CostCenterId'],
            );

            $result = $this->sp->createReturnId(
                build_sp('sp_insert_ca_v2', count($params)),
                $params,
                'result'
            );

            if (empty($result) || $result <= 0) {
                return $this->respondError("Failed to create cash advance request.");
            }

            $caRef = is_array($result) ? ($result['GeneratedCashAdvanceID'] ?? '') : (string) $result;
            $cashAdvanceId = is_array($result) ? ($result['id'] ?? $result) : $result;

            // 2. Prepare Bridge Folder
            $bridgeBase = $this->config->item('kflow_bridge_path');
            $batchId = 'KNET_' . $caRef . '_' . uniqid();
            $batchDir = $bridgeBase . $batchId . '/';
            $attachDir = $batchDir . 'attachments/';

            if (!is_dir($batchDir)) {
                mkdir($batchDir, 0777, true);
                mkdir($attachDir, 0777, true);
            }

            // 3. Generate PDFs
            $this->load->helper('ca_pdf');

            $templatePath = FCPATH . 'assets/templates/ca_template.pdf'; 
            $pdfOutputPath = $batchDir . $caRef . '.pdf';

            // Split address into two lines if it has a newline
            $addressLines = explode("\n", $data['Address']);
            $addressLine1 = $addressLines[0] ?? '';
            $addressLine2 = $addressLines[1] ?? '';

            // Get Cost Center Name
            $ccParams = array('CostCenterId' => $data['CostCenterId']);
            $costCenterRow = $this->sp->readData(
                build_sp('sp_fetch_cost_center_by_id', 1),
                $ccParams,
                'row'
            );
            $costCenterName = $costCenterRow['cost_center_name'] ?? '';

            $pdfData = array(
                'Date' => $data['Date'],
                'CashAdvanceId' => $caRef,
                'PayableTo' => $data['PayableTo'],
                'AddressLine1' => $addressLine1,
                'AddressLine2' => $addressLine2,
                'Amount' => $data['Amount'],
                'AmountInWords' => $data['AmountInWords'],
                'Description' => $data['Description'],
                'CostCenterName' => $costCenterName,
                'NeededDate' => $data['NeededDate'],
                'RequestedBy' => $userFullName,
            );

            generate_ca_pdf($pdfData, $templatePath, $pdfOutputPath);

            // 4. Save Attachments
            $attachmentManifest = array();
            if (!empty($_FILES['attachments'])) {
                $fileCount = count($_FILES['attachments']['name']);
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($_FILES['attachments']['error'][$i] === 0) {
                        $origName = $_FILES['attachments']['name'][$i];
                        $ext = pathinfo($origName, PATHINFO_EXTENSION);
                        $safeName = 'att_' . $i . '_' . uniqid() . '.' . $ext;
                        $destPath = $attachDir . $safeName;
                        move_uploaded_file($_FILES['attachments']['tmp_name'][$i], $destPath);

                        $attachmentManifest[] = array(
                            'original_name' => $origName,
                            'stored_name' => $safeName,
                        );

                        // Also save to K-net DB for record keeping
                        $attDbParams = array(
                            'cash_advance_id' => $caRef,
                            'original_name' => $origName,
                            'file_name' => $safeName,
                            'file_path' => $destPath,
                        );
                        $this->sp->createData(build_sp('sp_insert_ca_attachment', count($attDbParams)), $attDbParams, 'result');
                    }
                }
            }

            // 5. Write Manifest
            $manifest = array(
                'source' => 'knet_cash_advance',
                'ca_ref' => $caRef,
                'doc_title' => 'Cash Advance - ' . $caRef,
                'doc_description' => $data['Description'],
                'pdf_filename' => $caRef . '.pdf',
                'attachments' => $attachmentManifest,
                'created_at' => date('Y-m-d H:i:s'),
            );
            file_put_contents($batchDir . 'manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));

            // 6. Update CA record with batch_id and path
            $updateParams = array(
                'cash_advance_id' => $caRef,
                'kflow_batch_id' => $batchId,
                'generated_pdf_path' => $pdfOutputPath,
                'is_kflow_submitted' => 1,
            );
            $this->sp->createData(build_sp('sp_update_ca_kflow_batch', count($updateParams)), $updateParams, 'result');

            // 7. Build K-flow URL with token
            $secret = $this->config->item('kflow_secret_key');
            $token = hash_hmac('sha256', $batchId, $secret);
            $kflowUrl = $this->config->item('kflow_base_url')
                . 'workflow/document_list/upload_knet?batch_id=' . urlencode($batchId)
                . '&token=' . urlencode($token);

            return $this->respondSuccess(
                "Cash advance request created successfully. Redirecting to K-flow...",
                array(
                    'id' => $cashAdvanceId,
                    'cash_advance_id' => $caRef,
                    'redirect_url' => $kflowUrl,
                )
            );

        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }
    public function test_pdf_coords()
    {
        $this->load->helper('ca_pdf');

        $templatePath = FCPATH . 'assets/templates/ca_template.pdf';
        $testOutputPath = FCPATH . 'assets/temp/test_ca_output.pdf';

        // Ensure temp directory exists
        if (!is_dir(FCPATH . 'assets/temp/')) {
            mkdir(FCPATH . 'assets/temp/', 0777, true);
        }

        // Default coordinates (estimates — adjust these as your starting point)
        $defaults = array(
            'Date' => array('x' => 25, 'y' => 31, 'text' => date('Y-m-d')),
            'ECA_No' => array('x' => 0, 'y' => 0, 'text' => 'ECA-2024-00001'),
            'PayableTo' => array('x' => 32, 'y' => 36, 'text' => 'Juan Dela Cruz'),
            'AddressLine1' => array('x' => 32, 'y' => 40, 'text' => '123 Main Street, Barangay Uno'),
            'AddressLine2' => array('x' => 32, 'y' => 45, 'text' => 'Quezon City, Metro Manila'),
            'Amount' => array('x' => 60, 'y' => 50, 'text' => '12,500.00'),
            'AmountInWords' => array('x' => 75, 'y' => 54, 'text' => 'Twelve Thousand Five Hundred Pesos Only'),
            'Purpose' => array('x' => 20, 'y' => 65, 'text' => 'Transportation and meal allowance for site visit at Cabuyao plant. This covers 5 days of field work including toll fees and parking.'),
            'CostCenter' => array('x' => 55, 'y' => 75, 'text' => 'Finance Department'),
            'DateNeeded' => array('x' => 38, 'y' => 80, 'text' => date('Y-m-d', strtotime('+3 days'))),
            'RequestedBy' => array('x' => 38, 'y' => 97, 'text' => 'Juan Dela Cruz'),
            'RequestDate' => array('x' => 80, 'y' => 97, 'text' => date('Y-m-d')),
        );

        // If form submitted, use POST values; otherwise use defaults
        $fields = array();
        foreach ($defaults as $key => $def) {
            $fields[$key] = array(
                'x' => $this->input->post("{$key}_x") !== null ? (float) $this->input->post("{$key}_x") : $def['x'],
                'y' => $this->input->post("{$key}_y") !== null ? (float) $this->input->post("{$key}_y") : $def['y'],
                'text' => $this->input->post("{$key}_text") !== null ? $this->input->post("{$key}_text") : $def['text'],
            );
        }

        $pdf = new \setasign\Fpdi\Fpdi();

        $pdf->setSourceFile($templatePath);
        $tplId = $pdf->importPage(1);

        // GET ORIGINAL SIZE — this is the key fix
        $size = $pdf->getTemplateSize($tplId);
    
        // Create page that EXACTLY matches the template (no stretching, no cropping)
        $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
        $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);

        $pdf->SetAutoPageBreak(false);
        $pdf->SetFont('Arial', '', 10);

        foreach ($fields as $key => $f) {
            $pdf->SetXY($f['x'], $f['y']);
            // Red box for visibility
    

            $pdf->SetXY($f['x'], $f['y']);
            $pdf->SetTextColor(0, 0, 0);
            $pdf->Cell(0, 5, $f['text']);
        }

        // Grid overlay — use the actual page dimensions, not hardcoded 210/297
        $pageW = $size['width'];
        $pageH = $size['height'];

        $pdf->SetDrawColor(200, 200, 200);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->SetFont('Arial', '', 6);

        for ($x = 0; $x <= $pageW; $x += 10) {
            $pdf->Line($x, 0, $x, $pageH);
            $pdf->SetXY($x + 1, 1);
            $pdf->Cell(5, 3, round($x));
        }

        for ($y = 0; $y <= $pageH; $y += 10) {
            $pdf->Line(0, $y, $pageW, $y);
            $pdf->SetXY(1, $y + 1);
            $pdf->Cell(5, 3, round($y));
        }

        $pdf->Output('F', $testOutputPath);

        $data = array(
            'title' => 'Test PDF Coordinates',
            'main_view' => '../modules/cash-advance/views/test_pdf_coords',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'fields' => $fields,
            'pdf_url' => base_url('assets/temp/test_ca_output.pdf?v=' . time()),
            'template_url' => base_url('assets/templates/QMS-FM-FIN-02-03_Employee_Cash_Advance_Form.pdf'),
        );

        $this->load->view('main', $data);
    }
}
?>