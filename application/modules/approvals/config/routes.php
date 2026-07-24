<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['transactions/approvals'] = 'Approvals';
$route['transactions/approvals/review/(:any)'] = 'Approvals/review/$1';
$route['transactions/approvals/api/get/header'] = 'Approvals/api_get_header';
$route['transactions/approvals/api/get/past-header'] = 'Approvals/api_get_past_header';
$route['transactions/approvals/api/get/details'] = 'Approvals/api_get_details';
$route['transactions/approvals/api/submit_decisions'] = 'Approvals/api_submit_decisions';
$route['transactions/approvals/api/per/item/decision'] = 'Approvals/api_per_item_decision';
$route['transactions/approvals/api/get/timeline'] = 'Approvals/api_get_approval_timeline';
$route['transactions/approvals/api/update/ca-header'] = 'Approvals/api_update_ca_header';
$route['transactions/approvals/api/update/rmb-header'] = 'Approvals/api_update_rmb_header';
$route['transactions/approvals/api/get/payable-to-options'] = 'Approvals/api_get_payable_to_options';
$route['transactions/approvals/consolidation'] = 'Approvals/consolidation';
$route['transactions/approvals/api/get/consolidation-pivot'] = 'Approvals/api_get_consolidation_pivot';
$route['transactions/approvals/api/bulk-decision'] = 'Approvals/api_bulk_decision';
$route['transactions/approvals/api/get/payment-queue'] = 'Approvals/api_get_payment_queue';
$route['transactions/approvals/api/payment/advise'] = 'Approvals/api_advise_payment';
$route['transactions/approvals/api/payment/release'] = 'Approvals/api_release_payment';
$route['transactions/approvals/api/payment/bulk-action'] = 'Approvals/api_bulk_payment_action';
$route['transactions/approvals/petty-cash-slips-batch'] = 'Approvals/download_petty_cash_slips_batch';
$route['transactions/approvals/api/petty-cash-slips/eligibility'] = 'Approvals/api_petty_cash_slips_eligibility';
$route['transactions/approvals/bizlink-export-batch'] = 'Approvals/download_bizlink_export_batch';
$route['transactions/approvals/api/bizlink-export/eligibility'] = 'Approvals/api_bizlink_export_eligibility';
$route['transactions/approvals/test-petty-cash-coords'] = 'Approvals/test_petty_cash_coords';