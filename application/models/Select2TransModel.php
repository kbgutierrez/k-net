<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Select2TransModel extends CI_Model
{
  public $db;

  public function __construct()
  {
    parent::__construct();
    $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], TRUE);
  }
  public function fetch($params)
  {
    /*
    SELECT  {col_id} as id,
            {col_name} as text
    FROM    {table_name}
    WHERE   {name} = {value}
    */
    // $this->db->select($params['select_col']['col_id'] . ' as id, UPPER(' . $params['select_col']['col_name'] . ') as text');
    if ($params['show_code'] == 'true') {
      $this->db->select($params['select_col']['col_id'] . " as id, CONCAT(UPPER(" . $params['select_col']['col_id'] . "), ' - ', UPPER(" . $params['select_col']['col_name'] . ")) as text");
    } else {
      $this->db->select($params['select_col']['col_id'] . ' as id, UPPER(' . $params['select_col']['col_name'] . ') as text');
    }
    if (isset($params['search']['value'])) {
      $this->db->like('UPPER(' . $params['search']['name'] . ')', strtoupper($params['search']['value']));
    }
    $query = $this->db->get($params['table_name']);
    return ($query) ? $query->result_array() : $this->db->error();
  }
}