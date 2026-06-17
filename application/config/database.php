<?php

defined('BASEPATH') or exit('No direct script access allowed');

$active_group = 'default';
$query_builder = true;

$hostname = '192.168.0.250';
// $hostname = '210.213.199.250';



$testserver = '192.168.1.229';
// $testserver = '209.141.3.234';

$db['default'] = array(
    'dsn' => '',
    'hostname' => $testserver,
    'username' => 'sa',
    'password' => 'Lem0n91$',
    'database' => 'BigEKnet',
    'dbdriver' => 'sqlsrv',
    'dbprefix' => '',
    'pconnect' => false,
    'db_debug' => (ENVIRONMENT !== 'production'),
    'cache_on' => true,
    // 'cachedir' => 'application/cache',
    'char_set' => 'utf8',
    'dbcollat' => 'utf8_general_ci',
    'swap_pre' => '',
    'encrypt' => false,
    'compress' => false,
    'stricton' => false,
    'failover' => array(),
    'save_queries' => false,
);


$db['dbknet'] = array(
    'dsn' => '',
    'hostname' => $testserver,
    'username' => 'sa',
    'password' => 'Lem0n91$',
    'database' => 'BigEKnet',
    'dbdriver' => 'sqlsrv',
    'dbprefix' => '',
    'pconnect' => false,
    'db_debug' => (ENVIRONMENT !== 'production'),
    'cache_on' => true,
    // 'cachedir' => 'application/cache',
    'char_set' => 'utf8',
    'dbcollat' => 'utf8_general_ci',
    'swap_pre' => '',
    'encrypt' => false,
    'compress' => false,
    'stricton' => false,
    'failover' => array(),
    'save_queries' => false,
);

