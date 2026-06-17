<style>
	.kna-page { padding: 12px 14px; }
	.kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
	.kna-card .card-body { padding: .85rem; }
	.kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
	.kna-small { font-size: 12px !important; line-height: 1.35; }
	.kna-table td, .kna-table th { font-size: 12px !important; padding: .5rem .45rem; vertical-align: middle; white-space: nowrap; }
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Reporting Configuration</div>
			<div class="kna-small text-muted">Mock config for default filters, export formats, and scheduling options.</div>
		</div>
		<button type="button" class="btn btn-primary btn-sm kna-small" id="btnSaveReportingConfig">Save Config</button>
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<div class="table-responsive">
				<table class="table table-sm kna-table" style="width:100%">
					<thead><tr><th>Key</th><th>Value</th><th>Description</th></tr></thead>
					<tbody id="reportConfigTbody"></tbody>
				</table>
			</div>
		</div>
	</div>
</div>
