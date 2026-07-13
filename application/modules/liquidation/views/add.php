<style>
  /* Overlay for full image preview */
  .kna-image-overlay {
    display: none;
    position: fixed;
    z-index: 9999;
    left:0; top: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.55);
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
  }
  .kna-image-overlay.active { display: flex; }
  .kna-image-overlay img {
    max-width: 90vw; max-height: 90vh;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    background: #fff; padding: 8px;
  }

  /* ===== DESKTOP TABLE ===== */
  .kna-item-table-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-x: auto;
  }
  .kna-item-row-wrapper {
    margin-bottom: 6px;
    background: #f8f9fc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  .kna-item-table {
    display: grid;
    grid-template-columns: 32px 100px minmax(200px, 1.6fr) 110px 100px 44px 120px minmax(140px, 1.4fr) 80px;
    gap: 10px;
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0;
    padding: 10px 12px;
    min-width: 100%;
  }
  .kna-item-table-head {
    background: #e5e7eb;
    border-color: #d1d5db;
    font-size: 10px;
    font-weight: 700;
    color: #374151;
    align-items: center;
    padding: 8px 12px;
    min-height: 36px;
    margin-bottom: 6px;
  }
  .kna-item-table-head>div {
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kna-item-table-row .form-control {
    min-width: 0;
    font-size: 10px;
    padding: 5px 8px;
    height: 30px;
  }
  .kna-cell-index {
    font-size: 11px;
    font-weight: 700;
    color: #9ca3af;
    text-align: center;
  }
  .kna-cell-remarks .form-control {
    width: 100%;
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kna-cell-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .kna-cell-actions .btn {
    width: 28px; height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }
  .kna-attach-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }
  .kna-attach-cell .kna-attachment-cell {
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: keep-all;
    line-height: 1.3;
  }
  .kna-attachment-cell, .kna-attachment-cell * {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    word-wrap: normal !important;
  }
  .kna-attach-cell .btn {
    align-self: flex-start;
    white-space: nowrap;
    font-size: 10px;
    padding: 4px 10px;
    height: 28px;
  }

  /* ===== VENDOR INLINE BLOCK ===== */
  .kna-vendor-inline {
    margin-top: 0;
    padding: 8px 12px 10px;
    border-top: 1px solid #eef2f7;
    background: #fff;
  }
  .kna-vendor-inline-caption {
    display: flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .3px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .kna-vendor-inline-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .kna-vendor-inline .form-control {
    font-size: 10px;
    padding: 4px 8px;
    height: 28px;
    border-color: #e5e7eb;
    background: #fff;
    color: #1f2937;
  }
  .kna-vendor-inline .form-control:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.08);
  }
  .kna-vendor-inline.is-mobile {
    margin-top: 0;
    padding: 6px 10px 10px;
  }
  .kna-vendor-inline.is-mobile .kna-vendor-inline-grid {
    grid-template-columns: 1fr;
  }

  .kna-ocr-status {
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    line-height: 1.3;
  }
  .kna-ocr-scanning { color: #2563eb; }
  .kna-ocr-success { color: #059669; }
  .kna-ocr-error { color: #dc2626; }
  .kna-ocr-manual { color: #6b7280; }
  .kna-ocr-status i { font-size: 10px; width: 12px; text-align: center; }
  .kna-ocr-manual-btn {
    background: none; border: none;
    color: #4f46e5;
    font-size: 10px; font-weight: 600;
    cursor: pointer; padding: 0;
    text-decoration: underline; line-height: 1;
  }
  .kna-ocr-manual-btn:hover { color: #4338ca; }

  /* ===== GLOBAL ===== */
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  body { background: linear-gradient(135deg, #f0f4f8 0%, #f8f9fc 100%); }
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
  .kna-header-content { max-width: 1100px; margin: 0 auto; }
  .kna-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    line-height: 1.2;
  }
  .kna-title i { font-size: 18px; opacity: 0.95; }
  .kna-subtitle {
    font-size: 10px;
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
  .kna-card .card-body { padding: .85rem; }
  .kna-small { font-size: 10px !important; line-height: 1.35; }
  .kna-form-label {
    margin-bottom: .3rem;
    font-weight: 600;
    font-size: 10px;
  }
  .form-control, .form-control-sm {
    font-size: 10px;
    border-radius: 4px;
    padding: 6px 10px;
    height: 32px;
  }
  textarea.form-control { min-height: 48px; font-size: 10px; padding: 6px 10px; }
  .btn {
    border-radius: 4px;
    font-size: 10px;
    padding: 6px 14px;
  }
  .btn-primary { background: #6366f1; color: #fff; border: none; }
  .btn-outline-secondary {
    border: 1px solid #d1d5db;
    color: #6b7280;
    background: transparent;
  }
  .btn-outline-secondary:hover { background: #f3f4f6; border-color: #9ca3af; }
  .kna-section-title {
    font-size: 12px;
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
  .kna-expense-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 8px 0;
    border-top: 2px solid #e5e7eb;
    border-bottom: 2px solid #e5e7eb;
  }
  .kna-expense-section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: none;
  }
  .form-row {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
  .form-group { margin-bottom: 0; }
  .kna-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }
  hr { border: 0; border-top: 1px solid #f3f4f6; margin: 12px 0; }
  .kna-header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .kna-header-actions .btn { font-size: 10px; padding: 4px 10px; border-radius: 4px; }
  .mb-4 { margin-bottom: 12px; }
  .mr-1 { margin-right: 4px; }
  .d-none { display: none; }
  .d-flex { display: flex; }
  .gap-2 { gap: 6px; }
  .ml-2 { margin-left: 6px; }
  .kna-info-row {
    display: grid;
    gap: 8px;
    margin-bottom: 10px;
  }
  .kna-info-row-3 { grid-template-columns: repeat(3, 1fr); }
  .kna-desktop-info .kna-info-row {
    gap: 6px;
    margin-bottom: 6px;
  }
  .kna-desktop-info .kna-form-label {
    margin-bottom: .2rem;
  }
  .kna-compact-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .kna-compact-value {
    min-height: 30px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    background: #fff;
    font-size: 11px;
    font-weight: 500;
    color: #1f2937;
    display: flex;
    align-items: center;
  }
  .kna-compact-value.is-muted {
    background: #f8fafc;
  }
  .kna-compact-value .kna-var-badge {
    font-size: 11px;
    padding: 2px 8px;
  }
  .kna-fin-card {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-left: 3px solid #6366f1;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .kna-fin-card.ca { border-left-color: #3b82f6; }
  .kna-fin-card.liq { border-left-color: #0f766e; }
  .kna-fin-card.var { border-left-color: #f59e0b; }
  .kna-fin-label {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .4px;
    margin-bottom: 4px;
  }
  .kna-fin-value {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.3;
  }
  .kna-var-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
  }
  .kna-var-balanced { background: #d1fae5; color: #065f46; }
  .kna-var-return { background: #fef3c7; color: #92400e; }
  .kna-var-reimburse { background: #dbeafe; color: #1e40af; }
  .kna-exp-summary { display: block; margin-bottom: 10px; }
  .kna-summary-note { display: none; margin-top: 10px; padding: 10px 12px; border: 1px solid #d1fae5; border-radius: 8px; background: #f0fdf4; }
  .kna-summary-note .kna-fin-label { margin-bottom: 2px; }
  .kna-exp-mobile { display: none; }

  /* ===== MOBILE COMPACT OVERVIEW (Hidden on desktop) ===== */
  .kna-mobile-overview { display: none; }

  /* ===== MOBILE CARDS ===== */
  .kna-exp-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    padding: 0;
    box-shadow: 0 2px 8px rgba(20, 30, 50, .06);
    margin-bottom: 12px;
    overflow: hidden;
  }
  .kna-exp-card-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border-bottom: 1px solid #eef2f7;
    background: #fafbfc;
  }
  .kna-exp-card-head-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .kna-exp-card-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #6366f1;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    margin-bottom: 2px;
  }
  .kna-exp-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
  }
  .kna-exp-card-sub {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    margin-left: 4px;
  }
  .kna-exp-card-meta { font-size: 10px; color: #6b7280; }
  .kna-exp-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .kna-exp-card-remove {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: all .15s;
  }
  .kna-exp-card-remove:hover { background: #fee2e2; border-color: #ef4444; }
  .kna-exp-card-body { padding: 10px 12px; }
  .kna-exp-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 10px;
  }
  .kna-exp-card-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .kna-exp-card-field-full { grid-column: 1 / -1; }
  .kna-exp-card-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .3px;
    color: #6b7280;
  }
  .kna-exp-card-value { font-size: 10px; color: #1f2937; }
  .kna-exp-card-attach {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .kna-exp-card-field .form-control { min-width: 0; }
  .kna-vat-toggle-row { padding: 4px 0; }
  .kna-vat-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  .kna-vat-toggle input {
    position: absolute;
    opacity: 0;
    width: 0; height: 0;
  }
  .kna-vat-toggle-slider {
    position: relative;
    width: 40px; height: 22px;
    background: #d1d5db;
    border-radius: 22px;
    transition: background .2s;
    flex-shrink: 0;
  }
  .kna-vat-toggle-slider::before {
    content: '';
    position: absolute;
    left: 2px; top: 2px;
    width: 18px; height: 18px;
    background: #fff;
    border-radius: 50%;
    transition: transform .2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.15);
  }
  .kna-vat-toggle input:checked + .kna-vat-toggle-slider { background: #6366f1; }
  .kna-vat-toggle input:checked + .kna-vat-toggle-slider::before { transform: translateX(18px); }
  .kna-vat-toggle-label { font-size: 11px; font-weight: 600; color: #374151; }
  .kna-attach-section {
    border: 1.5px dashed #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: #f8fafc;
    transition: border-color .15s, background .15s;
  }
  .kna-attach-section:hover { border-color: #6366f1; background: #f5f3ff; }
  .kna-attach-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .kna-attach-status {
    font-size: 10px;
    color: #6b7280;
    font-weight: 600;
  }
  .kna-attach-btn {
    width: 100%;
    min-height: 40px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .kna-remarks-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .kna-vat-input {
    width: 14px; height: 14px;
    margin: 0;
    accent-color: #2563eb;
  }
  .kna-vat-wrap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 10px;
    color: #374151;
    user-select: none;
    cursor: pointer;
  }
  .kna-mobile-add-item { display: none; width: 100%; margin-top: 10px; }

  /* ===== MOBILE VENDOR SECTION ===== */
  .kna-mobile-vendor-section {
    margin-top: 10px;
  }
  .kna-mobile-vendor-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 0;
    background: transparent;
  }

  /* ===== MOBILE COMPACT OVERVIEW ===== */
  @media (max-width: 768px) {
    .kna-desktop-info { display: none !important; }
    .kna-mobile-overview { display: block; }

    .kna-mobile-hero {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 10px;
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
    .kna-mobile-hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .kna-mobile-hero-id {
      font-size: 13px;
      font-weight: 700;
      opacity: 0.95;
      letter-spacing: 0.3px;
    }
    .kna-mobile-hero-id span {
      opacity: 0.7;
      font-weight: 500;
      font-size: 11px;
      display: block;
      margin-top: 2px;
    }
    .kna-mobile-hero-status {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
      white-space: nowrap;
    }
    .kna-mobile-hero-amounts {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .kna-mobile-hero-amt {
      text-align: center;
      background: rgba(255,255,255,0.12);
      border-radius: 8px;
      padding: 8px 4px;
    }
    .kna-mobile-hero-amt-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      opacity: 0.75;
      margin-bottom: 2px;
    }
    .kna-mobile-hero-amt-value { font-size: 14px; font-weight: 700; }
    .kna-mobile-hero-amt-value.small { font-size: 12px; }

    .kna-info-section-mobile { display: block; margin-bottom: 10px; }
    .kna-info-grid-mobile {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .kna-info-item-mobile {
      background: #fff;
      border-radius: 10px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-left: 3px solid #6366f1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kna-info-item-mobile.ca-ref { border-left-color: #3b82f6; }
    .kna-info-item-mobile.ca-amt { border-left-color: #0f766e; }
    .kna-info-item-mobile.ca-date { border-left-color: #8b5cf6; }
    .kna-info-item-mobile.range { border-left-color: #f59e0b; }
    .kna-info-item-mobile.total { border-left-color: #059669; }
    .kna-info-item-mobile.variance { border-left-color: #ef4444; }
    .kna-info-item-mobile.payable { border-left-color: #ec4899; }
    .kna-info-item-mobile.address { border-left-color: #14b8a6; }
    .kna-info-item-mobile.costcenter { border-left-color: #f97316; }
    .kna-info-item-mobile.status { border-left-color: #6366f1; }
    .kna-info-item-mobile.submitted { border-left-color: #64748b; }
    .kna-info-item-mobile.expense-period { border-left-color: #a855f7; }
    .kna-info-item-mobile.purpose { border-left-color: #6366f1; }
    .kna-info-label-mobile {
      font-size: 9px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .kna-info-value-mobile {
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.3;
      word-break: break-word;
    }
    .kna-info-value-mobile .kna-var-badge { font-size: 10px; padding: 1px 8px; }
    .kna-info-item-mobile.full-width { grid-column: 1 / -1; }
    .kna-info-purpose-mobile {
      grid-column: 1 / -1;
      background: #fff;
      border-radius: 10px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-left: 3px solid #6366f1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kna-info-purpose-mobile .kna-info-value-mobile {
      font-size: 12px;
      color: #374151;
      font-weight: 500;
      line-height: 1.4;
    }
    .kna-section-title { font-size: 13px; margin-bottom: 10px; padding-bottom: 6px; }
    .kna-expense-section-header {
      margin-top: 8px;
      padding: 8px 0;
      border-top-width: 1px;
      border-bottom-width: 1px;
    }
    .kna-expense-section-title { font-size: 13px; }

    .kna-header { padding: 14px 6px; }
    .kna-container { padding: 8px 4px; }
    .kna-title { font-size: 14px; gap: 4px; }
    .kna-title i { font-size: 14px; }
    .kna-card .card-body { padding: 8px 4px; }
    .kna-line-card { padding: 6px 4px; }
    .form-row { grid-template-columns: repeat(2, 1fr); gap: 4px; }
    .kna-actions { display: none; }
    .kna-actions .btn { width: 100%; }
    .kna-info-row-3 { grid-template-columns: 1fr; }
    .kna-exp-mobile { display: block; }
    .kna-item-table-wrap { display: none !important; }
    .kna-summary-note { display: block; }
    .kna-exp-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .kna-exp-card-head { gap: 8px; }
    .kna-exp-card-attach { flex-direction: row; }
    .kna-mobile-add-item { display: block; }
    .kna-mobile-sticky-actions {
      display: flex;
      gap: 8px;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #fff;
      border-top: 1px solid #e5e7eb;
      padding: 10px 14px;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
      z-index: 1030;
    }
    .kna-mobile-sticky-actions .btn {
      flex: 1;
      font-size: 12px;
      padding: 10px 8px;
      min-height: 44px;
      border-radius: 8px;
    }
    .kna-mobile-sticky-actions .btn-outline-secondary {
      flex: 0 0 auto;
      padding: 10px 14px;
    }
    body { padding-bottom: 72px; }
    .kna-info-section-mobile {
      background: transparent;
      border-radius: 0;
      padding: 0;
      margin-bottom: 10px;
    }
    .form-control, .form-control-sm {
      min-height: 40px;
      font-size: 12px;
    }
    select.form-control { height: 40px; }
  }

  @media (max-width: 480px) {
    .kna-title { font-size: 12px; }
    .kna-section-title { font-size: 10px; }
    .form-row { grid-template-columns: 1fr; }
    .kna-card .card-body { padding: 4px 2px; }
    .kna-info-grid-mobile { grid-template-columns: 1fr; gap: 6px; }
    .kna-info-item-mobile { padding: 8px 10px; }
    .kna-info-value-mobile { font-size: 12px; }
    .kna-exp-card-grid { gap: 8px; }
    .kna-exp-card-body { padding: 8px; }
    .kna-mobile-hero-amounts { grid-template-columns: 1fr 1fr; }
    .kna-mobile-hero-amt:nth-child(3) { grid-column: 1 / -1; }
  }
</style>
<div class="page-inner kna-page">
  <input type="hidden" id="liquidationRef"
    value="<?= isset($liquidation_no) ? htmlspecialchars($liquidation_no, ENT_QUOTES, 'UTF-8') : ''; ?>">
  <input type="hidden" id="draftEditWindowDays"
    value="<?= isset($draft_edit_window_days) ? (int) $draft_edit_window_days : 7; ?>">
  <input type="hidden" id="isEditMode" value="<?= !empty($is_edit_mode) ? '1' : '0'; ?>">
  <div class="d-flex align-items-center justify-content-between mb-2">
    <div>
      <div class="kna-title"><?= !empty($is_edit_mode) ? 'Edit Draft Liquidation' : 'New Liquidation'; ?></div>
      <div class="kna-small text-muted">
        <?= !empty($is_edit_mode) ? 'Update your draft and submit when ready' : 'Submit expense details with receipt documentation'; ?>
      </div>
    </div>
    <a href="<?= base_url('transactions/liquidation'); ?>" class="btn btn-outline-secondary">
      <i class="fas fa-arrow-left mr-1"></i> Back
    </a>
  </div>
  <div class="card kna-card">
    <div class="card-body">
      <form id="formNewLiquidation" autocomplete="off">
        <!-- Desktop: Full form rows -->
        <div class="kna-desktop-info">
          <div class="kna-section-title">
            <i class="fas fa-info-circle"></i>
            Liquidation Information
          </div>
          <div class="kna-info-row kna-info-row-3">
            <div class="form-group">
              <label class="kna-form-label">Reference</label>
              <select class="form-control form-control-sm kna-small" id="newCaRef" required>
                <option value="">Select cash advance</option>
              </select>
            </div>
            <div class="form-group">
              <label class="kna-form-label">CA Amount</label>
              <input type="number" class="form-control form-control-sm kna-small" id="newCaAmount" min="0" step="0.01"
                value="0" readonly style="background: #f0f4f8;">
            </div>
            <div class="form-group">
              <label class="kna-form-label">CA Date</label>
              <input type="text" class="form-control form-control-sm kna-small" id="newCaDate" readonly
                style="background: #f0f4f8;" placeholder="-">
            </div>
          </div>
          <div class="kna-info-row kna-info-row-3">
            <div class="form-group">
              <label class="kna-form-label">Payable To</label>
              <input type="text" class="form-control form-control-sm kna-small" id="newPayableTo" readonly
                style="background: #f0f4f8;" placeholder="-">
            </div>
            <div class="form-group">
              <label class="kna-form-label">Address</label>
              <input type="text" class="form-control form-control-sm kna-small" id="newAddress" readonly
                style="background: #f0f4f8;" placeholder="-">
            </div>
            <div class="form-group">
              <label class="kna-form-label">Cost Center</label>
              <input type="text" class="form-control form-control-sm kna-small" id="newCostCenter" readonly
                style="background: #f0f4f8;" placeholder="-">
            </div>
          </div>
          <div class="kna-info-row kna-info-row-3">
            <div class="form-group kna-compact-field">
              <label class="kna-form-label">Expense Range</label>
              <input type="text" class="form-control form-control-sm kna-small" id="newDateRange"
                placeholder="Auto based on document dates" required readonly style="background: #f0f4f8;">
            </div>
            <div class="form-group kna-compact-field">
              <label class="kna-form-label">Total Amount</label>
              <div class="kna-compact-value is-muted" id="newLiquidatedAmount">0.00</div>
            </div>
            <div class="form-group kna-compact-field">
              <label class="kna-form-label">Variance</label>
              <div class="kna-compact-value is-muted" id="newVariance">-</div>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="kna-form-label">Purpose / Notes</label>
            <textarea class="form-control form-control-sm kna-small" id="newPurpose" placeholder="" readonly
              style="background: #f0f4f8; min-height: 48px;"></textarea>
          </div>
        </div>

        <!-- Mobile: Compact Hero + Grid (hidden on desktop) -->
        <div class="kna-mobile-overview">
          <div class="kna-mobile-hero">
            <div class="kna-mobile-hero-top">
              <div class="kna-mobile-hero-id">
                <span>CA Ref</span>
                <span id="mobileCaRef">-</span>
              </div>
              <div class="kna-mobile-hero-status"><?= !empty($is_edit_mode) ? 'Draft' : 'New'; ?></div>
            </div>
            <div class="kna-mobile-hero-amounts">
              <div class="kna-mobile-hero-amt">
                <div class="kna-mobile-hero-amt-label">CA Amount</div>
                <div class="kna-mobile-hero-amt-value" id="mobileCaAmount">-</div>
              </div>
              <div class="kna-mobile-hero-amt">
                <div class="kna-mobile-hero-amt-label">Total</div>
                <div class="kna-mobile-hero-amt-value" id="mobileTotal">-</div>
              </div>
              <div class="kna-mobile-hero-amt">
                <div class="kna-mobile-hero-amt-label">Variance</div>
                <div class="kna-mobile-hero-amt-value small" id="mobileVariance">-</div>
              </div>
            </div>
          </div>
          <div class="kna-info-section-mobile">
            <div class="kna-info-grid-mobile">
              <div class="kna-info-item-mobile ca-date">
                <div class="kna-info-label-mobile">CA Date</div>
                <div class="kna-info-value-mobile" id="mobileCaDate">-</div>
              </div>
              <div class="kna-info-item-mobile range">
                <div class="kna-info-label-mobile">Expense Range</div>
                <div class="kna-info-value-mobile" id="mobileDateRange">-</div>
              </div>
              <div class="kna-info-item-mobile payable">
                <div class="kna-info-label-mobile">Payable To</div>
                <div class="kna-info-value-mobile" id="mobilePayableTo">-</div>
              </div>
              <div class="kna-info-item-mobile costcenter">
                <div class="kna-info-label-mobile">Cost Center</div>
                <div class="kna-info-value-mobile" id="mobileCostCenter">-</div>
              </div>
              <div class="kna-info-item-mobile address full-width">
                <div class="kna-info-label-mobile">Address</div>
                <div class="kna-info-value-mobile" id="mobileAddress">-</div>
              </div>
              <div class="kna-info-item-mobile purpose full-width">
                <div class="kna-info-label-mobile">Purpose / Notes</div>
                <div class="kna-info-value-mobile" id="mobilePurpose">-</div>
              </div>
            </div>
          </div>
        </div>

        <hr />
        <div class="kna-expense-section-header">
          <div class="kna-expense-section-title">
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
          <a href="<?= base_url('transactions/liquidation'); ?>" class="btn btn-outline-secondary">Cancel</a>
          <button type="button" class="btn btn-outline-primary" id="btnSaveDraftLiquidation">
            <i class="fas fa-save mr-1"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary" id="btnSaveNewLiquidation">
            <i class="fas fa-check mr-1"></i> <?= !empty($is_edit_mode) ? 'Update & Submit' : 'Submit Liquidation'; ?>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Mobile sticky actions -->
  <div class="kna-mobile-sticky-actions d-none">
    <a href="<?= base_url('transactions/liquidation'); ?>" class="btn btn-outline-secondary">
      <i class="fas fa-arrow-left"></i>
    </a>
    <button type="button" class="btn btn-outline-primary" id="btnSaveDraftLiquidationMobile">
      <i class="fas fa-save"></i> Draft
    </button>
    <button type="button" class="btn btn-primary" id="btnSaveNewLiquidationMobile">
      <i class="fas fa-check"></i> Submit
    </button>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      const overlay = document.getElementById('knaImageOverlay');
      if (overlay) {
        overlay.addEventListener('click', function () {
          overlay.classList.remove('active');
          overlay.querySelector('img').src = '';
        });
      }
      document.body.addEventListener('click', function (e) {
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