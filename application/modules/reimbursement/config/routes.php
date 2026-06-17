<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/reimbursement'] = 'Reimbursement';
$route['transactions/reimbursement/add'] = 'Reimbursement/add';
$route['transactions/reimbursement/add/(:any)'] = 'Reimbursement/add/$1';
$route['transactions/reimbursement/view/(:any)'] = 'Reimbursement/view/$1';

$route['transactions/reimbursement/api/get/header'] = 'Reimbursement/api_get_header';
$route['transactions/reimbursement/api/get/details'] = 'Reimbursement/api_get_details';
$route['transactions/reimbursement/api/get/draft'] = 'Reimbursement/api_get_draft';
$route['transactions/reimbursement/api/save'] = 'Reimbursement/api_save_reimbursement';

?>
