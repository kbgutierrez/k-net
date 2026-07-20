
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

	.kna-small {
		font-size: 12px !important;
		line-height: 1.35;
	}

	.kna-form-label {
		margin-bottom: .3rem;
		font-weight: 600;
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
		margin: 0;
	}

	.kna-kpi-row { display: flex; flex-wrap: wrap; gap: .65rem; margin-bottom: .85rem; }
	.kna-kpi-row > div { flex: 1 1 160px; min-width: 140px; }
	.kna-kpi-fund { border-left: 3px solid #2f6eb4; }

	.kna-table td,
	.kna-table th {
		font-size: 12px !important;
		padding: .5rem .45rem;
		vertical-align: middle;
	}
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2">
		<div class="kna-title">New Replenishment</div>
		<a href="<?= base_url('transactions/replenishment') ?>" class="btn btn-outline-secondary btn-sm kna-small">
			<i class="fas fa-arrow-left mr-1"></i> Back
		</a>
	</div>

	<?php if (empty($hasActiveFund)): ?>
	<div class="card kna-card">
		<div class="card-body kna-small text-muted">
			You do not currently hold an active revolving fund, so there is nothing to replenish.
		</div>
	</div>
	<?php else: ?>

	<div class="kna-kpi-row">
		<div>
			<div class="card kna-card kna-kpi-fund h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Remaining Revolving Fund</p>
					<p class="kna-kpi" id="rplFundBalance">₱<?= number_format((float) ($revolvingFundBalance ?? 0), 2) ?></p>
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Claim your team's paid reimbursements as proof of expense to replenish your fund.</div>
				<div class="kna-small text-muted" id="claimableCount">—</div>
			</div>

			<div class="table-responsive">
				<table class="table table-sm kna-table" id="claimableTable" style="width:100%">
					<thead>
						<tr>
							<th style="width:32px;"><input type="checkbox" id="claimAll"></th>
							<th>Reimbursement No</th>
							<th>Filed By</th>
							<th>Description</th>
							<th class="text-right">Amount</th>
						</tr>
					</thead>
					<tbody id="claimableTbody"></tbody>
				</table>
			</div>

			<div class="mt-2">
				<label class="kna-small kna-form-label mb-1">Remarks</label>
				<textarea class="form-control form-control-sm kna-small" id="rplRemarks" rows="2" placeholder="Notes for the approver (optional)"></textarea>
			</div>

			<div class="d-flex align-items-center justify-content-between mt-2">
				<div class="kna-small">Total claimed: <strong id="claimedTotal">₱0.00</strong></div>
				<div>
					<button type="button" class="btn btn-outline-secondary btn-sm kna-small" id="btnSaveDraft">Save Draft</button>
					<button type="button" class="btn btn-primary btn-sm kna-small" id="btnSubmitReplenishment">Submit for Approval</button>
				</div>
			</div>
		</div>
	</div>

	<?php endif; ?>
</div>
