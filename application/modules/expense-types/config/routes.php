<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['maintenance/expense-types'] = 'Expense_Types';
$route['maintenance/expense-types/api/get'] = 'Expense_Types/api_get';
$route['maintenance/expense-types/api/save'] = 'Expense_Types/api_save';
$route['maintenance/expense-types/api/update'] = 'Expense_Types/api_update';

?>