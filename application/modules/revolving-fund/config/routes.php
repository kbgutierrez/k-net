<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['maintenance/revolving-fund'] = 'Revolving_Fund';

$route['maintenance/revolving-fund/api/get/funds'] = 'Revolving_Fund/api_get_funds';
$route['maintenance/revolving-fund/api/get/active-funds'] = 'Revolving_Fund/api_get_active_funds';
$route['maintenance/revolving-fund/api/save/fund'] = 'Revolving_Fund/api_save_fund';
$route['maintenance/revolving-fund/api/update/fund'] = 'Revolving_Fund/api_update_fund';

$route['maintenance/revolving-fund/api/get/assignments'] = 'Revolving_Fund/api_get_assignments';
$route['maintenance/revolving-fund/api/save/assignment'] = 'Revolving_Fund/api_save_assignment';
$route['maintenance/revolving-fund/api/update/assignment'] = 'Revolving_Fund/api_update_assignment';

$route['maintenance/revolving-fund/api/get/ledger'] = 'Revolving_Fund/api_get_ledger';
$route['maintenance/revolving-fund/api/save/ledger'] = 'Revolving_Fund/api_save_ledger';

$route['maintenance/revolving-fund/api/get/departments'] = 'Revolving_Fund/api_get_departments';
$route['maintenance/revolving-fund/api/get/users'] = 'Revolving_Fund/api_get_users';

?>
