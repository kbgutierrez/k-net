<style>
    .kna-page { padding: 12px 14px; }
    .kna-card { border: 1px solid #d9e0e7 !important; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(20, 30, 50, .05); }
    .kna-card .card-body { padding: .85rem; }
    .kna-title { font-size: 20px; font-weight: 600; margin: 0; line-height: 1.2; }
    .kna-small { font-size: 12px !important; line-height: 1.35; }
    .kna-form-label { margin-bottom: .3rem; font-weight: 600; font-size: 12px; }
    .kna-badge { padding: .2rem .4rem; border-radius: 3px; font-size: 11px; font-weight: 600; display: inline-block; }
    .kna-badge-pending { background: #fff9db; color: #f59f00; }
    .kna-badge-approved { background: #e8f7ee; color: #17663a; }
    .kna-badge-rejected { background: #fff5f5; color: #e03131; }
    .kna-badge-partial { background: #e9f3ff; color: #1b4f88; }

 /* ─── Timeline ─── */
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

.kna-timeline-item-date {
    font-size: 11px;
    color: #6b7280;
}

.kna-timeline-item-remarks {
    color: #4b5563;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
}

    /* ─── SPLIT TABLE SHELL (same pattern as index.php) ─── */
    .kna-review-desktop {
        width: 100%;
        border: 1px solid #e5ecf3;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
    }
    .kna-review-table-shell {
        display: flex;
        width: 100%;
        border-bottom: 1px solid #e5ecf3;
    }
    .kna-review-table-wrap-main {
        flex: 1 1 auto;
        overflow-x: auto;
        overflow-y: hidden;
    }
    .kna-review-table-main {
        min-width: 1100px;
        width: 100%;
        margin-bottom: 0;
        font-size: 12px;
        border-collapse: separate;
        border-spacing: 0;
    }
    .kna-review-table-main th,
    .kna-review-table-main td {
        padding: 10px;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
        border-right: 1px solid #f1f5f9;
        color: #1f2937;
        /* Ensure consistent height calculation */
        box-sizing: border-box;
    }
    .kna-review-table-main th {
        background: #f8fbff;
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: .3px;
        white-space: nowrap;
    }
    .kna-review-table-main tbody tr:nth-child(odd) td { background: #ffffff; }
    .kna-review-table-main tbody tr:nth-child(even) td { background: #f8fafc; }
    .kna-review-table-main tbody tr:hover td { background: #f0f9ff; }

    /* Row state coloring */
    .kna-review-table-main tbody tr.is-approved td { background: #f0fdf4 !important; }
    .kna-review-table-main tbody tr.is-rejected td { background: #fef2f2 !important; }

    /* Action table — separate, naturally frozen (no sticky needed) */
    .kna-review-table-wrap-action {
        width: 180px;
        flex: 0 0 180px;
        overflow: hidden;
    }
    .kna-review-table-action {
        width: 100%;
        margin-bottom: 0;
        font-size: 12px;
        border-collapse: separate;
        border-spacing: 0;
        border-left: 2px solid #e5ecf3;
    }
    .kna-review-table-action th,
    .kna-review-table-action td {
        padding: 10px;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
        text-align: center;
        background: #fff;
        /* Ensure consistent height calculation */
        box-sizing: border-box;
    }
    .kna-review-table-action th {
        background: #f8fbff;
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: .3px;
    }
    .kna-review-table-action tbody tr:nth-child(odd) td { background: #ffffff; }
    .kna-review-table-action tbody tr:nth-child(even) td { background: #f8fafc; }
    .kna-review-table-action tbody tr.is-approved td { background: #f0fdf4 !important; }
    .kna-review-table-action tbody tr.is-rejected td { background: #fef2f2 !important; }

    /* Action column cell content */
    .kna-col-action {
        width: 180px;
        min-width: 180px;
        max-width: 180px;
        padding: 10px !important;
        text-align: center;
    }

    /* ─── Toggle Decision Buttons ─── */
    .kna-item-decision {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
    }
    .kna-toggle-group {
        display: flex;
        width: 100%;
        border: 1.5px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
    }
    .kna-toggle-btn {
        flex: 1;
        border: none;
        background: #fff;
        font-size: 11px;
        font-weight: 700;
        padding: 7px 4px;
        cursor: pointer;
        color: #6b7280;
        transition: all .15s ease;
        line-height: 1.2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }
    .kna-toggle-btn:first-child {
        border-right: 1.5px solid #d1d5db;
    }
    .kna-toggle-btn:hover {
        background: #f9fafb;
    }
    .kna-toggle-btn.is-approve:hover {
        color: #17663a;
    }
    .kna-toggle-btn.is-reject:hover {
        color: #e03131;
    }
    .kna-toggle-btn.is-approve.is-active {
        background: #17663a;
        color: #fff;
    }
    .kna-toggle-btn.is-reject.is-active {
        background: #e03131;
        color: #fff;
    }
    .kna-toggle-btn.is-active {
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .kna-toggle-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .kna-toggle-btn:disabled:hover {
        background: #fff;
        color: #6b7280;
    }

    /* Remark textarea */
    .kna-item-remark {
        font-size: 12px;
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        width: 100%;
        resize: vertical;
        min-height: 60px;
        line-height: 1.5;
        color: #374151;
        background: #fafafa;
    }
    .kna-item-remark:focus {
        outline: none;
        border-color: #2f6eb4;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(47, 110, 180, 0.08);
    }
    .kna-item-remark::placeholder {
        color: #9ca3af;
        font-size: 11px;
    }
    .kna-item-remark.d-none { display: none !important; }
    .kna-item-remark[readonly] {
        background: #f3f4f6;
        color: #6b7280;
        cursor: default;
    }

    /* ─── Footer ─── */
    .kna-review-footer {
        display: flex;
        width: 100%;
        border-top: 2px solid #6ee7b7;
        background: #ecfdf5;
    }
    .kna-review-footer-main {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 10px 12px;
        min-height: 46px;
    }
    .kna-review-footer-label {
        font-size: 12px;
        font-weight: 700;
        color: #065f46;
        text-transform: uppercase;
        letter-spacing: .3px;
    }
    .kna-review-footer-amount { text-align: right; }

    /* ─── Common Elements ─── */
    .kna-exp-mobile { display: none; }
    .kna-amount-main { font-weight: 700; color: #0f766e; }
    .kna-amount-breakdown { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .kna-rownum { color: #9ca3af; font-size: 11px; text-align: center; }

    /* VAT checkbox */
    .kna-vat-indicator {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        margin: 0;
    }
    .kna-vat-check {
        width: 15px;
        height: 15px;
        margin: 0;
        accent-color: #2563eb;
        cursor: pointer;
    }
    .kna-vat-check:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Attachments */
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
    .kna-thumb:hover { transform: scale(1.08); border-color: #6366f1; }
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

    /* ─── Mobile Cards ─── */
    .kna-exp-card {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #fff;
        padding: 12px;
        margin-bottom: 10px;
        box-shadow: 0 1px 2px rgba(20, 30, 50, .04);
    }
    .kna-exp-card.is-approved { border-color: #86efac; background: #f0fdf4; }
    .kna-exp-card.is-rejected { border-color: #fca5a5; background: #fef2f2; }
    .kna-exp-card-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        padding-bottom: 10px;
        border-bottom: 1px solid #eef2f7;
        margin-bottom: 10px;
    }
    .kna-exp-card-title { font-size: 13px; font-weight: 700; color: #111827; line-height: 1.3; }
    .kna-exp-card-sub { font-size: 11px; font-weight: 600; color: #6b7280; margin-left: 4px; }
    .kna-exp-card-meta { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .kna-exp-card-amount { text-align: right; flex: 0 0 auto; }
    .kna-exp-card-field { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
    .kna-exp-card-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .3px;
        color: #6b7280;
    }
    .kna-exp-card-value { font-size: 12px; color: #1f2937; }
    .kna-exp-card-attach { display: flex; flex-wrap: wrap; gap: 6px; }

    /* ─── Overview Grid ─── */
    .kna-review-overview-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
    }
    .kna-review-stat {
        border: 1px solid #e5ecf3;
        border-radius: 6px;
        background: #f8fbff;
        padding: 10px 12px;
        min-height: 58px;
    }
    .kna-review-stat-wide { grid-column: 1 / -1; }
    .kna-review-stat-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .3px;
        color: #6b7280;
        margin-bottom: 4px;
    }
    .kna-review-stat-value {
        font-size: 12px;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.35;
    }
    .kna-review-stat-value.is-amount { font-size: 15px; color: #2f6eb4; }
    .kna-review-stat-value.is-purpose { font-weight: 500; color: #374151; }

    /* ─── Submit Bar ─── */
    .kna-review-items-card .card-body { padding: .75rem .85rem 0; }
    .kna-review-items-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        padding-bottom: .65rem;
        border-bottom: 1px solid #eef2f7;
        margin-bottom: .65rem;
    }
    .kna-review-items-body {
        min-height: 280px;
        padding-bottom: .5rem;
    }
    .kna-review-submit-bar {
        display: flex;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: .8rem;
        border: 1px solid #e5ecf3;
        border-radius: 8px;
        background: #f8fbff;
        padding: 10px 12px;
    }
    .kna-review-submit-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        flex: 1 1 280px;
    }
    .kna-review-stat-chip {
        border: 1px solid #e5ecf3;
        border-radius: 6px;
        background: #fff;
        padding: 8px 12px;
        min-width: 120px;
    }
    .kna-review-stat-chip-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 2px;
    }
    .kna-review-stat-chip-value {
        font-size: 13px;
        font-weight: 700;
        color: #1f2937;
    }
    .kna-review-stat-chip-value.is-approved { color: #17663a; }
    .kna-review-stat-chip-value.is-rejected { color: #e03131; }
    .kna-review-submit-remarks {
        flex: 2 1 320px;
        min-width: 220px;
    }
    .kna-review-submit-action {
        flex: 0 0 auto;
        min-width: 200px;
    }
    .kna-review-submit-action .btn { min-width: 200px; }

    .kna-review-context-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }

    /* ─── Lightbox ─── */
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

    /* ─── Responsive ─── */
    @media (max-width: 991.98px) {
        .kna-review-overview-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 767.98px) {
        .kna-page { padding: 8px 8px 12px; }
        .kna-title { font-size: 18px; }
        .kna-review-overview-grid { grid-template-columns: 1fr; }
        .kna-review-desktop { display: none !important; }
        .kna-exp-mobile { display: block; }
        .kna-review-items-body { min-height: auto; }
        .kna-review-submit-bar { margin-bottom: .65rem; }
        .kna-review-submit-action,
        .kna-review-submit-action .btn { width: 100%; min-width: 0; }
        .kna-thumb-wrap { max-width: 68px; margin-right: 4px; }
        .kna-thumb { width: 52px; height: 46px; }
        .kna-timeline-item { min-width: 0; flex-basis: 100%; }
    }
    /* ─── Remark required shake animation ─── */
    @keyframes kna-remark-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-4px); }
        40% { transform: translateX(4px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
    }
    .kna-remark-required {
        border-color: #e03131 !important;
        background: #fff5f5 !important;
        animation: kna-remark-shake 0.4s ease-in-out;
    }
  /* ─── Cancel Reject Button ─── */
    .kna-cancel-reject {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        padding: 5px 8px;
        margin-top: 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: #f9fafb;
        color: #6b7280;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all .15s ease;
    }
    .kna-cancel-reject:hover {
        background: #f3f4f6;
        color: #374151;
        border-color: #9ca3af;
    }
    .kna-cancel-reject i {
        font-size: 10px;
    }
    /* ─── Read-only Status Display ─── */
    .kna-readonly-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 4px;
    }
    .kna-readonly-by {
        font-size: 10px;
        color: #9ca3af;
        text-align: center;
        margin-bottom: 6px;
    }
    .kna-readonly-remark {
        font-size: 11px;
        color: #e03131;
        background: #fff5f5;
        border: 1px solid #fecaca;
        border-radius: 4px;
        padding: 6px 8px;
        text-align: left;
        line-height: 1.4;
        max-width: 160px;
        word-break: break-word;
    }
</style>
<div class="page-inner kna-page">
    <input type="hidden" id="approvalRef" value="<?=html_escape($approval_id);?>">
    <input type="hidden" id="currentUserId" value="<?=(int)$this->session->userdata('user_id');?>">

    <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap" style="gap: 8px;">
        <div>
            <div class="kna-title" id="reviewTitle">Review Request</div>
            <span class="kna-badge kna-badge-pending mt-1" id="reviewStatusBadge">Awaiting Your Action</span>
        </div>
        <a href="<?=base_url('transactions/approvals');?>" class="btn btn-outline-secondary btn-sm kna-small">
            <i class="fas fa-arrow-left mr-1"></i> Back
        </a>
    </div>

    <div class="card kna-card mb-2">
        <div class="card-body py-2">
            <div class="kna-small font-weight-bold text-muted mb-2 text-uppercase">Request Overview</div>
            <div id="reviewHeaderFields"></div>
        </div>
    </div>

    <div class="card kna-card kna-review-items-card mb-2">
        <div class="card-body">
            <div class="kna-review-items-head">
                <div>
                    <div class="kna-small font-weight-bold text-muted text-uppercase">Line Items for Review</div>
                </div>
            </div>

            <div class="kna-review-submit-bar" id="decisionSummary">
                <div class="kna-review-submit-stats">
                    <div class="kna-review-stat-chip">
                        <div class="kna-review-stat-chip-label">Items Reviewed</div>
                        <div class="kna-review-stat-chip-value" id="summaryReviewed">0 / 0</div>
                    </div>
                    <div class="kna-review-stat-chip">
                        <div class="kna-review-stat-chip-label">Approved Amount</div>
                        <div class="kna-review-stat-chip-value is-approved" id="summaryApprovedAmount">₱0.00</div>
                    </div>
                    <div class="kna-review-stat-chip">
                        <div class="kna-review-stat-chip-label">Rejected Amount</div>
                        <div class="kna-review-stat-chip-value is-rejected" id="summaryRejectedAmount">₱0.00</div>
                    </div>
                </div>
                <div class="kna-review-submit-remarks">
                    <label class="kna-form-label kna-small font-weight-bold text-dark mb-1">Overall Reviewer Remarks</label>
                    <textarea class="form-control kna-small" id="reviewerRemarks" rows="2" placeholder="Optional notes for the entire request..."></textarea>
                </div>
                <div class="kna-review-submit-action">
                    <button type="button" class="btn btn-success btn-sm kna-small font-weight-bold" id="btnSubmitDecision">
                        Submit Decisions
                    </button>
                </div>
            </div>

            <div class="kna-review-items-body" id="viewApprovalItems"></div>
        </div>
    </div>

    <div class="kna-review-context-grid">
        <div class="card kna-card mb-2">
            <div class="card-body py-2">
                <div class="kna-small font-weight-bold text-muted mb-2 text-uppercase">History</div>
                <ul class="kna-timeline" id="reviewTimeline"></ul>
            </div>
        </div>
    </div>
</div>

<div id="knaLightbox" class="kna-lightbox d-none">
    <button class="kna-lightbox-close" id="knaLightboxClose">&#x2715;</button>
    <img id="knaLightboxImg" class="kna-lightbox-img" src="" alt="Attachment">
</div>