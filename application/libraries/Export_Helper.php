<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Export_Helper
{
  public $CI;
  public function __construct()
  {
    $this->CI = &get_instance();
    $this->CI->load->model('DatatablesTransModel', 'datatablestrans');
  }
  public function load_fields($table_name)
  {
    $link_database = NULL;
    if (!empty($database_name)) {
      $this->CI->datatablestrans->setDatabase($database_name);
      $link_database = $database_name;
    } else {
      $this->CI->datatablestrans->setDatabase($this->CI->session->userdata('user_info')['database_name']);
      $link_database = $this->CI->session->userdata('user_info')['database_name'];
    }

    $this->CI->datatablestrans->setTable($table_name);
    $fields = $this->CI->datatablestrans->getFields($table_name);
    unset($fields[0]);

    return $fields;
  }
}
