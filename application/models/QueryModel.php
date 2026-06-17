<?php
(defined('BASEPATH')) or exit('No direct script access allowed');
class QueryModel extends CI_Model
{
  // private $db;
  public function __construct()
  {
    // $this->db = $this->load->database();
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
    return ($this->db->insert($table, $params)) ? true : $this->db->error();
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
  public function join($table1, $table2, $link)
  {
    $this->db->select('*');
    $this->db->from($table1);
    $this->db->join($table2, $link);
    $query = $this->db->get();
    return ($query) ? $query->result_array() : $this->db->error();
  }


  public function get_tables()
  {
    $tables = $this->db->list_tables();
  }
}
