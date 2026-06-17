<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');
class Cash_Advance extends MY_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('SPModel', 'sp');
        $this->sp->setDatabase('dbknet');
    }
    public function index()
    {
        $data = array(
            'title' => 'Cash Advance',
            'main_view' => '../modules/cash-advance/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                '../cash-advance/index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_save()
    {

         try {
            $this->output->set_content_type('application/json');

            $data = $this->getRequestPayload();
            $requiredFields = array('Amount', 'Description', 'NeededDate');
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '') {
                    return $this->respondError("Missing required field: {$field}");
                }
            }
        
            $params = array(
                "UserId" => $this->session->userdata('user_id'),
                "Amount" => $data['Amount'],
                "Description" => $data['Description'],
                "NeededDate" => $data['NeededDate'],
            );
            $result = $this->sp->createReturnId(
                build_sp('sp_insert_ca', count($params)),
                $params,
                'result'
            );
            if ($result > 0) {
                return $this->respondSuccess("Cash advance request created successfully", ['id' => $result]);
            } else {
                return $this->respondError("Failed to create cash advance request");
            }
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    private function getRequestPayload()
    {
        $contentType = $this->input->server('CONTENT_TYPE');
        if (is_string($contentType) && stripos($contentType, 'application/json') !== false) {
            $data = json_decode($this->input->raw_input_stream, true);
            return is_array($data) ? $data : array();
        }

        $postData = $this->input->post();
        return is_array($postData) ? $postData : array();
    }

    private function respondSuccess($message, $data = array())
    {
        echo json_encode(array(
            'status' => 'success',
            'response' => $message,
            'data' => $data,
        ));
        return;
    }
       private function respondError($message)
    {
        echo json_encode(array(
            'status' => 'error',
            'response' => $message,
        ));
        return;
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');
            $userId = $this->session->userdata('user_id');
            $cursorIdRaw = $this->input->post('CursorId');
            $takeRaw = $this->input->post('Take');

            $take = (int) $takeRaw;
            if ($take <= 0) {
                $take = 20;
            }

            $cursorId = null;
            if ($cursorIdRaw !== null && $cursorIdRaw !== '') {
                $cursorId = (int) $cursorIdRaw;
            }

            $params = array(
                "UserId" => $userId,
                "CursorId" => $cursorId,
                "Take" => $take,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_ca', count($params)),
                $params,
                'result'
            );

            $hasMore = count($result) > $take;
            if ($hasMore) {
                array_pop($result);
            }

            $nextCursorId = null;
            if (!empty($result)) {
                $lastRow = end($result);
                $nextCursorId = isset($lastRow['id']) ? (int) $lastRow['id'] : null;
            }

            echo json_encode(array(
                'status' => 'success',
                'data' => $result,
                'pagination' => array(
                    'take' => $take,
                    'hasMore' => $hasMore,
                    'nextCursorId' => $nextCursorId,
                ),
            ));
        } catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }
}