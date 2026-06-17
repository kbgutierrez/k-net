<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

if (!function_exists('build_sp')) {
  function build_sp($sp_name, $count)
  {
    $qstn = ' ?';
    for ($i = 1; $i < $count; $i++) {
      $qstn .= ',?';
    }
    $sp_formatted = $sp_name . $qstn;
    return $sp_formatted;
  }
}
