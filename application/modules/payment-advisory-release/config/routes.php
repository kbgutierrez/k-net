<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/payment-advisory-release'] = 'Payment_Advisory_Release_Report';
$route['reports/payment-advisory-release/api/get'] = 'Payment_Advisory_Release_Report/api_get';
$route['reports/payment-advisory-release/download/excel'] = 'Payment_Advisory_Release_Report/download_excel';
