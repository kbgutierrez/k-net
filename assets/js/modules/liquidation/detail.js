
const domDetail = {
	liquidationRef: null,
	viewLiquidationNo: null,
	viewCaRef: null,
	viewCaAmount: null,
	viewCaDate: null,
	viewExpenseDate: null,
	viewLiquidatedAmount: null,
	viewVariance: null,
	viewPurpose: null,
	viewStatus: null,
	viewSubmittedDate: null,
	viewExpenseItems: null,
	viewTimeline: null,
};

const IMG_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;

const openLightbox = (url) => {
	const lb = document.getElementById('knaLightbox');
	const img = document.getElementById('knaLightboxImg');
	if (lb && img) {
		img.src = url;
		lb.classList.remove('d-none');
	}
};

const renderAttachment = (name) => {
	const url = `${base_url}assets/uploads/attachments/${encodeURIComponent(name)}`;
	if (IMG_EXTS.test(name)) {
		return `<span class="kna-thumb-wrap" data-lightbox="${escapeHtml(url)}">
			<img class="kna-thumb" src="${url}" alt="${escapeHtml(name)}" loading="lazy">
			<span class="kna-thumb-label">${escapeHtml(name)}</span>
		</span>`;
	}
	return `<span class="kna-file-wrap">
		<i class="fas fa-file-alt" style="color:#6366f1;font-size:11px;"></i>
		<a href="${url}" target="_blank" rel="noopener">${escapeHtml(name)}</a>
	</span>`;
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
		.map((expense, i) => {
			const docDate = normalizeDate(expense.document_date || '').slice(0, 10);
			const category = normalizeDate(expense.category_name || '');
			const reference = normalizeDate(expense.invoice_receipt_no || '') || '\u2014';
			const amount = Number(expense.actual_amount || 0);
			const netAmt = Number(expense.net_amount || 0);
			const vatAmt = Number(expense.vat_amount || 0);
			const isVattable = Boolean(Number(expense.is_vatable));
			const description = normalizeDate(expense.description || '');

			const attachNames = normalizeDate(expense.attachment || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
			const attachHtml = attachNames.length
				? attachNames.map(renderAttachment).join('')
				: '<span class="text-muted" style="font-size:11px;">\u2014</span>';

			const vatBadge = isVattable
				? '<input type="checkbox" class="kna-vat-check" checked disabled>'
				: '<input type="checkbox" class="kna-vat-check" disabled>';

			const amountHtml = isVattable
				? `<div class="kna-amount-main">${formatPHP(amount)}</div><div class="kna-amount-breakdown">Net ${formatPHP(netAmt)}</div><div class="kna-amount-breakdown">VAT ${formatPHP(vatAmt)}</div>`
				: `<div class="kna-amount-main">${formatPHP(amount)}</div>`;

			return `
				<tr>
					<td class="text-center kna-rownum kna-cell-index" data-label="#">${i + 1}</td>
					<td data-label="Date">${escapeHtml(docDate)}</td>
					<td data-label="Category">${escapeHtml(category)}</td>
					<td data-label="Reference">${escapeHtml(reference)}</td>
					<td class="text-center kna-cell-vat" data-label="VAT">${vatBadge}</td>
					<td class="kna-cell-attachment" data-label="Attachment">${attachHtml}</td>
					<td data-label="Remarks">${escapeHtml(description)}</td>
					<td class="text-right kna-cell-amount" data-label="Amount">${amountHtml}</td>
				</tr>
			`;
		})
		.join('');

	const mobileCardsHtml = expenses
		.map((expense, i) => {
			const docDate = normalizeDate(expense.document_date || '').slice(0, 10);
			const category = normalizeDate(expense.category_name || '');
			const reference = normalizeDate(expense.invoice_receipt_no || '') || '\u2014';
			const amount = Number(expense.actual_amount || 0);
			const netAmt = Number(expense.net_amount || 0);
			const vatAmt = Number(expense.vat_amount || 0);
			const isVattable = Boolean(Number(expense.is_vatable));
			const description = normalizeDate(expense.description || '') || '\u2014';

			const attachNames = normalizeDate(expense.attachment || '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const amountHtml = isVattable
				? `<div class="kna-amount-main">${formatPHP(amount)}</div><div class="kna-amount-breakdown">Net ${formatPHP(netAmt)}</div><div class="kna-amount-breakdown">VAT ${formatPHP(vatAmt)}</div>`
				: `<div class="kna-amount-main">${formatPHP(amount)}</div>`;

			return `
				<div class="kna-exp-card">
					<div class="kna-exp-card-head">
						<div>
							<div class="kna-exp-card-title">${escapeHtml(category || 'Expense Item')} <span class="kna-exp-card-sub">#${i + 1}</span></div>
							<div class="kna-exp-card-meta">${escapeHtml(docDate)} • ${escapeHtml(reference)}</div>
						</div>
						<div class="kna-exp-card-amount">${amountHtml}</div>
					</div>

					<div class="kna-exp-card-grid">
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">VAT</span>
							<span class="kna-exp-card-value">
								<input type="checkbox" class="kna-vat-check" ${isVattable ? 'checked' : ''} disabled>
							</span>
						</div>
						<div class="kna-exp-card-field kna-exp-card-field-full">
							<span class="kna-exp-card-label">Remarks</span>
							<span class="kna-exp-card-value">${escapeHtml(description)}</span>
						</div>
					</div>

					<div class="kna-exp-card-field kna-exp-card-field-full">
						<span class="kna-exp-card-label">Attachment</span>
						<span class="kna-exp-card-value kna-exp-card-attach">
							${attachNames.length ? attachNames.map(renderAttachment).join('') : '<span class="text-muted">\u2014</span>'}
						</span>
					</div>
				</div>
			`;
		})
		.join('');

	const total    = expenses.reduce((sum, e) => sum + Number(e.actual_amount || 0), 0);
	const totalNet = expenses.reduce((sum, e) => sum + Number(e.net_amount    || 0), 0);
	const totalVat = expenses.reduce((sum, e) => sum + Number(e.vat_amount    || 0), 0);

	container.innerHTML = `
		<div class="kna-exp-wrap">
			<div class="kna-exp-mobile">${mobileCardsHtml}</div>
			<table class="kna-exp-table">
				<thead>
					<tr>
						<th style="width:34px;">#</th>
						<th style="width:96px;">Date</th>
						<th style="width:120px;">Category</th>
						<th style="width:110px;">Reference</th>
						<th style="width:72px;" class="text-center">VAT</th>
						<th style="min-width:110px;">Attachment</th>
						<th>Remarks</th>
						<th style="width:130px;" class="text-right">Amount</th>
					</tr>
				</thead>
				<tbody>${rowsHtml}</tbody>
				<tfoot>
					<tr>
						<td colspan="7" class="text-right" style="font-size:12px;">Total</td>
						<td class="text-right">
							<div class="kna-amount-main">${formatPHP(total)}</div>
							<div class="kna-amount-breakdown">Net ${formatPHP(totalNet)}</div>
							<div class="kna-amount-breakdown">VAT ${formatPHP(totalVat)}</div>
						</td>
					</tr>
				</tfoot>
			</table>
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
	domDetail.viewCaDate = document.getElementById('viewCaDate');
	domDetail.viewExpenseDate = document.getElementById('viewExpenseDate');
	domDetail.viewLiquidatedAmount = document.getElementById('viewLiquidatedAmount');
	domDetail.viewVariance = document.getElementById('viewVariance');
	domDetail.viewPurpose = document.getElementById('viewPurpose');
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewSubmittedDate = document.getElementById('viewSubmittedDate');
	domDetail.viewExpenseItems = document.getElementById('viewExpenseItems');
	domDetail.viewTimeline = document.getElementById('viewTimeline');

	// Lightbox — thumbnail click delegation
	if (domDetail.viewExpenseItems) {
		domDetail.viewExpenseItems.addEventListener('click', (e) => {
			const wrap = e.target.closest('[data-lightbox]');
			if (wrap) {
				openLightbox(wrap.getAttribute('data-lightbox'));
			}
		});
	}
	const lbEl = document.getElementById('knaLightbox');
	if (lbEl) {
		lbEl.addEventListener('click', (e) => {
			if (e.target === lbEl || e.target.id === 'knaLightboxClose') {
				lbEl.classList.add('d-none');
				document.getElementById('knaLightboxImg').src = '';
			}
		});
	}
};

const initDetailPage = () => {
	cacheDetailDom();

	const ref = normalizeDate(domDetail.liquidationRef ? domDetail.liquidationRef.value : '');

	if (!ref) {
		if (domDetail.viewExpenseItems) {
			domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Record not found.</div>';
		}
		return;
	}

	if (domDetail.viewLiquidationNo) {
		domDetail.viewLiquidationNo.textContent = ref;
	}

	// Load header info (fetch all headers for user, find matching record)
	ajax_loader('transactions/liquidation/api/get/header', { Take: 100 }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			return;
		}

		const record = (res.data || []).find((r) => normalizeDate(r.liquidation_id) === ref);
		if (!record) {
			return;
		}

		if (domDetail.viewLiquidationNo) {
			domDetail.viewLiquidationNo.textContent = normalizeDate(record.liquidation_id);
		}
		if (domDetail.viewCaRef) {
			domDetail.viewCaRef.textContent = normalizeDate(record.cash_advance_id);
		}
		if (domDetail.viewCaAmount) {
			domDetail.viewCaAmount.textContent = formatPHP(Number(record.ca_amount || 0));
		}
		if (domDetail.viewCaDate) {
			domDetail.viewCaDate.textContent = normalizeDate(record.submitted_date || '').slice(0, 10);
		}
		if (domDetail.viewLiquidatedAmount) {
			domDetail.viewLiquidatedAmount.textContent = formatPHP(Number(record.total_amount_spent || 0));
		}
		if (domDetail.viewStatus) {
			domDetail.viewStatus.innerHTML = getStatusBadge(normalizeDate(record.status_name));
		}
		if (domDetail.viewSubmittedDate) {
			domDetail.viewSubmittedDate.textContent = normalizeDate(record.submitted_date || '').slice(0, 10);
		}
		const refund = Number(record.refund_amount || 0);
		const reimburse = Number(record.reimburse_amount || 0);
		if (domDetail.viewVariance) {
			let badgeHtml = '<span class="kna-var-badge kna-var-balanced">0.00</span>';
			if (refund > 0) {
				badgeHtml = `<span class="kna-var-badge kna-var-return">${formatPHP(refund)} to return</span>`;
			} else if (reimburse > 0) {
				badgeHtml = `<span class="kna-var-badge kna-var-reimburse">${formatPHP(reimburse)} to reimburse</span>`;
			}
			domDetail.viewVariance.innerHTML = badgeHtml;
		}
		if (domDetail.viewPurpose) {
			domDetail.viewPurpose.textContent = normalizeDate(record.description || '') || '-';
		}
	});

	// Load expense details
	ajax_loader('transactions/liquidation/api/get/details', { LiquidationId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			if (domDetail.viewExpenseItems) {
				domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
			}
			return;
		}

		const expenses = res.data || [];
		renderDetailExpenseItems(expenses);

		if (domDetail.viewExpenseDate && expenses.length) {
			const dates = expenses
				.map((e) => normalizeDate(e.document_date || '').slice(0, 10))
				.filter(Boolean)
				.sort();
			const first = dates[0] || '-';
			const last = dates[dates.length - 1] || '-';
			domDetail.viewExpenseDate.textContent = first === last ? first : `${first} – ${last}`;
		}

		if (domDetail.viewTimeline) {
			domDetail.viewTimeline.innerHTML = '<div class="text-muted kna-small">No timeline data available.</div>';
		}
	}).fail(() => {
		if (domDetail.viewExpenseItems) {
			domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
		}
	});
};
