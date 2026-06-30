<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/cash-advance'] = 'Cash_Advance';
$route['transactions/cash-advance/add'] = 'Cash_Advance/add';
$route['transactions/cash-advance/view/(:any)'] = 'Cash_Advance/view/$1';
$route['transactions/cash-advance/api/save'] = 'Cash_Advance/api_save';
$route['transactions/cash-advance/api/get'] = 'Cash_Advance/api_get';
$route['transactions/cash-advance/api/get/detail'] = 'Cash_Advance/api_get_detail';
$route['transactions/cash-advance/api/get/timeline'] = 'Cash_Advance/api_get_timeline';
$route['transactions/cash-advance/api/check-pending'] = 'Cash_Advance/api_check_pending';
$route['transactions/cash-advance/test-pdf-coords'] = 'Cash_Advance/test_pdf_coords';
?>