<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/pending-approvals-aging'] = 'Pending_Approvals_Aging_Report';
$route['reports/pending-approvals-aging/api/get'] = 'Pending_Approvals_Aging_Report/api_get';
$route['reports/pending-approvals-aging/download/excel'] = 'Pending_Approvals_Aging_Report/download_excel';
