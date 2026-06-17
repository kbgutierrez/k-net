<style>
    .kna-page {
        padding: 12px 14px;
    }

    .kna-card {
        border: 1px solid #d9e0e7 !important;
        border-radius: 6px;
        background: #fff;
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

    .kna-small {
        font-size: 12px !important;
        line-height: 1.35;
    }

    .kna-table td,
    .kna-table th {
        font-size: 12px !important;
        padding: .5rem .45rem;
        vertical-align: middle;
        white-space: nowrap;
    }

    .kna-table-shell {
        display: flex;
        width: 100%;
        border: 1px solid #e5ecf3;
        border-radius: 6px;
        overflow: hidden;
    }

    .kna-table-wrap-main {
        flex: 1 1 auto;
        overflow-x: auto;
        overflow-y: hidden;
    }

    .kna-table-main {
        min-width: 1120px;
        margin-bottom: 0;
    }

    .kna-table-action {
        width: 100px;
        margin-bottom: 0;
        border-left: 1px solid #e5ecf3;
    }

    .kna-table-action th,
    .kna-table-action td {
        text-align: center;
        background: #fff;
    }

    .kna-table-main th,
    .kna-table-action th {
        background: #f8fbff;
    }

    .kna-tab {
        border: 1px solid #d9e0e7;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
        background: #fff;
        color: #32475b;
        cursor: pointer;
    }

    .kna-tab.is-active {
        background: #2f6eb4;
        border-color: #2f6eb4;
        color: #fff;
    }

    .kna-badge {
        padding: .2rem .4rem;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        display: inline-block;
    }

    .kna-badge-pending {
        background: #fff9db;
        color: #f59f00;
    }

    .kna-badge-approved {
        background: #e8f7ee;
        color: #17663a;
    }

    .kna-badge-rejected {
        background: #fff5f5;
        color: #e03131;
    }

    .kna-timeline {
        position: relative;
        padding-left: 24px;
        list-style: none;
        margin: 0;
    }

    .kna-timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 5px;
        bottom: 5px;
        width: 2px;
        background: #e9ecef;
    }

    .kna-timeline-item {
        position: relative;
        margin-bottom: 12px;
        font-size: 12px;
    }

    .kna-timeline-item::before {
        content: '';
        position: absolute;
        left: -21px;
        top: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #fff;
        background: #dee2e6;
        box-shadow: 0 0 0 2px #dee2e6;
    }

    .kna-timeline-item.is-current::before {
        background: #2f6eb4;
        box-shadow: 0 0 0 2px #2f6eb4;
    }

    .kna-timeline-item.is-done::before {
        background: #17663a;
        box-shadow: 0 0 0 2px #17663a;
    }

    .kna-timeline-item.is-error::before {
        background: #e03131;
        box-shadow: 0 0 0 2px #e03131;
    }

    @media (max-width: 767.98px) {
        .kna-page {
            padding: 8px 8px 12px;
        }

        .kna-table-shell {
            flex-direction: column;
        }

        .kna-table-action {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5ecf3;
        }
    }
    @media (max-width:767.98px){

    .kna-table-shell{
        display:none;
    }

    .kna-mobile-card{
        border:1px solid #e5ecf3;
        border-radius:8px;
        padding:12px;
        margin-bottom:10px;
        background:#fff;
    }

}
</style>

<div class="page-inner kna-page" id="approvalsListPage">
    <div class="d-flex align-items-center justify-content-between mb-2">
        <div>
            <div class="kna-title">Pending Approvals</div>
        </div>
    </div>

    <div class="card kna-card mb-2">
        <div class="card-body py-2 d-flex align-items-center flex-wrap" style="gap:.5rem;">
            <button class="kna-tab is-active" data-transaction-type="ALL">All Items</button>
            <button class="kna-tab" data-transaction-type="CASH_ADVANCE">Cash Advance</button>
            <button class="kna-tab" data-transaction-type="LIQUIDATION">Liquidation</button>
            <button class="kna-tab" data-transaction-type="REIMBURSEMENT">Reimbursement</button>
        </div>
    </div>

    <div class="card kna-card">
        <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="kna-small text-muted">Awaiting Your Action</div>
                <div class="kna-small text-muted" id="resultCount">0 Records</div>
            </div>
            <div class="kna-table-shell">
                <div class="kna-table-wrap-main">
                    <table class="table table-sm kna-table kna-table-main" style="width:100%">
                        <thead>
                            <tr>
                                <th>Transaction No.</th>
                                <th>Type</th>
                                <th>Requestor</th>
                                <th>Department</th>
                                <th>Amount</th>
                                <th>Submission Date</th>
                            
                            </tr>
                        </thead>
                        <tbody id="matrixTbodyMain"></tbody>
                    </table>
                </div>
                <div>
                    <table class="table table-sm kna-table kna-table-action">
                        <thead>
                            <tr>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="matrixTbodyAction"></tbody>
                    </table>
                </div>
            </div>
                    <div class="kna-mobile-list d-md-none">
            <div class="kna-mobile-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="font-weight-bold">CA-2026-0089</div>
                        <div class="text-muted">Cash Advance</div>
                    </div>
  
                </div>

                <div class="mt-2 kna-small">
                    <div><strong>Requestor:</strong> John Doe</div>
                    <div><strong>Department:</strong> IT</div>
                    <div><strong>Amount:</strong> ₱25,000.00</div>
                    <div><strong>Date:</strong> Jun 10, 2026</div>
                </div>

                <div class="mt-2">
                    <button class="btn btn-primary btn-sm btn-block">
                        Review
                    </button>
                </div>
            </div>
        </div>
            <div class="d-flex justify-content-end mt-2">
                <nav aria-label="Approvals desktop pagination">
                    <ul class="pagination pagination-sm mb-0" id="desktopPagination"></ul>
                </nav>
            </div>
        </div>

    </div>
    
</div>