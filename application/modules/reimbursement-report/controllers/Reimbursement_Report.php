<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Reimbursement_Report extends MY_Controller
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
            'title' => 'Reimbursement Report',
            'main_view' => '../modules/reimbursement-report/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    private function buildFilteredQuery($filters)
    {
        $dateFrom = trim((string) $filters['DateFrom']);
        $dateTo = trim((string) $filters['DateTo']);
        $status = trim((string) $filters['Status']);
        $department = trim((string) $filters['Department']);
        $company = trim((string) $filters['Company']);
        $employee = trim((string) $filters['Employee']);

        $db = $this->sp->db;
        $db->select(
            "A.id,
            A.reimbursement_id,
            LTRIM(RTRIM(ISNULL(B.lastname, '') + ', ' + ISNULL(B.firstname, ''))) AS employee_name,
            ISNULL(C.CMPNYNM, '') AS company_name,
            ISNULL(D.short_name, '') AS department_name,
            A.cost_center_id,
            A.cost_center_name,
            A.total_amount,
            A.description,
            A.created_date,
            A.updated_date,
            A.status_code,
            A.status_name",
            false
        );
        $db->from('vw_rmb_header A');
        $db->join('BigEUsers.dbo.users B', 'A.user_id = B.id', 'inner', false);
        $db->join('BigEHRIS.dbo.department D', 'B.department_id = D.department_id', 'left', false);
        $db->join('BIGEDISER.dbo.TBL_CMPNY_CLSS C', 'B.company = C.ID AND C.ISACTV = 1', 'left', false);

        if ($dateFrom !== '') {
            $db->where('CONVERT(date, A.created_date) >=', $dateFrom, false);
        }
        if ($dateTo !== '') {
            $db->where('CONVERT(date, A.created_date) <=', $dateTo, false);
        }
        if ($status !== '') {
            $db->where('A.status_name', $status);
        }
        if ($department !== '') {
            $db->where("ISNULL(D.short_name, '') =", $department, false);
        }
        if ($company !== '') {
            $db->where("ISNULL(C.CMPNYNM, '') =", $company, false);
        }
        if ($employee !== '') {
            $db->where("LTRIM(RTRIM(ISNULL(B.lastname, '') + ', ' + ISNULL(B.firstname, ''))) =", $employee, false);
        }

        $db->order_by('A.id', 'DESC');

        return $db;
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');

            $filters = array(
                'DateFrom' => $this->input->post('DateFrom'),
                'DateTo' => $this->input->post('DateTo'),
                'Status' => $this->input->post('Status'),
                'Department' => $this->input->post('Department'),
                'Company' => $this->input->post('Company'),
                'Employee' => $this->input->post('Employee'),
            );

            $result = $this->buildFilteredQuery($filters)->get()->result_array();

            $nextCursorId = null;
            if (!empty($result)) {
                $lastRow = end($result);
                $nextCursorId = isset($lastRow['id']) ? (int) $lastRow['id'] : null;
            }

            echo json_encode(array(
                'status' => 'success',
                'data' => $result,
                'pagination' => array(
                    'take' => count($result),
                    'hasMore' => false,
                    'nextCursorId' => $nextCursorId,
                ),
            ));
        } catch (Throwable $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function download_excel()
    {
        $filters = array(
            'DateFrom' => $this->input->get('DateFrom'),
            'DateTo' => $this->input->get('DateTo'),
            'Status' => $this->input->get('Status'),
            'Department' => $this->input->get('Department'),
            'Company' => $this->input->get('Company'),
            'Employee' => $this->input->get('Employee'),
        );

        $result = $this->buildFilteredQuery($filters)->get()->result_array();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reimbursement Report');

        $headers = array('Reimbursement No.', 'Employee', 'Department', 'Company', 'Cost Center', 'Amount', 'Description', 'Requested Date', 'Status');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:I1')->getFont()->setBold(true);

        $rowIndex = 2;
        foreach ($result as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $sheet->fromArray(array(
                isset($row['reimbursement_id']) ? $row['reimbursement_id'] : '',
                isset($row['employee_name']) ? $row['employee_name'] : '',
                isset($row['department_name']) ? $row['department_name'] : '',
                isset($row['company_name']) ? $row['company_name'] : '',
                $costCenterDisplay,
                isset($row['total_amount']) ? (float) $row['total_amount'] : 0,
                isset($row['description']) ? $row['description'] : '',
                isset($row['created_date']) ? $row['created_date'] : '',
                isset($row['status_name']) ? $row['status_name'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }

        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setWidth(22);
        }

        $filename = 'reimbursement-report-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
