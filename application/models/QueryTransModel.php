<?php
(defined('BASEPATH')) or exit('No direct script access allowed');
class QueryTransModel extends CI_Model
{
  public $db;
  public function __construct()
  {
    parent::__construct();
    // $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], TRUE);
  }



  public function setDatabase($database_name = '')
  {
    if (!empty($database_name)) {
      $this->db = $this->load->database($database_name, TRUE);
    } else {
      $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], TRUE);
    }
  }
  public function get_where_multiple($params)
  {
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
    $query = $this->db->get($params['table_name']);


    return ($query) ? $query->result_array() : $this->db->error();
  }
  public function get($table)
  {
    $query = $this->db->get($table, FALSE);
    return ($query) ? $query->result_array() : $this->db->error();
  }
  // Fetch for specific data
  public function get_where($table, $column, $type = 'all')
  {
    $query = $this->db->get_where($table, $column);
    if ($type == 'all') {
      return ($query) ? $query->result_array() : $this->db->error();
    }
    if ($type == 'single') {
      return ($query) ? $query->row_array() : $this->db->error();
    }
  }
  public function get_where_selected($table, $column, $selected_columns, $type = 'all')
  {
    if (!empty($selected_columns)) {
      $this->db->select($selected_columns);
    }
    $query = $this->db->get_where($table, $column);
    if ($type == 'all') {
      return ($query) ? $query->result_array() : $this->db->error();
    }
    if ($type == 'single') {
      return ($query) ? $query->row_array() : $this->db->error();
    }
  }
  // Fetch count
  public function get_count($table, $column)
  {
    $this->db->where($column);
    $this->db->from($table);
    return $this->db->count_all_results();
  }
  /**
   *
   *
   * INSERT DATA
   *
   *
   */
  // Insert
  public function insert($table, $params)
  {

    try {
      $query = $this->db->insert($table, $params);
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
  // Insert with return id
  public function insert_return_id($table, $params)
  {
    if ($this->db->insert($table, $params)) {
      return  $this->db->insert_id();
    } else {
      return $this->db->error;
    }
  }
  // Insert Batch
  public function insert_batch($table, $params)
  {
    $query = $this->db->insert_batch($table, $params);
    return ($query) ? true : $this->db->error();
  }
  /**
   *
   *
   * UPDATE DATA
   *
   *
   */
  public function update($table, $id, $params)
  {
    $query = $this->db->update($table, $params, $id);
    return ($query) ? true : $this->db->error();
  }
  /**
   *
   *
   * DELETE DATA
   *
   *
   */
  public function delete($table, $id)
  {
    $query = $this->db->delete($table, $id);
    return ($query) ? true : $this->db->error();
  }
  // JOIN
  public function join($table1, $table2, $link, $where_clause = array())
  {
    $this->db->select('*');
    $this->db->from($table1);
    $this->db->join($table2, $link);


    $i = 0;
    if (!empty($where_clause)) {
      foreach ($where_clause as $key => $value) {
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
          count($where_clause) - 1 == $i
        ) {
          // close bracket
          $this->db->group_end();
        }
        $i++;
      }
    }
    $query = $this->db->get();

    // print_r($query);
    return ($query) ? $query->result_array() : $this->db->error();
  }


  public function get_tables()
  {
    $tables = $this->db->list_tables();
  }
}
