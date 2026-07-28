<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Approval_Matrix_Coverage_Report extends MY_Controller
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
            'title' => 'Approval Matrix Coverage Gap Report',
            'main_view' => '../modules/approval-matrix-coverage/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function fetchGaps($transactionType)
    {
        $transactionType = trim((string) $transactionType);

        $params = array(
            'TransactionType' => $transactionType !== '' ? $transactionType : null,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_approval_matrix_coverage_gaps', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');

            $transactionType = $this->input->post('TransactionType');
            $rows = $this->fetchGaps($transactionType);

            echo json_encode(array(
                'status' => 'success',
                'data' => $rows,
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
        $transactionType = $this->input->get('TransactionType');
        $rows = $this->fetchGaps($transactionType);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Coverage Gaps');

        $headers = array('Department ID', 'Department Code', 'Department Name', 'Short Name', 'Category', 'Uncovered Transaction Type');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->fromArray(array(
                isset($row['department_id']) ? (int) $row['department_id'] : '',
                isset($row['department_code']) ? $row['department_code'] : '',
                isset($row['department_name']) ? $row['department_name'] : '',
                isset($row['short_name']) ? $row['short_name'] : '',
                isset($row['category']) ? $row['category'] : '',
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setWidth(28);
        }

        $filename = 'approval-matrix-coverage-gap-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
