<style>
  .kna-page { padding: 12px 14px; }
  .kna-card {
    border: 1px solid #d9e0e7 !important;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(20, 30, 50, .05);
  }
  .kna-card .card-body { padding: .85rem; }
  .kna-title { font-size: 20px; font-weight: 600; margin: 0 0 6px 0; line-height: 1.2; }
  .kna-small { font-size: 12px !important; line-height: 1.35; }
  .kna-form-label { margin-bottom: .3rem; font-weight: 600; }
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
  .kna-info-row { display: grid; gap: 8px; margin-bottom: 10px; }
  .kna-info-row-3 { grid-template-columns: repeat(3, 1fr); }
  .kna-fin-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-left: 3px solid #6366f1;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .kna-fin-card.total { border-left-color: #0f766e; }
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
  .kna-var-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .kna-var-balanced { background: #d1fae5; color: #065f46; }
  .kna-var-vat { background: #dbeafe; color: #1e40af; }
  .kna-item-table-wrap { width: 100%; display: flex; flex-direction: column; gap: 6px; overflow-x: auto; }
  .kna-item-table {
    display: grid;
    grid-template-columns: 128px 170px 120px 76px minmax(180px, 1fr) minmax(220px, 1.2fr) 64px;
    gap: 10px;
    align-items: center;
    background: #f8f9fc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 10px;
    min-width: 980px;
  }
  .kna-item-table-head {
    background: #e5e7eb;
    border-color: #d1d5db;
    font-size: 12px;
    font-weight: 700;
    color: #374151;
  }
  .kna-item-table-row .form-control { min-width: 0; }
  .kna-attachment-cell { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
  .kna-actions { display: flex; justify-content: flex-end; gap: 8px; }
  @media (max-width: 991.98px) {
    .kna-page { padding: 10px; }
    .kna-title { font-size: 17px; }
    .kna-card .card-body { padding: .7rem; }
    .kna-info-row-3 { grid-template-columns: 1fr; }
  }
</style>

<div class="page-inner kna-page">
  <input type="hidden" id="reimbursementRef" value="<?=isset($reimbursement_no) ? htmlspecialchars($reimbursement_no, ENT_QUOTES, 'UTF-8') : '';?>">
  <input type="hidden" id="draftEditWindowDays" value="<?=isset($draft_edit_window_days) ? (int)$draft_edit_window_days : 7;?>">
  <input type="hidden" id="isEditMode" value="<?=!empty($is_edit_mode) ? '1' : '0';?>">

  <div class="d-flex align-items-center justify-content-between mb-2">
    <div>
      <div class="kna-title"><?=!empty($is_edit_mode) ? 'Edit Draft Reimbursement' : 'New Reimbursement';?></div>
      <div class="kna-small text-muted"><?=!empty($is_edit_mode) ? 'Update your draft and submit when ready' : 'Create reimbursement with itemized receipts';?></div>
    </div>
    <a href="<?=base_url('transactions/reimbursement'); ?>" class="btn btn-outline-secondary btn-sm">Back</a>
  </div>

  <div class="card kna-card">
    <div class="card-body">
      <form id="formNewReimbursement" autocomplete="off">
        <div class="kna-section-title">Reimbursement Information</div>

        <div class="kna-info-row kna-info-row-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="kna-form-label">Expense Range</label>
            <input type="text" class="form-control form-control-sm kna-small" id="rbDateRange" placeholder="Auto based on document dates" readonly>
          </div>
          <div class="kna-fin-card total">
            <div class="kna-fin-label">Total Amount</div>
            <div class="kna-fin-value" id="rbTotalAmount">PHP 0.00</div>
          </div>
        </div>

        <div class="kna-info-row">
          <div class="form-group">
            <label class="kna-form-label">Purpose / Notes</label>
            <textarea class="form-control form-control-sm kna-small" id="rbPurpose" rows="2" placeholder="Reimbursement purpose" required></textarea>
          </div>
        </div>

        <hr />
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="kna-section-title" style="margin:0;border:none;padding:0;">Expense Items</div>
          <button type="button" class="btn btn-outline-secondary btn-sm" id="btnAddExpenseItem">Add Item</button>
        </div>

        <div id="expenseItemsContainer"></div>

        <hr />
        <div class="kna-actions">
          <a href="<?=base_url('transactions/reimbursement'); ?>" class="btn btn-outline-secondary btn-sm">Cancel</a>
          <button type="button" class="btn btn-outline-primary btn-sm" id="btnSaveDraftReimbursement">Save Draft</button>
          <button type="button" class="btn btn-primary btn-sm" id="btnSaveReimbursement">Submit Reimbursement</button>
        </div>
      </form>
    </div>
  </div>
</div>
