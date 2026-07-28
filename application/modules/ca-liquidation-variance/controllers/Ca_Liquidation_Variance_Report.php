<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Ca_Liquidation_Variance_Report extends MY_Controller
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
            'title' => 'CA vs Liquidation Variance Report',
            'main_view' => '../modules/ca-liquidation-variance/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function normalizeDate($value)
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        return $value;
    }

    private function fetchRows($dateFrom, $dateTo)
    {
        $params = array(
            'DateFrom' => $dateFrom,
            'DateTo'   => $dateTo,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_ca_liquidation_variance_report', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');

            $dateFrom = $this->normalizeDate($this->input->post('DateFrom'));
            $dateTo = $this->normalizeDate($this->input->post('DateTo'));

            $rows = $this->fetchRows($dateFrom, $dateTo);

            echo json_encode(array(
                'status' => 'success',
                'data' => $rows,
                'pagination' => array(
                    'take' => 0,
                    'hasMore' => false,
                ),
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => 'An error occurred: ' . $e->getMessage(),
            ));
        }
    }

    public function download_excel()
    {
        $dateFrom = $this->normalizeDate($this->input->get('DateFrom'));
        $dateTo = $this->normalizeDate($this->input->get('DateTo'));

        $rows = $this->fetchRows($dateFrom, $dateTo);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('CA vs Liquidation Variance');
        $sheet->fromArray(
            array('Cash Advance No.', 'Employee', 'Cost Center', 'Description', 'CA Amount', 'Liquidated Amount', 'Variance', 'Status', 'CA Date', 'Age (days)'),
            null,
            'A1'
        );
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($rows as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $sheet->fromArray(
                array(
                    $row['cash_advance_id'],
                    $row['user_name'],
                    $costCenterDisplay,
                    $row['description'],
                    (float) $row['ca_amount'],
                    (float) $row['liquidated_amount'],
                    (float) $row['variance'],
                    $row['status_name'],
                    $row['created_date'],
                    (int) $row['age_days'],
                ),
                null,
                'A' . $rowIndex
            );
            $rowIndex++;
        }
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setWidth(20);
        }

        $filename = 'ca-liquidation-variance-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
