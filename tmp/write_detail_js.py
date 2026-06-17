
content = r"""/* Liquidation Detail Page Module */

const domDetail = {
	liquidationRef: null,
	viewLiquidationNo: null,
	viewCaRef: null,
	viewCaAmount: null,
	viewDateFrom: null,
	viewDateTo: null,
	viewLiquidatedAmount: null,
	viewPurpose: null,
	viewStatus: null,
	viewSubmittedDate: null,
	viewReviewedDate: null,
	viewVariance: null,
	viewSettlementAction: null,
	viewSettlementAmount: null,
	viewExpenseItems: null,
	viewTimeline: null,
};

const renderDetailExpenseItems = (expenses) => {
	const container = domDetail.viewExpenseItems;
	if (!container) {
		return;
	}

	if (!expenses || !expenses.length) {
		container.innerHTML = '<div class="text-muted kna-small py-2">No expense items found.</div>';
		return;
	}

	const rowsHtml = expenses
		.map((expense, idx) => {
			const receiptsHtml =
				expense.receipts && expense.receipts.length
					? expense.receipts
							.map(
								(r) => `
								<div class="d-flex kna-small mt-1" style="gap:6px;flex-wrap:wrap;align-items:center;">
									<i class="fas fa-file-alt" style="color:#6366f1;font-size:11px;flex-shrink:0;"></i>
									<span class="font-weight-bold">${escapeHtml(r.fileName || '')}</span>
									${r.reference ? `<span class="text-muted">&middot; ${escapeHtml(r.reference)}</span>` : ''}
									${r.description ? `<span class="text-muted">&middot; ${escapeHtml(r.description)}</span>` : ''}
									${r.isVattable ? '<span class="kna-badge" style="background:#e9f3ff;color:#1b4f88;padding:.1rem .3rem;font-size:10px;">VAT</span>' : ''}
								</div>
							`,
							)
							.join('')
					: '<div class="kna-small text-muted mt-1"><i class="fas fa-exclamation-circle mr-1"></i>No receipts attached</div>';

			return `
				<div class="kna-item-table kna-item-table-row" style="grid-template-columns:120px 140px 110px 1fr;align-items:start;padding:8px;" data-expense-idx="${idx}">
					<div>
						<div class="kna-form-label" style="margin-bottom:2px;">Date</div>
						<div class="kna-receipt-cell">${escapeHtml(expense.expenseDate)}</div>
					</div>
					<div>
						<div class="kna-form-label" style="margin-bottom:2px;">Expense Type</div>
						<div class="kna-receipt-cell">${escapeHtml(expense.category)}</div>
					</div>
					<div>
						<div class="kna-form-label" style="margin-bottom:2px;">Amount</div>
						<div class="kna-receipt-amount-cell" style="text-align:left;">${formatPHP(expense.amount)}</div>
					</div>
					<div>
						<div class="kna-form-label" style="margin-bottom:2px;">Description / Receipts</div>
						<div class="kna-receipt-filename">${escapeHtml(expense.description)}</div>
						${receiptsHtml}
					</div>
				</div>
			`;
		})
		.join('');

	const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

	container.innerHTML = `
		<div class="kna-item-table-wrap">
			<div class="kna-item-table kna-item-table-head" style="grid-template-columns:120px 140px 110px 1fr;">
				<div>Document Date</div>
				<div>Expense Type</div>
				<div>Amount</div>
				<div>Description / Receipts</div>
			</div>
			${rowsHtml}
			<div class="kna-item-table" style="grid-template-columns:120px 140px 110px 1fr;background:#f0f4f8;border-color:#d1d5db;">
				<div></div>
				<div class="kna-small font-weight-bold text-right" style="color:#374151;">Total</div>
				<div class="kna-receipt-amount-cell" style="text-align:left;color:#374151;">${formatPHP(total)}</div>
				<div></div>
			</div>
		</div>
	`;
};

const renderDetailTimeline = (timeline) => {
	const container = domDetail.viewTimeline;
	if (!container) {
		return;
	}

	if (!timeline || !timeline.length) {
		container.innerHTML = '<div class="text-muted kna-small">No timeline available.</div>';
		return;
	}

	container.innerHTML = `
		<ul class="kna-timeline">
			${timeline.map((entry) => `<li class="kna-small">${escapeHtml(entry)}</li>`).join('')}
		</ul>
	`;
};

const cacheDetailDom = () => {
	domDetail.liquidationRef = document.getElementById('liquidationRef');
	domDetail.viewLiquidationNo = document.getElementById('viewLiquidationNo');
	domDetail.viewCaRef = document.getElementById('viewCaRef');
	domDetail.viewCaAmount = document.getElementById('viewCaAmount');
	domDetail.viewDateFrom = document.getElementById('viewDateFrom');
	domDetail.viewDateTo = document.getElementById('viewDateTo');
	domDetail.viewLiquidatedAmount = document.getElementById('viewLiquidatedAmount');
	domDetail.viewPurpose = document.getElementById('viewPurpose');
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewSubmittedDate = document.getElementById('viewSubmittedDate');
	domDetail.viewReviewedDate = document.getElementById('viewReviewedDate');
	domDetail.viewVariance = document.getElementById('viewVariance');
	domDetail.viewSettlementAction = document.getElementById('viewSettlementAction');
	domDetail.viewSettlementAmount = document.getElementById('viewSettlementAmount');
	domDetail.viewExpenseItems = document.getElementById('viewExpenseItems');
	domDetail.viewTimeline = document.getElementById('viewTimeline');
};

const initDetailPage = () => {
	cacheDetailDom();

	const ref = normalizeDate(domDetail.liquidationRef ? domDetail.liquidationRef.value : '');
	const record = mockLiquidations.find((liq) => normalizeDate(liq.liquidationNo) === ref);

	if (!record) {
		if (domDetail.viewLiquidationNo) {
			domDetail.viewLiquidationNo.textContent = ref || 'N/A';
		}
		if (domDetail.viewExpenseItems) {
			domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Record not found.</div>';
		}
		return;
	}

	// Compute variance & settlement
	const variance = varianceValue(record);
	const settlement = settlementFromVariance(variance);

	// Populate info fields
	domDetail.viewLiquidationNo.textContent = record.liquidationNo;
	domDetail.viewCaRef.textContent = record.cashAdvanceRef;
	domDetail.viewCaAmount.textContent = formatPHP(record.advancedAmount);
	domDetail.viewLiquidatedAmount.textContent = formatPHP(record.liquidatedAmount);
	domDetail.viewPurpose.textContent = record.purpose;

	// Status badge
	if (domDetail.viewStatus) {
		domDetail.viewStatus.innerHTML = getStatusBadge(record.status);
	}

	// Submitted / reviewed dates
	if (domDetail.viewSubmittedDate) {
		domDetail.viewSubmittedDate.textContent = record.submittedDate;
	}
	if (domDetail.viewReviewedDate) {
		domDetail.viewReviewedDate.textContent = record.reviewedDate || '-';
	}

	// Date from / to derived from expense dates range
	if (record.expenses && record.expenses.length) {
		const dates = record.expenses.map((e) => e.expenseDate).filter(Boolean).sort();
		if (domDetail.viewDateFrom) {
			domDetail.viewDateFrom.textContent = dates[0] || '-';
		}
		if (domDetail.viewDateTo) {
			domDetail.viewDateTo.textContent = dates[dates.length - 1] || '-';
		}
	}

	// Variance
	if (domDetail.viewVariance) {
		domDetail.viewVariance.textContent = varianceLabel(record);
	}

	// Settlement
	if (domDetail.viewSettlementAction) {
		domDetail.viewSettlementAction.textContent = settlement.action;
	}
	if (domDetail.viewSettlementAmount) {
		domDetail.viewSettlementAmount.textContent = settlement.amount;
	}

	// Render expense items and timeline
	renderDetailExpenseItems(record.expenses);
	renderDetailTimeline(record.timeline);
};
"""

with open(r'z:\htdocs\k-net\assets\js\modules\liquidation\detail.js', 'w', encoding='utf-8') as f:
    f.write(content.lstrip('\n'))

print('done', len(content), 'chars')
