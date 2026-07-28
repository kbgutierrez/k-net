<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/liquidation-report'] = 'Liquidation_Report';
$route['reports/liquidation-report/api/get'] = 'Liquidation_Report/api_get';
$route['reports/liquidation-report/download/excel'] = 'Liquidation_Report/download_excel';
