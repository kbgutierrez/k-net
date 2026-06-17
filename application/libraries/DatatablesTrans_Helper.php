<?php
defined('BASEPATH') or exit('No direct script access allowed');
class DatatablesTrans_Helper
{
  public $CI;
  public function __construct()
  {
    $this->CI = &get_instance();
    $this->CI->load->model('DatatablesTransModel', 'datatablestrans');
  }
  public function load(
    $post_data,
    $link_array = array(),
    $database_name = ''
  ) {
    $link_database = NULL;
    if (!empty($database_name)) {
      $this->CI->datatablestrans->setDatabase($database_name);
      $link_database = $database_name;
    } else {
      $this->CI->datatablestrans->setDatabase($this->CI->session->userdata('user_info')['database_name']);
      $link_database = $this->CI->session->userdata('user_info')['database_name'];
    }
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
      $this->CI->datatablestrans->setTable($table_name);
      unset($post_data['table_name']);
    }
    $arrayList = array();
    $result = $this->CI->datatablestrans->getRows($post_data);
    $i = $post_data['start'];
    foreach ($result as $row) {
      $row = array_map('strtoupper', $row);
      if (isset($row['status'])) {
        // $row['status'] = ($row['status'] == 1) ? '<span class="badge badge-success">ACTIVE</span>' : '<span class="badge badge-warning">INACTIVE</span>';
        switch ($row['status']) {
          case 1:
            $row['status'] = '<span class="badge badge-success">ACTIVE</span>';
            break;
          case 2:
            $row['status'] = '<span class="badge badge-warning">INACTIVE</span>';
            break;
          case 'NEW':
            $row['status'] = '<span class="badge badge-primary">NEW</span>';
            break;
          case 'FOR REVIEW':
            $row['status'] = '<span class="badge badge-warning">FOR REVIEW</span>';
            break;
          case 'APPROVED':
            $row['status'] = '<span class="badge badge-warning">APPROVED</span>';
            break;
          default:
            $row['status'] = '<span class="badge badge-default"></span>';
        }
      }
      if (isset($link_array['edit'])) {
        if ($post_data['transaction_type'] == 'masterdata') {
          $row_edit = str_replace('{id}', $row[$post_data['row_id']], $link_array['edit']);
          if (in_array($table_name, array('vw_fetch_expense', 'vw_fetch_expense_approval'))) {
            $row_edit = '<a class="" href="' . base_url('expense/edit/' . $row['id'] . '/' . $link_database) . '"><i class="fas fa-eye"></i></a>';
          }
        }
        if ($post_data['transaction_type'] == 'transaction') {
          $row_edit = '<a class="row-action" href=""><i class="fas fa-eye"></i></a>';
        }
        $row['edit'] = $row_edit;
      }
      if (isset($link_array['remove'])) {
        $row['remove'] = $link_array['remove'];
      }

      if (isset($row['created_by'])) {
        $row['created_by'] = get_user_fullname($row['created_by']);
      }
      if (isset($row['updated_by'])) {
        $row['updated_by'] = get_user_fullname($row['updated_by']);
      }
      array_unshift($row, ++$i);
      $arrayList[] = $row;
    }
    $output = array(
      "draw"         => $post_data['draw'],
      "recordsTotal"     => $this->CI->datatablestrans->countAll(),
      "recordsFiltered"  => $this->CI->datatablestrans->countFiltered($post_data),
      "data"         => $arrayList
    );
    return $output;
  }
}
