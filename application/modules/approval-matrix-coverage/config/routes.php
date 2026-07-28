<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/approval-matrix-coverage'] = 'Approval_Matrix_Coverage_Report';
$route['reports/approval-matrix-coverage/api/get'] = 'Approval_Matrix_Coverage_Report/api_get';
$route['reports/approval-matrix-coverage/download/excel'] = 'Approval_Matrix_Coverage_Report/download_excel';
