<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}
if (!function_exists('get_trusted_url')) {
    function get_trusted_url($user, $server, $view_url)
    {
        //   $params = '&:toolbar=n&:tabs=n';
        $params = '';
        $ticket = get_trusted_ticket($server, $user, $_SERVER['REMOTE_ADDR']);
        if ($ticket > 0) {
            return "https://$server/trusted/$ticket/$view_url?$params";
        } else {
            return 0;
        }
    }
}
if (!function_exists('get_trusted_ticket')) {
    function get_trusted_ticket($wgserver, $user, $remote_addr)
    {
        $params = array(
            'username' => $user,
            'client_ip' => $remote_addr,
        );
        return do_post_request("https://$wgserver/trusted", $params);
    }
}
if (!function_exists('do_post_request')) {
    function do_post_request($url, $data, $optional_headers = null)
    {
        $params = array('http' => array(
            'method' => 'POST',
            'content' => http_build_query($data),
        ));
        if ($optional_headers !== null) {
            $params['http']['header'] = $optional_headers;
        }
        $ctx = stream_context_create($params);
        $fp = @fopen($url, 'rb', false, $ctx);
        if (!$fp) {
            echo 'Cannot OPEN';
        }
        $response = @stream_get_contents($fp);
        if ($response === false) {
            echo 'CANNOT GET RESPONSE';
        }
        return $response;
    }
}
