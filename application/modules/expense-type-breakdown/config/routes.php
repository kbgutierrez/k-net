<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/expense-type-breakdown'] = 'Expense_Type_Breakdown_Report';
$route['reports/expense-type-breakdown/api/get'] = 'Expense_Type_Breakdown_Report/api_get';
$route['reports/expense-type-breakdown/download/excel'] = 'Expense_Type_Breakdown_Report/download_excel';
