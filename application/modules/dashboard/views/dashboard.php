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
        margin: 0 0 8px;
        line-height: 1.2;
    }

    .kna-small {
        font-size: 12px !important;
        line-height: 1.35;
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

    .kna-page .row > [class*='col-'] {
        min-width: 0;
    }

    .kna-table-wrap-scroll {
        max-height: 360px;
        overflow-y: auto;
    }

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

    .kna-badge-rejected {
        background: #fdeaea;
        color: #8a2121;
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

    .kna-attention-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .kna-attention-item {
        border: 1px solid #e6edf5;
        border-radius: 6px;
        padding: 7px 10px;
        background: #fbfdff;
    }

    .kna-attention-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 4px;
    }

    .kna-attention-title {
        font-size: 12px;
        font-weight: 600;
        color: #233243;
        margin: 0;
    }

    .kna-attention-meta {
        font-size: 11px;
        color: #708090;
        margin: 0;
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

    .kna-fund-card {
        border-left: 3px solid #2f6eb4;
    }

    .kna-approval-card {
        border-left: 3px solid #b3541e;
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
    }

    @media (max-width: 575.98px) {
        .kna-small {
            font-size: 11px !important;
        }
    }
</style>

<div class="page-inner kna-page">

    <div class="kna-title">Dashboard</div>

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
        <?php if (!empty($hasActiveFund)): ?>
        <div>
            <div class="card kna-card kna-summary-card kna-fund-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-start justify-content-between">
                        <p class="kna-kpi-caption">Remaining Fund</p>
                        <?php if (!empty($allowSelfCashIn)): ?>
                        <button type="button" class="btn btn-primary btn-sm kna-small" id="btnFundCashIn">
                            <i class="fas fa-plus mr-1"></i> Cash In
                        </button>
                        <?php endif; ?>
                    </div>
                    <p class="kna-kpi" id="fundBalanceValue"><?= '₱' . number_format((float) ($revolvingFundBalance ?? 0), 2) ?></p>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <div class="row mb-2 d-none" id="pendingApprovalsRow">
        <div class="col-12">
            <div class="card kna-card kna-approval-card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Awaiting Your Action</h3>
                        <a href="<?= base_url('transactions/approvals') ?>" class="kna-small" id="pendingApprovalsCount">View all</a>
                    </div>
                    <div id="pendingApprovalsList"></div>
                </div>
            </div>
        </div>
    </div>

    <?php if (!empty($hasActiveFund)): ?>
    <div class="row mb-2">
        <div class="col-12">
            <div class="card kna-card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h3 class="kna-section-title">Fund History</h3>
                        <div class="kna-small text-muted" id="fundPassbookCount">0 transaction(s)</div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm kna-small mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Transaction</th>
                                    <th>Remarks</th>
                                    <th class="text-right">Money In</th>
                                    <th class="text-right">Money Out</th>
                                    <th class="text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody id="fundPassbookBody"></tbody>
                        </table>
                    </div>
                    <div class="text-center mt-2 d-none" id="fundPassbookMoreWrap">
                        <button type="button" class="btn btn-outline-secondary btn-sm kna-small" id="btnFundPassbookMore">Load More</button>
                    </div>
                    <div class="kna-state d-none" id="fundPassbookState"></div>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if (!empty($canManageOverdueCa)): ?>
    <div class="row mb-2">
        <div class="col-12">
            <div class="card kna-card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div>
                            <h3 class="kna-section-title">Pending Liquidations</h3>
                            <div class="kna-small" id="overdueSummary" style="font-weight:600;color:#8a2121;"></div>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm kna-small" id="btnNotifyOverdue" disabled>
                            <i class="fas fa-bell mr-1"></i> Notify Selected
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm kna-small mb-0">
                            <thead>
                                <tr>
                                    <th style="width:28px;"><input type="checkbox" id="overdueSelectAll"></th>
                                    <th>Cash Advance No</th>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th class="text-right">Amount</th>
                                    <th>Released</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Extension Remarks</th>
                                    <th class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="overdueListBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="extendDueModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Extend Liquidation Due Date — <span id="extendDueRef"></span></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="kna-form-label kna-small">New Due Date</label>
                        <input type="date" class="form-control form-control-sm kna-small" id="extendDueDate">
                    </div>
                    <div class="form-group mb-0">
                        <label class="kna-form-label kna-small">Remarks <span class="text-danger">*</span></label>
                        <textarea class="form-control form-control-sm kna-small" id="extendDueRemarks" rows="2" maxlength="500" placeholder="e.g. On official business, back on Aug 15"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary btn-sm kna-small" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm kna-small" id="btnExtendDueSave">Extend Due Date</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

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

    <?php if (!empty($hasActiveFund)): ?>
    <div class="modal fade" id="fundCashInModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cash In — Remaining Fund</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="kna-form-label kna-small">Amount</label>
                        <input type="number" step="0.01" min="0.01" class="form-control form-control-sm kna-small" id="fundCashInAmount" placeholder="0.00">
                        <small class="text-muted kna-small">Fund limit: ₱<?= number_format((float) ($revolvingFundLimit ?? 0), 2) ?> — your balance cannot exceed this.</small>
                    </div>
                    <div class="form-group mb-0">
                        <label class="kna-form-label kna-small">Remarks <span class="text-muted">(optional)</span></label>
                        <input type="text" maxlength="500" class="form-control form-control-sm kna-small" id="fundCashInRemarks" placeholder="e.g. Petty cash replenishment received">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary btn-sm kna-small" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary btn-sm kna-small" id="btnFundCashInSubmit">Record Cash In</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>
