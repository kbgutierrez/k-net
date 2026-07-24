<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['maintenance/bank-account-masterlist'] = 'Bank_Account_Masterlist';
$route['maintenance/bank-account-masterlist/api/get'] = 'Bank_Account_Masterlist/api_get';
$route['maintenance/bank-account-masterlist/api/employee-options'] = 'Bank_Account_Masterlist/api_get_employee_options';
$route['maintenance/bank-account-masterlist/api/save'] = 'Bank_Account_Masterlist/api_save';
$route['maintenance/bank-account-masterlist/api/reveal'] = 'Bank_Account_Masterlist/api_reveal';
$route['maintenance/bank-account-masterlist/api/toggle'] = 'Bank_Account_Masterlist/api_toggle_active';
$route['maintenance/bank-account-masterlist/api/mass-upload'] = 'Bank_Account_Masterlist/api_mass_upload';
$route['maintenance/bank-account-masterlist/api/download-template'] = 'Bank_Account_Masterlist/download_template';

?>
