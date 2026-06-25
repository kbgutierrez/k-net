<style>
	.kna-image-overlay {
		display: none;
		position: fixed;
		z-index: 9999;
		left: 0;
		top: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0,0,0,0.55);
		align-items: center;
		justify-content: center;
		cursor: zoom-out;
	}
	.kna-image-overlay.active {
		display: flex;
	}
	.kna-image-overlay img {
		max-width: 90vw;
		max-height: 90vh;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.25);
		background: #fff;
		padding: 8px;
	}

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

	.kna-header {
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		color: white;
		padding: 22px 14px;
		box-shadow: 0 2px 10px rgba(99, 102, 241, .10);
	}

	.kna-header-content {
		max-width: 1100px;
		margin: 0 auto;
	}

	.kna-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 8px 0;
		line-height: 1.2;
	}

	.kna-title i {
		font-size: 22px;
		opacity: 0.95;
	}

	.kna-subtitle {
		font-size: 12px;
		opacity: 0.85;
		margin-top: 4px;
		font-weight: 400;
	}

	.kna-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 16px 8px;
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

	.kna-small {
		font-size: 12px !important;
		line-height: 1.35;
	}

	.kna-form-label {
		margin-bottom: .3rem;
		font-weight: 600;
		font-size: 12px;
	}

	.form-control, .form-control-sm {
		font-size: 12px;
		border-radius: 4px;
		padding: 6px 10px;
		height: 32px;
	}

	textarea.form-control {
		min-height: 48px;
		font-size: 12px;
		padding: 6px 10px;
	}

	.btn {
		border-radius: 4px;
		font-size: 12px;
		padding: 6px 14px;
	}

	.btn-primary {
		background: #6366f1;
		color: #fff;
		border: none;
	}

	.btn-outline-secondary {
		border: 1px solid #d1d5db;
		color: #6b7280;
		background: transparent;
	}

	.btn-outline-secondary:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
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

	.form-row {
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 8px;
	}

	.form-group {
		margin-bottom: 0;
	}

	.kna-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 12px;
	}

	hr {
		border: 0;
		border-top: 1px solid #f3f4f6;
		margin: 12px 0;
	}

	.kna-header-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.kna-header-actions .btn {
		font-size: 12px;
		padding: 4px 10px;
		border-radius: 4px;
	}

	.mb-4 { margin-bottom: 12px; }
	.mr-1 { margin-right: 4px; }
	.d-none { display: none; }
	.d-flex { display: flex; }
	.gap-2 { gap: 6px; }
	.ml-2 { margin-left: 6px; }

	/* Info grid rows */
	.kna-info-row { display: grid; gap: 8px; margin-bottom: 10px; }
	.kna-info-row-3 { grid-template-columns: repeat(3, 1fr); }
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
	.kna-exp-summary {
		display: block;
		margin-bottom: 10px;
	}
	.kna-exp-mobile { display: none; }
	.kna-exp-card {
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		background: #fff;
		padding: 8px 10px;
		box-shadow: 0 1px 2px rgba(20, 30, 50, .04);
		margin-bottom: 8px;
	}
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
	.kna-vat-input {
		width: 14px;
		height: 14px;
		margin: 0;
		accent-color: #2563eb;
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

	@media (max-width: 768px) {
		.kna-header {
			padding: 14px 6px;
		}

		.kna-container {
			padding: 8px 4px;
		}

		.kna-title {
			font-size: 15px;
			gap: 4px;
		}

		.kna-title i {
			font-size: 14px;
		}

		.kna-card .card-body {
			padding: 8px 4px;
		}

		.form-row {
			grid-template-columns: repeat(2, 1fr);
			gap: 4px;
		}

		.kna-actions {
			flex-direction: column;
			gap: 4px;
		}

		.kna-actions .btn {
			width: 100%;
		}

		.kna-info-row-3 { grid-template-columns: 1fr; }
		.kna-exp-mobile { display: block; }
		.kna-item-table { display: none; }
		.kna-exp-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
		.kna-exp-card-head { gap: 8px; }
		.kna-exp-card-attach { flex-direction: row; }
		.kna-item-table-wrap { overflow: visible; }
	}

	@media (max-width: 480px) {
		.kna-title {
			font-size: 12px;
		}

		.kna-section-title {
			font-size: 10px;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.kna-card .card-body {
			padding: 4px 2px;
		}
	}
</style>

<div class="page-inner kna-page">
	<input type="hidden" id="reimbursementRef" value="<?=isset($reimbursement_no) ? htmlspecialchars($reimbursement_no, ENT_QUOTES, 'UTF-8') : '';?>">
	<input type="hidden" id="draftEditWindowDays" value="<?=isset($draft_edit_window_days) ? (int)$draft_edit_window_days : 7;?>">
	<input type="hidden" id="isEditMode" value="<?=!empty($is_edit_mode) ? '1' : '0';?>">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div>
			<div class="kna-title"><?=!empty($is_edit_mode) ? 'Edit Draft Reimbursement' : 'New Reimbursement';?></div>
			<div class="kna-small text-muted"><?=!empty($is_edit_mode) ? 'Update your draft and submit when ready' : 'Submit expense details with receipt documentation';?></div>
		</div>
		<a href="<?=base_url('transactions/reimbursement'); ?>" class="btn btn-outline-secondary">
			<i class="fas fa-arrow-left mr-1"></i> Back
		</a>
	</div>
	<div class="card kna-card">
		<div class="card-body">
			<form id="formNewReimbursement" autocomplete="off">
				<div class="kna-section-title">
					<i class="fas fa-info-circle"></i>
					Reimbursement Information
				</div>
				<div class="kna-info-row kna-info-row-3">
					<div class="form-group">
						<label class="kna-form-label">Description / Notes</label>
						<textarea class="form-control form-control-sm kna-small" id="newDescription" placeholder="Purpose of reimbursement" style="min-height: 48px;" required></textarea>
					</div>
					<div class="kna-fin-card liq">
						<div class="kna-fin-label">Total Amount</div>
						<div class="kna-fin-value" id="newTotalAmount">0.00</div>
					</div>
					<div class="kna-fin-card">
						<div class="kna-fin-label">Expense Date Range</div>
						<div class="kna-fin-value" id="newDateRange">-</div>
					</div>
				</div>

				<hr />
				<div class="d-flex align-items-center justify-content-between mb-2">
					<div class="kna-section-title" style="margin: 0; border: none; padding: 0;">
						<i class="fas fa-receipt"></i>
						Expense Items
					</div>
					<button type="button" class="btn btn-outline-secondary" id="btnAddExpenseItem" style="white-space: nowrap;">
						<i class="fas fa-plus mr-1"></i> Add Item
					</button>
				</div>
				<div id="expenseItemsContainer"></div>
				<div id="knaImageOverlay" class="kna-image-overlay"><img src="" alt="Full Preview" /></div>
				<hr />
				<div class="kna-actions">
					<a href="<?=base_url('transactions/reimbursement'); ?>" class="btn btn-outline-secondary">Cancel</a>
					<button type="button" class="btn btn-outline-primary" id="btnSaveDraftReimbursement">
						<i class="fas fa-save mr-1"></i> Save Draft
					</button>
					<button type="button" class="btn btn-primary" id="btnSaveNewReimbursement">
						<i class="fas fa-check mr-1"></i> <?=!empty($is_edit_mode) ? 'Update & Submit' : 'Submit Reimbursement';?>
					</button>
				</div>
			</form>
		</div>
	</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
	const overlay = document.getElementById('knaImageOverlay');
	if (overlay) {
		overlay.addEventListener('click', function() {
			overlay.classList.remove('active');
			overlay.querySelector('img').src = '';
		});
	}
	document.body.addEventListener('click', function(e) {
		const preview = e.target.closest('.kna-receipt-preview[data-img-url]');
		if (preview) {
			const url = preview.getAttribute('data-img-url');
			if (overlay && url) {
				overlay.querySelector('img').src = url;
				overlay.classList.add('active');
			}
			e.preventDefault();
		}
	});
});
</script>
</div>