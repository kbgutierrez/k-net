<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['reports/gl-breakdown'] = 'Gl_Breakdown_Report';
$route['reports/gl-breakdown/api/get'] = 'Gl_Breakdown_Report/api_get';
$route['reports/gl-breakdown/download/excel'] = 'Gl_Breakdown_Report/download_excel';
