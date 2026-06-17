<?php
defined('BASEPATH') or exit('No direct script access allowed');
class DatatablesTransModel extends CI_Model
{
  public $table_name = '';
  public $column_order;
  public $column_search;
  public $fields;
  public $db;
  public function __construct()
  {
    parent::__construct();

    // $this->column_order = $this->getColumnOrder();

  }

  public function setDatabase($database_name = '')
  {
    if (!empty($database_name)) {
      $this->db = $this->load->database($database_name, TRUE);
    } else {
      $this->db = $this->load->database($this->session->userdata('user_info')['database_name'], TRUE);
    }
  }
  public function setTable($table_name)
  {
    $this->table_name = $table_name;
    $this->fields = $this->db->list_fields($this->table_name);
    $this->column_search = $this->getColumnSearch($this->fields);
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

    $i = 0;
    if (isset($postData['where_clause'])) {
      foreach ($postData['where_clause'] as $key => $value) {
        if ($i === 0) {
          // open bracket
          $this->db->group_start();
          $this->db->like('LOWER(' . $key . ')', strtolower($value));
        } else {
          $this->db->like('LOWER(' . $key . ')', strtolower($value));
        }
        // last loop
        if (count($postData['where_clause']) - 1 == $i) {
          // close bracket
          $this->db->group_end();
        }
        $i++;
      }
    }
    if (isset($postData['where_extra'])) {
      foreach ($postData['where_extra'] as $key => $value) {
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
          count($postData['where_extra']) - 1 == $i
        ) {
          // close bracket
          $this->db->group_end();
        }
        $i++;
      }
    }





if($this->table_name == 'customers' || $this->table_name == 'vw_customers' || $this->table_name == 'vw_fetch_expense' || $this->table_name == 'vw_fetch_expense_approval') {

  $this->db->order_by('created_date', 'DESC');
}


    if (isset($postData['order'])) {
      $this->db->order_by($this->getColumnOrder()[$postData['order']['0']['column']], $postData['order']['0']['dir']);
    } else if (isset($this->order)) {
      $order = $this->order;
      $this->db->order_by(key($order), $order[key($order)]);

    }
  }
}
