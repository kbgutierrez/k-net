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

  .kna-info-row {
    display: grid;
    gap: 8px;
    margin-bottom: 10px;
  }

  .kna-info-row-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .kna-fin-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-left: 3px solid #6366f1;
    border-radius: 6px;
    padding: 10px 12px;
  }

  .kna-fin-card.ca {
    border-left-color: #3b82f6;
  }

  .kna-fin-card.amt {
    border-left-color: #0f766e;
  }

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

  hr {
    border: 0;
    border-top: 1px solid #f3f4f6;
    margin: 12px 0;
  }

  /* Timeline */
  .kna-timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .kna-timeline-item {
    position: relative;
    padding: 12px 0 12px 24px;
    border-left: 2px solid #e5e7eb;
    font-size: 12px;
  }

  .kna-timeline-item:last-child {
    padding-bottom: 0;
  }

  .kna-timeline-item::before {
    content: '';
    position: absolute;
    left: -7px;
    top: 14px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #d1d5db;
    box-shadow: 0 0 0 2px #e5e7eb;
  }

  .kna-timeline-item.is-done {
    border-left-color: #22c55e;
  }

  .kna-timeline-item.is-done::before {
    background: #22c55e;
    box-shadow: 0 0 0 2px #dcfce7;
  }

  .kna-timeline-item.is-current {
    border-left-color: #2f6eb4;
  }

  .kna-timeline-item.is-current::before {
    background: #2f6eb4;
    box-shadow: 0 0 0 2px #bfdbfe;
  }

  .kna-timeline-item.is-pending {
    border-left-color: #d1d5db;
  }

  .kna-timeline-item.is-pending::before {
    background: #d1d5db;
    box-shadow: 0 0 0 2px #f3f4f6;
  }

  .kna-timeline-item-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .kna-timeline-item-name {
    font-weight: 700;
    color: #1f2937;
    font-size: 12px;
  }

  .kna-timeline-item-remarks {
    color: #4b5563;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
  }

  @media (max-width: 768px) {
    .kna-info-row-3 {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="page-inner kna-page">
  <div class="d-flex align-items-center justify-content-between mb-2">
    <div>
      <div class="kna-title">Cash Advance Details</div>
    </div>
    <a href="<?=base_url('transactions/cash-advance');?>" class="btn btn-outline-secondary">
      <i class="fas fa-arrow-left mr-1"></i> Back
    </a>
  </div>

  <div class="card kna-card">
    <div class="card-body">
      <input type="hidden" id="cashAdvanceRef" value="<?=html_escape($cash_advance_no);?>">

      <div class="kna-section-title">
        <i class="fas fa-info-circle"></i>
        Cash Advance Information
      </div>

      <!-- Row 1: Identifiers & Status -->
      <div class="kna-info-row kna-info-row-3">
        <div class="form-group">
          <label class="kna-form-label">Cash Advance No</label>
          <div class="kna-readonly" id="viewRefNo">-</div>
        </div>
        <div class="form-group">
          <label class="kna-form-label">Status</label>
          <div class="kna-readonly" id="viewStatus" style="background:transparent;border-color:transparent;padding-left:0;">-</div>
        </div>
        <div class="form-group">
          <label class="kna-form-label">Amount</label>
          <div class="kna-readonly" id="viewAmount">-</div>
        </div>
      </div>

      <!-- Row 2: Dates -->
      <div class="kna-info-row kna-info-row-3">
        <div class="form-group">
          <label class="kna-form-label">Requested Date</label>
          <div class="kna-readonly" id="viewRequestedDate">-</div>
        </div>
        <div class="form-group">
          <label class="kna-form-label">Date Needed</label>
          <div class="kna-readonly" id="viewNeededDate">-</div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group" style="margin-bottom:12px;">
        <label class="kna-form-label">Purpose / Description</label>
        <div class="kna-readonly" id="viewPurpose" style="min-height:48px;align-items:flex-start;padding-top:8px;">-</div>
      </div>

      <hr />

      <div class="kna-section-title">
        <i class="fas fa-history"></i>
        History
      </div>
      <ul class="kna-timeline" id="viewTimeline"></ul>
    </div>
  </div>
</div>