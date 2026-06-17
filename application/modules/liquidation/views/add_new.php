<style>
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background: linear-gradient(135deg, #f0f4f8 0%, #f8f9fc 100%);
  }

  .kna-page {
    padding: 0;
    background: transparent;
    min-height: 100vh;
  }

  .kna-header {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 40px 28px;
    box-shadow: 0 4px 20px rgba(99, 102, 241, .15);
  }

  .kna-header-content {
    max-width: 1400px;
    margin: 0 auto;
  }

  .kna-title {
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 12px;
    letter-spacing: -.5px;
  }

  .kna-title i {
    font-size: 36px;
    opacity: 0.95;
  }

  .kna-subtitle {
    font-size: 15px;
    opacity: 0.9;
    margin-top: 8px;
    font-weight: 400;
  }

  .kna-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 28px;
  }

  .kna-card {
    border: 0 !important;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 2px 16px rgba(0, 0, 0, .08);
    overflow: hidden;
    transition: all .3s cubic-bezier(.4, 0, .2, 1);
  }

  .kna-card:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, .12);
  }

  .kna-card .card-body {
    padding: 32px;
  }

  .kna-small {
    font-size: 13px;
    line-height: 1.6;
  }

  .kna-form-label {
    margin-bottom: 10px;
    font-weight: 700;
    color: #1f2937;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .6px;
  }

  .kna-section-title {
    font-size: 17px;
    font-weight: 800;
    color: #1a202c;
    margin-bottom: 22px;
    margin-top: 0;
    padding-bottom: 16px;
    border-bottom: 2px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kna-section-title i {
    color: #6366f1;
    font-size: 20px;
  }

  .kna-section-title:first-of-type {
    margin-top: 0;
  }

  .form-control {
    border: 1.5px solid #e5e7eb !important;
    border-radius: 10px;
    background: #fafbfc;
    font-size: 13px;
    transition: all .3s ease;
    height: 42px;
    padding: 10px 14px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .02);
  }

  .form-control:focus {
    border-color: #6366f1 !important;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, .1), inset 0 1px 2px rgba(0, 0, 0, .02);
    outline: none;
  }

  textarea.form-control {
    height: auto;
    resize: vertical;
    min-height: 90px;
  }

  .form-control-sm {
    height: 38px;
    padding: 8px 12px;
  }

  .btn {
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    padding: 10px 18px;
    transition: all .3s ease;
    border: 0;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, .3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, .4);
  }

  .btn-outline-primary {
    border: 1.5px solid #6366f1;
    color: #6366f1;
    background: transparent;
  }

  .btn-outline-primary:hover {
    background: #6366f1;
    color: white;
    transform: translateY(-1px);
  }

  .btn-outline-secondary {
    border: 1.5px solid #d1d5db;
    color: #6b7280;
  }

  .btn-outline-secondary:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .btn-outline-success {
    border: 1.5px solid #10b981;
    color: #10b981;
    background: transparent;
  }

  .btn-outline-success:hover {
    background: #10b981;
    color: white;
  }

  .btn-outline-danger {
    border: 1.5px solid #ef4444;
    color: #ef4444;
    background: transparent;
  }

  .btn-outline-danger:hover {
    background: #ef4444;
    color: white;
  }

  .kna-icon-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all .3s ease;
  }

  .kna-line-card {
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    padding: 24px;
    margin-bottom: 18px;
    transition: all .3s ease;
    position: relative;
    overflow: hidden;
  }

  .kna-line-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    opacity: 0;
    transition: opacity .3s ease;
  }

  .kna-line-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 16px rgba(99, 102, 241, .12);
  }

  .kna-line-card:hover::before {
    opacity: 1;
  }

  .kna-line-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .kna-line-title {
    font-size: 15px;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kna-line-title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 50%;
  }

  .kna-line-actions {
    display: flex;
    gap: 8px;
  }

  .form-row {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .form-group {
    margin-bottom: 0;
  }

  .kna-receipt-description-group {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
    transition: all .3s ease;
  }

  .kna-receipt-description-group:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, .1);
  }

  .kna-receipt-description-group > div {
    flex: 1;
  }

  .kna-file-name-label {
    font-size: 11px;
    font-weight: 800;
    color: #6b7280;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: .6px;
  }

  .kna-file-name-value {
    font-size: 12px;
    color: #1a202c;
    font-weight: 700;
    padding: 10px 12px;
    background: #f3f4f6;
    border-radius: 8px;
    display: block;
    word-break: break-all;
    border: 1px solid #e5e7eb;
    margin-bottom: 10px;
  }

  .kna-receipt-description-group input {
    margin-top: 2px !important;
    height: 38px !important;
  }

  .kna-remove-receipt {
    padding: 0;
    border-radius: 10px;
    border: 1.5px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
    cursor: pointer;
    font-size: 16px;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
  }

  .kna-remove-receipt:hover {
    background: #fee2e2;
    border-color: #dc2626;
    transform: scale(1.05);
  }

  .kna-empty-state {
    padding: 24px;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    text-align: center;
    color: #64748b;
    margin-top: 16px;
  }

  .kna-empty-state i {
    font-size: 32px;
    color: #9ca3af;
    margin-bottom: 8px;
    display: block;
  }

  hr {
    border: 0;
    border-top: 2px solid #f3f4f6;
    margin: 24px 0;
  }

  .kna-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .kna-muted {
    color: #64748b;
  }

  .kna-header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .kna-header-actions .btn {
    background: rgba(255, 255, 255, .2);
    border: 1.5px solid rgba(255, 255, 255, .4);
    color: white;
  }

  .kna-header-actions .btn:hover {
    background: rgba(255, 255, 255, .3);
    border-color: rgba(255, 255, 255, .6);
  }

  @media (max-width: 768px) {
    .kna-header {
      padding: 28px 16px;
    }

    .kna-container {
      padding: 20px 16px;
    }

    .kna-title {
      font-size: 26px;
      gap: 8px;
    }

    .kna-title i {
      font-size: 28px;
    }

    .kna-card .card-body {
      padding: 24px;
    }

    .kna-line-card {
      padding: 18px;
    }

    .form-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .kna-actions {
      flex-direction: column;
    }

    .kna-actions .btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .kna-title {
      font-size: 22px;
    }

    .kna-section-title {
      font-size: 15px;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .kna-card .card-body {
      padding: 18px;
    }
  }
</style>

<div class="kna-header">
  <div class="kna-header-content">
    <div class="kna-title">
      <i class="fas fa-file-invoice-dollar"></i>
      New Liquidation
    </div>
    <div class="kna-subtitle">Submit expense details with receipt documentation</div>
  </div>
</div>

<div class="kna-container">
  <div class="kna-header-actions">
    <div></div>
    <a href="<?=base_url('transactions/liquidation');?>" class="btn btn-outline-secondary">
      <i class="fas fa-arrow-left mr-1"></i> Back
    </a>
  </div>

  <div class="card kna-card">
    <div class="card-body">
      <form id="formNewLiquidation" autocomplete="off">
        <div class="kna-section-title">
          <i class="fas fa-info-circle"></i>
          Liquidation Information
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="kna-form-label">Cash Advance Reference</label>
            <select class="form-control form-control-sm" id="newCaRef" required>
              <option value="">Select cash advance</option>
              <option value="CA-2026-0002">CA-2026-0002</option>
              <option value="CA-2026-0004">CA-2026-0004</option>
            </select>
          </div>

          <div class="form-group">
            <label class="kna-form-label">Submitted Date</label>
            <input type="date" class="form-control form-control-sm" id="newSubmittedDate" required>
          </div>

          <div class="form-group">
            <label class="kna-form-label">Total Amount (PHP)</label>
            <input type="number" class="form-control form-control-sm" id="newLiquidatedAmount" min="0" step="0.01" value="0" readonly style="background: #f0f4f8;">
          </div>
        </div>

        <div class="form-group" style="margin-top: 20px;">
          <label class="kna-form-label">Notes / Purpose</label>
          <textarea class="form-control" id="newPurpose" placeholder="Describe the purpose of this liquidation..." required></textarea>
        </div>

        <hr />

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div class="kna-section-title" style="margin: 0; border: none; padding: 0;">
              <i class="fas fa-receipt"></i>
              Expense Line Items
            </div>
            <div class="kna-small kna-muted">Add detailed expense entries with supporting receipts</div>
          </div>
          <button type="button" class="btn btn-outline-primary" id="btnAddExpenseLine" style="white-space: nowrap;">
            <i class="fas fa-plus mr-1"></i> Add Line
          </button>
        </div>

        <div id="expenseLinesContainer"></div>

        <hr />

        <div class="kna-actions">
          <a href="<?=base_url('transactions/liquidation');?>" class="btn btn-outline-secondary">Cancel</a>
          <button type="button" class="btn btn-primary" id="btnSaveNewLiquidation">
            <i class="fas fa-check mr-1"></i> Submit Liquidation
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
