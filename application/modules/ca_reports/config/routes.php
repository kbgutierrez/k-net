<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/ca_reports'] = 'CA_Reports';
$route['reports/ca_reports/index'] = 'CA_Reports/index';
$route['reports/ca_reports/add'] = 'CA_Reports/add';
$route['reports/ca_reports/view/(:any)'] = 'CA_Reports/view/$1';
$route['reports/ca_reports/api/get'] = 'CA_Reports/api_get';
$route['reports/ca_reports/api/get/detail'] = 'CA_Reports/api_get_detail';
$route['reports/ca_reports/api/get/timeline'] = 'CA_Reports/api_get_timeline';

?>