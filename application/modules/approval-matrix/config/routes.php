<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['maintenance/approval-matrix'] = 'Approval_Matrix';
$route['maintenance/approval-matrix/add'] = 'Approval_Matrix/add';
$route['maintenance/approval-matrix/edit/(:num)'] = 'Approval_Matrix/edit/$1';
$route['maintenance/approval-matrix/api/get/approvers'] = 'Approval_Matrix/api_get_approvers';
$route['maintenance/approval-matrix/api/get/departments'] = 'Approval_Matrix/api_get_departments';
$route['maintenance/approval-matrix/api/save'] = 'Approval_Matrix/api_save';
$route['maintenance/approval-matrix/api/get/header'] = 'Approval_Matrix/api_get_header';
$route['maintenance/approval-matrix/api/get/details/header/(:num)'] = 'Approval_Matrix/api_get_header_by_id/$1';
$route['maintenance/approval-matrix/api/get/details'] = 'Approval_Matrix/api_get_details';

?>
