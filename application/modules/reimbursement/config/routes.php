<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/reimbursement'] = 'Reimbursement/index';
$route['transactions/reimbursement/add'] = 'Reimbursement/add';
$route['transactions/reimbursement/add/(:any)'] = 'Reimbursement/add/$1';
$route['transactions/reimbursement/view/(:any)'] = 'Reimbursement/view/$1';
$route['transactions/reimbursement/edit/(:any)'] = 'Reimbursement/edit/$1';
$route['transactions/reimbursement/api/save'] = 'Reimbursement/api_save_reimbursement';
$route['transactions/reimbursement/api/update'] = 'Reimbursement/api_update_reimbursement';
$route['transactions/reimbursement/api/get'] = 'Reimbursement/api_get_reimbursement';
$route['transactions/reimbursement/api/list'] = 'Reimbursement/api_get_list';
$route['transactions/reimbursement/api/delete'] = 'Reimbursement/api_delete_draft';
$route['transactions/reimbursement/api/categories'] = 'Reimbursement/api_get_expense_categories';
$route['transactions/reimbursement/api/timeline'] = 'Reimbursement/api_get_timeline';
$route['transactions/reimbursement/api/ocr'] = 'Reimbursement/api_ocr_receipt';