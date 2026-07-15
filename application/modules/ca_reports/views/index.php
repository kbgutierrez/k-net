<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
	.kna-filter-field { min-width: 140px; }
	.kna-report-nav a { display: block; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 12px; margin-bottom: 6px; color: #2b3f55; text-decoration: none; }
	.kna-report-nav a.is-active { background: #2f6eb4; border-color: #2f6eb4; color: #fff; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title"><?=html_escape($report_label);?></div>
			<div class="kna-small text-muted">Mock report page with date range filter, row selection, and Excel download.</div>
		</div>
	</div>

	<input type="hidden" id="reportKey" value="<?=html_escape($report_key);?>">

	<div class="row">
		<div class="col-md-3 mb-2">
			<div class="card kna-card h-100">
				<div class="card-body">
					<div class="kna-small font-weight-bold mb-2">Reports</div>
					<div class="kna-report-nav" id="reportNav"></div>
				</div>
			</div>
		</div>
		<div class="col-md-9 mb-2">
			<div class="card kna-card mb-2">
				<div class="card-body py-2">
					<div class="d-flex flex-wrap align-items-end" style="gap:.5rem;">
						<div class="kna-filter-field">
							<label class="kna-small mb-1">Date From</label>
							<input type="date" id="reportDateFrom" class="form-control form-control-sm kna-small">
						</div>
						<div class="kna-filter-field">
							<label class="kna-small mb-1">Date To</label>
							<input type="date" id="reportDateTo" class="form-control form-control-sm kna-small">
						</div>
						<div class="kna-filter-field">
							<button type="button" class="btn btn-outline-primary btn-sm" id="btnApplyReportFilter">Apply</button>
						</div>
						<div class="kna-filter-field">
							<button type="button" class="btn btn-outline-secondary btn-sm" id="btnDownloadSelected">Download Selected Excel</button>
						</div>
						<div class="kna-filter-field">
							<button type="button" class="btn btn-primary btn-sm" id="btnDownloadAll">Download All Excel</button>
						</div>
					</div>
				</div>
			</div>

			<div class="card kna-card">
				<div class="card-body">
					<div class="d-flex align-items-center justify-content-between mb-2">
						<div class="kna-small text-muted">Mock Data Rows</div>
						<div class="kna-small text-muted" id="reportCount">0 row(s)</div>
					</div>
					<div class="table-responsive">
						<table class="table table-sm kna-table" style="width:100%">
							<thead>
								<tr id="reportHead"></tr>
							</thead>
							<tbody id="reportBody"></tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
