<style>
    .kna-page {
        padding: 12px 14px;
    }

    .kna-card {
        border: 1px solid #d9e0e7 !important;
        border-radius: 6px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(20, 30, 50, .05);
    }

    .kna-card .card-body {
        padding: .7rem .75rem;
    }

    .kna-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        line-height: 1.2;
    }

    .kna-subtitle {
        font-size: 12px;
        color: #6c757d;
        margin: 4px 0 0;
    }

    .kna-small {
        font-size: 12px !important;
        line-height: 1.35;
    }

    .kna-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
    }

    .kna-topbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .kna-scope {
        display: inline-flex;
        border: 1px solid #d7dee7;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
    }

    .kna-scope-btn {
        border: 0;
        background: #fff;
        color: #4a5a6a;
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
        padding: 7px 10px;
        cursor: pointer;
    }

    .kna-scope-btn+.kna-scope-btn {
        border-left: 1px solid #e4e9f0;
    }

    .kna-scope-btn.is-active {
        background: #263645;
        color: #fff;
    }

    .kna-last-updated {
        font-size: 11px;
        color: #6b7a89;
    }

    .kna-kpi {
        font-size: 19px;
        line-height: 1.15;
        font-weight: 600;
        margin: 0;
        color: #1d2a3a;
    }

    .kna-kpi-caption {
        font-size: 11px;
        color: #6c757d;
        margin: 0 0 6px;
        text-transform: uppercase;
        letter-spacing: .3px;
    }

    .kna-section-title {
        font-size: 13px;
        font-weight: 700;
        color: #243447;
        margin: 0;
    }

    /* Bootstrap flex columns won't shrink below their content's
       intrinsic width by default — kept in case any other wide
       content ends up in a grid column on this page. */
    .kna-page .row > [class*='col-'] {
        min-width: 0;
    }

    .kna-table-wrap-scroll {
        max-height: 360px;
        overflow-y: auto;
    }

    /* Recent Requests — a single list design for every screen size
       instead of a multi-column table, since a table needs real
       column-width fights to stay readable and this data doesn't
       need to be scanned column-by-column. Each row reads top to
       bottom like a receipt: what it is, then the numbers. */
    .kna-request-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 4px;
        border-bottom: 1px solid #f0f3f7;
        text-decoration: none;
    }

    .kna-request-item:last-child {
        border-bottom: none;
    }

    .kna-request-icon {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }

    .kna-request-icon.type-cash-advance { background: #e6f4ff; color: #0056b3; }
    .kna-request-icon.type-liquidation { background: #fff4e0; color: #8a5a00; }
    .kna-request-icon.type-reimbursement { background: #f3e8ff; color: #6b21a8; }

    .kna-request-main {
        flex: 1 1 auto;
        min-width: 0;
    }

    .kna-request-ref {
        font-size: 12px;
        font-weight: 700;
        color: #1f2937;
    }

    .kna-request-purpose {
        font-size: 11px;
        color: #708090;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-top: 1px;
    }

    .kna-request-side {
        flex: 0 0 auto;
        text-align: right;
    }

    .kna-request-amount {
        font-size: 13px;
        font-weight: 700;
        color: #1d2a3a;
    }

    .kna-request-meta {
        font-size: 10px;
        color: #9aa7b4;
        margin-top: 3px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
    }

    .kna-actions .btn {
        padding: .3rem .55rem;
        font-size: 12px;
    }

    .kna-badge {
        padding: .2rem .45rem;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        display: inline-block;
    }

    .kna-badge-pending {
        background: #fff5d9;
        color: #7a5b00;
    }

    .kna-badge-approved {
        background: #e8f7ee;
        color: #17663a;
    }

    .kna-badge-liquidation {
        background: #e9f3ff;
        color: #1b4f88;
    }

    .kna-badge-submitted {
        background: #eef2f7;
        color: #495869;
    }

    .kna-badge-reimburse {
        background: #fef0e7;
        color: #a34a14;
    }

    .kna-summary-card {
        min-height: 100%;
    }

    .kna-kpi-link {
        width: 100%;
        border: 0;
        background: transparent;
        padding: 0;
        text-align: left;
        cursor: pointer;
    }

    .kna-kpi-link:focus {
        outline: none;
    }

    .kna-kpi-link:focus-visible {
        outline: 2px solid #2f6eb4;
        outline-offset: 2px;
        border-radius: 4px;
    }

    .kna-kpi-link:hover .kna-kpi {
        color: #0b4f8c;
    }

    .kna-attention-list,
    .kna-status-list,
    .kna-reminder-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .kna-attention-item,
    .kna-status-item,
    .kna-reminder-item {
        border: 1px solid #e6edf5;
        border-radius: 6px;
        padding: 7px 10px;
        background: #fbfdff;
    }

    .kna-attention-head,
    .kna-status-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 4px;
    }

    .kna-attention-title,
    .kna-status-title {
        font-size: 12px;
        font-weight: 600;
        color: #233243;
        margin: 0;
    }

    .kna-status-meta,
    .kna-attention-meta,
    .kna-muted-line {
        font-size: 11px;
        color: #708090;
        margin: 0;
    }

    .kna-status-bar {
        height: 6px;
        border-radius: 999px;
        background: #edf2f7;
        overflow: hidden;
        margin-top: 8px;
    }

    .kna-status-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #245c96, #4d88c7);
    }

    .kna-table-wrap {
        overflow-x: auto;
    }

    .kna-mobile-list .kna-item {
        border: 1px solid #dde3eb;
        border-radius: 6px;
        padding: .65rem;
        margin-bottom: .5rem;
        background: #fff;
    }

    .kna-mobile-list .kna-item:last-child {
        margin-bottom: 0;
    }

    .kna-mobile-list .kna-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .45rem;
        margin-bottom: .25rem;
    }

    .kna-mobile-list .kna-row:last-child {
        margin-bottom: 0;
    }

    .kna-empty {
        text-align: center;
        color: #9aa7b4;
        font-size: 12px;
        padding: 28px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .kna-empty::before {
        content: '✓';
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #eef6f0;
        color: #3fa45e;
        font-size: 15px;
        font-weight: 700;
    }

    .kna-state {
        text-align: center;
        color: #7b8794;
        font-size: 12px;
        padding: 14px 8px;
        border: 1px dashed #d6dee7;
        border-radius: 6px;
        background: #fcfdff;
    }

    .kna-state-error {
        color: #8c2d2d;
        border-color: #eabebe;
        background: #fff7f7;
    }

    .kna-kpi-row { display: flex; flex-wrap: wrap; gap: .65rem; margin-bottom: .65rem; }
    .kna-kpi-row > div { flex: 1 1 160px; min-width: 140px; }

    .kna-approval-card {
        border-left: 3px solid #b3541e;
    }

    .kna-fund-card {
        border-left: 3px solid #2f6eb4;
    }

    .kna-approval-item {
        border: 1px solid #f0e0d0;
        border-radius: 6px;
        padding: 7px 10px;
        background: #fffaf5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
    }

    .kna-approval-item:last-child {
        margin-bottom: 0;
    }

    .kna-approval-main {
        min-width: 0;
    }

    .kna-approval-ref {
        font-size: 12px;
        font-weight: 700;
        color: #233243;
    }

    .kna-approval-meta {
        font-size: 11px;
        color: #708090;
        margin: 2px 0 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .kna-approval-amount {
        font-size: 12px;
        font-weight: 700;
        color: #1d2a3a;
        white-space: nowrap;
    }

    .kna-status-chart-wrap {
        position: relative;
        height: 150px;
        margin-bottom: 8px;
    }

    @media (max-width: 991.98px) {
        .kna-page {
            padding: 10px;
        }

        .kna-title {
            font-size: 17px;
        }

        .kna-card .card-body {
            padding: .7rem;
        }

        .kna-stack-mobile {
            flex-direction: column;
            align-items: stretch !important;
            gap: .5rem;
        }

        .kna-mobile-cta {
            width: 100%;
        }

        .kna-topbar {
            flex-direction: column;
            align-items: stretch;
        }

        .kna-topbar-right {
            justify-content: space-between;
        }

        .kna-scope {
            width: 100%;
        }

        .kna-scope-btn {
            flex: 1 1 0;
            padding: 9px 8px;
        }

        .kna-kpi-row > div {
            flex: 1 1 calc(50% - .35rem);
            min-width: 0;
        }

        .kna-approval-item {
            flex-wrap: wrap;
        }

        .kna-approval-item .btn {
            width: 100%;
            order: 3;
        }

        .kna-status-chart-wrap {
            height: 220px;
        }
    }

    @media (max-width: 575.98px) {
        .kna-small {
            font-size: 11px !important;
        }
    }
</style>

<div class="page-inner kna-page">
    
    <div class="kna-topbar">
        <div>
            <div class="kna-title">Expense Dashboard</div>
        </div>
        <div class="kna-topbar-right">
            <div class="kna-scope" role="group" aria-label="Dashboard range">
                <button type="button" class="kna-scope-btn" data-scope="today">Today</button>
                <button type="button" class="kna-scope-btn" data-scope="week">This Week</button>
                <button type="button" class="kna-scope-btn is-active" data-scope="month">This Month</button>
            </div>
        </div>
    </div>

    <div class="kna-kpi-row">
        <div>
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="cash-advance">
                        <p class="kna-kpi-caption">Open Cash Advances</p>
                        <p class="kna-kpi" id="metricOpenCashAdvance">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div>
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="liquidation">
                        <p class="kna-kpi-caption">For Liquidation</p>
                        <p class="kna-kpi" id="metricForLiquidation">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div>
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="reimburse">
                        <p class="kna-kpi-caption">Pending Reimbursements</p>
                        <p class="kna-kpi" id="metricPendingReimbursements">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div>
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="month-summary">
                        <p class="kna-kpi-caption">Total Amount</p>
                        <p class="kna-kpi" id="metricMonthTotal">PHP 0.00</p>
                    </button>
                </div>
            </div>
        </div>
        <?php if (!empty($hasActiveFund)): ?>
        <div>
            <div class="card kna-card kna-summary-card kna-fund-card h-100">
                <div class="card-body">
                    <p class="kna-kpi-caption">Remaining Revolving Fund</p>
                    <p class="kna-kpi"><?= '₱' . number_format((float) ($revolvingFundBalance ?? 0), 2) ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <div class="row mb-2">
        <div class="col-lg-7 mb-2 mb-lg-0">
            <div class="card kna-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Recent Requests</h3>
                        <div class="kna-small text-muted" id="recentRequestCount">0 item(s)</div>
                    </div>

                    <div class="kna-request-list kna-table-wrap-scroll" id="recentRequestsMobile"></div>
                    <div class="kna-state d-none" id="recentRequestsState"></div>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card kna-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Needs Attention</h3>
                        <div class="kna-small text-muted" id="attentionCount">0 item(s)</div>
                    </div>
                    <div class="kna-attention-list" id="attentionList"></div>
                    <div class="kna-state d-none" id="attentionState"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-lg-7 mb-2 mb-lg-0">
            <div class="card kna-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Status Overview</h3>
                        <div class="kna-small text-muted">Current workload</div>
                    </div>
                    <div class="kna-status-chart-wrap">
                        <canvas id="statusOverviewChart"></canvas>
                    </div>
                    <div class="kna-status-list" id="statusOverviewList"></div>
                    <div class="kna-state d-none" id="statusState"></div>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card kna-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">This Month</h3>
                        <div class="kna-small text-muted" id="dashboardLastUpdated">Live totals</div>
                    </div>
                    <div class="kna-reminder-list">
                        <div class="kna-reminder-item">
                            <p class="kna-kpi-caption">Cash Advance Released</p>
                            <p class="kna-kpi" id="monthCashAdvance">PHP 0.00</p>
                        </div>
                        <div class="kna-reminder-item">
                            <p class="kna-kpi-caption">Liquidated</p>
                            <p class="kna-kpi" id="monthLiquidated">PHP 0.00</p>
                        </div>
                        <div class="kna-reminder-item">
                            <p class="kna-kpi-caption">Reimbursed</p>
                            <p class="kna-kpi" id="monthReimbursed">PHP 0.00</p>
                        </div>
                        <div class="kna-reminder-item">
                            <p class="kna-section-title mb-1">Reminders</p>
                            <p class="kna-muted-line mb-1">Liquidate cash advances on time to keep requests moving.</p>
                            <p class="kna-muted-line mb-0">Keep receipts complete so reimbursement approval is faster.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

