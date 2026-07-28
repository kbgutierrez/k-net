<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Payment_Advisory_Release_Report extends MY_Controller
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
            'title' => 'Payment Advisory & Release Register',
            'main_view' => '../modules/payment-advisory-release/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function fetchRows($cursorId, $take)
    {
        $params = array(
            'CursorId' => $cursorId,
            'Take' => $take,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_payment_register', count($params)),
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

            $cursorId = null;
            if ($cursorIdRaw !== null && $cursorIdRaw !== '') {
                $cursorId = (int) $cursorIdRaw;
            }

            $result = $this->fetchRows($cursorId, $take);

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

    private function applyFilters($rows)
    {
        $keyword = strtolower(trim((string) $this->input->get_post('Keyword')));
        $eventType = trim((string) $this->input->get_post('EventType'));
        $transactionType = trim((string) $this->input->get_post('TransactionType'));
        $dateFrom = trim((string) $this->input->get_post('DateFrom'));
        $dateTo = trim((string) $this->input->get_post('DateTo'));

        if ($keyword === '' && $eventType === '' && $transactionType === '' && $dateFrom === '' && $dateTo === '') {
            return $rows;
        }

        return array_values(array_filter($rows, function ($row) use ($keyword, $eventType, $transactionType, $dateFrom, $dateTo) {
            if ($eventType !== '' && (!isset($row['event_type']) || $row['event_type'] !== $eventType)) {
                return false;
            }

            if ($transactionType !== '' && (!isset($row['transaction_type']) || $row['transaction_type'] !== $transactionType)) {
                return false;
            }

            if ($dateFrom !== '' && (!isset($row['created_date']) || substr((string) $row['created_date'], 0, 10) < $dateFrom)) {
                return false;
            }

            if ($dateTo !== '' && (!isset($row['created_date']) || substr((string) $row['created_date'], 0, 10) > $dateTo)) {
                return false;
            }

            if ($keyword !== '') {
                $haystack = strtolower(
                    (isset($row['reference_no']) ? $row['reference_no'] : '') . ' ' .
                    (isset($row['requester_name']) ? $row['requester_name'] : '') . ' ' .
                    (isset($row['actor_name']) ? $row['actor_name'] : '')
                );
                if (strpos($haystack, $keyword) === false) {
                    return false;
                }
            }

            return true;
        }));
    }

    public function download_excel()
    {
        $result = $this->applyFilters($this->fetchRows(null, null));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Payment Register');

        $headers = array('Reference No.', 'Transaction Type', 'Event', 'Status', 'Requester', 'Payable To', 'Department', 'Cost Center', 'Amount', 'Actioned By', 'Date/Time', 'Remarks');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:L1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($result as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $sheet->fromArray(array(
                isset($row['reference_no']) ? $row['reference_no'] : '',
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
                isset($row['event_type']) ? $row['event_type'] : '',
                isset($row['action']) ? $row['action'] : '',
                isset($row['requester_name']) ? $row['requester_name'] : '',
                isset($row['payable_to']) ? $row['payable_to'] : '',
                isset($row['department']) ? $row['department'] : '',
                $costCenterDisplay,
                isset($row['amount']) ? (float) $row['amount'] : 0,
                isset($row['actor_name']) ? $row['actor_name'] : '',
                isset($row['created_date']) ? $row['created_date'] : '',
                isset($row['remarks']) ? $row['remarks'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setWidth(20);
        }

        $filename = 'payment-advisory-release-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
