<style>
  .kna-page { padding: 12px 14px; }
  .kna-card {
    border: 1px solid #d9e0e7 !important;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(20, 30, 50, .05);
  }
  .kna-card .card-body { padding: .85rem; }
  .kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
  .kna-small { font-size: 12px !important; line-height: 1.35; }
  .kna-kpi { font-size: 19px; line-height: 1.15; font-weight: 600; margin: 0; color: #1d2a3a; }
  .kna-kpi-caption { font-size: 11px; color: #6c757d; margin: 0; }
  .kna-form-label { margin-bottom: .3rem; font-weight: 600; }
  .kna-table td, .kna-table th {
    font-size: 12px !important;
    padding: .5rem .45rem;
    vertical-align: middle;
    white-space: nowrap;
  }
  .kna-badge { padding: .2rem .4rem; border-radius: 3px; font-size: 11px; font-weight: 600; display: inline-block; }
  .kna-badge-pending { background: #fff5d9; color: #7a5b00; }
  .kna-badge-approved { background: #e8f7ee; color: #17663a; }
  .kna-badge-rejected { background: #fdeaea; color: #8a2121; }
  .kna-badge-draft { background: #eef2f7; color: #495869; }
  @media (max-width: 991.98px) {
    .kna-page { padding: 10px; }
    .kna-title { font-size: 17px; }
    .kna-card .card-body { padding: .7rem; }
  }
</style>

<div class="page-inner kna-page">
  <div class="d-flex align-items-center justify-content-between mb-2">
    <div>
      <div class="kna-title">Reimbursement</div>
    </div>
    <button type="button" class="btn btn-primary btn-sm kna-small" id="btnOpenNewReimbursement">New Reimbursement</button>
  </div>

  <div class="row mb-2">
    <div class="col-md-3 col-6 pr-md-2 mb-2 mb-md-0">
      <div class="card kna-card h-100"><div class="card-body"><p class="kna-kpi-caption">Total Reimbursement</p><p class="kna-kpi" id="sumTotalReimbursement">—</p></div></div>
    </div>
    <div class="col-md-3 col-6 px-md-2 mb-2 mb-md-0">
      <div class="card kna-card h-100"><div class="card-body"><p class="kna-kpi-caption">Submitted</p><p class="kna-kpi" id="sumPendingReview">—</p></div></div>
    </div>
    <div class="col-md-3 col-6 px-md-2">
      <div class="card kna-card h-100"><div class="card-body"><p class="kna-kpi-caption">Draft</p><p class="kna-kpi" id="sumDraft">—</p></div></div>
    </div>
    <div class="col-md-3 col-6 pl-md-2">
      <div class="card kna-card h-100"><div class="card-body"><p class="kna-kpi-caption">With VAT</p><p class="kna-kpi" id="sumVat">—</p></div></div>
    </div>
  </div>

  <div class="card kna-card mb-2">
    <div class="card-body py-2">
      <div class="d-flex flex-wrap align-items-end" style="gap:.5rem;">
        <div>
          <label class="kna-small kna-form-label mb-1">Date Range</label>
          <input type="text" class="form-control form-control-sm kna-small" id="filterDateRange" placeholder="YYYY-MM-DD to YYYY-MM-DD" style="width:200px;">
        </div>
        <div>
          <label class="kna-small kna-form-label mb-1">Status</label>
          <select class="form-control form-control-sm kna-small" id="filterStatus" style="width:150px;">
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
          </select>
        </div>
        <div>
          <label class="kna-small kna-form-label mb-1">Amount</label>
          <select class="form-control form-control-sm kna-small" id="filterAmountRange" style="width:160px;">
            <option value="">All</option>
            <option value="0-5000">PHP 0 - PHP 5,000</option>
            <option value="5001-10000">PHP 5,001 - PHP 10,000</option>
            <option value="10001-999999">Above PHP 10,000</option>
          </select>
        </div>
        <div>
          <button type="button" class="btn btn-outline-secondary btn-sm" id="btnReset" title="Clear filters" style="height:31px;width:31px;padding:0;">
            <i class="fas fa-undo"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="card kna-card">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="kna-small text-muted">Reimbursement History</div>
        <div class="kna-small text-muted" id="resultCount">—</div>
      </div>
      <div class="table-responsive">
        <table class="table table-sm kna-table" id="reimbursementTable" style="width:100%">
          <thead>
            <tr>
              <th>Reimbursement No</th>
              <th>Purpose</th>
              <th class="text-right">Amount</th>
              <th>Submitted</th>
              <th>VAT</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody id="reimbursementTbody"></tbody>
        </table>
      </div>
      <div class="d-flex justify-content-end mt-2">
        <nav aria-label="Reimbursement pagination">
          <ul class="pagination pagination-sm mb-0" id="desktopPagination"></ul>
        </nav>
      </div>
    </div>
  </div>
</div>
