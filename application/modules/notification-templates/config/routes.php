<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['maintenance/notification-templates'] = 'Notification_Templates';
$route['maintenance/notification-templates/add'] = 'Notification_Templates/add';
$route['maintenance/notification-templates/edit/(:num)'] = 'Notification_Templates/edit/$1';
$route['maintenance/notification-templates/api/get/header'] = 'Notification_Templates/api_get_header';
$route['maintenance/notification-templates/api/get/by-id'] = 'Notification_Templates/api_get_by_id';
$route['maintenance/notification-templates/api/save'] = 'Notification_Templates/api_save';
$route['maintenance/notification-templates/api/update'] = 'Notification_Templates/api_update';
$route['maintenance/notification-templates/api/preview'] = 'Notification_Templates/api_preview';
$route['maintenance/notification-templates/api/get/default'] = 'Notification_Templates/api_get_default_template';
$route['maintenance/notification-templates/api/get/log'] = 'Notification_Templates/api_get_log';
