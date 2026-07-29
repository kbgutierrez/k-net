<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class Executive_Dashboard extends MY_Controller
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
            'title' => 'Executive Dashboard',
            'main_view' => '../modules/executive-dashboard/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_get_dashboard()
    {
        try {
            $this->output->set_content_type('application/json');

            $dateFrom = trim((string) $this->input->post('DateFrom'));
            $dateTo = trim((string) $this->input->post('DateTo'));
            $params = array(
                'DateFrom' => $dateFrom !== '' ? $dateFrom : null,
                'DateTo' => $dateTo !== '' ? $dateTo : null,
            );

            $kpis = $this->sp->readData(
                build_sp('sp_fetch_dashboard_kpis', count($params)),
                $params,
                'row'
            );

            $monthlyTrend = $this->sp->readData(
                build_sp('sp_fetch_dashboard_monthly_trend', count($params)),
                $params,
                'result'
            );

            $departmentBreakdown = $this->sp->readData(
                build_sp('sp_fetch_dashboard_department_breakdown', count($params)),
                $params,
                'result'
            );

            $glBreakdown = $this->sp->readData(
                build_sp('sp_fetch_dashboard_gl_breakdown', count($params)),
                $params,
                'result'
            );

            $agingBuckets = $this->sp->readData(
                'EXEC sp_fetch_dashboard_aging_buckets',
                null,
                'result'
            );

            return $this->respondSuccess('OK', array(
                'kpis' => is_array($kpis) ? $kpis : new stdClass(),
                'monthlyTrend' => is_array($monthlyTrend) ? $monthlyTrend : array(),
                'departmentBreakdown' => is_array($departmentBreakdown) ? $departmentBreakdown : array(),
                'glBreakdown' => is_array($glBreakdown) ? $glBreakdown : array(),
                'agingBuckets' => is_array($agingBuckets) ? $agingBuckets : array(),
            ));
        } catch (Throwable $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    private function fetchDetailRows($dateFrom, $dateTo)
    {
        $params = array(
            'DateFrom' => $dateFrom !== '' ? $dateFrom : null,
            'DateTo' => $dateTo !== '' ? $dateTo : null,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_dashboard_detail', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    public function api_get_detail()
    {
        try {
            $this->output->set_content_type('application/json');

            $dateFrom = trim((string) $this->input->post('DateFrom'));
            $dateTo = trim((string) $this->input->post('DateTo'));

            $result = $this->fetchDetailRows($dateFrom, $dateTo);

            return $this->respondSuccess('OK', $result);
        } catch (Throwable $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    private function fetchGlDetailRows($dateFrom, $dateTo)
    {
        $params = array(
            'DateFrom' => $dateFrom !== '' ? $dateFrom : null,
            'DateTo' => $dateTo !== '' ? $dateTo : null,
        );

        $result = $this->sp->readData(
            build_sp('sp_fetch_dashboard_gl_detail', count($params)),
            $params,
            'result'
        );

        return is_array($result) ? $result : array();
    }

    private function periodLabel($dateFrom, $dateTo)
    {
        if ($dateFrom === '' && $dateTo === '') {
            return 'Period: All time';
        }
        return 'Period: ' . ($dateFrom !== '' ? $dateFrom : 'earliest') . ' to ' . ($dateTo !== '' ? $dateTo : 'latest');
    }

    public function download_excel()
    {
        $dateFrom = trim((string) $this->input->post('DateFrom'));
        $dateTo = trim((string) $this->input->post('DateTo'));
        $selectedRefs = $this->input->post('References');
        $selectedRefs = is_array($selectedRefs) ? array_filter(array_map('trim', $selectedRefs)) : array();
        $periodLabel = $this->periodLabel($dateFrom, $dateTo);

        $rows = $this->fetchDetailRows($dateFrom, $dateTo);
        if (!empty($selectedRefs)) {
            $selectedLookup = array_flip($selectedRefs);
            $rows = array_values(array_filter($rows, function ($row) use ($selectedLookup) {
                return isset($row['reference_no']) && isset($selectedLookup[$row['reference_no']]);
            }));
        }

        $glRows = $this->fetchGlDetailRows($dateFrom, $dateTo);
        if (!empty($selectedRefs)) {
            $selectedLookup = array_flip($selectedRefs);
            $glRows = array_values(array_filter($glRows, function ($row) use ($selectedLookup) {
                return isset($row['reference_no']) && isset($selectedLookup[$row['reference_no']]);
            }));
        }

        $departmentTotals = array();
        foreach ($rows as $row) {
            $department = isset($row['department_name']) && trim((string) $row['department_name']) !== '' ? $row['department_name'] : 'Unassigned';
            if (!isset($departmentTotals[$department])) {
                $departmentTotals[$department] = array('total_amount' => 0.0, 'trx_count' => 0);
            }
            $departmentTotals[$department]['total_amount'] += isset($row['amount']) ? (float) $row['amount'] : 0;
            $departmentTotals[$department]['trx_count'] += 1;
        }
        arsort($departmentTotals);

        $glTotals = array();
        foreach ($glRows as $row) {
            $glCode = isset($row['gl_code']) ? $row['gl_code'] : '(No GL Code)';
            $glName = isset($row['gl_name']) ? $row['gl_name'] : 'Unassigned';
            $key = $glCode . '|' . $glName;
            if (!isset($glTotals[$key])) {
                $glTotals[$key] = array('gl_code' => $glCode, 'gl_name' => $glName, 'total_amount' => 0.0, 'line_count' => 0);
            }
            $glTotals[$key]['total_amount'] += isset($row['actual_amount']) ? (float) $row['actual_amount'] : 0;
            $glTotals[$key]['line_count'] += 1;
        }
        usort($glTotals, function ($a, $b) {
            return $b['total_amount'] <=> $a['total_amount'];
        });

        $spreadsheet = new Spreadsheet();

        $detailSheet = $spreadsheet->getActiveSheet();
        $detailSheet->setTitle('Detail');
        $detailSheet->fromArray(array($periodLabel), null, 'A1');
        $detailSheet->getStyle('A1')->getFont()->setItalic(true);

        $headers = array('Type', 'Reference No.', 'Employee', 'Company', 'Department', 'Cost Center', 'Amount', 'Description', 'Status', 'Created Date', 'Updated Date');
        $detailSheet->fromArray($headers, null, 'A2');
        $detailSheet->getStyle('A2:K2')->getFont()->setBold(true);

        $rowIndex = 3;
        foreach ($rows as $row) {
            $costCenter = trim((string) (isset($row['cost_center_id']) ? $row['cost_center_id'] : ''));
            $costCenterName = trim((string) (isset($row['cost_center_name']) ? $row['cost_center_name'] : ''));
            $costCenterDisplay = ($costCenter !== '' && $costCenterName !== '') ? ($costCenter . ' - ' . $costCenterName) : ($costCenter !== '' ? $costCenter : $costCenterName);

            $detailSheet->fromArray(array(
                isset($row['transaction_type']) ? $row['transaction_type'] : '',
                isset($row['reference_no']) ? $row['reference_no'] : '',
                isset($row['employee_name']) ? $row['employee_name'] : '',
                isset($row['company_name']) ? $row['company_name'] : '',
                isset($row['department_name']) ? $row['department_name'] : '',
                $costCenterDisplay,
                isset($row['amount']) ? (float) $row['amount'] : 0,
                isset($row['description']) ? $row['description'] : '',
                isset($row['status_name']) ? $row['status_name'] : '',
                isset($row['created_date']) ? $row['created_date'] : '',
                isset($row['updated_date']) ? $row['updated_date'] : '',
            ), null, 'A' . $rowIndex);
            $rowIndex++;
        }
        foreach (range('A', 'K') as $col) {
            $detailSheet->getColumnDimension($col)->setWidth(22);
        }

        $deptSheet = $spreadsheet->createSheet();
        $deptSheet->setTitle('By Department');
        $deptSheet->fromArray(array($periodLabel), null, 'A1');
        $deptSheet->getStyle('A1')->getFont()->setItalic(true);
        $deptSheet->fromArray(array('Department', 'Total Amount', 'Transaction Count'), null, 'A2');
        $deptSheet->getStyle('A2:C2')->getFont()->setBold(true);
        $rowIndex = 3;
        foreach ($departmentTotals as $department => $totals) {
            $deptSheet->fromArray(array($department, (float) $totals['total_amount'], (int) $totals['trx_count']), null, 'A' . $rowIndex);
            $rowIndex++;
        }
        foreach (range('A', 'C') as $col) {
            $deptSheet->getColumnDimension($col)->setWidth(28);
        }

        $glSheet = $spreadsheet->createSheet();
        $glSheet->setTitle('By GL');
        $glSheet->fromArray(array($periodLabel), null, 'A1');
        $glSheet->getStyle('A1')->getFont()->setItalic(true);
        $glSheet->fromArray(array('GL Code', 'GL Description', 'Total Amount', 'Line Count'), null, 'A2');
        $glSheet->getStyle('A2:D2')->getFont()->setBold(true);
        $rowIndex = 3;
        foreach ($glTotals as $totals) {
            $glSheet->fromArray(array($totals['gl_code'], $totals['gl_name'], (float) $totals['total_amount'], (int) $totals['line_count']), null, 'A' . $rowIndex);
            $rowIndex++;
        }
        foreach (range('A', 'D') as $col) {
            $glSheet->getColumnDimension($col)->setWidth(28);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'executive-dashboard-detail-' . date('Ymd-His') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
