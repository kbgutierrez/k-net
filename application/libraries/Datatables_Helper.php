<?php
defined('BASEPATH') or exit('No direct script access allowed');
class Datatables_Helper
{
  public $CI;
  public function __construct()
  {
    $this->CI = &get_instance();
    $this->CI->load->model('DatatablesModel', 'datatables');
  }
  public function load(
    $post_data,
    $link_array
  ) {
    // get post data
    if (isset($post_data['params'])) {
      $params = $post_data['params'];
      unset($post_data['params']);
      $where_clause = array();
      foreach ($params as $val) {
        if ($val['value']) {
          $where_clause[$val['name']] = (!is_numeric($val['value'])) ? strtolower($val['value']) : $val['value'];
        }
      }
      $post_data['where_clause'] = $where_clause;
    }
    if (isset($post_data['table_name'])) {
      $table_name = $post_data['table_name'];
      $this->CI->datatables->setTable($table_name);
      unset($post_data['table_name']);
    }
    // call datatables model
    $arrayList = array();
    $result = $this->CI->datatables->getRows($post_data);
    $i = $post_data['start'];
    foreach ($result as $row) {

      $row = array_map('strtoupper', $row);
      if (isset($row['status'])) {
        $row['status'] = ($row['status'] == 1) ? '<span class="badge badge-success">ACTIVE</span>' : '<span class="badge badge-warning">INACTIVE</span>';
      }
      if (isset($link_array['edit'])) {
        $row_edit = str_replace('{id}', $row['id'], $link_array['edit']);
        array_unshift($row, $row_edit);
      }
      if (isset($link_array['remove'])) {
        $row['remove'] = $link_array['remove'];
      }

      array_unshift($row, ++$i);
      unset($row['id']);
      $arrayList[] = array_values($row);
    }
    $output = array(
      "draw"         => $post_data['draw'],
      "recordsTotal"     => $this->CI->datatables->countAll(),
      "recordsFiltered"  => $this->CI->datatables->countFiltered($post_data),
      "data"         => $arrayList,
    );
    return $output;
  }
}
