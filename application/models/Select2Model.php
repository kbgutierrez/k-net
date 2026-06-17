<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Select2Model extends CI_Model
{
  public function __construct()
  {
    parent::__construct();
  }
  public function fetch($params)
  {
    /*
    SELECT  {col_id} as id,
            {col_name} as text
    FROM    {table_name}
    WHERE   {name} = {value}
    */
    if ($params['show_code'] == 'true') {
      $this->db->select($params['select_col']['col_id'] . " as id, CONCAT(UPPER(" . $params['select_col']['col_id'] . "), ' - ', UPPER(" . $params['select_col']['col_name'] . ")) as text");
    } else {
      $this->db->select($params['select_col']['col_id'] . ' as id, UPPER(' . $params['select_col']['col_name'] . ') as text');
    }
    if (is_distri() == 1) {
      if ($params['table_name'] === 'user_type') {
        $this->db->where('is_distri', 1);
      }
    }
    $i = 0;
    if (isset($params['where_clause'])) {
      foreach ($params['where_clause'] as $key => $value) {
        $new_val = (!is_numeric($value)) ? strtoupper($value) : $value;
        $new_key = (!is_numeric($key)) ? 'UPPER(' . $key . ')' : $key;
        if (
          $i === 0
        ) {
          // open bracket
          $this->db->group_start();
          $this->db->where($new_key, $new_val);
        } else {
          $this->db->where($new_key, $new_val);
        }
        // last loop
        if (
          count($params['where_clause']) - 1 == $i
        ) {
          // close bracket
          $this->db->group_end();
        }
        $i++;
      }
    }
    if (isset($params['search']['value'])) {
      $this->db->like('UPPER(' . $params['search']['name'] . ')', strtoupper($params['search']['value']));
    }
    $this->db->order_by('text', 'ASC');
    $query = $this->db->get($params['table_name']);
    return ($query) ? $query->result_array() : $this->db->error();
  }
}
