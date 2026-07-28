<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/cost-center-utilization'] = 'Cost_Center_Utilization_Report';
$route['reports/cost-center-utilization/api/get'] = 'Cost_Center_Utilization_Report/api_get';
$route['reports/cost-center-utilization/download/excel'] = 'Cost_Center_Utilization_Report/download_excel';
