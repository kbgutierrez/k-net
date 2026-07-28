<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #ffffff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-kpi { font-size: 19px; line-height: 1.15; font-weight: 600; margin: 0; color: #1d2a3a; }
	.kna-kpi-caption { font-size: 11px; color: #6c757d; margin: 0; }
	.kna-form-label { margin-bottom: .3rem; font-weight: 600; color: #34495e; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-badge { padding: .2rem .4rem; border-radius: 3px; font-size: 11px; font-weight: 600; display: inline-block; }
	.kna-badge-gap { background: #fdeaea; color: #a71d2a; }
	.kna-badge-sd { background: #e6f4ff; color: #0056b3; }
	.kna-badge-ga { background: #f3e8ff; color: #6b21a8; }
	.kna-mobile-list .kna-item { border: 1px solid #dde3eb; border-radius: 6px; padding: .65rem; margin-bottom: .5rem; background: #fff; }
	.kna-mobile-list .kna-item:last-child { margin-bottom: 0; }
	.kna-mobile-list .kna-row { display: flex; align-items: center; justify-content: space-between; gap: .45rem; margin-bottom: .25rem; }
	.kna-mobile-list .kna-row:last-child { margin-bottom: 0; }

	@media (max-width: 991.98px) {
		.kna-page { padding: 10px; }
		.kna-title { font-size: 17px; }
		.kna-card .card-body { padding: .7rem; }
		.kna-stack-mobile { flex-direction: column; align-items: stretch !important; gap: .5rem; }
		.kna-mobile-cta { width: 100%; }
	}
	@media (max-width: 575.98px) {
		.kna-small { font-size: 11px !important; }
	}
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2 kna-stack-mobile">
		<div>
			<div class="kna-title">Approval Matrix Coverage Gap Report</div>
		</div>
		<button type="button" class="btn btn-success btn-sm kna-small kna-mobile-cta" id="btnDownloadExcel">
			<i class="fas fa-file-excel mr-1"></i>Download Excel
		</button>
	</div>

	<div class="row mb-2">
		<div class="col-md-4 col-6 pr-md-2 mb-2 mb-md-0">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Total Gaps</p>
					<p class="kna-kpi" id="sumTotal">0</p>
				</div>
			</div>
		</div>
		<div class="col-md-4 col-6 px-md-2 mb-2 mb-md-0">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Departments Affected</p>
					<p class="kna-kpi" id="sumDepartments">0</p>
				</div>
			</div>
		</div>
		<div class="col-md-4 col-12 pl-md-2">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Transaction Types Affected</p>
					<p class="kna-kpi" id="sumTypes">0</p>
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body py-2">
			<div class="d-flex flex-wrap align-items-end" style="gap:.5rem;">
				<div>
					<label class="kna-small kna-form-label mb-1">Search</label>
					<input type="text" class="form-control form-control-sm kna-small" id="filterKeyword" placeholder="Department name or code" style="width:220px;">
				</div>
				<div>
					<label class="kna-small kna-form-label mb-1">Transaction Type</label>
					<select class="form-control form-control-sm kna-small" id="filterTransactionType" style="width:180px;">
						<option value="">All Types</option>
						<option value="CASH_ADVANCE">Cash Advance</option>
						<option value="LIQUIDATION">Liquidation</option>
						<option value="REIMBURSEMENT">Reimbursement</option>
					</select>
				</div>
				<div>
					<label class="kna-small kna-form-label mb-1">Category</label>
					<select class="form-control form-control-sm kna-small" id="filterCategory" style="width:120px;">
						<option value="">All</option>
						<option value="SD">SD</option>
						<option value="GA">GA</option>
					</select>
				</div>
				<div>
					<button type="button" class="btn btn-outline-secondary btn-sm" id="btnReset" title="Clear filters" style="height:31px;width:31px;padding:0;">
						<i class="fas fa-sync-alt"></i>
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card d-none d-md-block">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Departments With No Active Approval Matrix</div>
				<div class="kna-small text-muted" id="resultCount">0 record(s)</div>
			</div>
			<div class="table-responsive">
				<table class="table table-sm kna-table" id="gapTable" style="width:100%">
					<thead>
						<tr>
							<th style="width:150px;">Department Code</th>
							<th style="width:220px;">Department Name</th>
							<th style="width:150px;">Short Name</th>
							<th style="width:80px;">Category</th>
							<th style="width:160px;">Uncovered Transaction Type</th>
						</tr>
					</thead>
					<tbody id="gapTbody"></tbody>
				</table>
			</div>
			<div class="d-flex justify-content-end mt-2">
				<nav aria-label="Coverage gap desktop pagination">
					<ul class="pagination pagination-sm mb-0" id="desktopPagination"></ul>
				</nav>
			</div>
		</div>
	</div>

	<div class="card kna-card d-md-none">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Coverage Gaps</div>
				<div class="kna-small text-muted" id="resultCountMobile">0 record(s)</div>
			</div>
			<div class="kna-mobile-list" id="gapMobileList"></div>
		</div>
	</div>
</div>
