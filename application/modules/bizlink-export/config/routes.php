<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/bizlink-export'] = 'Bizlink_Export';
$route['transactions/bizlink-export/api/get/header'] = 'Bizlink_Export/api_get_header';
$route['transactions/bizlink-export/api/eligibility'] = 'Bizlink_Export/api_bizlink_export_eligibility';
$route['transactions/bizlink-export/generate-batch'] = 'Bizlink_Export/download_bizlink_export_batch';
$route['transactions/bizlink-export/api/batches'] = 'Bizlink_Export/api_fetch_bizlink_export_batches';
$route['transactions/bizlink-export/api/void'] = 'Bizlink_Export/api_void_bizlink_export_batch';
