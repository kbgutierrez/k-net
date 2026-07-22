<?php
defined('BASEPATH') or exit('No direct script access allowed');

// $route[''] = 'Dashboard';
$route['dashboard'] = 'Dashboard';
$route['dashboard/chat-embed'] = 'Dashboard/chat_embed';
$route['dashboard/api/get/summary'] = 'Dashboard/api_get_summary';
$route['dashboard/api/fund/cash-in'] = 'Dashboard/api_fund_cash_in';
$route['dashboard/api/fund/passbook'] = 'Dashboard/api_fund_passbook';
$route['dashboard/api/overdue-liquidations'] = 'Dashboard/api_get_overdue_liquidations';
$route['dashboard/api/overdue-liquidations/notify'] = 'Dashboard/api_notify_overdue';
$route['dashboard/api/overdue-liquidations/extend'] = 'Dashboard/api_extend_due';

?>