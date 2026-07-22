const dashboardDom = {
	metricOpenCashAdvance: null,
	metricForLiquidation: null,
	metricPendingReimbursements: null,
	kpiLinks: [],
	recentRequestCount: null,
	recentRequestsMobile: null,
	recentRequestsState: null,
	attentionCount: null,
	attentionList: null,
	attentionState: null,
	pendingApprovalsRow: null,
	pendingApprovalsList: null,
	pendingApprovalsCount: null,
};

const dashboardRoutes = {
	'cash-advance': 'transactions/cash-advance',
	liquidation: 'transactions/liquidation',
	reimburse: 'transactions/reimbursement',
};

const dashboardState = {
	data: null,
	requestId: 0,
};

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const normalizeText = (value) => (value ? String(value) : '');

const statusCategory = (statusCode) => {
	const code = normalizeText(statusCode).toUpperCase();
	if (code.endsWith('DRAFT')) return 'Draft';
	if (code.endsWith('SUBMITTED') || code.endsWith('PENDING')) return 'Pending Approval';
	if (code.endsWith('FOR_LIQUIDATION')) return 'For Liquidation';
	if (code.endsWith('APPROVED')) return 'Approved';
	if (code.endsWith('FOR_RELEASE')) return 'For Release';
	if (code.endsWith('PAID') || code.endsWith('COMPLETED')) return 'Completed';
	if (code.endsWith('REJECTED')) return 'Rejected';
	return code || 'Unknown';
};

const TYPE_LABELS = {
	CASH_ADVANCE: 'Cash Advance',
	LIQUIDATION: 'Liquidation',
	REIMBURSEMENT: 'Reimbursement',
};

const badgeClassForCategory = (category) => {
	if (category === 'Pending Approval') return 'kna-badge kna-badge-pending';
	if (category === 'For Release' || category === 'For Liquidation') return 'kna-badge kna-badge-liquidation';
	if (category === 'Approved' || category === 'Completed') return 'kna-badge kna-badge-approved';
	if (category === 'Rejected') return 'kna-badge kna-badge-reimburse';
	return 'kna-badge kna-badge-submitted';
};

const ATTENTION_META = {
	DRAFT_AGING: { status: 'Draft', route: (ref) => routeForReference(ref, 'add') },
	REJECTED: { status: 'Rejected', route: (ref) => routeForReference(ref, 'view') },
	LIQUIDATION_OVERDUE: { status: 'For Liquidation', route: () => 'transactions/liquidation/add' },
};

const ATTENTION_TITLE_DETAIL = {
	DRAFT_AGING: (row) => `${row.days_open} day(s) since it was started — submit it or it may need re-checking.`,
	REJECTED: (row) => `Rejected ${row.days_open} day(s) ago — review the remarks and resubmit.`,
	LIQUIDATION_OVERDUE: (row) => `Released ${row.days_open} day(s) ago with no liquidation filed yet.`,
};

const routeForReference = (referenceNo, mode) => {
	const ref = normalizeText(referenceNo);
	if (ref.startsWith('CA')) return mode === 'add' ? 'transactions/cash-advance/add' : 'transactions/cash-advance';
	if (ref.startsWith('RPL')) return mode === 'add' ? 'transactions/replenishment/add' : `transactions/replenishment/view/${ref}`;
	if (ref.startsWith('RMB')) return mode === 'add' ? 'transactions/reimbursement/add' : `transactions/reimbursement/view/${ref}`;
	if (ref.startsWith('LQ')) return 'transactions/liquidation';
	return '';
};

const stateConfig = {
	loading: { text: 'Loading dashboard data...', cls: '' },
	empty: { text: 'No data available', cls: '' },
	error: { text: 'Unable to load dashboard data.', cls: 'kna-state-error' },
};

const setSectionState = (stateName, message) => {
	const config = stateConfig[stateName] || stateConfig.empty;
	const text = message || config.text;
	[dashboardDom.recentRequestsState, dashboardDom.attentionState].forEach((el) => {
		if (!el) return;
		el.className = `kna-state ${config.cls || ''}`.trim();
		el.textContent = text;
		if (stateName === 'ready') {
			el.classList.add('d-none');
		} else {
			el.classList.remove('d-none');
		}
	});

	const showContent = stateName === 'ready';
	if (dashboardDom.recentRequestsMobile) {
		dashboardDom.recentRequestsMobile.classList.toggle('d-none', !showContent);
	}
	if (dashboardDom.attentionList) {
		dashboardDom.attentionList.classList.toggle('d-none', !showContent);
	}
};

const setSummaryLoading = () => {
	dashboardDom.metricOpenCashAdvance.textContent = '-';
	dashboardDom.metricForLiquidation.textContent = '-';
	dashboardDom.metricPendingReimbursements.textContent = '-';
	dashboardDom.recentRequestCount.textContent = '...';
	dashboardDom.attentionCount.textContent = '...';
};

const fetchDashboardData = () =>
	new Promise((resolve, reject) => {
		ajax_loader('dashboard/api/get/summary', { Scope: 'month' }).done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				reject(new Error(res.response || 'Failed to load dashboard data.'));
				return;
			}
			resolve(res.data || {});
		}).fail(() => {
			reject(new Error('Failed to load dashboard data.'));
		});
	});

const renderSummary = () => {
	const summaryRows = (dashboardState.data && dashboardState.data.summary) || [];
	const s = Array.isArray(summaryRows) ? (summaryRows[0] || {}) : summaryRows;

	dashboardDom.metricOpenCashAdvance.textContent = s.open_cash_advance_count ?? 0;
	dashboardDom.metricForLiquidation.textContent = s.for_liquidation_count ?? 0;
	dashboardDom.metricPendingReimbursements.textContent = s.pending_reimbursement_count ?? 0;
};

const TYPE_ICON_CLASS = {
	CASH_ADVANCE: 'type-cash-advance',
	LIQUIDATION: 'type-liquidation',
	REIMBURSEMENT: 'type-reimbursement',
};

const TYPE_ICON_GLYPH = {
	CASH_ADVANCE: '<i class="fas fa-hand-holding-usd"></i>',
	LIQUIDATION: '<i class="fas fa-receipt"></i>',
	REIMBURSEMENT: '<i class="fas fa-wallet"></i>',
};

const renderRecentRequests = () => {
	const rows = (dashboardState.data && dashboardState.data.recent) || [];
	dashboardDom.recentRequestCount.textContent = `${rows.length} item(s)`;
	dashboardDom.recentRequestsMobile.innerHTML = '';

	if (!rows.length) {
		dashboardDom.recentRequestsMobile.innerHTML = '<div class="kna-empty">No recent requests.</div>';
		return;
	}

	dashboardDom.recentRequestsMobile.innerHTML = rows.map((row) => {
		const typeLabel = TYPE_LABELS[row.transaction_type] || row.transaction_type;
		const category = statusCategory(row.status_code);
		const badgeClass = badgeClassForCategory(category);
		const purpose = normalizeText(row.purpose) || typeLabel;
		const updated = normalizeText(row.updated_date).slice(0, 10);
		const iconClass = TYPE_ICON_CLASS[row.transaction_type] || 'type-reimbursement';
		const iconGlyph = TYPE_ICON_GLYPH[row.transaction_type] || '<i class="fas fa-file-invoice"></i>';
		const route = routeForReference(row.reference_no, 'view');
		const tag = route ? 'a' : 'div';
		const hrefAttr = route ? ` href="${base_url}${route}"` : '';

		return `
			<${tag} class="kna-request-item"${hrefAttr}>
				<div class="kna-request-icon ${iconClass}">${iconGlyph}</div>
				<div class="kna-request-main">
					<div class="kna-request-ref">${escapeHtml(row.reference_no)}</div>
					<div class="kna-request-purpose" title="${escapeHtml(purpose)}">${escapeHtml(typeLabel)} · ${escapeHtml(purpose)}</div>
				</div>
				<div class="kna-request-side">
					<div class="kna-request-amount">${formatPHP(row.amount)}</div>
					<div class="kna-request-meta">
						<span class="${badgeClass}">${escapeHtml(category)}</span>
						<span>${escapeHtml(updated)}</span>
					</div>
				</div>
			</${tag}>
		`;
	}).join('');
};

const renderAttention = () => {
	const items = (dashboardState.data && dashboardState.data.attention) || [];
	dashboardDom.attentionCount.textContent = `${items.length} item(s)`;
	dashboardDom.attentionList.innerHTML = '';

	if (!items.length) {
		dashboardDom.attentionList.innerHTML = '<div class="kna-empty">Nothing urgent right now.</div>';
		return;
	}

	items.forEach((row) => {
		const meta = ATTENTION_META[row.attention_type] || { status: 'Attention', route: () => '' };
		const detailFn = ATTENTION_TITLE_DETAIL[row.attention_type];
		const detail = detailFn ? detailFn(row) : '';
		const route = meta.route(row.reference_no);
		const badgeClass = badgeClassForCategory(meta.status);

		const wrapper = document.createElement('div');
		wrapper.className = 'kna-attention-item';
		const actionHtml = route
			? `<a href="${base_url}${route}" class="btn btn-outline-secondary btn-sm kna-small mt-2">${escapeHtml(row.reference_no)}</a>`
			: `<button type="button" class="btn btn-outline-secondary btn-sm kna-small mt-2" disabled>${escapeHtml(row.reference_no)}</button>`;

		wrapper.innerHTML = `
			<div class="kna-attention-head">
				<p class="kna-attention-title">${escapeHtml(row.title)}</p>
				<span class="${badgeClass}">${escapeHtml(meta.status)}</span>
			</div>
			<p class="kna-attention-meta">${escapeHtml(detail)}</p>
			${actionHtml}
		`;
		dashboardDom.attentionList.appendChild(wrapper);
	});
};

const renderPendingApprovals = () => {
	const row = dashboardDom.pendingApprovalsRow;
	const list = dashboardDom.pendingApprovalsList;
	if (!row || !list) return;

	const data = dashboardState.data || {};
	const items = data.pending_approvals || [];
	const totalCount = Number(data.pending_approvals_count || items.length);

	if (!items.length) {
		row.classList.add('d-none');
		return;
	}

	row.classList.remove('d-none');
	if (dashboardDom.pendingApprovalsCount) {
		dashboardDom.pendingApprovalsCount.textContent = `View all (${totalCount})`;
	}

	list.innerHTML = items.map((item) => {
		const ref = normalizeText(item.reference_no);
		const requester = normalizeText(item.requester_name);
		const typeLabel = TYPE_LABELS[item.transaction_type] || normalizeText(item.transaction_type);
		const amount = item.ca_amount ?? item.lq_amount ?? item.amount;
		return `
			<div class="kna-approval-item">
				<div class="kna-approval-main">
					<div class="kna-approval-ref">${escapeHtml(ref)}</div>
					<p class="kna-approval-meta">${escapeHtml(typeLabel)}${requester ? ' · ' + escapeHtml(requester) : ''}</p>
				</div>
				<div class="kna-approval-amount">${formatPHP(amount)}</div>
				<a href="${base_url}transactions/approvals/review/${encodeURIComponent(ref)}" class="btn btn-primary btn-sm kna-small">Review</a>
			</div>
		`;
	}).join('');
};

const loadDashboard = async () => {
	dashboardState.requestId += 1;
	const requestId = dashboardState.requestId;

	setSummaryLoading();
	setSectionState('loading');

	try {
		const data = await fetchDashboardData();
		if (requestId !== dashboardState.requestId) return;
		dashboardState.data = data;

		renderSummary();
		renderRecentRequests();
		renderAttention();
		renderPendingApprovals();
		setSectionState('ready');
	} catch (error) {
		if (requestId !== dashboardState.requestId) return;
		setSectionState('error');
	}
};

const bindEvents = () => {
	dashboardDom.kpiLinks.forEach((btn) => {
		btn.addEventListener('click', () => {
			const route = dashboardRoutes[btn.getAttribute('data-kpi-link')];
			if (route) window.location.href = `${base_url}${route}`;
		});
	});
};

const cacheDom = () => {
	dashboardDom.metricOpenCashAdvance = document.getElementById('metricOpenCashAdvance');
	dashboardDom.metricForLiquidation = document.getElementById('metricForLiquidation');
	dashboardDom.metricPendingReimbursements = document.getElementById('metricPendingReimbursements');
	dashboardDom.kpiLinks = Array.from(document.querySelectorAll('[data-kpi-link]'));
	dashboardDom.recentRequestCount = document.getElementById('recentRequestCount');
	dashboardDom.recentRequestsMobile = document.getElementById('recentRequestsMobile');
	dashboardDom.recentRequestsState = document.getElementById('recentRequestsState');
	dashboardDom.attentionCount = document.getElementById('attentionCount');
	dashboardDom.attentionList = document.getElementById('attentionList');
	dashboardDom.attentionState = document.getElementById('attentionState');
	dashboardDom.pendingApprovalsRow = document.getElementById('pendingApprovalsRow');
	dashboardDom.pendingApprovalsList = document.getElementById('pendingApprovalsList');
	dashboardDom.pendingApprovalsCount = document.getElementById('pendingApprovalsCount');
};

const passbookState = {
	nextCursor: null,
	count: 0,
};

const renderPassbookRows = (rows, append) => {
	const body = document.getElementById('fundPassbookBody');
	if (!body) return;

	const html = (rows || []).map((row) => {
		const amount = Number(row.amount || 0);
		const moneyIn = amount > 0 ? formatPHP(amount) : '';
		const moneyOut = amount < 0 ? formatPHP(Math.abs(amount)) : '';
		const trxDate = normalizeText(row.trx_date).slice(0, 10);
		return `<tr>
			<td>${escapeHtml(trxDate)}</td>
			<td>${escapeHtml(row.trx_type_name || row.trx_type || '')}</td>
			<td>${escapeHtml(row.remarks || '')}</td>
			<td class="text-right">${moneyIn}</td>
			<td class="text-right">${moneyOut}</td>
			<td class="text-right">${formatPHP(row.balance_after)}</td>
		</tr>`;
	}).join('');

	if (append) {
		body.insertAdjacentHTML('beforeend', html);
	} else {
		body.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No fund transactions yet.</td></tr>';
	}
};

const loadFundPassbook = (append = false) => {
	const body = document.getElementById('fundPassbookBody');
	if (!body) return;

	ajax_loader('dashboard/api/fund/passbook', {
		CursorId: append ? passbookState.nextCursor : null,
		Take: 20,
	}).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') return;

		const data = res.data || {};
		const rows = data.rows || [];

		renderPassbookRows(rows, append);

		passbookState.nextCursor = data.next_cursor || null;
		passbookState.count = append ? passbookState.count + rows.length : rows.length;

		const countEl = document.getElementById('fundPassbookCount');
		if (countEl) countEl.textContent = `${passbookState.count} transaction(s)`;

		const moreWrap = document.getElementById('fundPassbookMoreWrap');
		if (moreWrap) moreWrap.classList.toggle('d-none', !data.has_more);

		const balanceEl = document.getElementById('fundBalanceValue');
		if (balanceEl && data.balance !== undefined && data.balance !== null) {
			balanceEl.textContent = formatPHP(data.balance).replace('PHP', '₱').trim();
		}
	});
};

const bindFundCashIn = () => {
	const btnOpen = document.getElementById('btnFundCashIn');
	const btnSubmit = document.getElementById('btnFundCashInSubmit');
	const btnMore = document.getElementById('btnFundPassbookMore');

	if (btnMore) {
		btnMore.addEventListener('click', () => loadFundPassbook(true));
	}
	if (!btnOpen) return;

	btnOpen.addEventListener('click', () => {
		const amountEl = document.getElementById('fundCashInAmount');
		const remarksEl = document.getElementById('fundCashInRemarks');
		if (amountEl) amountEl.value = '';
		if (remarksEl) remarksEl.value = '';
		$('#fundCashInModal').modal('show');
	});

	if (btnSubmit) {
		btnSubmit.addEventListener('click', () => {
			const amountEl = document.getElementById('fundCashInAmount');
			const remarksEl = document.getElementById('fundCashInRemarks');
			const amount = Number(amountEl ? amountEl.value : 0);

			if (!Number.isFinite(amount) || amount <= 0) {
				Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Enter an amount greater than zero.' });
				return;
			}

			Swal.fire({
				icon: 'question',
				title: 'Record Cash In?',
				text: `This will add ${formatPHP(amount)} to your fund.`,
				showCancelButton: true,
				confirmButtonText: 'Yes, Cash In',
				cancelButtonText: 'Cancel',
				reverseButtons: true,
			}).then((result) => {
				if (!result.isConfirmed) return;

				ajax_loader_loading('dashboard/api/fund/cash-in', {
					Amount: amount,
					Remarks: remarksEl ? remarksEl.value.trim() : '',
				}).done((response) => {
					const res = (typeof response === 'string') ? $.parseJSON(response) : response;
					if (res.status !== 'success') {
						Swal.fire({ icon: 'error', title: 'Failed', text: res.response || 'Failed to record cash in.' });
						return;
					}

					$('#fundCashInModal').modal('hide');
					Swal.fire({ icon: 'success', title: 'Cash In Recorded', text: 'Your fund balance has been updated.' });
					loadFundPassbook(false);
				}).fail(() => {
					Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while recording cash in.' });
				});
			});
		});
	}
};

const overdueState = {
	rows: [],
	selected: new Set(),
	extendRef: '',
};

const overdueDueBadge = (row) => {
	const days = Number(row.days_overdue || 0);
	if (Number(row.is_overdue) === 1) {
		return `<span class="kna-badge kna-badge-rejected">${days} day(s) overdue</span>`;
	}
	if (days === 0) {
		return '<span class="kna-badge kna-badge-pending">Due today</span>';
	}
	return `<span class="kna-badge kna-badge-liquidation">Due in ${Math.abs(days)} day(s)</span>`;
};

const updateOverdueToolbar = () => {
	const btn = document.getElementById('btnNotifyOverdue');
	if (btn) btn.disabled = overdueState.selected.size === 0;

	const summary = document.getElementById('overdueSummary');
	if (summary) {
		const overdue = overdueState.rows.filter((r) => Number(r.is_overdue) === 1);
		const total = overdue.reduce((sum, r) => sum + Number(r.amount || 0), 0);
		summary.textContent = overdue.length
			? `${overdue.length} overdue — ${formatPHP(total)} unliquidated`
			: '';
	}

	const selectAll = document.getElementById('overdueSelectAll');
	if (selectAll) {
		const boxes = Array.from(document.querySelectorAll('.overdue-row-checkbox'));
		selectAll.checked = boxes.length > 0 && boxes.every((cb) => cb.checked);
	}
};

const renderOverdueList = () => {
	const body = document.getElementById('overdueListBody');
	if (!body) return;

	if (!overdueState.rows.length) {
		body.innerHTML = '<tr><td colspan="10" class="text-center text-muted kna-small">No cash advances awaiting liquidation.</td></tr>';
		updateOverdueToolbar();
		return;
	}

	body.innerHTML = overdueState.rows.map((row) => {
		const ref = normalizeText(row.cash_advance_id);
		const remarks = normalizeText(row.due_extension_remarks);
		const extendedBy = normalizeText(row.due_extended_by_name);
		const remarksCell = remarks
			? `${escapeHtml(remarks)}${extendedBy ? ` <span class="text-muted">(${escapeHtml(extendedBy)})</span>` : ''}`
			: '<span class="text-muted">—</span>';
		return `<tr>
			<td><input type="checkbox" class="overdue-row-checkbox" data-ref="${escapeHtml(ref)}" ${overdueState.selected.has(ref) ? 'checked' : ''}></td>
			<td class="text-nowrap">${escapeHtml(ref)}</td>
			<td>${escapeHtml(normalizeText(row.employee_name))}</td>
			<td>${escapeHtml(normalizeText(row.department_name))}</td>
			<td class="text-right">${formatPHP(row.amount)}</td>
			<td>${escapeHtml(normalizeText(row.released_date).slice(0, 10))}</td>
			<td>${escapeHtml(normalizeText(row.due_date).slice(0, 10))}</td>
			<td>${overdueDueBadge(row)}</td>
			<td class="text-truncate" style="max-width:220px;">${remarksCell}</td>
			<td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary kna-small" data-action="extend" data-ref="${escapeHtml(ref)}">Extend</button></td>
		</tr>`;
	}).join('');

	updateOverdueToolbar();
};

const loadOverdueList = () => {
	if (!document.getElementById('overdueListBody')) return;

	ajax_loader('dashboard/api/overdue-liquidations', {}).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') return;
		overdueState.rows = (res.data && res.data.rows) || [];
		overdueState.selected.clear();
		renderOverdueList();
	});
};

const bindOverduePanel = () => {
	const body = document.getElementById('overdueListBody');
	if (!body) return;

	body.addEventListener('change', (event) => {
		const cb = event.target.closest('.overdue-row-checkbox');
		if (!cb) return;
		const ref = cb.getAttribute('data-ref');
		if (cb.checked) {
			overdueState.selected.add(ref);
		} else {
			overdueState.selected.delete(ref);
		}
		updateOverdueToolbar();
	});

	body.addEventListener('click', (event) => {
		const btn = event.target.closest('button[data-action="extend"]');
		if (!btn) return;
		overdueState.extendRef = btn.getAttribute('data-ref');
		const refEl = document.getElementById('extendDueRef');
		const dateEl = document.getElementById('extendDueDate');
		const remarksEl = document.getElementById('extendDueRemarks');
		if (refEl) refEl.textContent = overdueState.extendRef;
		if (dateEl) {
			const tomorrow = new Date(Date.now() + 86400000);
			dateEl.min = tomorrow.toISOString().slice(0, 10);
			dateEl.value = '';
		}
		if (remarksEl) remarksEl.value = '';
		$('#extendDueModal').modal('show');
	});

	const selectAll = document.getElementById('overdueSelectAll');
	if (selectAll) {
		selectAll.addEventListener('change', () => {
			const checked = selectAll.checked;
			document.querySelectorAll('.overdue-row-checkbox').forEach((cb) => {
				cb.checked = checked;
				const ref = cb.getAttribute('data-ref');
				if (checked) {
					overdueState.selected.add(ref);
				} else {
					overdueState.selected.delete(ref);
				}
			});
			updateOverdueToolbar();
		});
	}

	const btnNotify = document.getElementById('btnNotifyOverdue');
	if (btnNotify) {
		btnNotify.addEventListener('click', () => {
			const refs = Array.from(overdueState.selected);
			if (!refs.length) return;

			Swal.fire({
				icon: 'question',
				title: 'Send Liquidation Reminders?',
				text: `This will email a reminder to the holder(s) of ${refs.length} cash advance(s).`,
				showCancelButton: true,
				confirmButtonText: 'Send',
				cancelButtonText: 'Cancel',
				reverseButtons: true,
			}).then((result) => {
				if (!result.isConfirmed) return;

				ajax_loader_loading('dashboard/api/overdue-liquidations/notify', {
					reference_numbers: refs,
				}).done((response) => {
					const res = (typeof response === 'string') ? $.parseJSON(response) : response;
					if (res.status !== 'success') {
						Swal.fire({ icon: 'error', title: 'Failed', text: res.response || 'Failed to send reminders.' });
						return;
					}
					const data = res.data || {};
					const notified = (data.notified || []).length;
					const skipped = (data.skipped || []).length;
					Swal.fire({
						icon: skipped ? 'warning' : 'success',
						title: 'Reminders Sent',
						text: `${notified} reminder(s) sent.${skipped ? ` ${skipped} skipped (no email or no longer pending).` : ''}`,
					});
					overdueState.selected.clear();
					updateOverdueToolbar();
				}).fail(() => {
					Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while sending reminders.' });
				});
			});
		});
	}

	const btnExtendSave = document.getElementById('btnExtendDueSave');
	if (btnExtendSave) {
		btnExtendSave.addEventListener('click', () => {
			const dateEl = document.getElementById('extendDueDate');
			const remarksEl = document.getElementById('extendDueRemarks');
			const newDate = dateEl ? dateEl.value : '';
			const remarks = remarksEl ? remarksEl.value.trim() : '';

			if (!newDate) {
				Swal.fire({ icon: 'warning', title: 'Missing Date', text: 'Select the new due date.' });
				return;
			}
			if (!remarks) {
				Swal.fire({ icon: 'warning', title: 'Remarks Required', text: 'State the reason for the extension (e.g. on official business).' });
				return;
			}

			ajax_loader_loading('dashboard/api/overdue-liquidations/extend', {
				CashAdvanceId: overdueState.extendRef,
				NewDueDate: newDate,
				Remarks: remarks,
			}).done((response) => {
				const res = (typeof response === 'string') ? $.parseJSON(response) : response;
				if (res.status !== 'success') {
					Swal.fire({ icon: 'error', title: 'Failed', text: res.response || 'Failed to extend the due date.' });
					return;
				}
				$('#extendDueModal').modal('hide');
				Swal.fire({ icon: 'success', title: 'Due Date Extended', text: `${overdueState.extendRef} is now due on ${newDate}.` });
				loadOverdueList();
			}).fail(() => {
				Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while extending the due date.' });
			});
		});
	}
};

const initDashboard = () => {
	cacheDom();
	bindEvents();
	loadDashboard();
	bindFundCashIn();
	loadFundPassbook(false);
	bindOverduePanel();
	loadOverdueList();
};

$(document).ready(() => {
	initDashboard();
});
