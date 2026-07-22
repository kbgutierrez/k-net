<?php
defined('BASEPATH') or exit('No direct script access allowed');

// $route[''] = 'Dashboard';
$route['dashboard'] = 'Dashboard';
$route['dashboard/chat-embed'] = 'Dashboard/chat_embed';
$route['dashboard/api/get/summary'] = 'Dashboard/api_get_summary';
$route['dashboard/api/fund/cash-in'] = 'Dashboard/api_fund_cash_in';
$route['dashboard/api/fund/passbook'] = 'Dashboard/api_fund_passbook';

?>