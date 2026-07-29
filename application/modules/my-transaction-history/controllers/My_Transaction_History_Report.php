<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class My_Transaction_History_Report extends MY_Controller
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
            'title' => 'My Transaction History',
            'main_view' => '../modules/my-transaction-history/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function fetchRows($take)
    {
        $userId = (int) $this->session->userdata('user_id');

        $params = array(
            'UserId' => $userId,
            'Take' => $take,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_my_transaction_history_report', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');
            $take = $this->resolvePaginationTake($this->input->post('Take'));

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

    private function applyFilters($rows)
    {
        $keyword = trim((string) $this->input->get_post('Keyword'));
        $type = trim((string) $this->input->get_post('Type'));
        $status = trim((string) $this->input->get_post('Status'));
        $dateFrom = trim((string) $this->input->get_post('DateFrom'));
        $dateTo = trim((string) $this->input->get_post('DateTo'));

        if ($keyword === '' && $type === '' && $status === '' && $dateFrom === '' && $dateTo === '') {
            return $rows;
        }

        $keyword = strtolower($keyword);
        $status = strtolower($status);

        return array_values(array_filter($rows, function ($row) use ($keyword, $type, $status, $dateFrom, $dateTo) {
            if ($type !== '' && (!isset($row['transaction_type']) || $row['transaction_type'] !== $type)) {
                return false;
            }

            if ($status !== '' && (!isset($row['status_name']) || strpos(strtolower($row['status_name']), $status) === false)) {
                return false;
            }

            $createdDate = isset($row['created_date']) ? substr((string) $row['created_date'], 0, 10) : '';

            if ($dateFrom !== '' && ($createdDate === '' || $createdDate < $dateFrom)) {
                return false;
            }

            if ($dateTo !== '' && ($createdDate === '' || $createdDate > $dateTo)) {
                return false;
            }

            if ($keyword !== '') {
                $haystack = strtolower(
                    (isset($row['reference_no']) ? $row['reference_no'] : '') . ' ' .
                    (isset($row['description']) ? $row['description'] : '')
                );
                if (strpos($haystack, $keyword) === false) {
                    return false;
                }
            }

            return true;
        }));
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

    public function download_excel()
    {
        $result = $this->applyFilters($this->fetchRows(null));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('My Transaction History');

        $headers = array('Transaction Type', 'Reference No.', 'Amount', 'Status', 'Description', 'Cost Center', 'Needed Date', 'Employee', 'Position', 'Department', 'Company', 'Created Date', 'Updated Date');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($result as $row) {
            $sheet->fromArray(array(
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
                isset($row['reference_no']) ? $row['reference_no'] : '',
                isset($row['amount']) ? (float) $row['amount'] : 0,
                isset($row['status_name']) ? $row['status_name'] : '',
                isset($row['description']) ? $row['description'] : '',
                $this->formatCodeName(isset($row['cost_center_id']) ? $row['cost_center_id'] : '', isset($row['cost_center_name']) ? $row['cost_center_name'] : ''),
                isset($row['needed_date']) ? $row['needed_date'] : '',
                isset($row['employee_name']) ? $row['employee_name'] : '',
                isset($row['position']) ? $row['position'] : '',
                isset($row['department_name']) ? $row['department_name'] : '',
                isset($row['company_name']) ? $row['company_name'] : '',
                isset($row['created_date']) ? $row['created_date'] : '',
                isset($row['updated_date']) ? $row['updated_date'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setWidth(22);
        }

        $filename = 'my-transaction-history-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
