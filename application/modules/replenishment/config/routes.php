<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/replenishment'] = 'Replenishment/index';
$route['transactions/replenishment/add'] = 'Replenishment/add';
$route['transactions/replenishment/api/get/claimable'] = 'Replenishment/api_get_claimable';
$route['transactions/replenishment/api/save'] = 'Replenishment/api_save_replenishment';
$route['transactions/replenishment/api/list'] = 'Replenishment/api_get_list';
$route['transactions/replenishment/api/get'] = 'Replenishment/api_get_replenishment';
