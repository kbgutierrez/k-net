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
	viewPayableTo: null,
	viewAddress: null,
	viewCostCenter: null,
	viewStatus: null,
	viewSubmittedDate: null,
	viewExpenseItems: null,
	viewTimeline: null,
	btnEditLiquidation: null,
	mobileLiquidationNo: null,
	mobileStatus: null,
	mobileCaAmount: null,
	mobileTotal: null,
	mobileVariance: null,
	mobileCaRef: null,
	mobileCaDate: null,
	mobileSubmittedDate: null,
	mobileExpenseDate: null,
	mobilePayableTo: null,
	mobileCostCenter: null,
	mobileAddress: null,
	mobilePurpose: null,
};

const IMG_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;

const getVariancePresentation = (refund, reimburse) => {
	if (refund > 0) {
		return {
			desktopHtml: `<span class="kna-var-badge kna-var-return">${formatPHP(refund)} to return</span>`,
			mobileText: `${formatPHP(refund)} return`,
		};
	}
	if (reimburse > 0) {
		return {
			desktopHtml: `<span class="kna-var-badge kna-var-reimburse">${formatPHP(reimburse)} to reimburse</span>`,
			mobileText: `${formatPHP(reimburse)} reimburse`,
		};
	}
	return {
		desktopHtml: '<span class="kna-var-badge kna-var-balanced">0.00</span>',
		mobileText: '0.00',
	};
};

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

const getExpenseTypeDisplayText = (expense) => {
	const code = normalizeDate(expense.expense_code || expense.expense_category_code || expense.category_code || '');
	const longText = normalizeDate(expense.long_text || expense.expense_category_name || expense.category_name || expense.description || '');

	if (code && longText) {
		return `${code} - ${longText}`;
	}
	return code || longText || 'Expense Item';
};

const getExpenseVendorHtml = (expense) => {
	const vendorName = normalizeDate(expense.vendor_name || '');
	const vendorAddress = normalizeDate(expense.vendor_address || '');
	const vendorTin = normalizeDate(expense.vendor_tin || '');

	if (!vendorName && !vendorAddress && !vendorTin) {
		return '<span class="text-muted" style="font-size:11px;">\u2014</span>';
	}

	return `
		<div class="kna-vendor-display">
			${vendorName ? `<div>${escapeHtml(vendorName)}</div>` : ''}
			${vendorAddress ? `<div class="kna-vendor-sub">${escapeHtml(vendorAddress)}</div>` : ''}
			${vendorTin ? `<div class="kna-vendor-sub">TIN: ${escapeHtml(vendorTin)}</div>` : ''}
		</div>
	`;
};

const getExpenseStatusBadge = (expense) => {
	const hasApproved = Boolean(Number(expense.has_approved || 0));
	const hasRejected = Boolean(Number(expense.has_rejected || 0));
	const rejectionReason = normalizeDate(expense.rejection_reason || '');
	const rejectedByName = normalizeDate(expense.rejected_by_name || '');

	if (hasApproved) {
		return {
			desktop: '<div class="kna-approved-badge" style="margin-top:4px;"><i class="fas fa-check"></i> Approved</div>',
			mobile: '<span class="kna-status-badge kna-status-approved"><i class="fas fa-check"></i> Approved</span>',
		};
	}

	if (hasRejected) {
		return {
			desktop: `<div class="kna-rejected-badge" style="margin-top:4px;"><i class="fas fa-times"></i> Rejected by ${escapeHtml(rejectedByName)}</div><div class="kna-rejected-reason" style="font-size:11px;color:#991b1b;font-style:italic;">"${escapeHtml(rejectionReason)}"</div>`,
			mobile: `<span class="kna-status-badge kna-status-rejected"><i class="fas fa-times"></i> Rejected by ${escapeHtml(rejectedByName)}</span>`,
		};
	}

	return { desktop: '', mobile: '' };
};

const getExpenseItemSummary = (expense) => ({
	docDate: normalizeDate(expense.document_date || '').slice(0, 10),
	typeText: getExpenseTypeDisplayText(expense),
	reference: normalizeDate(expense.invoice_receipt_no || '') || '\u2014',
	amount: Number(expense.actual_amount || 0),
	netAmt: Number(expense.net_amount || 0),
	vatAmt: Number(expense.vat_amount || 0),
	isVattable: Boolean(Number(expense.is_vatable)),
	description: normalizeDate(expense.description || ''),
	attachNames: normalizeDate(expense.attachment || '').split(',').map((s) => s.trim()).filter(Boolean),
	vendorName: normalizeDate(expense.vendor_name || ''),
	vendorAddress: normalizeDate(expense.vendor_address || ''),
	vendorTin: normalizeDate(expense.vendor_tin || ''),
	vendorHtml: getExpenseVendorHtml(expense),
	statusBadge: getExpenseStatusBadge(expense),
});

const renderExpenseRow = (summary, index) => {
	const vatBadge = summary.isVattable
		? '<input type="checkbox" class="kna-vat-check" checked disabled>'
		: '<input type="checkbox" class="kna-vat-check" disabled>';

	const amountHtml = summary.isVattable
		? `<div class="kna-amount-main">${formatPHP(summary.amount)}</div><div class="kna-amount-breakdown">Net ${formatPHP(summary.netAmt)}</div><div class="kna-amount-breakdown">VAT ${formatPHP(summary.vatAmt)}</div>`
		: `<div class="kna-amount-main">${formatPHP(summary.amount)}</div>`;

	return `
		<tr>
			<td class="text-center kna-rownum kna-cell-index" data-label="#">${index + 1}</td>
			<td data-label="Date">${escapeHtml(summary.docDate)}</td>
			<td data-label="Expense Type">${escapeHtml(summary.typeText)}</td>
			<td data-label="Reference">${escapeHtml(summary.reference)}</td>
			<td class="text-center kna-cell-vat" data-label="VAT">${vatBadge}</td>
			<td data-label="Vendor">${summary.vendorHtml}</td>
			<td class="kna-cell-attachment" data-label="Attachment">${summary.attachNames.length ? summary.attachNames.map(renderAttachment).join('') : '<span class="text-muted" style="font-size:11px;">\u2014</span>'}</td>
			<td data-label="Remarks">${escapeHtml(summary.description)}${summary.statusBadge.desktop}</td>
			<td class="text-right kna-cell-amount" data-label="Amount">${amountHtml}</td>
		</tr>
	`;
};

const renderExpenseCard = (summary, index) => {
	const amountHtml = summary.isVattable
		? `<div class="kna-amount-main">${formatPHP(summary.amount)}</div><div class="kna-amount-breakdown">Net ${formatPHP(summary.netAmt)}</div><div class="kna-amount-breakdown">VAT ${formatPHP(summary.vatAmt)}</div>`
		: `<div class="kna-amount-main">${formatPHP(summary.amount)}</div>`;

	return `
		<div class="kna-exp-card">
			<div class="kna-exp-card-head">
				<div class="kna-exp-card-head-left">
					<div class="kna-exp-card-badge">${index + 1}</div>
					<div class="kna-exp-card-title">${escapeHtml(summary.typeText || 'Expense Item')}</div>
					<div class="kna-exp-card-meta">${escapeHtml(summary.docDate)} \u2022 ${escapeHtml(summary.reference)}</div>
					${summary.statusBadge.mobile}
				</div>
				<div class="kna-exp-card-amount">${amountHtml}</div>
			</div>

			<div class="kna-exp-card-body">
				<div class="kna-exp-card-grid">
					<div class="kna-exp-card-field kna-exp-card-field-full">
						<span class="kna-exp-card-label">Vendor</span>
						<span class="kna-exp-card-value kna-vendor-display">${summary.vendorHtml}</span>
					</div>
					<div class="kna-exp-card-field">
						<span class="kna-exp-card-label">VAT</span>
						<span class="kna-exp-card-value">${summary.isVattable ? '<input type="checkbox" class="kna-vat-check" checked disabled>' : '<input type="checkbox" class="kna-vat-check" disabled>'}</span>
					</div>
					<div class="kna-exp-card-field kna-exp-card-field-full">
						<span class="kna-exp-card-label">Remarks</span>
						<span class="kna-exp-card-value">${escapeHtml(summary.description || '\u2014')}</span>
					</div>
				</div>

				<div class="kna-exp-card-field kna-exp-card-field-full">
					<span class="kna-exp-card-label">Attachment</span>
					<span class="kna-exp-card-value kna-exp-card-attach">${summary.attachNames.length ? summary.attachNames.map(renderAttachment).join('') : '<span class="text-muted">\u2014</span>'}</span>
				</div>
			</div>
		</div>
	`;
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
			return renderExpenseRow(getExpenseItemSummary(expense), i);
		})
		.join('');

	const mobileCardsHtml = expenses
		.map((expense, i) => {
			return renderExpenseCard(getExpenseItemSummary(expense), i);
		})
		.join('');

	const total    = expenses.reduce((sum, e) => sum + Number(e.actual_amount || 0), 0);
	const totalNet = expenses.reduce((sum, e) => sum + Number(e.net_amount    || 0), 0);
	const totalVat = expenses.reduce((sum, e) => sum + Number(e.vat_amount    || 0), 0);
	if (domDetail.mobileTotal) {
		domDetail.mobileTotal.textContent = formatPHP(total);
	}

	container.innerHTML = `
		<div class="kna-exp-wrap">
			<div class="kna-exp-mobile">${mobileCardsHtml}</div>
			<table class="kna-exp-table">
				<thead>
					<tr>
						<th style="width:34px;">#</th>
						<th style="width:96px;">Date</th>
						<th style="width:120px;">Expense Type</th>
						<th style="width:110px;">Reference</th>
						<th style="width:72px;" class="text-center">VAT</th>
						<th style="width:340px;">Vendor</th>
						<th style="width:70px;">Attachment</th>
						<th>Remarks</th>
						<th style="width:130px;" class="text-right">Amount</th>
					</tr>
				</thead>
				<tbody>${rowsHtml}</tbody>
				<tfoot>
					<tr>
						<td colspan="8" class="text-right" style="font-size:12px;">Total</td>
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

const formatTimelineDate = (dateStr) => {
	if (!dateStr) return '';
	const raw = normalizeDate(dateStr);
	if (!raw) return '';

	const date = new Date(raw.replace(' ', 'T'));
	if (Number.isNaN(date.getTime())) return raw;

	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	let hh = date.getHours();
	const ampm = hh >= 12 ? 'PM' : 'AM';
	hh = hh % 12;
	hh = hh ? hh : 12;
	const min = String(date.getMinutes()).padStart(2, '0');

	return `${yyyy}-${mm}-${dd} ${String(hh).padStart(2, '0')}:${min}${ampm}`;
};

const groupAuditTrail = (auditTrail) => {
	if (!auditTrail || !auditTrail.length) return [];

	const sorted = [...auditTrail].sort((a, b) => {
		const da = new Date((a.created_date || '').replace(' ', 'T'));
		const db = new Date((b.created_date || '').replace(' ', 'T'));
		return da - db;
	});

	const entriesWithKey = sorted.map((entry) => {
		const action = normalizeDate(entry.action || '').toUpperCase();
		const changedByName = normalizeDate(entry.changed_by_name || 'Unknown User');
		const transactionId = normalizeDate(entry.transaction_id || '');
		const entityType = normalizeDate(entry.entity_type || '').toUpperCase();
		const description = normalizeDate(entry.description || '');
		const remarks = normalizeDate(entry.remarks || '');
		const dateStr = formatTimelineDate(entry.created_date);

		const rawDate = normalizeDate(entry.created_date || '');
		const timeBucket = rawDate.length >= 16 ? rawDate.substring(0, 16) : rawDate;

		const groupKey = `${changedByName}|${action}|${transactionId}|${timeBucket}`;

		return {
			...entry,
			_action: action,
			_entityType: entityType,
			_changedByName: changedByName,
			_dateStr: dateStr,
			_timeBucket: timeBucket,
			_groupKey: groupKey,
			_description: description,
			_remarks: remarks,
		};
	});

	const groupMap = new Map();

	entriesWithKey.forEach((entry) => {
		const key = entry._groupKey;

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				dateStr: entry._dateStr,
				changedByName: entry._changedByName,
				action: entry._action,
				transactionType: normalizeDate(entry.transaction_type || ''),
				remarks: '',
				description: '',
				items: [],
				hasHeader: false,
				hasItems: false,
			});
		}

		const group = groupMap.get(key);

		if (entry._entityType === 'HEADER') {
			group.hasHeader = true;
			if (entry._remarks) group.remarks = entry._remarks;
			if (entry._description) group.description = entry._description;
		} else if (entry._entityType === 'ITEM') {
			group.hasItems = true;
			if (entry._description) {
				group.items.push({
					description: entry._description,
					remarks: entry._remarks,
					actualAmount: entry.actual_amount,
				});
			}
		} else {
			if (entry._description) group.description = entry._description;
			if (entry._remarks) group.remarks = entry._remarks;
		}
	});

	const groups = Array.from(groupMap.values());
	groups.sort((a, b) => {
		const da = new Date((a.dateStr || '').replace(' ', 'T'));
		const db = new Date((b.dateStr || '').replace(' ', 'T'));
		return da - db;
	});

	return groups;
};

const buildTimelineText = (group) => {
	const action = group.action;
	const changedByName = group.changedByName;
	const transactionType = group.transactionType.toLowerCase();
	const remarks = group.remarks;
	const hasItems = group.hasItems;
	const items = group.items;

	let actionText = '';
	switch (action) {
		case 'SUBMITTED':
		case 'SAVED_DRAFT':
			actionText = 'files';
			break;
		case 'CREATED':
			actionText = 'creates';
			break;
		case 'APPROVED':
			actionText = 'approves';
			break;
		case 'REJECTED':
			actionText = 'rejects';
			break;
		case 'UPDATED_DRAFT':
		case 'RESUBMITTED':
			actionText = 'updates';
			break;
		case 'ADDED_ITEM':
			actionText = 'adds';
			break;
		case 'UPDATED_ITEM':
			actionText = 'updates';
			break;
		default:
			actionText = action.toLowerCase();
	}

	let entityDesc = '';
	if (transactionType === 'cash_advance') {
		entityDesc = 'cash advance';
	} else if (transactionType === 'liquidation') {
		entityDesc = 'liquidation';
	} else {
		entityDesc = 'request';
	}

	if (hasItems && items.length > 0) {
		let mainLine = `${changedByName} ${actionText} ${entityDesc}`;
		if (remarks) mainLine += `: "${remarks}"`;

		const subLines = items.map((item) => {
			if (item.description) {
				return `${actionText} ${item.description}`;
			}
			return '';
		}).filter(Boolean);

		return [mainLine, ...subLines].join('<br>');
	}

	if (group.hasHeader && !hasItems) {
		let text = `${changedByName} ${actionText} ${entityDesc}`;
		if (group.description) text += ` \u2014 ${group.description}`;
		if (remarks) text += `: "${remarks}"`;
		return text;
	}

	let text = `${changedByName} ${actionText} ${entityDesc}`;
	if (group.description) text += ` \u2014 ${group.description}`;
	if (remarks) text += `: "${remarks}"`;
	return text;
};

const renderHistoryTimeline = (auditTrail) => {
	const container = domDetail.viewTimeline;
	if (!container) return;

	if (!auditTrail || !auditTrail.length) {
		container.innerHTML = `
			<li class="kna-timeline-item is-pending">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">No history available</span>
				</div>
				<div class="kna-timeline-item-remarks">This request has no recorded history yet.</div>
			</li>
		`;
		return;
	}

	const groups = groupAuditTrail(auditTrail);

	const html = groups.map((group, index) => {
		const isLast = index === groups.length - 1;
		const statusClass = isLast ? 'is-current' : 'is-done';
		const text = buildTimelineText(group);

		return `
			<li class="kna-timeline-item ${statusClass}">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">${escapeHtml(group.dateStr)}</span>
				</div>
				<div class="kna-timeline-item-remarks">${text}</div>
			</li>
		`;
	}).join('');

	container.innerHTML = html;
};

const loadAuditTrail = () => {
	const ref = domDetail.liquidationRef ? domDetail.liquidationRef.value : '';
	if (!ref) return;

	ajax_loader('transactions/liquidation/api/get/timeline', { ReferenceNo: ref })
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				renderHistoryTimeline([]);
				return;
			}
			renderHistoryTimeline(res.data && res.data.audit_trail ? res.data.audit_trail : []);
		})
		.fail(() => {
			renderHistoryTimeline([]);
		});
};

const renderDetailTimeline = (timeline) => {
	loadAuditTrail();
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
	domDetail.viewPayableTo = document.getElementById('viewPayableTo');
	domDetail.viewAddress = document.getElementById('viewAddress');
	domDetail.viewCostCenter = document.getElementById('viewCostCenter');
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewSubmittedDate = document.getElementById('viewSubmittedDate');
	domDetail.viewExpenseItems = document.getElementById('viewExpenseItems');
	domDetail.viewTimeline = document.getElementById('viewTimeline');
	domDetail.btnEditLiquidation = document.getElementById('btnEditLiquidation');
	domDetail.mobileLiquidationNo = document.getElementById('mobileLiquidationNo');
	domDetail.mobileStatus = document.getElementById('mobileStatus');
	domDetail.mobileCaAmount = document.getElementById('mobileCaAmount');
	domDetail.mobileTotal = document.getElementById('mobileTotal');
	domDetail.mobileVariance = document.getElementById('mobileVariance');
	domDetail.mobileCaRef = document.getElementById('mobileCaRef');
	domDetail.mobileCaDate = document.getElementById('mobileCaDate');
	domDetail.mobileSubmittedDate = document.getElementById('mobileSubmittedDate');
	domDetail.mobileExpenseDate = document.getElementById('mobileExpenseDate');
	domDetail.mobilePayableTo = document.getElementById('mobilePayableTo');
	domDetail.mobileCostCenter = document.getElementById('mobileCostCenter');
	domDetail.mobileAddress = document.getElementById('mobileAddress');
	domDetail.mobilePurpose = document.getElementById('mobilePurpose');

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
	if (domDetail.mobileLiquidationNo) {
		domDetail.mobileLiquidationNo.textContent = ref;
	}

	// Use dedicated endpoint instead of loading all headers
	ajax_loader('transactions/liquidation/api/get/header_by_id', { LiquidationId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			return;
		}

		const record = res.data;

		if (domDetail.viewLiquidationNo) {
			domDetail.viewLiquidationNo.textContent = normalizeDate(record.liquidation_id);
		}
		if (domDetail.mobileLiquidationNo) {
			domDetail.mobileLiquidationNo.textContent = normalizeDate(record.liquidation_id) || '-';
		}
		if (domDetail.viewCaRef) {
			domDetail.viewCaRef.textContent = normalizeDate(record.cash_advance_id);
		}
		if (domDetail.mobileCaRef) {
			domDetail.mobileCaRef.textContent = normalizeDate(record.cash_advance_id) || '-';
		}
		if (domDetail.viewCaAmount) {
			domDetail.viewCaAmount.textContent = formatPHP(Number(record.ca_amount || 0));
		}
		if (domDetail.mobileCaAmount) {
			domDetail.mobileCaAmount.textContent = formatPHP(Number(record.ca_amount || 0));
		}
		const submittedDate = normalizeDate(record.submitted_date || '').slice(0, 10) || '-';
		if (domDetail.viewCaDate) {
			domDetail.viewCaDate.textContent = submittedDate;
		}
		if (domDetail.mobileCaDate) {
			domDetail.mobileCaDate.textContent = submittedDate;
		}
		if (domDetail.viewLiquidatedAmount) {
			domDetail.viewLiquidatedAmount.textContent = formatPHP(Number(record.total_amount_spent || 0));
		}
		if (domDetail.mobileTotal) {
			domDetail.mobileTotal.textContent = formatPHP(Number(record.total_amount_spent || 0));
		}
		if (domDetail.viewStatus) {
			domDetail.viewStatus.innerHTML = getStatusBadge(normalizeDate(record.status_name));
		}
		if (domDetail.mobileStatus) {
			domDetail.mobileStatus.textContent = normalizeDate(record.status_name) || '-';
		}
		if (domDetail.viewSubmittedDate) {
			domDetail.viewSubmittedDate.textContent = submittedDate;
		}
		if (domDetail.mobileSubmittedDate) {
			domDetail.mobileSubmittedDate.textContent = submittedDate;
		}

		// New fields from SP
		if (domDetail.viewPayableTo) {
			domDetail.viewPayableTo.textContent = normalizeDate(record.payable_to || '') || '-';
		}
		if (domDetail.mobilePayableTo) {
			domDetail.mobilePayableTo.textContent = normalizeDate(record.payable_to || '') || '-';
		}
		if (domDetail.viewAddress) {
			domDetail.viewAddress.textContent = normalizeDate(record.address || '') || '-';
		}
		if (domDetail.mobileAddress) {
			domDetail.mobileAddress.textContent = normalizeDate(record.address || '') || '-';
		}
		if (domDetail.viewCostCenter) {
			const ccId = record.cost_center_id || '';
			const ccName = record.cost_center_name || '';
			const costCenterText = ccId && ccName ? `${ccId} - ${ccName}` : (normalizeDate(ccId || ccName) || '-');
			domDetail.viewCostCenter.textContent = costCenterText;
			if (domDetail.mobileCostCenter) {
				domDetail.mobileCostCenter.textContent = costCenterText;
			}
		}

		const refund = Number(record.refund_amount || 0);
		const reimburse = Number(record.reimburse_amount || 0);
		const variance = getVariancePresentation(refund, reimburse);
		if (domDetail.viewVariance) {
			domDetail.viewVariance.innerHTML = variance.desktopHtml;
		}
		if (domDetail.mobileVariance) {
			domDetail.mobileVariance.textContent = variance.mobileText;
		}
		if (domDetail.viewPurpose) {
			domDetail.viewPurpose.textContent = normalizeDate(record.description || '') || '-';
		}
		if (domDetail.mobilePurpose) {
			domDetail.mobilePurpose.textContent = normalizeDate(record.description || '') || '-';
		}

		const statusCode = normalizeDate(record.status_code || '');
		const isSubmitted = statusCode === 'LQ_SUBMITTED';
		const currentUserId = Number(window.currentUserId || 0);
		const createdById = Number(record.created_by || 0);
		
		if (isSubmitted && createdById === currentUserId && domDetail.btnEditLiquidation) {
			domDetail.btnEditLiquidation.classList.remove('d-none');
			domDetail.btnEditLiquidation.href = `${base_url}transactions/liquidation/edit/${encodeURIComponent(ref)}`;
		}
	}).fail(() => {
		// Silently fail - details will still try to load
	});

	ajax_loader('transactions/liquidation/api/get/details', { LiquidationId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			if (domDetail.viewExpenseItems) {
				domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
			}
			return;
		}

		const expenses = res.data || [];
		
		fetchApprovalStatusForItems(ref, expenses).then((expensesWithStatus) => {
			renderDetailExpenseItems(expensesWithStatus);

			if (domDetail.viewExpenseDate && expensesWithStatus.length) {
				const dates = expensesWithStatus
					.map((e) => normalizeDate(e.document_date || '').slice(0, 10))
					.filter(Boolean)
					.sort();
				const first = dates[0] || '-';
				const last = dates[dates.length - 1] || '-';
				const rangeText = first === last ? first : `${first} \u2013 ${last}`;
				domDetail.viewExpenseDate.textContent = rangeText;
				if (domDetail.mobileExpenseDate) {
					domDetail.mobileExpenseDate.textContent = rangeText;
				}
			}

			loadAuditTrail();
		});
	}).fail(() => {
		if (domDetail.viewExpenseItems) {
			domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
		}
	});
};

const fetchApprovalStatusForItems = (liquidationId, expenses) => {
	return new Promise((resolve) => {
		ajax_loader('transactions/liquidation/api/get/for_edit', { LiquidationId: liquidationId }).done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success' || !res.data || !res.data.details) {
				resolve(expenses);
				return;
			}

			const detailsWithStatus = res.data.details || [];
			const statusMap = {};
			
			detailsWithStatus.forEach((detail) => {
				statusMap[Number(detail.id)] = {
					has_approved: detail.has_approved,
					has_rejected: detail.has_rejected,
					rejection_reason: detail.rejection_reason,
					rejected_by_name: detail.rejected_by_name,
				};
			});

			const merged = expenses.map((expense) => {
				const detailId = Number(expense.id || 0);
				const status = statusMap[detailId] || {};
				return {
					...expense,
					has_approved: status.has_approved || 0,
					has_rejected: status.has_rejected || 0,
					rejection_reason: status.rejection_reason || '',
					rejected_by_name: status.rejected_by_name || '',
				};
			});

			resolve(merged);
		}).fail(() => {
			resolve(expenses);
		});
	});
};