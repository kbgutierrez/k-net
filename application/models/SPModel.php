<?php
class SPModel extends CI_Model
{
  public $db;
  public function __construct()
  {
    parent::__construct();
    // if (is_distri() == 1) {
    //   $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], true);
    // }
  }
  public function setDatabase($database_name)
  {
    if (!empty($database_name)) {
      $this->db = $this->load->database($database_name, TRUE);
    } 
  }
  public function fetchData($sp, $type = 'result')
  {
    $query = $this->db->query($sp);
    return ($type == 'result') ? $query->result_array() : $query->row_array();
  }
  public function readData(
    $sp,
    $data,
    $type
  ) {
    $query = $this->db->query($sp, $data);
    if ($type == 'result') {
      return $query->result_array();
    }
    if ($type == 'row') {
      return $query->row_array();
    }
  }
  public function createData($sp, $data)
  {
    try {
      $query = $this->db->query($sp, $data);
      $db_error = $this->db->error();
      if ($db_error['message']) {
        throw new Exception('Database error! Error Code [' . $db_error['code'] . '] Error: ' . $db_error['message']);
        return FALSE;
      } else {
        return TRUE;
      }
    } catch (Exception $e) {
      return $e->getMessage();
    }
  }
  public function createReturnId($sp, $data)
  {
    $query = $this->db->query($sp, $data);
    return $query ? $query->row_array() : $this->db->error();
  }
}
