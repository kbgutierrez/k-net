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

	/* Payment Controls: dropdown-with-checkboxes */
	.kna-payment-dropdown { position: relative; }
	.kna-payment-dropdown .js-payment-dropdown-toggle { height: 28px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; }
	.kna-payment-dropdown-menu { min-width: 180px; font-size: 12px; background: #fff; }
	.kna-payment-dropdown-menu .custom-control-label { cursor: pointer; }
	/* Atlantis theme's .custom-control.custom-checkbox forces display:inline-block
	   and padding-left:2em (assets/css/atlantis.css), which stacks these two
	   checkboxes side by side and misaligns the indicator box against
	   Bootstrap's hard-coded left:-1.5rem on the label ::before/::after.
	   Scoped override restores the normal stacked/aligned checkbox layout
	   only inside this dropdown. */
	.kna-payment-dropdown-menu .custom-control.custom-checkbox {
		display: block !important;
		padding-left: 1.5rem;
		margin-right: 0;
		line-height: 1.4;
	}
	.kna-payment-dropdown-menu .custom-control-label::before,
	.kna-payment-dropdown-menu .custom-control-label::after {
		left: -1.5rem;
	}

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
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Sales Office <span class="kna-small text-muted">(optional)</span></label>
					<select class="form-control form-control-sm kna-small" id="salesOfficeId"><option value="">Loading...</option></select>
				</div>
				<div class="form-group col-md-3">
					<label class="kna-form-label kna-small">Sales District <span class="kna-small text-muted">(optional)</span></label>
					<select class="form-control form-control-sm kna-small" id="salesDistrictId" disabled><option value="">All Districts (office-wide)</option></select>
				</div>
			</div>
			<div class="form-row">
				<div class="form-group col-md-12 mb-0">
					<div class="kna-small text-muted">Tip: Leave Sales Office and Sales District blank to apply this rule to the whole department. A rule set to a specific office or district always takes priority over one that isn't.</div>
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
