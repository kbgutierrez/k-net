<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/executive-dashboard'] = 'Executive_Dashboard';
$route['reports/executive-dashboard/api/get'] = 'Executive_Dashboard/api_get_dashboard';
$route['reports/executive-dashboard/api/get/detail'] = 'Executive_Dashboard/api_get_detail';
$route['reports/executive-dashboard/download/excel'] = 'Executive_Dashboard/download_excel';
