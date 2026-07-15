<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports'] = 'Reports';
$route['reports/ca-vs-liquidation'] = 'Reports/index/ca-vs-liquidation';
$route['reports/liquidation-register'] = 'Reports/index/liquidation-register';
$route['reports/reimbursement-register'] = 'Reports/index/reimbursement-register';
$route['reports/revolving-fund-ledger'] = 'Reports/index/revolving-fund-ledger';
$route['reports/pending-approvals'] = 'Reports/index/pending-approvals';
$route['reports/approval-trail'] = 'Reports/index/approval-trail';
$route['reports/department-spend'] = 'Reports/index/department-spend';

?>
