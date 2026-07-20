<?php

(defined('BASEPATH')) or exit('No direct script access allowed');

class Notifications extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }

    /**
     * General activity feed for the header bell — reuses
     * tbl_notification_log (already populated by every notify_event()
     * call across the system) instead of a narrow "pending my
     * approval only" list, so it naturally covers submissions routed
     * to this user as an approver AND status updates on their own
     * filed requests.
     */
    public function api_get_recent()
    {
        try {
            $this->output->set_content_type('application/json');

            $userId = (int) $this->session->userdata('user_id');
            $userInfo = get_user_info($userId);
            $email = is_array($userInfo) ? trim((string) ($userInfo['email'] ?? '')) : '';

            if ($email === '') {
                echo json_encode(array('status' => 'success', 'data' => array()));
                return;
            }

            $params = array(
                'Email' => $email,
                'UserId' => $userId,
                'Take' => 10,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_notification_log_for_user', count($params)),
                $params,
                'result'
            );

            echo json_encode(array(
                'status' => 'success',
                'data' => is_array($result) ? $result : array(),
            ));
        } catch (Throwable $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => 'An error occurred: ' . $e->getMessage(),
            ));
        }
    }
}
