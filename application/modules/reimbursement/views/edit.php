
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

	.form-group { margin-bottom: 0; }

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

	.btn-primary {
		background: #6366f1;
		color: #fff;
		border: none;
	}

	.btn-warning {
		background: #f59e0b;
		color: #fff;
		border: none;
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
	.kna-fin-card.liq { border-left-color: #0f766e; }
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

	/* Item table */
	.kna-item-table-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-x: auto;
	}
	.kna-item-table {
		display: grid;
		grid-template-columns: 128px 154px 154px 112px 76px minmax(180px, 1.2fr) minmax(220px, 1.4fr) 64px;
		gap: 10px;
		align-items: center;
		background: #f8f9fc;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 8px 10px;
		min-width: 1120px;
	}
	.kna-item-table-head {
		background: #e5e7eb;
		border-color: #d1d5db;
		font-size: 12px;
		font-weight: 700;
		color: #374151;
	}
	.kna-item-table-row .form-control {
		min-width: 0;
		font-size: 12px;
	}
	.kna-attachment-cell {
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 4px;
		white-space: normal;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.25;
	}
	.kna-vat-wrap {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: 12px;
		color: #374151;
		user-select: none;
		cursor: pointer;
	}
	.kna-vat-input {
		width: 14px;
		height: 14px;
		margin: 0;
		accent-color: #2563eb;
	}

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
		position: relative;
	}
	.kna-thumb-wrap.removed {
		opacity: 0.4;
		filter: grayscale(1);
	}
	.kna-thumb-remove {
		position: absolute;
		top: -4px;
		right: -4px;
		background: #ef4444;
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		font-size: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 2;
		padding: 0;
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
	.kna-file-wrap .kna-file-remove {
		color: #ef4444;
		cursor: pointer;
		font-size: 10px;
		margin-left: 2px;
	}
	.kna-file-wrap.removed {
		opacity: 0.4;
		text-decoration: line-through;
	}

	/* Rejected item styling */
	.kna-row-rejected {
		background: #fef2f2 !important;
		border-color: #fecaca !important;
	}
	.kna-row-rejected .kna-item-table {
		background: #fef2f2;
		border-color: #fecaca;
	}
	.kna-rejection-ribbon {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 6px 10px;
		background: #fff;
		border: 1px solid #fecaca;
		border-radius: 6px;
		border-left: 3px solid #ef4444;
		font-size: 11px;
		margin-top: 6px;
	}
	.kna-rejection-ribbon-label {
		font-weight: 700;
		color: #991b1b;
		text-transform: uppercase;
		letter-spacing: .3px;
		font-size: 10px;
		white-space: nowrap;
	}
	.kna-rejection-pill {
		background: #fee2e2;
		color: #991b1b;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}
	.kna-rejection-pill i { margin-right: 3px; font-size: 10px; }

	/* Locked row styling */
	.kna-row-locked .kna-item-table {
		background: #f3f4f6 !important;
		border-color: #e5e7eb !important;
	}
	.kna-lock-icon {
		color: #9ca3af;
		font-size: 11px;
	}

	/* Mobile cards */
	.kna-exp-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #fff;
		padding: 8px 10px;
		box-shadow: 0 1px 2px rgba(20, 30, 50, .04);
		margin-bottom: 8px;
		position: relative;
		overflow: hidden;
	}
	.kna-exp-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
	}
	.kna-exp-card[data-status="approved"]::before { background: #22c55e; }
	.kna-exp-card[data-status="rejected"]::before { background: #ef4444; }
	.kna-exp-card[data-status="pending"]::before  { background: #f59e0b; }

	.kna-exp-card-head {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: flex-start;
		padding-bottom: 8px;
		border-bottom: 1px solid #eef2f7;
		margin-bottom: 8px;
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
	.kna-exp-card-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 0 0 auto;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.kna-exp-card-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin-bottom: 8px;
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
	.kna-exp-card-value { font-size: 12px; color: #1f2937; }
	.kna-exp-card-attach { display: flex; flex-wrap: wrap; gap: 6px; }
	.kna-exp-card-field .form-control { min-width: 0; }

	/* Mobile rejected card */
	.kna-exp-card-rejected {
		border-color: #fecaca;
		background: #fef2f2;
	}
	.kna-exp-card-rejected .kna-exp-card-head { border-bottom-color: #fecaca; }
	.kna-rejection-box-mobile {
		background: #fff;
		border: 1px solid #fecaca;
		border-left: 3px solid #ef4444;
		border-radius: 6px;
		padding: 8px 10px;
		margin: 8px 0 0 0;
		font-size: 12px;
	}
	.kna-rejection-item {
		color: #991b1b;
		margin-bottom: 4px;
		font-size: 11px;
	}
	.kna-rejection-item:last-child { margin-bottom: 0; }
	.kna-rejection-item i { margin-right: 4px; }

	/* Mobile summary */
	.kna-mobile-summary {
		display: none;
		margin-top: 10px;
		padding: 10px 12px;
		border: 1px solid #d1fae5;
		border-radius: 8px;
		background: #f0fdf4;
	}
	.kna-mobile-summary .kna-fin-label { margin-bottom: 2px; }

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

	/* Edit-specific styles */
	.kna-edit-input {
		font-size: 12px;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		width: 100%;
		min-width: 0;
	}
	.kna-edit-input:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
	}
	.kna-edit-input:disabled {
		background: #f3f4f6;
		border-color: #e5e7eb;
		color: #6b7280;
		cursor: not-allowed;
	}
	.kna-edit-select {
		font-size: 12px;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		width: 100%;
		min-width: 0;
		background: #fff;
	}
	.kna-edit-select:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
	}
	.kna-edit-select:disabled {
		background: #f3f4f6;
		border-color: #e5e7eb;
		color: #6b7280;
		cursor: not-allowed;
	}
	.kna-edit-number { text-align: right; }
	.kna-edit-checkbox {
		width: 15px;
		height: 15px;
		margin: 0;
		accent-color: #2563eb;
	}
	.kna-edit-checkbox:disabled {
		accent-color: #9ca3af;
		cursor: not-allowed;
	}

	/* Remove button */
	.kna-remove-btn {
		color: #b91c1c;
		background: none;
		border: none;
		font-size: 14px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background 0.12s;
	}
	.kna-remove-btn:hover { background: #fee2e2; }
	.kna-remove-btn:disabled { color: #d1d5db; cursor: not-allowed; }

	/* Warning banner for rejected items */
	.kna-rejected-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		padding: 10px 12px;
		margin-bottom: 12px;
		font-size: 12px;
		color: #991b1b;
	}
	.kna-rejected-banner i { margin-right: 6px; }

	/* Actions bar */
	.kna-edit-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 12px;
	}

	/* Attachment remove undo */
	.kna-attach-undo {
		font-size: 10px;
		color: #6366f1;
		cursor: pointer;
		margin-left: 4px;
	}
	.kna-attach-undo:hover { text-decoration: underline; }

	@media (max-width: 767.98px) {
		.kna-page { padding: 8px 8px 12px; }
		.kna-title { font-size: 18px; }
		.kna-info-row-3 { grid-template-columns: 1fr; }
		.kna-fin-value { font-size: 14px; }
		.kna-exp-wrap { overflow: visible; }
		.kna-exp-mobile { display: block; }
		.kna-item-table-wrap { display: none !important; }
		.kna-thumb-wrap { max-width: 68px; margin-right: 4px; }
		.kna-thumb { width: 52px; height: 46px; }
		.kna-thumb-label { max-width: 68px; }
		.kna-mobile-summary { display: block; }
		.kna-edit-actions { flex-direction: column; }
		.kna-edit-actions .btn { width: 100%; }
		.kna-exp-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
		.kna-exp-card-head { gap: 8px; }
		.kna-exp-card-attach { flex-direction: row; }
	}
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title">Edit Reimbursement</div>
			<div class="kna-small text-muted">Update rejected items and resubmit for approval</div>
		</div>
		<a href="<?=base_url('transactions/reimbursement');?>" class="btn btn-outline-secondary">
			<i class="fas fa-arrow-left mr-1"></i> Back
		</a>
	</div>

	<!-- Rejected Items Banner -->
	<div id="rejectedBanner" class="kna-rejected-banner d-none">
		<i class="fas fa-exclamation-triangle"></i>
		<strong>Action Required:</strong> <span id="rejectedCount">0</span> item(s) were rejected. Please update the highlighted items below and resubmit.
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<input type="hidden" id="reimbursementRef" value="<?=html_escape($reimbursement_no);?>">
			<input type="hidden" id="editPageMarker" value="1">

			<div class="kna-section-title">
				<i class="fas fa-info-circle"></i>
				Reimbursement Information
			</div>

			<div class="kna-info-row kna-info-row-3">
				<div class="form-group">
					<label class="kna-form-label">Reimbursement No</label>
					<div class="kna-readonly" id="editReimbursementNo">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Status</label>
					<div class="kna-readonly" id="editStatus" style="background:transparent;border-color:transparent;padding-left:0;">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Submitted Date</label>
					<div class="kna-readonly" id="editSubmittedDate">-</div>
				</div>
			</div>

			<div class="kna-info-row kna-info-row-3" style="margin-bottom:12px;">
				<div class="form-group">
					<label class="kna-form-label">Expense Period</label>
					<div class="kna-readonly" id="editExpenseDate">-</div>
				</div>
				<div class="kna-fin-card liq">
					<div class="kna-fin-label">Total Amount</div>
					<div class="kna-fin-value" id="editTotalAmount">-</div>
				</div>
				<div class="form-group">
					<label class="kna-form-label">Description</label>
					<div class="kna-readonly" id="editDescription" style="min-height:48px;align-items:flex-start;padding-top:8px;"></div>
				</div>
			</div>

			<hr />

			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-section-title" style="margin:0;border:none;padding:0;">
					<i class="fas fa-receipt"></i>
					Expense Items
				</div>
				<button type="button" class="btn btn-outline-secondary" id="btnAddNewItem" style="white-space: nowrap;">
					<i class="fas fa-plus mr-1"></i> Add Item
				</button>
			</div>

			<div id="editExpenseItems"></div>

			<hr />

			<div class="kna-edit-actions">
				<a href="<?=base_url('transactions/reimbursement');?>" class="btn btn-outline-secondary">Cancel</a>
				<button type="button" class="btn btn-warning" id="btnSaveAsDraft">
					<i class="fas fa-save mr-1"></i> Save as Draft
				</button>
				<button type="button" class="btn btn-primary" id="btnSaveEdit">
					<i class="fas fa-check mr-1"></i> Save & Resubmit
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Lightbox -->
<div id="knaLightbox" class="kna-lightbox d-none">
	<button class="kna-lightbox-close" id="knaLightboxClose">&#x2715;</button>
	<img id="knaLightboxImg" class="kna-lightbox-img" src="" alt="Attachment">
</div>

<script>
window.currentUserId = <?=json_encode((int)$this->session->userdata('user_id'));?>;
</script>