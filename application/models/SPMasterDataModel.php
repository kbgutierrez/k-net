<?php
class SPMasterdataModel extends CI_Model
{
  public $db;
  public function __construct()
  {
    parent::__construct();
    $this->db = $this->load->database('default', TRUE);
  }
  public function fetchData($sp)
  {
    $query = $this->db->query($sp);
    return $query->result_array();
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
    $query = $this->db->query($sp, $data);
    return $query ? TRUE : $this->db->error();
  }
  public function createReturnId($sp, $data)
  {
    $query = $this->db->query($sp, $data);
    return $query ? $query->row_array() : $this->db->error();
  }
}
