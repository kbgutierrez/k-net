<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/disbursement-register'] = 'Disbursement_Register_Report';
$route['reports/disbursement-register/api/get'] = 'Disbursement_Register_Report/api_get';
$route['reports/disbursement-register/download/excel'] = 'Disbursement_Register_Report/download_excel';
