<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Approval_Turnaround_Report extends MY_Controller
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
            'title' => 'Approval Turnaround / SLA Report',
            'main_view' => '../modules/approval-turnaround/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function resolveFilters()
    {
        $allApprovers = $this->input->get_post('AllApprovers');
        $approverId = null;
        if (empty($allApprovers) || $allApprovers === '0') {
            $approverId = (int) $this->session->userdata('user_id');
        }

        $dateFromRaw = trim((string) $this->input->get_post('DateFrom'));
        $dateToRaw = trim((string) $this->input->get_post('DateTo'));

        return array(
            'ApproverId' => $approverId,
            'DateFrom' => $dateFromRaw !== '' ? $dateFromRaw : null,
            'DateTo' => $dateToRaw !== '' ? $dateToRaw : null,
        );
    }

    private function applyFilters($rows)
    {
        $keyword = strtolower(trim((string) $this->input->get_post('Keyword')));
        $type = trim((string) $this->input->get_post('Type'));

        if ($keyword === '' && $type === '') {
            return $rows;
        }

        return array_values(array_filter($rows, function ($row) use ($keyword, $type) {
            if ($type !== '' && (!isset($row['transaction_type']) || $row['transaction_type'] !== $type)) {
                return false;
            }

            if ($keyword !== '') {
                $haystack = strtolower(
                    (isset($row['reference_no']) ? $row['reference_no'] : '') . ' ' .
                    (isset($row['requester_name']) ? $row['requester_name'] : '')
                );
                if (strpos($haystack, $keyword) === false) {
                    return false;
                }
            }

            return true;
        }));
    }

    private function fetchRows($take)
    {
        $filters = $this->resolveFilters();

        $params = array(
            'ApproverId' => $filters['ApproverId'],
            'DateFrom' => $filters['DateFrom'],
            'DateTo' => $filters['DateTo'],
            'Take' => $take,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_approval_turnaround_report', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');
            $take = $this->resolvePaginationTake($this->input->get_post('Take'));

            $result = $this->fetchRows($take);

            echo json_encode(array(
                'status' => 'success',
                'data' => $result,
                'pagination' => array('take' => $take, 'hasMore' => false, 'nextCursorId' => null),
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function download_excel()
    {
        $result = $this->applyFilters($this->fetchRows(null));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Approval Turnaround');

        $headers = array('Transaction Type', 'Reference No.', 'Requester', 'Department', 'Cost Center', 'Approver', 'Amount', 'Status', 'Submitted Date', 'Decided Date', 'Turnaround (Hours)', 'Turnaround (Days)');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($result as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $sheet->fromArray(array(
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
                isset($row['reference_no']) ? $row['reference_no'] : '',
                isset($row['requester_name']) ? $row['requester_name'] : '',
                isset($row['department']) ? $row['department'] : '',
                $costCenterDisplay,
                isset($row['approver_name']) ? $row['approver_name'] : '',
                isset($row['amount']) ? (float) $row['amount'] : 0,
                isset($row['status']) ? $row['status'] : '',
                isset($row['submitted_date']) ? $row['submitted_date'] : '',
                isset($row['decided_date']) ? $row['decided_date'] : '',
                isset($row['turnaround_hours']) ? (int) $row['turnaround_hours'] : 0,
                isset($row['turnaround_days']) ? (int) $row['turnaround_days'] : 0,
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setWidth(20);
        }

        $filename = 'approval-turnaround-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
