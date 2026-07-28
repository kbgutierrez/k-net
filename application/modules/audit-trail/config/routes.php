<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/audit-trail'] = 'Audit_Trail_Report';
$route['reports/audit-trail/api/get'] = 'Audit_Trail_Report/api_get';
$route['reports/audit-trail/download/excel'] = 'Audit_Trail_Report/download_excel';
