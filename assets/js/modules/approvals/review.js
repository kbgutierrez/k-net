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

const renderCashAdvance = (data) => {
	const h = data[0];
	reviewState.header = h;
	reviewState.items = [];
	reviewState.totalItems = 1;
	reviewState.decisions = {};

	if (domReview.reviewTitle) domReview.reviewTitle.textContent = 'Review Cash Advance';
	if (domReview.reviewStatusBadge) domReview.reviewStatusBadge.innerHTML = getStatusBadge(h.status_name);

	const overviewHtml = `
        <div class="kna-review-overview-grid">
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Reference No.</div>
                <div class="kna-review-stat-value">${escapeHtml(h.reference_no)}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Requestor</div>
                <div class="kna-review-stat-value">${escapeHtml(h.user_name || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Needed Date</div>
                <div class="kna-review-stat-value">${normalizeDate(h.needed_date).slice(0, 10) || '-'}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Submission Date</div>
                <div class="kna-review-stat-value">${normalizeDate(h.created_date).slice(0, 10) || '-'}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Requested Amount</div>
                <div class="kna-review-stat-value is-amount">${formatPHP(h.ca_amount)}</div>
            </div>
            <div class="kna-review-stat kna-review-stat-wide">
                <div class="kna-review-stat-label">Purpose / Description</div>
                <div class="kna-review-stat-value is-purpose">${escapeHtml(h.description || '-')}</div>
            </div>
        </div>
    `;
	if (domReview.reviewHeaderFields) domReview.reviewHeaderFields.innerHTML = overviewHtml;

	const caKey = 'ca_' + h.id;
	const ca_amount = Number(h.ca_amount) || 0;
	reviewState.decisions[caKey] = {
		decision: null,
		remark: '',
		amount: ca_amount,
		detail_id: null
	};

	const desktopHtml = `
        <div class="kna-review-desktop">
            <div class="kna-review-table-scroll">
                <table class="table table-sm kna-review-table-main">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-right">Amount</th>
                            <th class="kna-col-action">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-item-key="${caKey}">
                            <td>${escapeHtml(h.description || '-')}</td>
                            <td class="text-right kna-amount-main">${formatPHP(h.ca_amount)}</td>
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
                                    <textarea class="kna-item-remark d-none" data-key="${caKey}" placeholder="Add remarks for rejection..."></textarea>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="kna-review-footer">
                <div class="kna-review-footer-main">
                    <span class="kna-review-footer-label">Total Requested</span>
                    <div class="kna-review-footer-amount kna-amount-main">${formatPHP(h.ca_amount)}</div>
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
                        <div class="kna-exp-card-meta">Ref: ${escapeHtml(h.reference_no)}</div>
                    </div>
                    <div class="kna-exp-card-amount">
                        <div class="kna-amount-main">${formatPHP(h.ca_amount)}</div>
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
                    <textarea class="kna-item-remark d-none" data-key="${caKey}" placeholder="Add remarks for rejection..."></textarea>
                </div>
            </div>
        </div>
    `;

	if (domReview.viewApprovalItems) domReview.viewApprovalItems.innerHTML = desktopHtml + mobileHtml;
};

const renderLiquidation = (data) => {
	reviewState.header = null;
	reviewState.items = data;
	reviewState.totalItems = data.length;
	reviewState.decisions = {};

	if (domReview.reviewTitle) domReview.reviewTitle.textContent = 'Review Liquidation';
	if (domReview.reviewStatusBadge) domReview.reviewStatusBadge.innerHTML = getStatusBadge('Pending Approval');

	const first = data[0];

	const cashAdvanceAmount = Number(first.ca_amount) || 0;

	const totalLiquidated = data.reduce(
		(sum, i) => sum + (Number(i.lq_amount) || 0),
		0
	);

	const varianceAmount = Number(first.variance) || 0;

	const overviewHtml = `
        <div class="kna-review-overview-grid">
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Liquidation ID</div>
                <div class="kna-review-stat-value">${escapeHtml(first.liquidation_id || '-')}</div>
            </div>
            <div class="kna-review-stat">
                <div class="kna-review-stat-label">Reference</div>
                <div class="kna-review-stat-value">${escapeHtml(first.cash_advance_id)}</div>
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
	if (domReview.reviewHeaderFields) domReview.reviewHeaderFields.innerHTML = overviewHtml;

	let rows = '';
	let mobileCards = '';

	data.forEach((item, idx) => {
		const key = item.liquidation_id + '_' + idx;
		const amount = Number(item.lq_amount) || 0;
		const originalIsVatable = Boolean(Number(item.is_vatable));

		const vatCalc = calculateVat(amount, originalIsVatable);
		const detailId = item.id || 0;

	reviewState.decisions[key] = {
		decision: null,
		remark: '',
		amount: amount,
		isVatable: originalIsVatable,
		originalIsVatable: originalIsVatable,
		netAmount: vatCalc.netAmount,
		vatAmount: vatCalc.vatAmount,
		actualAmount: amount,
		detail_id: detailId
	};

		const hasAttachment = Boolean(item.attachment);
		const attachHtml = hasAttachment
			? renderAttachment(item.attachment)
			: '<span class="text-muted kna-small">—</span>';

		const docDate = normalizeDate(item.document_date || '').slice(0, 10) || '—';

		rows += `
            <tr data-item-key="${key}">
                <td class="text-center kna-rownum">${idx + 1}</td>
                <td>${escapeHtml(item.description || '-')}</td>
                <td>${escapeHtml(item.category_name || '-')}</td>
                <td>${escapeHtml(item.invoice_receipt_no || '-')}</td>
                <td>${docDate}</td>
                <td class="text-right kna-amount-main" data-gross-amount="${amount}">${formatPHP(amount)}</td>
                <td class="text-center kna-vat-cell">
                    <label class="kna-vat-indicator" style="cursor:pointer; margin:0;">
                        <input type="checkbox" class="kna-vat-check kna-vat-approver" data-key="${key}" ${originalIsVatable ? 'checked' : ''}>
                    </label>
                </td>
                <td class="text-right kna-net-cell" data-net="${vatCalc.netAmount}">${formatPHP(vatCalc.netAmount)}</td>
                <td class="text-right kna-vat-amt-cell" data-vat="${vatCalc.vatAmount}">${formatPHP(vatCalc.vatAmount)}</td>
                <td>${attachHtml}</td>
                <td class="kna-col-action">
                    <div class="kna-item-decision">
                        <div class="kna-toggle-group">
                            <button type="button" class="kna-toggle-btn is-approve" data-decision="approve" data-key="${key}" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button type="button" class="kna-toggle-btn is-reject" data-decision="reject" data-key="${key}" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <textarea class="kna-item-remark d-none" data-key="${key}" placeholder="Add remarks for rejection..."></textarea>
                    </div>
                </td>
            </tr>
        `;

		const attachNames = normalizeDate(item.attachment || '')
			.split(',')
			.map(s => s.trim())
			.filter(Boolean);

		mobileCards += `
            <div class="kna-exp-card" data-item-key="${key}">
                <div class="kna-exp-card-head">
                    <div>
                        <div class="kna-exp-card-title">${escapeHtml(item.description || '-')}</div>
                        <div class="kna-exp-card-sub">${escapeHtml(item.category_name || '-')}</div>
                        <div class="kna-exp-card-meta">Inv#: ${escapeHtml(item.invoice_receipt_no || '-')} • ${docDate}</div>
                    </div>
                    <div class="kna-exp-card-amount">
                        <div class="kna-amount-main kna-mobile-gross" data-gross="${amount}">${formatPHP(amount)}</div>
                    </div>
                </div>
                <div class="kna-exp-card-grid">
                    <div class="kna-exp-card-field">
                        <span class="kna-exp-card-label">VAT</span>
                        <span class="kna-exp-card-value">
                            <label class="kna-vat-indicator" style="cursor:pointer;">
                                <input type="checkbox" class="kna-vat-check kna-vat-approver" data-key="${key}" ${originalIsVatable ? 'checked' : ''}>
                            </label>
                        </span>
                    </div>
                    <div class="kna-exp-card-field">
                        <span class="kna-exp-card-label">Net / VAT</span>
                        <span class="kna-exp-card-value kna-mobile-net-vat">
                            <span class="kna-net-value">${formatPHP(vatCalc.netAmount)}</span> / 
                            <span class="kna-vat-value">${formatPHP(vatCalc.vatAmount)}</span>
                        </span>
                    </div>
                    <div class="kna-exp-card-field kna-exp-card-field-full">
                        <span class="kna-exp-card-label">Attachment</span>
                        <span class="kna-exp-card-value kna-exp-card-attach">
                            ${attachNames.length ? attachNames.map(renderAttachment).join('') : '<span class="text-muted">—</span>'}
                        </span>
                    </div>
                </div>
                <div class="kna-item-decision mt-2">
                    <div class="kna-toggle-group">
                        <button type="button" class="kna-toggle-btn is-approve" data-decision="approve" data-key="${key}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button type="button" class="kna-toggle-btn is-reject" data-decision="reject" data-key="${key}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                    <textarea class="kna-item-remark d-none" data-key="${key}" placeholder="Add remarks for rejection..."></textarea>
                </div>
            </div>
        `;
	});

	const desktopHtml = `
        <div class="kna-review-desktop">
            <div class="kna-review-table-scroll">
                <table class="table table-sm kna-review-table-main">
                    <thead>
                        <tr>
                            <th style="width:34px;">#</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Invoice/Receipt</th>
                            <th>Doc. Date</th>
                            <th class="text-right">Gross</th>
                            <th class="text-center" style="width:60px;">VAT</th>
                            <th class="text-right">Net</th>
                            <th class="text-right">VAT Amt</th>
                            <th>Attachment</th>
                            <th class="kna-col-action">Action</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
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

	if (domReview.viewApprovalItems) domReview.viewApprovalItems.innerHTML = desktopHtml + mobileHtml;
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
};

const bindDecisionEvents = () => {
	if (!domReview.viewApprovalItems) return;

	domReview.viewApprovalItems.addEventListener('click', (e) => {
		const btn = e.target.closest('.kna-toggle-btn');
		if (!btn) return;

		const key = btn.getAttribute('data-key');
		const decision = btn.getAttribute('data-decision');
		const parent = btn.closest('.kna-toggle-group');
		const container = btn.closest('.kna-item-decision');

		const isAlreadyActive = btn.classList.contains('is-active');

		parent.querySelectorAll('.kna-toggle-btn').forEach(b => b.classList.remove('is-active'));

		if (isAlreadyActive) {
			// Deselect
			if (reviewState.decisions[key]) {
				reviewState.decisions[key].decision = null;
			}
			const remark = container.querySelector(`.kna-item-remark[data-key="${key}"]`);
			if (remark) {
				remark.classList.add('d-none');
				remark.value = '';
			}
		} else {
			// Select
			btn.classList.add('is-active');
			if (reviewState.decisions[key]) {
				reviewState.decisions[key].decision = decision;
			}
			const remark = container.querySelector(`.kna-item-remark[data-key="${key}"]`);
			if (remark) {
				// Show remark only for reject
				if (decision === 'reject') {
					remark.classList.remove('d-none');
				} else {
					remark.classList.add('d-none');
					remark.value = '';
				}
			}
		}

		const rows = document.querySelectorAll(`[data-item-key="${key}"]`);
		rows.forEach(row => {
			row.classList.remove('is-approved', 'is-rejected');
			if (!isAlreadyActive && decision === 'approve') row.classList.add('is-approved');
			if (!isAlreadyActive && decision === 'reject') row.classList.add('is-rejected');
		});

		updateSummary();
	});

	domReview.viewApprovalItems.addEventListener('input', (e) => {
		if (e.target.classList.contains('kna-item-remark')) {
			const key = e.target.getAttribute('data-key');
			if (reviewState.decisions[key]) {
				reviewState.decisions[key].remark = e.target.value;
			}
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

const submitDecisions = () => {
	const decisions = reviewState.decisions;
	const keys = Object.keys(decisions);
	const totalItems = keys.length;
	const reviewedCount = keys.filter(k => decisions[k].decision).length;

	if (reviewedCount === 0) {
		Swal.fire({
			icon: 'warning',
			title: 'No Decisions',
			text: 'Please make at least one decision before submitting.',
			confirmButtonText: 'OK'
		});
		return;
	}

	// Check if all items reviewed
	if (reviewedCount < totalItems) {
		Swal.fire({
			icon: 'question',
			title: 'Incomplete Review',
			text: `You have reviewed ${reviewedCount} of ${totalItems} items. Submit anyway?`,
			showCancelButton: true,
			confirmButtonText: 'Yes, Submit',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#17663a',
			cancelButtonColor: '#6b7280'
		}).then((result) => {
			if (result.isConfirmed) {
				handleSubmit();
			}
		});
	} else {
		// All reviewed — confirm before submit
		const hasRejections = keys.some(k => decisions[k].decision === 'reject');
		const title = 'Confirm Submission';
		const text = hasRejections
			? 'Some items will be rejected. Are you sure you want to proceed?'
			: 'All items will be approved. Submit your decision?';
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
			if (result.isConfirmed) {
				handleSubmit();
			}
		});
	}
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
					btn.textContent = originalText;
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
				btn.textContent = originalText;
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
		console.log('API Response:', res);
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
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initReviewPage);
} else {
	initReviewPage();
}