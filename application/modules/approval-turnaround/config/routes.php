<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/approval-turnaround'] = 'Approval_Turnaround_Report';
$route['reports/approval-turnaround/api/get'] = 'Approval_Turnaround_Report/api_get';
$route['reports/approval-turnaround/download/excel'] = 'Approval_Turnaround_Report/download_excel';
