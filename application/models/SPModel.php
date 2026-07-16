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
  /**
   * CI3's db_debug hard-exits the request via display_error() on any SQL
   * error instead of letting it be caught as a PHP exception - so a THROW
   * from a stored proc (e.g. a validation rule) would crash the whole
   * request rather than surface as a normal error response. Suppress
   * db_debug only around the query itself so failures come back as a
   * normal FALSE result / $this->db->error(), then restore it after.
   */
  private function runQuerySafely($sp, $data = null)
  {
    $previousDebug = $this->db->db_debug;
    $this->db->db_debug = FALSE;
    try {
      return ($data === null) ? $this->db->query($sp) : $this->db->query($sp, $data);
    } finally {
      $this->db->db_debug = $previousDebug;
    }
  }
  /**
   * The native driver prefixes every error with vendor/driver tags like
   * "[Microsoft][ODBC Driver 13 for SQL Server][SQL Server]" ahead of the
   * actual message (e.g. our own THROW text from a validation rule). That
   * prefix is meaningless to an end user, so strip it before the message
   * ever reaches a controller's respondError(). The untouched original is
   * still written to the CI log for developer diagnostics.
   */
  private function cleanErrorMessage($rawMessage)
  {
    log_message('error', 'SPModel DB error: ' . $rawMessage);
    $cleaned = preg_replace('/^(?:\[[^\]]*\])+\s*/', '', $rawMessage);
    return ($cleaned !== null && trim($cleaned) !== '') ? trim($cleaned) : 'Something went wrong while saving. Please try again.';
  }
  public function fetchData($sp, $type = 'result')
  {
    $query = $this->runQuerySafely($sp);
    return ($type == 'result') ? $query->result_array() : $query->row_array();
  }
  public function readData(
    $sp,
    $data,
    $type
  ) {
    $query = $this->runQuerySafely($sp, $data);
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
      $query = $this->runQuerySafely($sp, $data);
      $db_error = $this->db->error();
      if ($db_error['message']) {
        throw new Exception($this->cleanErrorMessage($db_error['message']));
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
    $query = $this->runQuerySafely($sp, $data);
    if ($query) {
      return $query->row_array();
    }
    $db_error = $this->db->error();
    $db_error['message'] = $this->cleanErrorMessage($db_error['message']);
    return $db_error;
  }
}
