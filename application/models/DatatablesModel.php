<?php
defined('BASEPATH') or exit('No direct script access allowed');
class DatatablesModel extends CI_Model
{
  public $table_name = '';
  public $column_order;
  public $column_search;
  public $fields;
  public function __construct()
  {
    parent::__construct();
    $this->fields = $this->db->list_fields($this->table_name);
    // $this->column_order = $this->getColumnOrder();
    $this->column_search = $this->getColumnSearch($this->fields);
  }
  public function setTable($table_name)
  {
    $this->table_name = $table_name;
  }
  public function getFields($table_name)
  {
    return $this->db->list_fields($table_name);
  }
  public function getColumnOrder()
  {
    $fields = $this->getFields($this->table_name);
    $list     = [];
    $list[0]   = null;
    foreach ($fields as $field) {
      $list[] = $field;
    }
    return $list;
  }
  public function getColumnSearch()
  {
    $list = [];
    foreach ($this->fields as $field) {
      $list[] = $field;
    }
    return $list;
  }
  public function getRows($postData)
  {
    $this->_get_datatables_query($postData);
    if ($postData['length'] != -1) {
      $this->db->limit($postData['length'], $postData['start']);
    }
    $query = $this->db->get();
    return $query->result_array();
  }
  public function countAll()
  {
    $this->db->from($this->table_name);
    return $this->db->count_all_results();
  }
  public function countFiltered($postData)
  {
    $this->_get_datatables_query($postData);
    $query = $this->db->get();
    return $query->num_rows();
  }
  private function _get_datatables_query($postData)
  {
    $this->db->from($this->table_name);
    if (is_distri() == 1) {
      $this->db->where('is_distri', 1);
    }
    $i = 0;
    if (isset($postData['where_clause'])) {
      foreach ($postData['where_clause'] as $key => $value) {
        if ($i === 0) {
          // open bracket
          $this->db->group_start();
          $this->db->like('LOWER(' . $key . ')', strtolower($value));
        } else {
          $this->db->like('LOWER(' . $key . ')', $value);
        }
        // last loop
        if (count($postData['where_clause']) - 1 == $i) {
          // close bracket
          $this->db->group_end();
        }
        $i++;
      }
    }
    if (isset($postData['order'])) {
      $this->db->order_by($this->getColumnOrder()[$postData['order']['0']['column']], $postData['order']['0']['dir']);
    } else if (isset($this->order)) {
      $order = $this->order;
      $this->db->order_by(key($order), $order[key($order)]);
    }
  }
}