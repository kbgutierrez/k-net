<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/ca-liquidation-variance'] = 'Ca_Liquidation_Variance_Report';
$route['reports/ca-liquidation-variance/api/get'] = 'Ca_Liquidation_Variance_Report/api_get';
$route['reports/ca-liquidation-variance/download/excel'] = 'Ca_Liquidation_Variance_Report/download_excel';
