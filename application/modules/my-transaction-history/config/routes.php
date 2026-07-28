<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/my-transaction-history'] = 'My_Transaction_History_Report';
$route['reports/my-transaction-history/api/get'] = 'My_Transaction_History_Report/api_get';
$route['reports/my-transaction-history/download/excel'] = 'My_Transaction_History_Report/download_excel';
?>