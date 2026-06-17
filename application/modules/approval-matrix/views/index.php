<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-table-shell { display: flex; width: 100%; border: 1px solid #e5ecf3; border-radius: 6px; overflow: hidden; }
	.kna-table-wrap-main { flex: 1 1 auto; overflow-x: auto; overflow-y: hidden; }
	.kna-table-main { min-width: 1120px; margin-bottom: 0; }
	.kna-table-action { width: 90px; margin-bottom: 0; border-left: 1px solid #e5ecf3; }
	.kna-table-action th,
	.kna-table-action td { text-align: center; background: #fff; }
	.kna-table-main th,
	.kna-table-action th { background: #f8fbff; }
	.kna-tab { border: 1px solid #d9e0e7; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; background: #fff; color: #32475b; cursor: pointer; }
	.kna-tab.is-active { background: #2f6eb4; border-color: #2f6eb4; color: #fff; }
	.kna-badge { padding: .2rem .4rem; border-radius: 3px; font-size: 11px; font-weight: 600; display: inline-block; }
	.kna-badge-active { background: #e8f7ee; color: #17663a; }
	.kna-badge-inactive { background: #eef2f7; color: #495869; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Approval Matrix</div>
	
		</div>
		<a class="btn btn-primary btn-sm kna-small" href="<?=base_url('maintenance/approval-matrix/add');?>">New Matrix</a>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body py-2 d-flex align-items-center" style="gap:.5rem;">
			<button class="kna-tab is-active" data-transaction-type="ALL">All</button>
			<button class="kna-tab" data-transaction-type="CASH_ADVANCE">Cash Advance</button>
			<button class="kna-tab" data-transaction-type="LIQUIDATION">Liquidation</button>
			<button class="kna-tab" data-transaction-type="REIMBURSEMENT">Reimbursement</button>
		</div>
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Approval Matrix Records</div>
				<div class="kna-small text-muted" id="resultCount">—</div>
			</div>
			<div class="kna-table-shell">
				<div class="kna-table-wrap-main">
					<table class="table table-sm kna-table kna-table-main" style="width:100%">
						<thead>
							<tr>
								<th>Matrix Name</th>
								<th>Transaction Type</th>
								<th>Department</th>
								<th>Amount Range</th>
								<th>Status</th>
								<th>Created By</th>
								<th>Created Date</th>
								<th>Updated By</th>
								<th>Updated Date</th>
							</tr>
						</thead>
						<tbody id="matrixTbodyMain"></tbody>
					</table>
				</div>
				<div>
					<table class="table table-sm kna-table kna-table-action">
						<thead>
							<tr>
								<th>Action</th>
							</tr>
						</thead>
						<tbody id="matrixTbodyAction"></tbody>
					</table>
				</div>
			</div>
			<div class="d-flex justify-content-end mt-2">
				<nav aria-label="Approval matrix desktop pagination">
					<ul class="pagination pagination-sm mb-0" id="desktopPagination"></ul>
				</nav>
			</div>
		</div>
	</div>
</div>
