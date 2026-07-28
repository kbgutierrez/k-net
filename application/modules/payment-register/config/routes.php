<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/payment-register'] = 'Payment_Register_Report';
$route['reports/payment-register/api/get'] = 'Payment_Register_Report/api_get';
$route['reports/payment-register/download/excel'] = 'Payment_Register_Report/download_excel';
