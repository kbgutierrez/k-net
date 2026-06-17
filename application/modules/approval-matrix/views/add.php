<style>
	.select2-container {
    transform: none !important;
}
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-form-label { margin-bottom: .3rem; font-weight: 600; }
	.kna-approver-row { border: 1px dashed #d9e0e7; border-radius: 6px; padding: .6rem; margin-bottom: .55rem; background: #fbfdff; }

	/* Select2 compact override */
	.kna-page .select2-container .select2-selection--single,
	.kna-page .select2-container--default .select2-selection--single { height: 28px !important; }
	.kna-page .select2-container--default .select2-selection--single .select2-selection__rendered { line-height: 26px !important; padding-left: 8px !important; font-size: 12px !important; }
	.kna-page .select2-container--default .select2-selection--single .select2-selection__arrow { height: 26px !important; }
	.kna-page .select2-container--default .select2-selection--single .select2-selection__placeholder { font-size: 12px !important; }
	.kna-page .select2-results__option { font-size: 12px !important; padding: 4px 8px !important; }
	.kna-page .select2-search--dropdown .select2-search__field { font-size: 12px !important; padding: 3px 6px !important; }

	@media (max-width: 991.98px) {
		.kna-page { padding: 10px; }
		.kna-title { font-size: 17px; }
		.kna-card .card-body { padding: .7rem; }
		.kna-stack-mobile { flex-direction: column; align-items: stretch !important; gap: .5rem; }
	}
</style>

<div class="page-inner kna-page">

	<div class="d-flex align-items-center justify-content-between mb-2 kna-stack-mobile">
		<div>
			<div class="kna-title">New Approval Matrix</div>
		</div>
		<div class="d-flex" style="gap:.45rem;">
			<a class="btn btn-outline-secondary btn-sm kna-small" href="<?=base_url('maintenance/approval-matrix');?>">Back to List</a>
			<button type="button" class="btn btn-primary btn-sm kna-small" id="btnSaveMatrix">Save Matrix</button>
		</div>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body">
			<div class="form-row">
				<div class="form-group col-md-6">
					<label class="kna-form-label kna-small">Matrix Name</label>
					<input type="text" class="form-control form-control-sm kna-small" id="matrixName" placeholder="Approval for OB">
				</div>
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Transaction Type</label>
					<select class="form-control form-control-sm kna-small" id="transactionType">
						<option value="CASH_ADVANCE">Cash Advance</option>
						<option value="LIQUIDATION">Liquidation</option>
						<option value="REIMBURSEMENT">Reimbursement</option>
					</select>
				</div>
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Department</label>
					<select class="form-control form-control-sm kna-small" id="departmentId"><option value="">Loading...</option></select>
				</div>
			</div>
			<div class="form-row">
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Min Amount</label>
					<input type="number" min="0" step="0.01" class="form-control form-control-sm kna-small" id="minAmount" placeholder="0.00">
				</div>
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Max Amount</label>
					<input type="number" min="0" step="0.01" class="form-control form-control-sm kna-small" id="maxAmount" placeholder="99999999.99">
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div>
					<div class="kna-small font-weight-bold">Approver Route</div>
					<div class="kna-small text-muted">Choose approvers, set approval order and approval type per row.</div>
				</div>
				<button type="button" class="btn btn-outline-primary btn-sm kna-small" id="btnAddApprover">Add Approver</button>
			</div>
			<div id="approverRows"></div>
		</div>
	</div>
</div>
