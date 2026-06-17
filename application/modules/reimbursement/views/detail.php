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
  .kna-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 10px;
    margin-top: 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #f3f4f6;
  }
  .kna-info-row { display: grid; gap: 8px; margin-bottom: 10px; }
  .kna-info-row-3 { grid-template-columns: repeat(3, 1fr); }
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
  .kna-badge { padding: .2rem .45rem; border-radius: 999px; font-size: 11px; font-weight: 600; display: inline-block; }
  .kna-badge-pending { background: #fff5d9; color: #7a5b00; }
  .kna-badge-approved { background: #e8f7ee; color: #17663a; }
  .kna-badge-rejected { background: #fdeaea; color: #8a2121; }
  .kna-badge-draft { background: #eef2f7; color: #495869; }
  .kna-exp-table {
    width: 100%;
    min-width: 780px;
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
  }
  .kna-exp-table td {
    border-bottom: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    padding: 8px 10px;
    background: #fff;
  }
  .kna-exp-table td:first-child { border-left: 1px solid #f1f5f9; }
  .kna-amount-main { font-weight: 700; color: #0f766e; text-align: right; }
  @media (max-width: 991.98px) {
    .kna-page { padding: 10px; }
    .kna-title { font-size: 17px; }
    .kna-card .card-body { padding: .7rem; }
    .kna-info-row-3 { grid-template-columns: 1fr; }
  }
</style>

<div class="page-inner kna-page">
  <input type="hidden" id="reimbursementRef" value="<?=isset($reimbursement_no) ? htmlspecialchars($reimbursement_no, ENT_QUOTES, 'UTF-8') : '';?>">

  <div class="d-flex align-items-center justify-content-between mb-2">
    <div>
      <div class="kna-title">Reimbursement Details</div>
      <div class="kna-small text-muted">Detailed view like liquidation detail page.</div>
    </div>
    <a href="<?=base_url('transactions/reimbursement'); ?>" class="btn btn-outline-secondary btn-sm">Back</a>
  </div>

  <div class="card kna-card mb-2">
    <div class="card-body">
      <div class="kna-section-title">Summary</div>
      <div class="kna-info-row kna-info-row-3">
        <div>
          <label class="kna-small font-weight-bold">Reimbursement No</label>
          <div class="kna-readonly" id="viewRbNo">-</div>
        </div>
        <div>
          <label class="kna-small font-weight-bold">Date</label>
          <div class="kna-readonly" id="viewRbDate">-</div>
        </div>
        <div>
          <label class="kna-small font-weight-bold">Status</label>
          <div class="kna-readonly" id="viewRbStatus">-</div>
        </div>
      </div>
      <div class="kna-info-row kna-info-row-3">
        <div>
          <label class="kna-small font-weight-bold">Purpose</label>
          <div class="kna-readonly" id="viewRbPurpose">-</div>
        </div>
        <div>
          <label class="kna-small font-weight-bold">Expense Range</label>
          <div class="kna-readonly" id="viewRbRange">-</div>
        </div>
        <div>
          <label class="kna-small font-weight-bold">Total Amount</label>
          <div class="kna-readonly" id="viewRbTotal">-</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card kna-card">
    <div class="card-body">
      <div class="kna-section-title">Expense Items</div>
      <div class="table-responsive" id="viewExpenseItems"></div>
    </div>
  </div>
</div>
