<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Audit_Trail_Report extends MY_Controller
{
    const EXPORT_ROW_CAP = 50000;

    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    public function index()
    {
        $data = array(
            'title' => 'Full Audit Trail Export',
            'main_view' => '../modules/audit-trail/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function resolveFilters($getter)
    {
        $dateFrom = trim((string) $getter('DateFrom'));
        $dateTo = trim((string) $getter('DateTo'));
        $transactionType = trim((string) $getter('TransactionType'));
        $action = trim((string) $getter('Action'));

        return array(
            'DateFrom' => $dateFrom !== '' ? $dateFrom : null,
            'DateTo' => $dateTo !== '' ? $dateTo : null,
            'TransactionType' => $transactionType !== '' ? $transactionType : null,
            'Action' => $action !== '' ? $action : null,
        );
    }

    private function fetchRows($cursorId, $take, $filters)
    {
        $params = array(
            'CursorId' => $cursorId,
            'Take' => $take,
            'DateFrom' => $filters['DateFrom'],
            'DateTo' => $filters['DateTo'],
            'TransactionType' => $filters['TransactionType'],
            'Action' => $filters['Action'],
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_audit_trail_report', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');

            $cursorIdRaw = $this->input->post('CursorId');
            $take = $this->resolvePaginationTake($this->input->post('Take'));
            $cursorId = ($cursorIdRaw !== null && $cursorIdRaw !== '') ? (int) $cursorIdRaw : null;

            $filters = $this->resolveFilters(function ($key) {
                return $this->input->post($key);
            });

            $result = $this->fetchRows($cursorId, $take, $filters);
            $payload = $this->buildPaginationResult($result, $take);

            echo json_encode(array(
                'status' => 'success',
                'data' => $payload['data'],
                'pagination' => $payload['pagination'],
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
        $filters = $this->resolveFilters(function ($key) {
            return $this->input->get($key);
        });

        $result = $this->fetchRows(null, self::EXPORT_ROW_CAP, $filters);

        $capped = count($result) > self::EXPORT_ROW_CAP;
        if ($capped) {
            $result = array_slice($result, 0, self::EXPORT_ROW_CAP);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Audit Trail');

        $headers = array(
            'ID', 'Transaction Type', 'Transaction ID', 'Action', 'Entity Type', 'Entity ID',
            'Field Name', 'Old Value', 'New Value', 'Changed By (ID)', 'Changed By (Name)',
            'Date/Time', 'Remarks',
        );
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($result as $row) {
            $sheet->fromArray(array(
                isset($row['id']) ? (int) $row['id'] : '',
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
                isset($row['transaction_id']) ? $row['transaction_id'] : '',
                isset($row['action']) ? $row['action'] : '',
                isset($row['entity_type']) ? $row['entity_type'] : '',
                isset($row['entity_id']) ? $row['entity_id'] : '',
                isset($row['field_name']) ? $row['field_name'] : '',
                isset($row['old_value']) ? $row['old_value'] : '',
                isset($row['new_value']) ? $row['new_value'] : '',
                isset($row['changed_by']) ? $row['changed_by'] : '',
                isset($row['changed_by_name']) ? $row['changed_by_name'] : '',
                isset($row['created_date']) ? $row['created_date'] : '',
                isset($row['remarks']) ? $row['remarks'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setWidth(22);
        }

        if ($capped) {
            $rowIndex++;
            $sheet->setCellValue('A' . $rowIndex, 'Export capped at ' . self::EXPORT_ROW_CAP . ' rows. Narrow the date range or filters to see the remaining records.');
            $sheet->getStyle('A' . $rowIndex)->getFont()->setItalic(true);
        }

        $filename = 'audit-trail-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
