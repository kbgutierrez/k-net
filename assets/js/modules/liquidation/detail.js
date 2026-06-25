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
	btnEditLiquidation: null,
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

			// Rejection / Approval badges
			const hasApproved = Boolean(Number(expense.has_approved || 0));
			const hasRejected = Boolean(Number(expense.has_rejected || 0));
			const rejectionReason = normalizeDate(expense.rejection_reason || '');
			const rejectedByName = normalizeDate(expense.rejected_by_name || '');

			let statusBadge = '';
			if (hasApproved) {
				statusBadge = `<div class="kna-approved-badge" style="margin-top:4px;"><i class="fas fa-check"></i> Approved</div>`;
			} else if (hasRejected) {
				statusBadge = `<div class="kna-rejected-badge" style="margin-top:4px;"><i class="fas fa-times"></i> Rejected by ${escapeHtml(rejectedByName)}</div>
					<div class="kna-rejected-reason" style="font-size:11px;color:#991b1b;font-style:italic;">"${escapeHtml(rejectionReason)}"</div>`;
			}

			return `
				<tr>
					<td class="text-center kna-rownum kna-cell-index" data-label="#">${i + 1}</td>
					<td data-label="Date">${escapeHtml(docDate)}</td>
					<td data-label="Category">${escapeHtml(category)}</td>
					<td data-label="Reference">${escapeHtml(reference)}</td>
					<td class="text-center kna-cell-vat" data-label="VAT">${vatBadge}</td>
					<td class="kna-cell-attachment" data-label="Attachment">${attachHtml}</td>
					<td data-label="Remarks">${escapeHtml(description)}${statusBadge}</td>
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

			// Rejection / Approval badges for mobile
			const hasApproved = Boolean(Number(expense.has_approved || 0));
			const hasRejected = Boolean(Number(expense.has_rejected || 0));
			const rejectionReason = normalizeDate(expense.rejection_reason || '');
			const rejectedByName = normalizeDate(expense.rejected_by_name || '');

			let statusBadge = '';
			if (hasApproved) {
				statusBadge = `<div class="kna-approved-badge" style="margin-top:6px;"><i class="fas fa-check"></i> Approved</div>`;
			} else if (hasRejected) {
				statusBadge = `<div class="kna-rejected-badge" style="margin-top:6px;"><i class="fas fa-times"></i> Rejected by ${escapeHtml(rejectedByName)}</div>
					<div class="kna-rejected-reason" style="font-size:11px;color:#991b1b;font-style:italic;">"${escapeHtml(rejectionReason)}"</div>`;
			}

			return `
				<div class="kna-exp-card">
					<div class="kna-exp-card-head">
						<div>
							<div class="kna-exp-card-title">${escapeHtml(category || 'Expense Item')} <span class="kna-exp-card-sub">#${i + 1}</span></div>
							<div class="kna-exp-card-meta">${escapeHtml(docDate)} • ${escapeHtml(reference)}</div>
							${statusBadge}
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
				<<thead>
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

// ─── GROUP AUDIT TRAIL BY APPROVER + TIMESTAMP ───
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

// ─── BUILD TIMELINE ENTRY TEXT ───
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

	// CASE 1: Has items → group them
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

	// CASE 2: Header-only entry
	if (group.hasHeader && !hasItems) {
		let text = `${changedByName} ${actionText} ${entityDesc}`;
		if (group.description) text += ` — ${group.description}`;
		if (remarks) text += `: "${remarks}"`;
		return text;
	}

	// CASE 3: Fallback
	let text = `${changedByName} ${actionText} ${entityDesc}`;
	if (group.description) text += ` — ${group.description}`;
	if (remarks) text += `: "${remarks}"`;
	return text;
};

// ─── RENDER HISTORY TIMELINE FROM AUDIT TRAIL DATA ───
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

// ─── FETCH AND DISPLAY AUDIT TRAIL ───
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

// ─── LEGACY: Keep for compatibility ───
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
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewSubmittedDate = document.getElementById('viewSubmittedDate');
	domDetail.viewExpenseItems = document.getElementById('viewExpenseItems');
	domDetail.viewTimeline = document.getElementById('viewTimeline');
	domDetail.btnEditLiquidation = document.getElementById('btnEditLiquidation');

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

		// Show Edit button if submitted and user is the creator
		const statusCode = normalizeDate(record.status_code || '');
		const isSubmitted = statusCode === 'LQ_SUBMITTED';
		const currentUserId = Number(window.currentUserId || 0); // Set this in your PHP view
		const createdById = Number(record.created_by || 0);
		
		if (isSubmitted && createdById === currentUserId && domDetail.btnEditLiquidation) {
			domDetail.btnEditLiquidation.classList.remove('d-none');
			domDetail.btnEditLiquidation.href = `${base_url}transactions/liquidation/edit/${encodeURIComponent(ref)}`;
		}
	});

	// Load expense details with approval status
	ajax_loader('transactions/liquidation/api/get/details', { LiquidationId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			if (domDetail.viewExpenseItems) {
				domDetail.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
			}
			return;
		}

		const expenses = res.data || [];
		
		// Fetch approval status for each item
		fetchApprovalStatusForItems(ref, expenses).then((expensesWithStatus) => {
			renderDetailExpenseItems(expensesWithStatus);

			if (domDetail.viewExpenseDate && expensesWithStatus.length) {
				const dates = expensesWithStatus
					.map((e) => normalizeDate(e.document_date || '').slice(0, 10))
					.filter(Boolean)
					.sort();
				const first = dates[0] || '-';
				const last = dates[dates.length - 1] || '-';
				domDetail.viewExpenseDate.textContent = first === last ? first : `${first} \u2013 ${last}`;
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
		// Fetch approval per items data
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