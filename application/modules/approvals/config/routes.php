<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/approvals'] = 'Approvals';
$route['transactions/approvals/review/(:any)'] = 'Approvals/review/$1';
$route['transactions/approvals/api/get/header'] = 'Approvals/api_get_header';
$route['transactions/approvals/api/get/details'] = 'Approvals/api_get_details';
$route['transactions/approvals/api/submit_decisions'] = 'Approvals/api_submit_decisions';