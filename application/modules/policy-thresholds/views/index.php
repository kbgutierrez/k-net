<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-toggle-on { color: #17663a; font-weight: 700; }
	.kna-toggle-off { color: #8a2121; font-weight: 700; }
	.kna-help { border-left: 3px solid #2f6eb4; padding: .55rem .7rem; background: #f8fbff; }
	.kna-form-label { margin-bottom: .3rem; font-weight: 600; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Policy Rules</div>
			<div class="kna-small text-muted">Set business rules that control when users can submit, approve, and release requests.</div>
		</div>
		<div class="d-flex" style="gap:.5rem;">
			<button type="button" class="btn btn-outline-primary btn-sm kna-small" id="btnSavePolicies">Save Changes</button>
			<button type="button" class="btn btn-primary btn-sm kna-small" id="btnNewPolicy">New Policy</button>
		</div>
	</div>

	<div class="kna-help kna-small mb-2">
		<strong>How this works:</strong> Policies are checked when a user submits or approves a request.
		If a rule is active and the condition is met, the system applies the chosen action (allow, warn, or block).
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body">
			<div class="table-responsive">
				<table class="table table-sm kna-table" style="width:100%">
					<thead>
						<tr><th>Policy Name</th><th>Applies To</th><th>Condition</th><th>Action</th><th>Status</th></tr>
					</thead>
					<tbody id="policyTbody"></tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="modalPolicy" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
		<div class="modal-content">
			<div class="modal-header py-2">
				<h5 class="modal-title kna-small">New Policy (Mock)</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			</div>
			<div class="modal-body">
				<div class="form-row">
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Policy Name</label>
						<input type="text" id="policyName" class="form-control form-control-sm kna-small" placeholder="Block new CA when liquidation is rejected">
					</div>
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Applies To</label>
						<select id="policyAppliesTo" class="form-control form-control-sm kna-small">
							<option value="Cash Advance">Cash Advance</option>
							<option value="Liquidation">Liquidation</option>
							<option value="Reimbursement">Reimbursement</option>
							<option value="All Modules">All Modules</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Condition</label>
						<input type="text" id="policyCondition" class="form-control form-control-sm kna-small" placeholder="Latest liquidation is Rejected">
					</div>
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Action</label>
						<select id="policyAction" class="form-control form-control-sm kna-small">
							<option value="Block Submission">Block Submission</option>
							<option value="Show Warning">Show Warning</option>
							<option value="Allow with Notice">Allow with Notice</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Status</label>
						<select id="policyStatus" class="form-control form-control-sm kna-small">
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
			</div>
			<div class="modal-footer py-2">
				<button type="button" class="btn btn-outline-secondary btn-sm" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary btn-sm" id="btnCreatePolicy">Create Policy</button>
			</div>
		</div>
	</div>
</div>
