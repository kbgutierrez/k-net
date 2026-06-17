<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-tab { border: 1px solid #d9e0e7; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; background: #fff; color: #32475b; cursor: pointer; }
	.kna-tab.is-active { background: #2f6eb4; border-color: #2f6eb4; color: #fff; }
	.kna-form-label { margin-bottom: .3rem; font-weight: 600; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Revolving Fund Management</div>
			<div class="kna-small text-muted">Maintain setup by person, department, or company plus assignment and adjustments.</div>
		</div>
		<button type="button" class="btn btn-primary btn-sm kna-small" id="btnRfAction">Add</button>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body py-2 d-flex align-items-center" style="gap:.5rem;">
			<button class="kna-tab is-active" data-tab="setup">Setup</button>
			<button class="kna-tab" data-tab="assignment">Assignment</button>
			<button class="kna-tab" data-tab="adjustment">Top-up/Adjustment</button>
		</div>
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<div class="table-responsive">
				<table class="table table-sm kna-table" style="width:100%">
					<thead><tr id="rfHead"></tr></thead>
					<tbody id="rfTbody"></tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="modalRfAction" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
		<div class="modal-content">
			<div class="modal-header py-2">
				<h5 class="modal-title kna-small" id="rfModalTitle">Add</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
			</div>
			<div class="modal-body" id="rfModalBody"></div>
			<div class="modal-footer py-2">
				<button type="button" class="btn btn-outline-secondary btn-sm" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary btn-sm" id="btnSaveRf">Save</button>
			</div>
		</div>
	</div>
</div>
