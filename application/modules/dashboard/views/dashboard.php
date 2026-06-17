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
        padding: .85rem;
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

    .kna-table td,
    .kna-table th {
        font-size: 12px !important;
        padding: .5rem .45rem;
        vertical-align: middle;
        white-space: nowrap;
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
        gap: 8px;
    }

    .kna-attention-item,
    .kna-status-item,
    .kna-reminder-item {
        border: 1px solid #e6edf5;
        border-radius: 6px;
        padding: 10px 12px;
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
        color: #7b8794;
        font-size: 12px;
        padding: 14px 8px;
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

    <div class="row mb-2">
        <div class="col-md-3 col-6 pr-md-2 mb-2 mb-md-0">
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="cash-advance">
                        <p class="kna-kpi-caption">Open Cash Advances</p>
                        <p class="kna-kpi" id="metricOpenCashAdvance">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 px-md-2 mb-2 mb-md-0">
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="liquidation">
                        <p class="kna-kpi-caption">For Liquidation</p>
                        <p class="kna-kpi" id="metricForLiquidation">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 px-md-2">
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="reimburse">
                        <p class="kna-kpi-caption">Pending Reimbursements</p>
                        <p class="kna-kpi" id="metricPendingReimbursements">0</p>
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-6 pl-md-2">
            <div class="card kna-card kna-summary-card h-100">
                <div class="card-body">
                    <button type="button" class="kna-kpi-link" data-kpi-link="month-summary">
                        <p class="kna-kpi-caption">Total Amount</p>
                        <p class="kna-kpi" id="metricMonthTotal">PHP 0.00</p>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-2">
        <div class="col-lg-7 mb-2 mb-lg-0">
            <div class="card kna-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Recent Requests</h3>
                        <div class="kna-small text-muted" id="recentRequestCount">0 item(s)</div>
                    </div>

                    <div class="kna-table-wrap d-none d-md-block">
                        <table class="table table-sm kna-table mb-0">
                            <thead>
                                <tr>
                                    <th style="width:115px;">Type</th>
                                    <th style="width:140px;">Reference</th>
                                    <th>Purpose</th>
                                    <th style="width:120px;" class="text-right">Amount</th>
                                    <th style="width:110px;">Status</th>
                                    <th style="width:110px;">Updated</th>
                                </tr>
                            </thead>
                            <tbody id="recentRequestsTbody"></tbody>
                        </table>
                    </div>

                    <div class="kna-mobile-list d-md-none" id="recentRequestsMobile"></div>
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
                        <div class="kna-small text-muted">Mock summary</div>
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

