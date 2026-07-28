<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Cost_Center_Utilization_Report extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    private function formatCodeName($code, $name)
    {
        $code = trim((string) $code);
        $name = trim((string) $name);
        if ($code !== '' && $name !== '') {
            return $code . ' - ' . $name;
        }
        return $code !== '' ? $code : ($name !== '' ? $name : '');
    }

    public function index()
    {
        $data = array(
            'title' => 'Cost Center Utilization Report',
            'main_view' => '../modules/cost-center-utilization/views/index',
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
            build_sp('sp_fetch_cost_center_utilization_report', count($params)),
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

        $summary = array();
        foreach ($rows as $row) {
            $key = $row['cost_center_id'] !== null ? $row['cost_center_id'] : '(Unassigned)';
            if (!isset($summary[$key])) {
                $summary[$key] = array(
                    'cost_center_id' => $row['cost_center_id'],
                    'cost_center_name' => $row['cost_center_name'],
                    'cash_advance' => 0,
                    'reimbursement' => 0,
                    'liquidation' => 0,
                    'total' => 0,
                );
            }

            $amount = (float) $row['amount'];
            $summary[$key]['total'] += $amount;

            if ($row['transaction_type'] === 'CASH_ADVANCE') {
                $summary[$key]['cash_advance'] += $amount;
            } elseif ($row['transaction_type'] === 'REIMBURSEMENT') {
                $summary[$key]['reimbursement'] += $amount;
            } elseif ($row['transaction_type'] === 'LIQUIDATION') {
                $summary[$key]['liquidation'] += $amount;
            }
        }

        $spreadsheet = new Spreadsheet();

        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Summary by Cost Center');
        $summarySheet->fromArray(
            array('Cost Center', 'Cash Advance', 'Reimbursement', 'Liquidation', 'Total'),
            null,
            'A1'
        );
        $summarySheet->getStyle('A1:E1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($summary as $item) {
            $summarySheet->fromArray(
                array(
                    $this->formatCodeName($item['cost_center_id'], $item['cost_center_name']),
                    round($item['cash_advance'], 2),
                    round($item['reimbursement'], 2),
                    round($item['liquidation'], 2),
                    round($item['total'], 2),
                ),
                null,
                'A' . $rowIndex
            );
            $rowIndex++;
        }
        foreach (range('A', 'E') as $col) {
            $summarySheet->getColumnDimension($col)->setWidth(26);
        }

        $detailSheet = $spreadsheet->createSheet();
        $detailSheet->setTitle('Transactions');
        $detailSheet->fromArray(
            array('Cost Center', 'Transaction Type', 'Reference No.', 'Amount', 'Transaction Date', 'Status'),
            null,
            'A1'
        );
        $detailSheet->getStyle('A1:F1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($rows as $row) {
            $detailSheet->fromArray(
                array(
                    $this->formatCodeName($row['cost_center_id'], $row['cost_center_name']),
                    $row['transaction_type'],
                    $row['reference_no'],
                    (float) $row['amount'],
                    $row['transaction_date'],
                    $row['status_name'],
                ),
                null,
                'A' . $rowIndex
            );
            $rowIndex++;
        }
        foreach (range('A', 'F') as $col) {
            $detailSheet->getColumnDimension($col)->setWidth(20);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'cost-center-utilization-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
