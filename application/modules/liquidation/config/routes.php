<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/liquidation'] = 'Liquidation';
$route['transactions/liquidation/add'] = 'Liquidation/add';
$route['transactions/liquidation/add/(:any)'] = 'Liquidation/add/$1';
$route['transactions/liquidation/view/(:any)'] = 'Liquidation/view/$1';
$route['transactions/liquidation/api/get/pending/ca_no'] = 'Liquidation/api_get_pending_ca_nums_by_userid';
$route['transactions/liquidation/api/get/ca_details'] = 'Liquidation/api_get_ca_details_by_ca_no';
$route['transactions/liquidation/api/get/expense_types'] = 'Liquidation/api_get_expense_types';
$route['transactions/liquidation/api/get/draft'] = 'Liquidation/api_get_draft';
$route['transactions/liquidation/api/ocr'] = 'Liquidation/api_ocr_receipt';
$route['transactions/liquidation/api/save'] = 'Liquidation/api_save_liquidation';

$route['transactions/liquidation/api/get/header'] = 'Liquidation/api_get_header';
$route['transactions/liquidation/api/get/details'] = 'Liquidation/api_get_details';

$route['transactions/liquidation/edit/(:any)'] = 'Liquidation/edit/$1';
$route['transactions/liquidation/api/get/for_edit'] = 'Liquidation/api_get_for_edit';
$route['transactions/liquidation/api/update'] = 'Liquidation/api_update_liquidation';
$route['transactions/liquidation/api/get/timeline'] = 'Liquidation/api_get_timeline';
?>