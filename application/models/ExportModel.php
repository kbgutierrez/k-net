<?php
defined('BASEPATH') or exit('No direct script access allowed');
class ExportModel extends CI_Model
{
  public $db;
  public function __construct()
  {
    parent::__construct();
    $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], TRUE);
  }
  public function fetch($params)
  {
    $this->db->select($params['columns']);
    $this->db->from($params['table_name']);
    $i = 0;
    if (isset($params['where_clause']) && !empty($params['where_clause'])) {
      foreach ($params['where_clause'] as $key => $value) {
        if ($i === 0) {
          // open bracket
          $this->db->group_start();
          $this->db->like('LOWER(' . $key . ')', strtolower($value));
        } else {
          $this->db->like('LOWER(' . $key . ')', strtolower($value));
        }
        // last loop
        if (count($params['where_clause']) - 1 == $i) {

          $this->db->group_end();
        }
        $i++;
      }
    }

    $query = $this->db->get();
    return ($query) ? $query->result_array() : $this->db->error();
  }
}
