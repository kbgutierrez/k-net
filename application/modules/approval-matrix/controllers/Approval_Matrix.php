<?php

require 'vendor/autoload.php';
(defined('BASEPATH')) or exit('No direct script access allowed');

class Approval_Matrix extends MY_Controller
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
            'title' => 'Approval Matrix',
            'main_view' => '../modules/approval-matrix/views/index',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'scripts' => array(
                'index.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function add()
    {
        $data = array(
            'title' => 'New Approval Matrix',
            'main_view' => '../modules/approval-matrix/views/add',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'matrix_id' => 0,
            'is_edit_mode' => false,
            'scripts' => array(
                'add.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function edit($matrix_id = 0)
    {
        $id = (int) $matrix_id;
        if ($id <= 0) {
            redirect('maintenance/approval-matrix');
            return;
        }

        $data = array(
            'title' => 'Edit Approval Matrix',
            'main_view' => '../modules/approval-matrix/views/details',
            'module_group' => $this->module_group,
            'module' => $this->module,
            'matrix_id' => $id,
            'scripts' => array(
                'details.js',
            ),
        );

        $this->load->view('main', $data);
    }

    public function api_get_approvers(){
         try{
            $this->output->set_content_type('application/json');
            $result = $this->sp->fetchData('sp_fetch_approvers');
    
            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }


    }

    public function api_get_departments(){
        try{
            $this->output->set_content_type('application/json');
            $result = $this->sp->fetchData('sp_fetch_department');
    
            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_save()
    {
        try{
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();
            $headerParams = array(
                'matrix_name'=> $data['matrix_name'],
                'transaction_type' => $data['transaction_type'],
                'department_id' => $data['department_id'],
                'min_amount' => $data['min_amount'],
                'max_amount' => $data['max_amount'],
                'created_by' => $this->session->userdata('user_id')                
            );
            $headerId = $this->sp->createReturnId(build_sp('sp_insert_approval_matrix_header', count($headerParams)), $headerParams, 'result');
            if($headerId){
                $details = isset($data['details']) && is_array($data['details']) ? $data['details'] : array();
                foreach($details as $detail){
                    $detailParams = array(
                        'matrix_header_id' => $headerId['id'],
                        'approver_id' => $detail['approver_id'],
                        'approval_order' => $detail['approval_order'],
                        'approval_type' => $detail['approval_type']
                    );
                    $this->sp->createData(build_sp('sp_insert_approval_matrix_details', count($detailParams)), $detailParams);
                }
                return $this->respondSuccess("Approval matrix saved successfully");
            }

        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }
      public function api_update()
    {
        try {
            $this->output->set_content_type('application/json');
            $data = $this->getRequestPayload();

            $id = isset($data['id']) ? (int) $data['id'] : 0;
            if ($id <= 0) {
                return $this->respondError("Invalid matrix ID");
            }

            $headerParams = array(
                'id' => $id,
                'matrix_name' => $data['matrix_name'],
                'transaction_type' => $data['transaction_type'],
                'department_id' => $data['department_id'],
                'min_amount' => $data['min_amount'],
                'max_amount' => $data['max_amount'],
                'is_active' => isset($data['is_active']) ? (int) $data['is_active'] : 1,
                'updated_by' => $this->session->userdata('user_id')
            );

            // Update header
            $this->sp->createData(
                build_sp('sp_update_approval_matrix_header', count($headerParams)),
                $headerParams
            );

            // Delete existing details
            $this->sp->createData(
                build_sp('sp_delete_approval_matrix_details', 1),
                array('matrix_header_id' => $id)
            );

            // Insert new details
            $details = isset($data['details']) && is_array($data['details']) ? $data['details'] : array();
            foreach ($details as $detail) {
                $detailParams = array(
                    'matrix_header_id' => $id,
                    'approver_id' => $detail['approver_id'],
                    'approval_order' => $detail['approval_order'],
                    'approval_type' => $detail['approval_type']
                );
                $this->sp->createData(
                    build_sp('sp_insert_approval_matrix_details', count($detailParams)),
                    $detailParams
                );
            }

            return $this->respondSuccess("Approval matrix updated successfully");
        } catch (Exception $e) {
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_get_header()
    {
        try{
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
                    build_sp('sp_fetch_approval_matrix_header', count($params)),
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
        }catch(Exception $e){
            echo json_encode(array(
                'status' => 'error',
                'response' => "An error occurred: " . $e->getMessage(),
            ));
        }    
    }

    public function api_get_details()
    {
        try{
            $this->output->set_content_type('application/json');
            $matrixIdRaw = $this->input->post('MatrixId');
            $matrixId = null;
            if ($matrixIdRaw !== null && $matrixIdRaw !== '') {
                $matrixId = (int) $matrixIdRaw;
            }
            if ($matrixId === null) {
                return $this->respondError("MatrixId is required");
            }
            $params = array(
                "MatrixId" => $matrixId,
            );
            $result = $this->sp->readData(
                build_sp('sp_fetch_approval_matrix_details', count($params)),
                $params,
                'result'
            );

            return $this->respondSuccess("success", $result);
        }catch(Exception $e){
            return $this->respondError("An error occurred: " . $e->getMessage());
        }
    }

    public function api_get_header_by_id($matrixId)
    {
        try{
            $this->output->set_content_type('application/json');
            $id = (int) $matrixId;
            if ($id <= 0) {
                return $this->respondError("Invalid MatrixId");
            }
            $params = array(
                "MatrixId" => $id,
            );
            $result = $this->sp->readData(
                build_sp('sp_fetch_approval_matrix_header_by_id', count($params)),
                $params,
                'result'
            );

            if (empty($result)) {
                return $this->respondError("Approval matrix not found");
            }

            return $this->respondSuccess("success", $result[0]);
        }catch(Exception $e){
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

}
