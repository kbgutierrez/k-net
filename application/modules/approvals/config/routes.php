<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/approvals'] = 'Approvals';
$route['transactions/approvals/review/(:any)'] = 'Approvals/review/$1';
$route['transactions/approvals/api/get/header'] = 'Approvals/api_get_header';
$route['transactions/approvals/api/get/details'] = 'Approvals/api_get_details';
$route['transactions/approvals/api/submit_decisions'] = 'Approvals/api_submit_decisions';
$route['transactions/approvals/api/per/item/decision'] = 'Approvals/api_per_item_decision';
$route['transactions/approvals/api/get/timeline'] = 'Approvals/api_get_approval_timeline';
$route['transactions/approvals/api/update/ca-header'] = 'Approvals/api_update_ca_header';
$route['transactions/approvals/api/update/rmb-header'] = 'Approvals/api_update_rmb_header';