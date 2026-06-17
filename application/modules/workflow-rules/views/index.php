<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-tag { padding: 2px 8px; border-radius: 12px; font-size: 11px; background: #eef2f7; color: #445668; }
	.kna-help { border-left: 3px solid #2f6eb4; padding: .55rem .7rem; background: #f8fbff; }
	.kna-form-label { margin-bottom: .3rem; font-weight: 600; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Workflow Rules</div>
			<div class="kna-small text-muted">Define what can happen next when a request is in a specific stage.</div>
		</div>
		<button type="button" class="btn btn-primary btn-sm kna-small" id="btnAddRule">New Rule</button>
	</div>

	<div class="kna-help kna-small mb-2">
		Use this page to set allowed actions. Example: if a request is "Submitted", allowed actions may be "Approve" or "Return for correction".
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<div class="table-responsive">
				<table class="table table-sm kna-table" style="width:100%">
					<thead>
						<tr>
							<th>Module</th>
							<th>Current Stage</th>
							<th>Allowed Action</th>
							<th>Next Stage</th>
							<th>When This Is Allowed</th>
							<th class="text-center">Action</th>
						</tr>
					</thead>
					<tbody id="rulesTbody"></tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="modalRule" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
		<div class="modal-content">
			<div class="modal-header py-2">
				<h5 class="modal-title kna-small" id="ruleModalTitle">New Rule</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			</div>
			<div class="modal-body">
				<div class="form-row">
					<div class="form-group col-md-4">
						<label class="kna-form-label kna-small">Module</label>
						<select class="form-control form-control-sm kna-small" id="ruleModule">
							<option value="CA">CA</option>
							<option value="LQ">LQ</option>
							<option value="RB">RB</option>
						</select>
					</div>
					<div class="form-group col-md-4">
						<label class="kna-form-label kna-small">Current Stage</label>
						<input type="text" class="form-control form-control-sm kna-small" id="ruleCurrent" placeholder="Submitted">
					</div>
					<div class="form-group col-md-4">
						<label class="kna-form-label kna-small">Allowed Action</label>
						<input type="text" class="form-control form-control-sm kna-small" id="ruleAction" placeholder="Approve">
					</div>
				</div>
				<div class="form-row">
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">Next Stage</label>
						<input type="text" class="form-control form-control-sm kna-small" id="ruleNext" placeholder="Approved">
					</div>
					<div class="form-group col-md-6">
						<label class="kna-form-label kna-small">When This Is Allowed</label>
						<input type="text" class="form-control form-control-sm kna-small" id="ruleCondition" placeholder="All required documents are complete">
					</div>
				</div>
			</div>
			<div class="modal-footer py-2">
				<button type="button" class="btn btn-outline-secondary btn-sm" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary btn-sm" id="btnSaveRule">Save Rule</button>
			</div>
		</div>
	</div>
</div>
