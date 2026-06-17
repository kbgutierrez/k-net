<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');
class Expense_Types extends MY_Controller
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
            'title' => 'Expense Types',
            'main_view' => '../modules/expense-types/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_get()
    {
        try {
            $this->output->set_content_type('application/json');
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
                "CursorId" => $cursorId,
                "Take" => $take,
            );

            $result = $this->sp->readData(
                build_sp('sp_fetch_maintenance_expense_types', count($params)),
                $params,
                'result'
            );

            $hasMore = count($result) > $take;
            if ($hasMore) {
                array_pop($result);
            }
            $nextCursorId = null;
            if(!empty($result)) {
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

        }catch (Exception $e) {
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }
    }

    public function api_save()
    {
        try {
            $this->output->set_content_type('application/json');

            $data = $this->getRequestPayload();
            $categoryName = isset($data['CategoryName']) ? trim((string) $data['CategoryName']) : '';
            $description = isset($data['Description']) ? trim((string) $data['Description']) : '';
            $status = isset($data['Status']) ? trim((string) $data['Status']) : 'CAT_ACTIVE';

            if ($categoryName === '') {
                return $this->respondError('Category name is required');
            }

            if (!in_array($status, array('CAT_ACTIVE', 'CAT_INACTIVE'), true)) {
                $status = 'CAT_ACTIVE';
            }

            $params = array(
                'CategoryName' => $categoryName,
                'Description' => $description,
                'Status' => $status,
                'CreatedBy' => (int) $this->session->userdata('user_id'),
            );

            $result = $this->sp->createData(
                build_sp('sp_insert_maintenance_expense_type', count($params)),
                $params
            );

            if ($result === true) {
                return $this->respondSuccess('Expense type added successfully');
            }

            return $this->respondError(is_string($result) ? $result : 'Failed to add expense type');
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
        }
    }

    public function api_update()
    {
        try {
            $this->output->set_content_type('application/json');

            $data = $this->getRequestPayload();
            $id = isset($data['Id']) ? (int) $data['Id'] : 0;
            $categoryName = isset($data['CategoryName']) ? trim((string) $data['CategoryName']) : '';
            $description = isset($data['Description']) ? trim((string) $data['Description']) : '';
            $status = isset($data['Status']) ? trim((string) $data['Status']) : 'CAT_ACTIVE';

            if ($id <= 0) {
                return $this->respondError('Invalid expense type id');
            }

            if ($categoryName === '') {
                return $this->respondError('Category name is required');
            }

            if (!in_array($status, array('CAT_ACTIVE', 'CAT_INACTIVE'), true)) {
                $status = 'CAT_ACTIVE';
            }

            $params = array(
                'Id' => $id,
                'CategoryName' => $categoryName,
                'Description' => $description,
                'Status' => $status,
                'UpdatedBy' => (int) $this->session->userdata('user_id'),
            );

            $result = $this->sp->createData(
                build_sp('sp_update_maintenance_expense_type', count($params)),
                $params
            );

            if ($result === true) {
                return $this->respondSuccess('Expense type updated successfully');
            }

            return $this->respondError(is_string($result) ? $result : 'Failed to update expense type');
        } catch (Exception $e) {
            return $this->respondError('An error occurred: ' . $e->getMessage());
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

}