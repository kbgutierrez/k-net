const domReview = {
	approvalRef: null,
	reviewTitle: null,
	reviewStatusBadge: null,
	reviewHeaderFields: null,
	viewApprovalItems: null,
	reviewTimeline: null,
	summaryReviewed: null,
	summaryApprovedAmount: null,
	summaryRejectedAmount: null,
	reviewerRemarks: null,
	btnSubmitDecision: null,
};

const IMG_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;

const formatPHP = (n) => {
	const num = Number(n) || 0;
	return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const normalizeDate = (str) => {
	if (str == null) return '';
	const clean = String(str).trim();
	if (!clean || clean === 'null' || clean === 'undefined') return '';
	return clean;
};

const getStatusBadge = (statusName) => {
	const name = String(statusName || '').toLowerCase();
	if (name.includes('pending')) return '<span class="kna-badge kna-badge-pending">Pending Approval</span>';
	if (name.includes('approved') || name.includes('approve')) return '<span class="kna-badge kna-badge-approved">Approved</span>';
	if (name.includes('rejected') || name.includes('reject')) return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	if (name.includes('partial')) return '<span class="kna-badge kna-badge-partial">Partially Approved</span>';
	return '<span class="kna-badge kna-badge-pending">' + escapeHtml(statusName || 'Pending') + '</span>';
};

const escapeHtml = (str) => {
	if (str == null) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
};

const openLightbox = (url) => {
	const lb = document.getElementById('knaLightbox');
	const img = document.getElementById('knaLightboxImg');
	if (lb && img) {
		img.src = url;
		lb.classList.remove('d-none');
	}
};

const calculateVat = (grossAmount, isVatable) => {
	if (!isVatable || !grossAmount) {
		return { netAmount: grossAmount, vatAmount: 0, grossAmount: grossAmount };
	}
	const net = Number(grossAmount) / 1.12;
	const vat = Number(grossAmount) - net;
	return {
		netAmount: Math.round(net * 100) / 100,
		vatAmount: Math.round(vat * 100) / 100,
		grossAmount: Number(grossAmount)
	};
};

let reviewState = {
	transactionType: null,
	referenceNo: null,
	items: [],
	header: null,
	decisions: {},
	totalItems: 0,
	reviewedCount: 0,
	approvedAmount: 0,
	rejectedAmount: 0,
};

const ATTACHMENTS_BASE = base_url + 'assets/uploads/attachments/';

const renderAttachment = (name) => {
	const url = ATTACHMENTS_BASE + encodeURIComponent(name);
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

// ─── SYNC ROW HEIGHTS between main and action tables ───
const syncRowHeights = () => {
	const mainTable = document.querySelector('.kna-review-table-main');
	const actionTable = document.querySelector('.kna-review-table-action');
	if (!mainTable || !actionTable) return;

	const mainRows = mainTable.querySelectorAll('tbody tr[data-item-key]');
	const actionRows = actionTable.querySelectorAll('tbody tr[data-item-key]');

	mainRows.forEach(row => { row.style.height = ''; });
	actionRows.forEach(row => { row.style.height = ''; });

	const actionRowMap = new Map();
	actionRows.forEach(row => {
		const key = row.getAttribute('data-item-key');
		if (key) actionRowMap.set(key, row);
	});

	mainRows.forEach(mainRow => {
		const key = mainRow.getAttribute('data-item-key');
		const actionRow = actionRowMap.get(key);
		if (!actionRow) return;

		const mainHeight = mainRow.getBoundingClientRect().height;
		const actionHeight = actionRow.getBoundingClientRect().height;
		const maxHeight = Math.max(mainHeight, actionHeight);

		mainRow.style.height = maxHeight + 'px';
		actionRow.style.height = maxHeight + 'px';
	});
};

// ─── UPDATE REJECT BUTTON ICON ───
const setRejectButtonIcon = (btn, isConfirmState) => {
	if (!btn) return;
	const icon = btn.querySelector('i');
	if (!icon) return;
	if (isConfirmState) {
		icon.className = 'fas fa-paper-plane';
		btn.title = 'Click again to confirm rejection';
	} else {
		icon.className = 'fas fa-times';
		btn.title = 'Reject';
	}
};

// ─── TOGGLE CANCEL BUTTON VISIBILITY ───
const toggleCancelButton = (key, show) => {
	document.querySelectorAll(`[data-cancel-reject][data-key="${key}"]`).forEach(btn => {
		if (show) {
			btn.classList.remove('d-none');
		} else {
			btn.classList.add('d-none');
		}
	});
};

// ─── CANCEL REJECT FLOW ───
const cancelRejectFlow = (key) => {
	const decisionState = reviewState.decisions[key];
	if (decisionState) {
		decisionState.decision = null;
	}

	document.querySelectorAll('.kna-item-decision').forEach(container => {
		const remark = container.querySelector(`.kna-item-remark[data-key="${key}"]`);
		const rejectBtn = container.querySelector(`.kna-toggle-btn.is-reject[data-key="${key}"]`);
		const approveBtn = container.querySelector(`.kna-toggle-btn.is-approve[data-key="${key}"]`);

		if (remark) {
			remark.classList.add('d-none');
			remark.value = '';
		}
		if (rejectBtn) {
			rejectBtn.classList.remove('is-active');
			setRejectButtonIcon(rejectBtn, false);
		}
		if (approveBtn) {
			approveBtn.classList.remove('is-active');
		}
	});

	toggleCancelButton(key, false);
	updateRowStyling(key, null);
	refreshItemStatusBadge(key, 'PENDING');
	updateSummary();
};

// ─── SPLIT TABLE RENDERING: Main + Action ───

const renderCashAdvance = (data) => {
	const h = data[0];

	reviewState.header = h;
	reviewState.items = [];
	reviewState.totalItems = 1;
	reviewState.decisions = {};

	if (domReview.reviewTitle)
		domReview.reviewTitle.textContent = 'Review Cash Advance';

	if (domReview.reviewStatusBadge)
		domReview.reviewStatusBadge.innerHTML = getStatusBadge(h.status_name);

	const overviewHtml = `
        <div class="kna-review-overview-grid">
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Reference No.</div>
                <div class="kna-review-stat-value">${escapeHtml(h.reference_no || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Requester</div>
                <div class="kna-review-stat-value">${escapeHtml(h.user_name || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Needed Date</div>
                <div class="kna-review-stat-value">${normalizeDate(h.needed_date).slice(0,10) || '-'}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Submission Date</div>
                <div class="kna-review-stat-value">${normalizeDate(h.created_date).slice(0,10) || '-'}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Requested Amount</div>
                <div class="kna-review-stat-value is-amount">${formatPHP(h.ca_amount || 0)}</div>
            </div>
            <div class="kna-review-stat kna-review-stat-wide">
                <div class="kna-review-stat-label">Purpose / Description</div>
                <div class="kna-review-stat-value is-purpose">${escapeHtml(h.description || '-')}</div>
            </div>
        </div>
    `;

	if (domReview.reviewHeaderFields)
		domReview.reviewHeaderFields.innerHTML = overviewHtml;

	const caKey = 'ca_' + h.id;
	const caAmount = Number(h.ca_amount) || 0;

	reviewState.decisions[caKey] = {
		decision: null,
		remark: '',
		amount: caAmount,
		actualAmount: caAmount,
		detail_id: null,
		approval_per_item_id: null,
		item_status: 'PENDING'
	};

	const desktopHtml = `
        <div class="kna-review-desktop">
            <div class="kna-review-table-shell">
                <div class="kna-review-table-wrap-main">
                    <table class="table table-sm kna-review-table-main">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr data-item-key="${caKey}">
                                <td>${escapeHtml(h.description || '-')}</td>
                                <td class="text-right kna-amount-main">${formatPHP(h.ca_amount || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="kna-review-table-wrap-action">
                    <table class="table table-sm kna-review-table-action">
                        <thead>
                            <tr>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr data-item-key="${caKey}">
                                <td class="kna-col-action">
                                    <div class="kna-item-decision">
                                        <div class="kna-toggle-group">
                                            <button type="button" class="kna-toggle-btn is-approve" data-decision="approve" data-key="${caKey}" title="Approve">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button type="button" class="kna-toggle-btn is-reject" data-decision="reject" data-key="${caKey}" title="Reject">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <textarea class="kna-item-remark d-none" data-key="${caKey}" placeholder="Remarks are required for rejection..."></textarea>
                                        <button type="button" class="kna-cancel-reject d-none" data-cancel-reject data-key="${caKey}" title="Cancel rejection">
                                            <i class="fas fa-undo"></i> Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="kna-review-footer">
                <div class="kna-review-footer-main">
                    <span class="kna-review-footer-label">Total Requested</span>
                    <div class="kna-review-footer-amount kna-amount-main">${formatPHP(h.ca_amount || 0)}</div>
                </div>
            </div>
        </div>
    `;

	const mobileHtml = `
        <div class="kna-exp-mobile">
            <div class="kna-exp-card" data-item-key="${caKey}">
                <div class="kna-exp-card-head">
                    <div>
                        <div class="kna-exp-card-title">${escapeHtml(h.description || 'Cash Advance')}</div>
                        <div class="kna-exp-card-meta">Ref: ${escapeHtml(h.reference_no || '-')}</div>
                    </div>
                    <div class="kna-exp-card-amount">
                        <div class="kna-amount-main">${formatPHP(h.ca_amount || 0)}</div>
                    </div>
                </div>
                <div class="kna-item-decision">
                    <div class="kna-toggle-group">
                        <button type="button" class="kna-toggle-btn is-approve" data-decision="approve" data-key="${caKey}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button type="button" class="kna-toggle-btn is-reject" data-decision="reject" data-key="${caKey}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                    <textarea class="kna-item-remark d-none" data-key="${caKey}" placeholder="Remarks are required for rejection..."></textarea>
                    <button type="button" class="kna-cancel-reject d-none" data-cancel-reject data-key="${caKey}">
                        <i class="fas fa-undo"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

	if (domReview.viewApprovalItems)
		domReview.viewApprovalItems.innerHTML = desktopHtml + mobileHtml;

	requestAnimationFrame(() => {
		requestAnimationFrame(syncRowHeights);
	});
};

const renderLiquidation = (data) => {
	reviewState.header = data[0];
	reviewState.items = data;
	reviewState.totalItems = data.length;
	reviewState.decisions = {};

	if (domReview.reviewTitle)
		domReview.reviewTitle.textContent = 'Review Liquidation';

	if (domReview.reviewStatusBadge)
		domReview.reviewStatusBadge.innerHTML = getStatusBadge('Pending Approval');

	const first = data[0];
	const requesterName = first.user_name || '-';
	const cashAdvanceAmount = Number(first.ca_amount) || 0;
	const totalLiquidated = data.reduce(
		(sum, item) => sum + (Number(item.gross_amount ?? item.lq_amount) || 0),
		0
	);
	const varianceAmount = Number(first.variance) || 0;

	const overviewHtml = `
        <div class="kna-review-overview-grid">
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Requester</div>
                <div class="kna-review-stat-value">${escapeHtml(requesterName)}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Liquidation ID</div>
                <div class="kna-review-stat-value">${escapeHtml(first.liquidation_id || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Cash Advance Reference</div>
                <div class="kna-review-stat-value">${escapeHtml(first.cash_advance_id || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Total Items</div>
                <div class="kna-review-stat-value">${data.length}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Cash Advance Amount</div>
                <div class="kna-review-stat-value is-amount">${formatPHP(cashAdvanceAmount)}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Total Liquidated</div>
                <div class="kna-review-stat-value is-amount">${formatPHP(totalLiquidated)}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Variance</div>
                <div class="kna-review-stat-value is-amount">${formatPHP(varianceAmount)}</div>
            </div>
        </div>
    `;

	if (domReview.reviewHeaderFields)
		domReview.reviewHeaderFields.innerHTML = overviewHtml;

	let mainRows = '';
	let actionRows = '';
	let mobileCards = '';

	data.forEach((item, idx) => {
		const key = item.liquidation_id + '_' + idx;
		const amount = Number(item.gross_amount ?? item.lq_amount) || 0;
		const originalIsVatable = Boolean(Number(item.is_vatable));
		const vatCalc = calculateVat(amount, originalIsVatable);
		const detailId = item.id || 0;
		const approvalPerItemId = item.approval_per_item_id || 0;
		const itemStatus = item.item_status || 'PENDING';

		reviewState.decisions[key] = {
			decision: null,
			remark: '',
			amount: amount,
			isVatable: originalIsVatable,
			originalIsVatable: originalIsVatable,
			netAmount: vatCalc.netAmount,
			vatAmount: vatCalc.vatAmount,
			actualAmount: amount,
			liquidatedAmount: amount,
			detail_id: detailId,
			approval_per_item_id: approvalPerItemId,
			item_status: itemStatus
		};

		const hasAttachment = Boolean(item.attachment);
		const attachHtml = hasAttachment
			? renderAttachment(item.attachment)
			: '<span class="text-muted kna-small">—</span>';
		const docDate = normalizeDate(item.document_date || '').slice(0,10) || '—';

		const rowClass = itemStatus === 'APPROVED' ? 'is-approved' : (itemStatus === 'REJECTED' ? 'is-rejected' : '');
		const statusBadge = itemStatus !== 'PENDING' 
			? `<span class="kna-badge ${itemStatus === 'APPROVED' ? 'kna-badge-approved' : 'kna-badge-rejected'} ml-2">${itemStatus}</span>` 
			: '';

		const preselectedApprove = itemStatus === 'APPROVED' ? 'is-active' : '';
		const preselectedReject = itemStatus === 'REJECTED' ? 'is-active' : '';
		const remarkVisible = itemStatus === 'REJECTED' ? '' : 'd-none';

		mainRows += `
            <tr data-item-key="${key}" class="${rowClass}">
                <td class="text-center kna-rownum">${idx + 1}</td>
                <td>${escapeHtml(item.description || '-')}${statusBadge}</td>
                <td>${escapeHtml(item.category_name || '-')}</td>
                <td>${escapeHtml(item.invoice_receipt_no || '-')}</td>
                <td>${docDate}</td>
                <td class="text-right kna-amount-main">${formatPHP(amount)}</td>
                <td class="text-center kna-vat-cell">
                    <label class="kna-vat-indicator">
                        <input type="checkbox" class="kna-vat-check kna-vat-approver" data-key="${key}" ${originalIsVatable ? 'checked' : ''}>
                    </label>
                </td>
                <td class="text-right kna-net-cell">${formatPHP(vatCalc.netAmount)}</td>
                <td class="text-right kna-vat-amt-cell">${formatPHP(vatCalc.vatAmount)}</td>
                <td>${attachHtml}</td>
            </tr>
        `;

		actionRows += `
            <tr data-item-key="${key}" class="${rowClass}">
                <td class="kna-col-action">
                    <div class="kna-item-decision">
                        <div class="kna-toggle-group">
                            <button type="button" class="kna-toggle-btn is-approve ${preselectedApprove}" data-decision="approve" data-key="${key}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button type="button" class="kna-toggle-btn is-reject ${preselectedReject}" data-decision="reject" data-key="${key}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <textarea class="kna-item-remark ${remarkVisible}" data-key="${key}" placeholder="Remarks are required for rejection...">${escapeHtml(item.item_remarks || '')}</textarea>
                        <button type="button" class="kna-cancel-reject ${remarkVisible === '' ? '' : 'd-none'}" data-cancel-reject data-key="${key}" title="Cancel rejection">
                            <i class="fas fa-undo"></i> Cancel
                        </button>
                    </div>
                </td>
            </tr>
        `;

		const attachNames = (item.attachment || '').split(',').map(s => s.trim()).filter(Boolean);

		mobileCards += `
            <div class="kna-exp-card ${rowClass}" data-item-key="${key}">
                <div class="kna-exp-card-head">
                    <div>
                        <div class="kna-exp-card-title">${escapeHtml(item.description || '-')}${statusBadge}</div>
                        <div class="kna-exp-card-sub">${escapeHtml(item.category_name || '-')}</div>
                        <div class="kna-exp-card-meta">Inv#: ${escapeHtml(item.invoice_receipt_no || '-')} • ${docDate}</div>
                    </div>
                    <div class="kna-exp-card-amount">
                        <div class="kna-amount-main">${formatPHP(amount)}</div>
                    </div>
                </div>
                <div class="kna-exp-card-grid">
                    <div class="kna-exp-card-field">
                        <span class="kna-exp-card-label">VAT</span>
                        <span class="kna-exp-card-value">
                            <input type="checkbox" class="kna-vat-check kna-vat-approver" data-key="${key}" ${originalIsVatable ? 'checked' : ''}>
                        </span>
                    </div>
                    <div class="kna-exp-card-field">
                        <span class="kna-exp-card-label">Net / VAT</span>
                        <span class="kna-exp-card-value">
                            ${formatPHP(vatCalc.netAmount)} / ${formatPHP(vatCalc.vatAmount)}
                        </span>
                    </div>
                    <div class="kna-exp-card-field kna-exp-card-field-full">
                        <span class="kna-exp-card-label">Attachment</span>
                        <span class="kna-exp-card-value">
                            ${attachNames.length ? attachNames.map(renderAttachment).join('') : '<span class="text-muted">—</span>'}
                        </span>
                    </div>
                </div>
                <div class="kna-item-decision mt-2">
                    <div class="kna-toggle-group">
                        <button type="button" class="kna-toggle-btn is-approve ${preselectedApprove}" data-decision="approve" data-key="${key}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button type="button" class="kna-toggle-btn is-reject ${preselectedReject}" data-decision="reject" data-key="${key}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                    <textarea class="kna-item-remark ${remarkVisible}" data-key="${key}" placeholder="Remarks are required for rejection...">${escapeHtml(item.item_remarks || '')}</textarea>
                    <button type="button" class="kna-cancel-reject ${remarkVisible === '' ? '' : 'd-none'}" data-cancel-reject data-key="${key}">
                        <i class="fas fa-undo"></i> Cancel
                    </button>
                </div>
            </div>
        `;
	});

	const desktopHtml = `
        <div class="kna-review-desktop">
            <div class="kna-review-table-shell">
                <div class="kna-review-table-wrap-main">
                    <table class="table table-sm kna-review-table-main">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Invoice/Receipt</th>
                                <th>Doc. Date</th>
                                <th class="text-right">Gross</th>
                                <th>VAT</th>
                                <th class="text-right">Net</th>
                                <th class="text-right">VAT Amt</th>
                                <th>Attachment</th>
                            </tr>
                        </thead>
                        <tbody>${mainRows}</tbody>
                    </table>
                </div>
                <div class="kna-review-table-wrap-action">
                    <table class="table table-sm kna-review-table-action">
                        <thead>
                            <tr>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>${actionRows}</tbody>
                    </table>
                </div>
            </div>
            <div class="kna-review-footer">
                <div class="kna-review-footer-main">
                    <span class="kna-review-footer-label">Total Liquidated Amount</span>
                    <div class="kna-review-footer-amount kna-amount-main">${formatPHP(totalLiquidated)}</div>
                </div>
            </div>
        </div>
    `;

	const mobileHtml = `<div class="kna-exp-mobile">${mobileCards}</div>`;

	if (domReview.viewApprovalItems)
		domReview.viewApprovalItems.innerHTML = desktopHtml + mobileHtml;

	data.forEach((item, idx) => {
		const key = item.liquidation_id + '_' + idx;
		const itemStatus = item.item_status || 'PENDING';
		if (itemStatus === 'APPROVED') {
			reviewState.decisions[key].decision = 'approve';
		} else if (itemStatus === 'REJECTED') {
			reviewState.decisions[key].decision = 'reject';
			reviewState.decisions[key].remark = item.item_remarks || '';
		}
	});

	requestAnimationFrame(() => {
		requestAnimationFrame(syncRowHeights);
	});
};

const updateVatDisplay = (key, isVatable) => {
	const decision = reviewState.decisions[key];
	if (!decision) return;

	const vatCalc = calculateVat(decision.actualAmount, isVatable);
	decision.isVatable = isVatable;
	decision.netAmount = vatCalc.netAmount;
	decision.vatAmount = vatCalc.vatAmount;

	const rows = document.querySelectorAll(`[data-item-key="${key}"]`);
	rows.forEach(row => {
		const netCell = row.querySelector('.kna-net-cell');
		const vatCell = row.querySelector('.kna-vat-amt-cell');
		if (netCell) {
			netCell.textContent = formatPHP(vatCalc.netAmount);
			netCell.setAttribute('data-net', vatCalc.netAmount);
		}
		if (vatCell) {
			vatCell.textContent = formatPHP(vatCalc.vatAmount);
			vatCell.setAttribute('data-vat', vatCalc.vatAmount);
		}

		const netSpan = row.querySelector('.kna-net-value');
		const vatSpan = row.querySelector('.kna-vat-value');
		if (netSpan) netSpan.textContent = formatPHP(vatCalc.netAmount);
		if (vatSpan) vatSpan.textContent = formatPHP(vatCalc.vatAmount);
	});

	requestAnimationFrame(syncRowHeights);
};

const renderReviewTimeline = () => {
	if (domReview.reviewTimeline) {
		domReview.reviewTimeline.innerHTML = `
            <li class="kna-timeline-item is-current">
                <div class="kna-timeline-item-top">
                    <span class="kna-timeline-item-name">Your Review</span>
                    <span class="kna-timeline-item-date">Current</span>
                </div>
                <div class="kna-timeline-item-remarks">Awaiting your decision.</div>
            </li>
        `;
	}
};

const updateSubmitButtonState = () => {
	const decisions = reviewState.decisions;
	const keys = Object.keys(decisions);
	const totalItems = keys.length;
	const reviewedCount = keys.filter(k => decisions[k].decision).length;
	const allDecided = totalItems > 0 && reviewedCount === totalItems;

	if (domReview.btnSubmitDecision) {
		domReview.btnSubmitDecision.disabled = !allDecided;
		if (allDecided) {
			domReview.btnSubmitDecision.classList.remove('btn-light');
			domReview.btnSubmitDecision.classList.add('btn-success');
			domReview.btnSubmitDecision.title = 'All items reviewed — ready to submit';
		} else {
			domReview.btnSubmitDecision.classList.remove('btn-success');
			domReview.btnSubmitDecision.classList.add('btn-light');
			domReview.btnSubmitDecision.title = `Review all items first (${reviewedCount}/${totalItems})`;
		}
	}
};

const updateSummary = () => {
	const decisions = reviewState.decisions;
	const keys = Object.keys(decisions);
	const totalItems = keys.length;
	let reviewedCount = 0;
	let approvedAmount = 0;
	let rejectedAmount = 0;

	keys.forEach(k => {
		const d = decisions[k];
		if (d.decision) reviewedCount++;
		if (d.decision === 'approve') approvedAmount += d.amount;
		if (d.decision === 'reject') rejectedAmount += d.amount;
	});

	reviewState.reviewedCount = reviewedCount;
	reviewState.approvedAmount = approvedAmount;
	reviewState.rejectedAmount = rejectedAmount;

	if (domReview.summaryReviewed) domReview.summaryReviewed.textContent = `${reviewedCount} / ${totalItems}`;
	if (domReview.summaryApprovedAmount) domReview.summaryApprovedAmount.textContent = formatPHP(approvedAmount);
	if (domReview.summaryRejectedAmount) domReview.summaryRejectedAmount.textContent = formatPHP(rejectedAmount);

	updateSubmitButtonState();
};

const callPerItemDecision = (key, status, remarks, isNotify) => {
	const decision = reviewState.decisions[key];
	if (!decision || !decision.approval_per_item_id) {
		return Promise.reject(new Error('Approval item ID not found for key: ' + key));
	}

	const payload = {
		approval_per_item_id: decision.approval_per_item_id,
		status: status.toUpperCase(),
		remarks: remarks || '',
		is_notify: isNotify
	};

	return $.ajax({
		url: base_url + 'transactions/approvals/api/per/item/decision',
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		data: JSON.stringify(payload)
	});
};

const updateRowStyling = (key, decision) => {
	const rows = document.querySelectorAll(`[data-item-key="${key}"]`);
	rows.forEach(row => {
		row.classList.remove('is-approved', 'is-rejected');
		if (decision === 'approve') row.classList.add('is-approved');
		if (decision === 'reject') row.classList.add('is-rejected');
	});

	requestAnimationFrame(syncRowHeights);
};

const refreshItemStatusBadge = (key, newStatus) => {
	const mainRows = document.querySelectorAll(`.kna-review-table-main [data-item-key="${key}"]`);
	mainRows.forEach(row => {
		const titleCell = row.querySelector('td:nth-child(2)');
		if (titleCell) {
			const oldBadge = titleCell.querySelector('.kna-badge');
			if (oldBadge) oldBadge.remove();
			if (newStatus && newStatus !== 'PENDING') {
				const badgeClass = newStatus === 'APPROVED' ? 'kna-badge-approved' : 'kna-badge-rejected';
				titleCell.insertAdjacentHTML('beforeend', ` <span class="kna-badge ${badgeClass}">${newStatus}</span>`);
			}
		}
	});

	const mobileCards = document.querySelectorAll(`.kna-exp-mobile [data-item-key="${key}"]`);
	mobileCards.forEach(card => {
		const mobileTitle = card.querySelector('.kna-exp-card-title');
		if (mobileTitle) {
			const oldBadge = mobileTitle.querySelector('.kna-badge');
			if (oldBadge) oldBadge.remove();
			if (newStatus && newStatus !== 'PENDING') {
				const badgeClass = newStatus === 'APPROVED' ? 'kna-badge-approved' : 'kna-badge-rejected';
				mobileTitle.insertAdjacentHTML('beforeend', ` <span class="kna-badge ${badgeClass}">${newStatus}</span>`);
			}
		}
	});

	requestAnimationFrame(syncRowHeights);
};

// ============================================================
// FIXED: Reject workflow with cancel option — properly hide cancel button
// ============================================================
const bindDecisionEvents = () => {
	if (!domReview.viewApprovalItems) return;

	domReview.viewApprovalItems.addEventListener('click', (e) => {
		// ─── HANDLE CANCEL REJECT BUTTON ───
		const cancelBtn = e.target.closest('[data-cancel-reject]');
		if (cancelBtn) {
			const key = cancelBtn.getAttribute('data-key');
			cancelRejectFlow(key);
			return;
		}

		const btn = e.target.closest('.kna-toggle-btn');
		if (!btn) return;

		const key = btn.getAttribute('data-key');
		const decision = btn.getAttribute('data-decision');
		const parent = btn.closest('.kna-toggle-group');
		const container = btn.closest('.kna-item-decision');

		const decisionState = reviewState.decisions[key];
		if (!decisionState) return;

		const isAlreadyActive = btn.classList.contains('is-active');
		const remark = container.querySelector(`.kna-item-remark[data-key="${key}"]`);

		// ─── SPECIAL CASE: Reject button clicked again while active and textarea is visible → confirm ───
		if (isAlreadyActive && decision === 'reject' && remark && !remark.classList.contains('d-none')) {
			const remarkText = remark.value.trim();

			if (!remarkText) {
				remark.classList.add('kna-remark-required');
				remark.focus();
				setTimeout(() => remark.classList.remove('kna-remark-required'), 600);
				Swal.fire({
					icon: 'warning',
					title: 'Remarks Required',
					text: 'Please provide remarks for this rejection before confirming.',
					confirmButtonText: 'OK',
					confirmButtonColor: '#f59f00'
				});
				return;
			}

			// Remarks exist → show confirmation Swal and call API
			Swal.fire({
				icon: 'warning',
				title: 'Reject Item',
				text: 'Notify the requester to correct this item?',
				showDenyButton: true,
				showCancelButton: true,
				confirmButtonText: 'Yes, Notify',
				denyButtonText: 'No, Don\'t Notify',
				cancelButtonText: 'Cancel',
				confirmButtonColor: '#e03131',
				denyButtonColor: '#6b7280',
				cancelButtonColor: '#9ca3af'
			}).then((result) => {
				if (result.isDismissed) {
					return;
				}

				const isNotify = result.isConfirmed ? 1 : 0;

				callPerItemDecision(key, 'REJECTED', remarkText, isNotify)
					.then((response) => {
						if (response.status !== 'success') {
							throw new Error(response.response || 'Failed');
						}
						decisionState.item_status = 'REJECTED';
						decisionState.remark = remarkText;
						// Hide cancel button after successful reject
						toggleCancelButton(key, false);
						setRejectButtonIcon(btn, false);
						updateRowStyling(key, 'reject');
						refreshItemStatusBadge(key, 'REJECTED');
						updateSummary();

						Swal.fire({
							icon: 'success',
							title: 'Item Rejected',
							text: isNotify 
								? 'Requester has been notified to correct this item.' 
								: 'Item has been rejected successfully.',
							timer: 2500,
							showConfirmButton: false,
							toast: true,
							position: 'top-end'
						});
					})
					.catch((err) => {
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: err.message || 'Failed to reject item.'
						});
						toggleCancelButton(key, false);
						setRejectButtonIcon(btn, false);
						btn.classList.remove('is-active');
						decisionState.decision = null;
						if (remark) {
							remark.classList.add('d-none');
							remark.value = '';
						}
						updateRowStyling(key, null);
						refreshItemStatusBadge(key, 'PENDING');
						updateSummary();
					});
			});
			return;
		}

		// ─── DESELECT (clicked same active button, not in confirm-ready state) ───
		if (isAlreadyActive) {
			if (decisionState) {
				decisionState.decision = null;
			}
			if (remark) {
				remark.classList.add('d-none');
				remark.value = '';
			}
			toggleCancelButton(key, false);
			if (decision === 'reject') {
				setRejectButtonIcon(btn, false);
			}
			parent.querySelectorAll('.kna-toggle-btn').forEach(b => b.classList.remove('is-active'));
			updateRowStyling(key, null);
			refreshItemStatusBadge(key, 'PENDING');
			updateSummary();
			return;
		}

		// ─── SELECT NEW DECISION ───
		// FIX: Reset reject icon on any previously active reject button before deactivating
		parent.querySelectorAll('.kna-toggle-btn').forEach(b => {
			if (b.classList.contains('is-active') && b.getAttribute('data-decision') === 'reject') {
				setRejectButtonIcon(b, false);
			}
			b.classList.remove('is-active');
		});
		btn.classList.add('is-active');
		if (decisionState) {
			decisionState.decision = decision;
		}

		// CASH_ADVANCE: UI toggle only, no per-item API
		if (reviewState.transactionType === 'CASH_ADVANCE') {
			if (remark) {
				if (decision === 'reject') {
					remark.classList.remove('d-none');
					remark.focus();
					toggleCancelButton(key, true);
				} else {
					remark.classList.add('d-none');
					remark.value = '';
					toggleCancelButton(key, false);
				}
			}
			updateRowStyling(key, decision);
			updateSummary();
			return;
		}

		// LIQUIDATION:
		if (reviewState.transactionType === 'LIQUIDATION') {
			
			// ─── APPROVE: UI only ───
			if (decision === 'approve') {
				if (remark) {
					remark.classList.add('d-none');
					remark.value = '';
				}
				toggleCancelButton(key, false);
				// FIX: Ensure reject button icon is reset when switching to approve
				const rejectBtn = container.querySelector(`.kna-toggle-btn.is-reject[data-key="${key}"]`);
				if (rejectBtn) setRejectButtonIcon(rejectBtn, false);
				updateRowStyling(key, 'approve');
				refreshItemStatusBadge(key, 'APPROVED');
				updateSummary();
				return;
			}

			// ─── REJECT: Step 1 — show textarea, change icon to confirm, show cancel button ───
			if (decision === 'reject') {
				if (remark) {
					remark.classList.remove('d-none');
					remark.focus();
				}
				toggleCancelButton(key, true);
				setRejectButtonIcon(btn, true);
				return;
			}
		}
	});

	domReview.viewApprovalItems.addEventListener('input', (e) => {
		if (e.target.classList.contains('kna-item-remark')) {
			const key = e.target.getAttribute('data-key');
			if (reviewState.decisions[key]) {
				reviewState.decisions[key].remark = e.target.value;
			}
			e.target.classList.remove('kna-remark-required');
		}
	});

	domReview.viewApprovalItems.addEventListener('change', (e) => {
		if (e.target.classList.contains('kna-vat-approver')) {
			const key = e.target.getAttribute('data-key');
			const isVatable = e.target.checked;
			updateVatDisplay(key, isVatable);
		}
	});

	domReview.viewApprovalItems.addEventListener('click', (e) => {
		const wrap = e.target.closest('[data-lightbox]');
		if (wrap) {
			openLightbox(wrap.getAttribute('data-lightbox'));
		}
	});
};

// ============================================================
// FIXED: submitDecisions — blocks if not all items decided
// ============================================================
const submitDecisions = () => {
	const decisions = reviewState.decisions;
	const keys = Object.keys(decisions);
	const totalItems = keys.length;
	const reviewedCount = keys.filter(k => decisions[k].decision).length;

	// BLOCK: All items must have a decision
	if (reviewedCount < totalItems) {
		Swal.fire({
			icon: 'warning',
			title: 'Incomplete Review',
			text: `Please review all items before submitting. (${reviewedCount} of ${totalItems} decided)`,
			confirmButtonText: 'OK',
			confirmButtonColor: '#f59f00'
		});
		return;
	}

	// LIQUIDATION
	if (reviewState.transactionType === 'LIQUIDATION') {
		const hasRejections = keys.some(k => decisions[k].decision === 'reject');
		const title = 'Confirm Final Submission';
		const text = hasRejections
			? 'Rejected items will remain visible to the next approver as read-only. Continue?'
			: 'Submit your final decision?';
		const icon = hasRejections ? 'warning' : 'info';
		const confirmColor = hasRejections ? '#e03131' : '#17663a';

		Swal.fire({
			icon: icon,
			title: title,
			text: text,
			showCancelButton: true,
			confirmButtonText: 'Submit Final Decision',
			cancelButtonText: 'Cancel',
			confirmButtonColor: confirmColor,
			cancelButtonColor: '#6b7280'
		}).then((result) => {
			if (!result.isConfirmed) return;

			const btn = domReview.btnSubmitDecision;
			if (btn) {
				btn.disabled = true;
				btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Processing...';
			}

			const approvalPromises = [];
			keys.forEach(k => {
				const d = decisions[k];
				if (d.decision === 'approve' && d.approval_per_item_id) {
					const p = callPerItemDecision(k, 'APPROVED', '', 0)
						.catch(err => {
							if (err.message && err.message.includes('already been decided')) {
								return { status: 'success', skipped: true };
							}
							throw err;
						});
					approvalPromises.push(p);
				}
			});

			Promise.all(approvalPromises)
				.then(() => {
					handleSubmit();
				})
				.catch((err) => {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: err.message || 'Failed to process approvals.',
						confirmButtonColor: '#e03131'
					});
					if (btn) {
						btn.disabled = false;
						updateSubmitButtonState();
					}
				});
		});
		return;
	}

	// CASH_ADVANCE
	const hasRejections = keys.some(k => decisions[k].decision === 'reject');
	const title = 'Confirm Submission';
	const text = hasRejections
		? 'This will reject the cash advance. Are you sure?'
		: 'This will approve the cash advance. Submit?';
	const icon = hasRejections ? 'warning' : 'info';
	const confirmColor = hasRejections ? '#e03131' : '#17663a';

	Swal.fire({
		icon: icon,
		title: title,
		text: text,
		showCancelButton: true,
		confirmButtonText: 'Submit',
		cancelButtonText: 'Cancel',
		confirmButtonColor: confirmColor,
		cancelButtonColor: '#6b7280'
	}).then((result) => {
		if (result.isConfirmed) handleSubmit();
	});
};

const handleSubmit = () => {
	const decisions = reviewState.decisions;
	const keys = Object.keys(decisions);

	const payload = {
		reference_no: reviewState.referenceNo,
		transaction_type: reviewState.transactionType,
		overall_remarks: domReview.reviewerRemarks ? domReview.reviewerRemarks.value : '',
		decisions: keys.map(k => {
			const d = decisions[k];
			return {
				item_key: k,
				decision: d.decision,
				remark: d.remark,
				amount: d.amount,
				is_vatable: d.isVatable,
				net_amount: d.netAmount,
				vat_amount: d.vatAmount,
				actual_amount: d.actualAmount,
				detail_id: d.detail_id || null
			};
		}).filter(d => d.decision !== null)
	};

	const btn = domReview.btnSubmitDecision;
	const originalText = btn ? btn.textContent : 'Submit Decisions';
	if (btn) {
		btn.disabled = true;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Submitting...';
	}

	$.ajax({
		url: base_url + 'transactions/approvals/api/submit_decisions',
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		data: JSON.stringify(payload),
		success: function (response) {
			if (response.status === 'success') {
				Swal.fire({
					icon: 'success',
					title: 'Submitted!',
					text: 'Your decisions have been submitted successfully.',
					confirmButtonText: 'OK',
					confirmButtonColor: '#17663a'
				}).then(() => {
					window.location.href = base_url + 'transactions/approvals';
				});
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: response.response || 'Unknown error occurred.',
					confirmButtonText: 'OK',
					confirmButtonColor: '#e03131'
				});
				if (btn) {
					btn.disabled = false;
					updateSubmitButtonState();
				}
			}
		},
		error: function (xhr, status, error) {
			let msg = 'Server error during submission.';
			try {
				const resp = JSON.parse(xhr.responseText);
				if (resp.response) msg = resp.response;
			} catch (e) { }

			Swal.fire({
				icon: 'error',
				title: 'Server Error',
				text: msg,
				confirmButtonText: 'OK',
				confirmButtonColor: '#e03131'
			});

			if (btn) {
				btn.disabled = false;
				updateSubmitButtonState();
			}
		}
	});
};

const loadReviewData = () => {
	const ref = domReview.approvalRef ? domReview.approvalRef.value : '';
	if (!ref) {
		if (domReview.viewApprovalItems) {
			domReview.viewApprovalItems.innerHTML = '<div class="alert alert-danger kna-small">No approval reference found.</div>';
		}
		return;
	}

	reviewState.referenceNo = ref;

	ajax_loader('transactions/approvals/api/get/details', { ReferenceNo: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !Array.isArray(res.data)) {
			if (domReview.viewApprovalItems) {
				domReview.viewApprovalItems.innerHTML = '<div class="alert alert-danger kna-small">' + escapeHtml(res.response || 'Failed to load details.') + '</div>';
			}
			return;
		}

		const data = res.data;
		if (!data.length) {
			if (domReview.viewApprovalItems) {
				domReview.viewApprovalItems.innerHTML = '<div class="alert alert-danger kna-small">No data returned for this reference.</div>';
			}
			return;
		}

		reviewState.transactionType = data[0].transaction_type;

		if (reviewState.transactionType === 'CASH_ADVANCE') {
			renderCashAdvance(data);
		} else if (reviewState.transactionType === 'LIQUIDATION') {
			renderLiquidation(data);
		} else {
			if (domReview.viewApprovalItems) {
				domReview.viewApprovalItems.innerHTML = '<div class="alert alert-danger kna-small">Unknown transaction type: ' + escapeHtml(reviewState.transactionType) + '</div>';
			}
			return;
		}

		renderReviewTimeline();
		updateSummary();
	}).fail(() => {
		if (domReview.viewApprovalItems) {
			domReview.viewApprovalItems.innerHTML = '<div class="alert alert-danger kna-small">Server error while fetching details.</div>';
		}
	});
};

const cacheReviewDom = () => {
	domReview.approvalRef = document.getElementById('approvalRef');
	domReview.reviewTitle = document.getElementById('reviewTitle');
	domReview.reviewStatusBadge = document.getElementById('reviewStatusBadge');
	domReview.reviewHeaderFields = document.getElementById('reviewHeaderFields');
	domReview.viewApprovalItems = document.getElementById('viewApprovalItems');
	domReview.reviewTimeline = document.getElementById('reviewTimeline');
	domReview.summaryReviewed = document.getElementById('summaryReviewed');
	domReview.summaryApprovedAmount = document.getElementById('summaryApprovedAmount');
	domReview.summaryRejectedAmount = document.getElementById('summaryRejectedAmount');
	domReview.reviewerRemarks = document.getElementById('reviewerRemarks');
	domReview.btnSubmitDecision = document.getElementById('btnSubmitDecision');

	const lb = document.getElementById('knaLightbox');
	if (lb) {
		lb.addEventListener('click', (e) => {
			if (e.target === lb || e.target.id === 'knaLightboxClose') {
				lb.classList.add('d-none');
				const img = document.getElementById('knaLightboxImg');
				if (img) img.src = '';
			}
		});
	}

	if (domReview.btnSubmitDecision) {
		domReview.btnSubmitDecision.addEventListener('click', submitDecisions);
	}
};

const initReviewPage = () => {
	cacheReviewDom();
	loadReviewData();
	bindDecisionEvents();

	window.addEventListener('resize', syncRowHeights);
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initReviewPage);
} else {
	initReviewPage();
}