const dashboardDom = {
	metricOpenCashAdvance: null,
	metricForLiquidation: null,
	metricPendingReimbursements: null,
	metricMonthTotal: null,
	dashboardLastUpdated: null,
	scopeButtons: [],
	kpiLinks: [],
	recentRequestCount: null,
	recentRequestsMobile: null,
	recentRequestsState: null,
	attentionCount: null,
	attentionList: null,
	attentionState: null,
	statusOverviewList: null,
	statusState: null,
	monthCashAdvance: null,
	monthLiquidated: null,
	monthReimbursed: null,
	statusOverviewChart: null,
};

let statusOverviewChartInstance = null;

const dashboardRoutes = {
	'cash-advance': 'transactions/cash-advance',
	liquidation: 'transactions/liquidation',
	reimburse: 'transactions/reimbursement',
	'month-summary': 'transactions/cash-advance',
};

const dashboardState = {
	scope: 'month',
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

const normalizeDate = (value) => (value ? String(value) : '');

/* Status codes differ per module (CA_*, LQ_*, RMB_*) but share the same
   DRAFT -> SUBMITTED/PENDING -> APPROVED -> FOR_RELEASE -> COMPLETED/PAID
   (or REJECTED) shape — bucket by suffix, mirroring the SQL side. */
const statusCategory = (statusCode) => {
	const code = normalizeDate(statusCode).toUpperCase();
	if (code.endsWith('DRAFT')) return 'Draft';
	if (code.endsWith('SUBMITTED') || code.endsWith('PENDING')) return 'Pending Approval';
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
	if (category === 'For Release') return 'kna-badge kna-badge-liquidation';
	if (category === 'Approved' || category === 'Completed') return 'kna-badge kna-badge-approved';
	if (category === 'Rejected') return 'kna-badge kna-badge-reimburse';
	return 'kna-badge kna-badge-submitted';
};

const STATUS_TONE_COLOR = {
	'Draft': 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
	'Pending Approval': 'linear-gradient(90deg, #f0b429, #f7c95c)',
	'Approved': 'linear-gradient(90deg, #17663a, #3fa45e)',
	'For Release': 'linear-gradient(90deg, #1b4f88, #4e8dd0)',
	'Completed': 'linear-gradient(90deg, #17663a, #3fa45e)',
	'Rejected': 'linear-gradient(90deg, #c0392b, #e57368)',
};

const ATTENTION_META = {
	DRAFT_AGING: { status: 'Draft', route: (ref) => routeForReference(ref, 'add') },
	REJECTED: { status: 'Rejected', route: (ref) => routeForReference(ref, 'view') },
	LIQUIDATION_OVERDUE: { status: 'For Liquidation', route: () => 'transactions/liquidation/add' },
};

const routeForReference = (referenceNo, mode) => {
	const ref = normalizeDate(referenceNo);
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
	const states = [dashboardDom.recentRequestsState, dashboardDom.attentionState, dashboardDom.statusState];
	states.forEach((el) => {
		if (!el) {
			return;
		}
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
	if (dashboardDom.statusOverviewList) {
		dashboardDom.statusOverviewList.classList.toggle('d-none', !showContent);
	}
};

const setSummaryLoading = () => {
	dashboardDom.metricOpenCashAdvance.textContent = '-';
	dashboardDom.metricForLiquidation.textContent = '-';
	dashboardDom.metricPendingReimbursements.textContent = '-';
	dashboardDom.metricMonthTotal.textContent = '-';
	dashboardDom.monthCashAdvance.textContent = '-';
	dashboardDom.monthLiquidated.textContent = '-';
	dashboardDom.monthReimbursed.textContent = '-';
	dashboardDom.recentRequestCount.textContent = '...';
	dashboardDom.attentionCount.textContent = '...';
};

const setLastUpdated = () => {
	if (!dashboardDom.dashboardLastUpdated) {
		return;
	}
	const now = new Date();
	dashboardDom.dashboardLastUpdated.textContent = now.toLocaleString('en-PH', {
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const fetchDashboardData = (scope) =>
	new Promise((resolve, reject) => {
		ajax_loader('dashboard/api/get/summary', { Scope: scope }).done((response) => {
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
	dashboardDom.metricMonthTotal.textContent = formatPHP(s.scope_total_amount);

	dashboardDom.monthCashAdvance.textContent = formatPHP(s.month_ca_released);
	dashboardDom.monthLiquidated.textContent = formatPHP(s.month_liquidated);
	dashboardDom.monthReimbursed.textContent = formatPHP(s.month_reimbursed);
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

const routeForRecentRow = (row) => routeForReference(row.reference_no, 'view');

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
		const purpose = normalizeDate(row.purpose) || typeLabel;
		const updated = normalizeDate(row.updated_date).slice(0, 10);
		const iconClass = TYPE_ICON_CLASS[row.transaction_type] || 'type-reimbursement';
		const iconGlyph = TYPE_ICON_GLYPH[row.transaction_type] || '<i class="fas fa-file-invoice"></i>';
		const route = routeForRecentRow(row);
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

const ATTENTION_TITLE_DETAIL = {
	DRAFT_AGING: (row) => `${row.days_open} day(s) since it was started — submit it or it may need re-checking.`,
	REJECTED: (row) => `Rejected ${row.days_open} day(s) ago — review the remarks and resubmit.`,
	LIQUIDATION_OVERDUE: (row) => `Released ${row.days_open} day(s) ago with no liquidation filed yet.`,
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
		const badgeClass = badgeClassForCategory(meta.status === 'For Liquidation' ? 'For Release' : meta.status);

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

const renderStatusOverview = () => {
	const items = (dashboardState.data && dashboardState.data.status_overview) || [];
	dashboardDom.statusOverviewList.innerHTML = '';

	if (!items.length) {
		dashboardDom.statusOverviewList.innerHTML = '<div class="kna-empty">No status data yet.</div>';
		return;
	}

	const grandTotal = items.reduce((sum, item) => sum + Number(item.item_count || 0), 0);

	items.forEach((item) => {
		const count = Number(item.item_count || 0);
		const percentage = grandTotal > 0 ? Math.min(100, Math.round((count / grandTotal) * 100)) : 0;
		const color = STATUS_TONE_COLOR[item.status_category] || STATUS_TONE_COLOR['Pending Approval'];
		const wrapper = document.createElement('div');
		wrapper.className = 'kna-status-item';
		wrapper.innerHTML = `
			<div class="kna-status-head">
				<p class="kna-status-title">${escapeHtml(item.status_category)}</p>
				<div class="kna-small text-muted">${count} item(s) · ${formatPHP(item.total_amount)}</div>
			</div>
			<div class="kna-status-bar">
				<div class="kna-status-fill" style="width:${percentage}%;background:${color};"></div>
			</div>
		`;
		dashboardDom.statusOverviewList.appendChild(wrapper);
	});
};

const renderStatusChart = () => {
	const canvas = dashboardDom.statusOverviewChart;
	if (!canvas || typeof Chart === 'undefined') {
		return;
	}
	const items = (dashboardState.data && dashboardState.data.status_overview) || [];

	if (statusOverviewChartInstance) {
		statusOverviewChartInstance.destroy();
		statusOverviewChartInstance = null;
	}

	if (!items.length) {
		return;
	}

	const labels = items.map((item) => item.status_category);
	const counts = items.map((item) => Number(item.item_count || 0));
	const colors = items.map((item) => {
		const grad = STATUS_TONE_COLOR[item.status_category] || '';
		const match = grad.match(/#[0-9a-fA-F]{3,6}/);
		return match ? match[0] : '#607080';
	});

	const isNarrow = window.innerWidth < 768;

	statusOverviewChartInstance = new Chart(canvas.getContext('2d'), {
		type: 'doughnut',
		data: {
			labels,
			datasets: [{
				data: counts,
				backgroundColor: colors,
				borderWidth: 2,
				borderColor: '#ffffff',
			}],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: '62%',
			plugins: {
				legend: { position: isNarrow ? 'bottom' : 'right', labels: { boxWidth: 10, font: { size: 11 } } },
				tooltip: {
					callbacks: {
						label: (ctx) => `${ctx.label}: ${ctx.parsed} item(s)`,
					},
				},
				datalabels: { display: false },
			},
		},
	});
};

const updateScopeButtons = () => {
	dashboardDom.scopeButtons.forEach((btn) => {
		const isActive = btn.getAttribute('data-scope') === dashboardState.scope;
		btn.classList.toggle('is-active', isActive);
	});
};

const goToRoute = (key) => {
	const route = dashboardRoutes[key];
	if (!route) {
		return;
	}
	window.location.href = `${base_url}${route}`;
};

const bindEvents = () => {
	dashboardDom.scopeButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			const scope = btn.getAttribute('data-scope') || 'month';
			if (scope === dashboardState.scope) {
				return;
			}
			loadDashboard(scope);
		});
	});

	dashboardDom.kpiLinks.forEach((btn) => {
		btn.addEventListener('click', () => {
			goToRoute(btn.getAttribute('data-kpi-link'));
		});
	});
};

const loadDashboard = async (scope) => {
	dashboardState.scope = scope;
	dashboardState.requestId += 1;
	const requestId = dashboardState.requestId;

	updateScopeButtons();
	setSummaryLoading();
	setSectionState('loading');

	try {
		const data = await fetchDashboardData(scope);
		if (requestId !== dashboardState.requestId) {
			return;
		}
		dashboardState.data = data;
		renderSummary();

		const hasRecent = data && Array.isArray(data.recent) && data.recent.length > 0;
		const hasAttention = data && Array.isArray(data.attention) && data.attention.length > 0;
		const hasStatus = data && Array.isArray(data.status_overview) && data.status_overview.length > 0;

		if (!hasRecent && !hasAttention && !hasStatus) {
			setSectionState('empty');
			return;
		}

		renderRecentRequests();
		renderAttention();
		renderStatusOverview();
		renderStatusChart();
		setLastUpdated();
		setSectionState('ready');
	} catch (error) {
		if (requestId !== dashboardState.requestId) {
			return;
		}
		setSectionState('error');
	}
};

const cacheDom = () => {
	dashboardDom.metricOpenCashAdvance = document.getElementById('metricOpenCashAdvance');
	dashboardDom.metricForLiquidation = document.getElementById('metricForLiquidation');
	dashboardDom.metricPendingReimbursements = document.getElementById('metricPendingReimbursements');
	dashboardDom.metricMonthTotal = document.getElementById('metricMonthTotal');
	dashboardDom.dashboardLastUpdated = document.getElementById('dashboardLastUpdated');
	dashboardDom.scopeButtons = Array.from(document.querySelectorAll('[data-scope]'));
	dashboardDom.kpiLinks = Array.from(document.querySelectorAll('[data-kpi-link]'));
	dashboardDom.recentRequestCount = document.getElementById('recentRequestCount');
	dashboardDom.recentRequestsMobile = document.getElementById('recentRequestsMobile');
	dashboardDom.recentRequestsState = document.getElementById('recentRequestsState');
	dashboardDom.attentionCount = document.getElementById('attentionCount');
	dashboardDom.attentionList = document.getElementById('attentionList');
	dashboardDom.attentionState = document.getElementById('attentionState');
	dashboardDom.statusOverviewList = document.getElementById('statusOverviewList');
	dashboardDom.statusState = document.getElementById('statusState');
	dashboardDom.monthCashAdvance = document.getElementById('monthCashAdvance');
	dashboardDom.monthLiquidated = document.getElementById('monthLiquidated');
	dashboardDom.monthReimbursed = document.getElementById('monthReimbursed');
	dashboardDom.statusOverviewChart = document.getElementById('statusOverviewChart');
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
		const trxDate = normalizeDate(row.trx_date).slice(0, 10);
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

	if (btnMore) {
		btnMore.addEventListener('click', () => loadFundPassbook(true));
	}
};

const initDashboard = () => {
	cacheDom();
	bindEvents();
	loadDashboard('month');
	bindFundCashIn();
	loadFundPassbook(false);
};

$(document).ready(() => {
	initDashboard();
});
