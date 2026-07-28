<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Expense_Type_Breakdown_Report extends MY_Controller
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
            'title' => 'Expense Type Breakdown Report',
            'main_view' => '../modules/expense-type-breakdown/views/index',
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
            build_sp('sp_fetch_expense_type_breakdown_report', count($params)),
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
            $key = $row['expense_category'] !== null ? $row['expense_category'] : '(Uncategorized)';
            if (!isset($summary[$key])) {
                $summary[$key] = array(
                    'expense_category' => $row['expense_category'],
                    'category_name' => $row['category_name'],
                    'reimbursement' => 0,
                    'liquidation' => 0,
                    'total' => 0,
                );
            }

            $amount = (float) $row['actual_amount'];
            $summary[$key]['total'] += $amount;

            if ($row['source_module'] === 'REIMBURSEMENT') {
                $summary[$key]['reimbursement'] += $amount;
            } elseif ($row['source_module'] === 'LIQUIDATION') {
                $summary[$key]['liquidation'] += $amount;
            }
        }

        $spreadsheet = new Spreadsheet();

        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Summary by Expense Type');
        $summarySheet->fromArray(
            array('Expense Category Code', 'Category Name', 'Reimbursement', 'Liquidation', 'Total'),
            null,
            'A1'
        );
        $summarySheet->getStyle('A1:E1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($summary as $item) {
            $summarySheet->fromArray(
                array(
                    $item['expense_category'],
                    $item['category_name'],
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
            $summarySheet->getColumnDimension($col)->setWidth(24);
        }

        $detailSheet = $spreadsheet->createSheet();
        $detailSheet->setTitle('Details');
        $detailSheet->fromArray(
            array('Source', 'Reference No.', 'Expense Category', 'Category Name', 'Cost Center', 'Document Date', 'Invoice No.', 'Actual Amount', 'Net Amount', 'VAT Amount', 'Approved Amount', 'Vendor', 'Vendor TIN'),
            null,
            'A1'
        );
        $detailSheet->getStyle('A1:M1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($rows as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $detailSheet->fromArray(
                array(
                    $row['source_module'],
                    $row['reference_no'],
                    $row['expense_category'],
                    $row['category_name'],
                    $costCenterDisplay,
                    $row['document_date'],
                    isset($row['invoice_receipt_no']) ? $row['invoice_receipt_no'] : '',
                    (float) $row['actual_amount'],
                    (float) $row['net_amount'],
                    (float) $row['vat_amount'],
                    $row['approved_amount'] !== null ? (float) $row['approved_amount'] : null,
                    $row['vendor_name'],
                    isset($row['vendor_tin']) ? $row['vendor_tin'] : '',
                ),
                null,
                'A' . $rowIndex
            );
            $rowIndex++;
        }
        foreach (range('A', 'M') as $col) {
            $detailSheet->getColumnDimension($col)->setWidth(18);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'expense-type-breakdown-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
