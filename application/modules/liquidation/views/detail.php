<style>
	* {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	body {
		background: linear-gradient(135deg, #f0f4f8 0%, #f8f9fc 100%);
	}

	.kna-page {
		padding: 12px 14px;
		background: transparent;
		min-height: 100vh;
	}

	.kna-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 8px 0;
		line-height: 1.2;
	}

	.kna-small {
		font-size: 12px !important;
		line-height: 1.35;
	}

	.kna-card {
		border: 1px solid #d9e0e7 !important;
		border-radius: 6px;
		background: #ffffff;
		box-shadow: 0 1px 2px rgba(20, 30, 50, .05);
	}

	.kna-card .card-body {
		padding: .85rem;
	}

	.kna-form-label {
		margin-bottom: .3rem;
		font-weight: 600;
		font-size: 12px;
	}

	.kna-readonly {
		min-height: 32px;
		padding: 6px 10px;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
		background: #f8fafc;
		font-size: 12px;
		color: #1f2937;
		display: flex;
		align-items: center;
	}

	.kna-section-title {
		font-size: 14px;
		font-weight: 700;
		color: #1a202c;
		margin-bottom: 10px;
		margin-top: 0;
		padding-bottom: 4px;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.form-group {
		margin-bottom: 0;
	}

	.btn {
		border-radius: 4px;
		font-size: 12px;
		padding: 6px 14px;
	}

	.btn-outline-secondary {
		border: 1px solid #d1d5db;
		color: #6b7280;
		background: transparent;
	}

	.kna-line-card {
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 10px;
		background: #fff;
	}

	.kna-line-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.kna-line-title {
		font-size: 13px;
		font-weight: 700;
		color: #1f2937;
	}

	.kna-item-table-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-x: auto;
	}

	.kna-item-table {
		display: grid;
		grid-template-columns: 130px 140px 140px 110px 90px 170px 1fr;
		gap: 8px;
		align-items: center;
		background: #f8f9fc;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 6px;
		min-width: 900px;
	}

	.kna-item-table-row .form-control {
		min-width: 0;
		font-size: 12px;
	}

	.kna-attachment-cell {
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.kna-item-table-head {
		background: #e5e7eb;
		border-color: #d1d5db;
		font-size: 12px;
		font-weight: 700;
		color: #374151;
	}

	.kna-receipt-filename,
	.kna-receipt-cell {
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
		font-weight: 600;
		color: #1f2937;
	}

	.kna-receipt-amount-cell {
		font-size: 12px;
		font-weight: 700;
		color: #0f766e;
		text-align: right;
	}

	.kna-vat-indicator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 600;
		color: #374151;
	}

	.kna-vat-indicator input {
		width: 14px;
		height: 14px;
		margin: 0;
	}

	.kna-expense-divider {
		border-top: 1px dashed #d1d5db;
		margin: 10px 0 12px;
	}

	hr {
		border: 0;
		border-top: 1px solid #f3f4f6;
		margin: 12px 0;
	}

	/* Info grid rows */
	.kna-info-row { display: grid; gap: 8px; margin-bottom: 10px; }
	.kna-info-row-3 { grid-template-columns: repeat(3, 1fr); }

	/* Financial summary cards */
	.kna-fin-card {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-left: 3px solid #6366f1;
		border-radius: 6px;
		padding: 10px 12px;
	}
	.kna-fin-card.ca  { border-left-color: #3b82f6; }
	.kna-fin-card.liq { border-left-color: #0f766e; }
	.kna-fin-card.var { border-left-color: #f59e0b; }
	.kna-fin-label {
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: .4px;
		margin-bottom: 4px;
	}
	.kna-fin-value {
		font-size: 15px;
		font-weight: 700;
		color: #1f2937;
		line-height: 1.3;
	}

	/* Variance badges */
	.kna-var-badge     { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
	.kna-var-balanced  { background: #d1fae5; color: #065f46; }
	.kna-var-return    { background: #fef3c7; color: #92400e; }
	.kna-var-reimburse { background: #dbeafe; color: #1e40af; }

	/* Expense table */
	.kna-exp-wrap { width: 100%; overflow-x: auto; }
	.kna-exp-mobile { display: none; }
	.kna-exp-table {
		min-width: 780px;
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 12px;
	}
	.kna-exp-table th {
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		padding: 8px 10px;
		font-weight: 700;
		color: #475569;
		text-transform: uppercase;
		font-size: 11px;
		letter-spacing: .3px;
		white-space: nowrap;
	}
	.kna-exp-table td {
		border-bottom: 1px solid #f1f5f9;
		border-right: 1px solid #f1f5f9;
		padding: 8px 10px;
		vertical-align: top;
		color: #1f2937;
	}
	.kna-exp-table td:first-child { border-left: 1px solid #f1f5f9; }
	.kna-exp-table tbody tr:nth-child(odd)  td { background: #ffffff; }
	.kna-exp-table tbody tr:nth-child(even) td { background: #f8fafc; }
	.kna-exp-table tbody tr:hover td { background: #f0f9ff; }
	.kna-exp-table tfoot td {
		background: #ecfdf5;
		border-top: 2px solid #6ee7b7;
		border-color: #a7f3d0;
		font-weight: 700;
		color: #065f46;
		vertical-align: middle;
	}
	.kna-amount-main      { font-weight: 700; color: #0f766e; }
	.kna-amount-breakdown { font-size: 10px; color: #9ca3af; margin-top: 2px; }
	.kna-rownum { color: #9ca3af; font-size: 11px; text-align: center; }
	.kna-vat-check {
		width: 15px;
		height: 15px;
		margin: 0;
		accent-color: #2563eb;
	}
	.kna-vat-yes { background: #d1fae5; color: #065f46; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
	.kna-vat-no  { background: #f3f4f6; color: #9ca3af;  padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; }

	/* Attachment thumbnails */
	.kna-thumb-wrap {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		margin: 2px 6px 2px 0;
		max-width: 72px;
		vertical-align: top;
		text-align: center;
	}
	.kna-thumb {
		width: 58px;
		height: 50px;
		object-fit: cover;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
		transition: transform .15s, border-color .15s;
	}
	.kna-thumb:hover { transform: scale(1.1); border-color: #6366f1; }
	.kna-thumb-label {
		font-size: 10px;
		color: #6b7280;
		margin-top: 2px;
		max-width: 72px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}
	.kna-file-wrap { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; margin-bottom: 3px; }
	.kna-file-wrap a { color: #4f46e5; text-decoration: none; font-weight: 600; }
	.kna-file-wrap a:hover { text-decoration: underline; }
	.kna-exp-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #fff;
		padding: 12px;
		margin-bottom: 10px;
		box-shadow: 0 1px 2px rgba(20, 30, 50, .04);
	}
	.kna-exp-card-head {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: flex-start;
		padding-bottom: 10px;
		border-bottom: 1px solid #eef2f7;
		margin-bottom: 10px;
	}
	.kna-exp-card-title {
		font-size: 13px;
		font-weight: 700;
		color: #111827;
		line-height: 1.3;
	}
	.kna-exp-card-sub {
		font-size: 11px;
		font-weight: 600;
		color: #6b7280;
		margin-left: 4px;
	}
	.kna-exp-card-meta {
		font-size: 11px;
		color: #6b7280;
		margin-top: 3px;
	}
	.kna-exp-card-amount {
		text-align: right;
		flex: 0 0 auto;
	}
	.kna-exp-card-grid {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 8px;
		margin-bottom: 10px;
	}
	.kna-exp-card-field {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.kna-exp-card-field-full { grid-column: 1 / -1; }
	.kna-exp-card-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: .3px;
		color: #6b7280;
	}
	.kna-exp-card-value {
		font-size: 12px;
		color: #1f2937;
	}
	.kna-exp-card-attach {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.kna-mobile-summary {
		display: none;
		margin-top: 10px;
		padding: 10px 12px;
		border: 1px solid #d1fae5;
		border-radius: 8px;
		background: #f0fdf4;
	}
	.kna-mobile-summary .kna-fin-label {
		margin-bottom: 2px;
	}

	/* Lightbox */
	.kna-lightbox {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, .88);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.kna-lightbox.d-none { display: none !important; }
	.kna-lightbox-img {
		max-width: 90vw;
		max-height: 88vh;
		border-radius: 6px;
		box-shadow: 0 8px 40px rgba(0, 0, 0, .6);
	}
	.kna-lightbox-close {
		position: fixed;
		top: 16px;
		right: 20px;
		background: none;
		border: none;
		color: #fff;
		font-size: 32px;
		cursor: pointer;
		line-height: 1;
		z-index: 10000;
	}

	@media (max-width: 767.98px) {
		.kna-page { padding: 8px 8px 12px; }
		.kna-title { font-size: 18px; }
		.kna-info-row-3 { grid-template-columns: 1fr; }
		.kna-fin-value { font-size: 14px; }
		.kna-exp-wrap { overflow: visible; }
		.kna-exp-mobile { display: block; }
		.kna-exp-table { display: none !important; }
		.kna-thumb-wrap { max-width: 68px; margin-right: 4px; }
		.kna-thumb { width: 52px; height: 46px; }
		.kna-thumb-label { max-width: 68px; }
		.kna-mobile-summary { display: block; }
	}
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Liquidation Details</div>

		</div>
		<a href="<?=base_url('transactions/liquidation');?>" class="btn btn-outline-secondary">
			<i class="fas fa-arrow-left mr-1"></i> Back
		</a>
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<input type="hidden" id="liquidationRef" value="<?=html_escape($liquidation_no);?>">

			<div class="kna-section-title">
				<i class="fas fa-info-circle"></i>
				Liquidation Information
			</div>

			<!-- Row 1: Identifiers & Status -->
			<div class="kna-info-row kna-info-row-3">
				<div class="form-group">
					<label class="kna-form-label">Liquidation No</label>
					<div class="kna-readonly" id="viewLiquidationNo">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Cash Advance Ref</label>
					<div class="kna-readonly" id="viewCaRef">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Status</label>
					<div class="kna-readonly" id="viewStatus" style="background:transparent;border-color:transparent;padding-left:0;">-</div>
				</div>
			</div>

			<!-- Row 2: Dates -->
			<div class="kna-info-row kna-info-row-3">
				<div class="form-group">
					<label class="kna-form-label">Submitted Date</label>
					<div class="kna-readonly" id="viewSubmittedDate">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Expense Period</label>
					<div class="kna-readonly" id="viewExpenseDate">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">CA Date</label>
					<div class="kna-readonly" id="viewCaDate">-</div>
				</div>
			</div>

			<!-- Row 3: Financial summary -->
			<div class="kna-info-row kna-info-row-3" style="margin-bottom:12px;">
				<div class="kna-fin-card ca">
					<div class="kna-fin-label">CA Amount</div>
					<div class="kna-fin-value" id="viewCaAmount">-</div>
				</div>
				<div class="kna-fin-card liq">
					<div class="kna-fin-label">Total Liquidated</div>
					<div class="kna-fin-value" id="viewLiquidatedAmount">-</div>
				</div>
				<div class="kna-fin-card var">
					<div class="kna-fin-label">Variance</div>
					<div class="kna-fin-value" id="viewVariance">-</div>
				</div>
			</div>

			<!-- Notes -->
			<div class="form-group" style="margin-bottom:12px;">
				<label class="kna-form-label">Notes / Purpose</label>
				<div class="kna-readonly" id="viewPurpose" style="min-height:48px;align-items:flex-start;padding-top:8px;"></div>
			</div>

			<hr />

			<div class="kna-section-title">
				<i class="fas fa-receipt"></i>
				Expense Items
			</div>

			<div id="viewExpenseItems"></div>

			<hr />

			<div class="kna-section-title">
				<i class="fas fa-history"></i>
				Timeline
			</div>

			<div id="viewTimeline"></div>
		</div>
	</div>
</div>

<!-- Lightbox -->
<div id="knaLightbox" class="kna-lightbox d-none">
	<button class="kna-lightbox-close" id="knaLightboxClose">&#x2715;</button>
	<img id="knaLightboxImg" class="kna-lightbox-img" src="" alt="Attachment">
</div>
