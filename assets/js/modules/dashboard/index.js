const dashboardDom = {
	metricOpenCashAdvance: null,
	metricForLiquidation: null,
	metricPendingReimbursements: null,
	metricMonthTotal: null,
	dashboardLastUpdated: null,
	scopeButtons: [],
	kpiLinks: [],
	recentRequestCount: null,
	recentRequestsTbody: null,
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
};

const dashboardRoutes = {
	'cash-advance': 'transactions/cash-advance',
	liquidation: 'transactions/liquidation',
	reimburse: 'transactions/liquidation',
	'month-summary': 'transactions/cash-advance',
};

const dashboardMockBase = {
	summary: {
		openCashAdvance: { count: 2 },
		forLiquidation: { amount: 18450 },
		pendingReimbursements: { amount: 3250 },
		monthTotal: { amount: 42680 },
	},
	monthBreakdown: {
		cashAdvance: 28500,
		liquidated: 10930,
		reimbursed: 3250,
	},
	attention: [
		{
			title: 'Liquidate CA-2026-014 before June 02',
			detail: 'PHP 9,800 still tagged for liquidation.',
			status: 'For Liquidation',
			actionPath: 'transactions/liquidation/add',
			actionLabel: 'Liquidate',
		},
		{
			title: 'Cash advance request CA-2026-018 is pending approval',
			detail: 'Requested last May 27 for client visit expenses.',
			status: 'Pending Approval',
			actionPath: 'transactions/cash-advance',
			actionLabel: 'View request',
		},
		{
			title: 'Reimbursement RB-2026-004 was submitted',
			detail: 'Waiting for release after finance review.',
			status: 'Submitted',
			actionPath: '',
			actionLabel: 'Tracking soon',
		},
	],
	statusOverview: [
		{ label: 'Pending Approval', count: 1, total: 4, tone: 'pending' },
		{ label: 'For Liquidation', count: 2, total: 4, tone: 'liquidation' },
		{ label: 'Submitted', count: 1, total: 4, tone: 'submitted' },
		{ label: 'Approved', count: 3, total: 6, tone: 'approved' },
	],
	recentRequests: [
		{
			type: 'Cash Advance',
			reference: 'CA-2026-018',
			purpose: 'Trade visit in Laguna',
			amount: 6500,
			status: 'Pending Approval',
			updated: '2026-05-29',
		},
		{
			type: 'Liquidation',
			reference: 'LIQ-2026-006',
			purpose: 'Distributor meeting expenses',
			amount: 9800,
			status: 'Submitted',
			updated: '2026-05-28',
		},
		{
			type: 'Reimbursement',
			reference: 'RB-2026-004',
			purpose: 'Emergency transport reimbursement',
			amount: 3250,
			status: 'Submitted',
			updated: '2026-05-27',
		},
		{
			type: 'Cash Advance',
			reference: 'CA-2026-014',
			purpose: 'Client lunch and field travel',
			amount: 11800,
			status: 'For Liquidation',
			updated: '2026-05-24',
		},
	],
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

const badgeClassForStatus = (status) => {
	if (status === 'Pending Approval') {
		return 'kna-badge kna-badge-pending';
	}
	if (status === 'For Liquidation') {
		return 'kna-badge kna-badge-liquidation';
	}
	if (status === 'Approved') {
		return 'kna-badge kna-badge-approved';
	}
	if (status === 'Reimbursement') {
		return 'kna-badge kna-badge-reimburse';
	}
	return 'kna-badge kna-badge-submitted';
};

const statusBarColor = (tone) => {
	if (tone === 'pending') {
		return 'linear-gradient(90deg, #f0b429, #f7c95c)';
	}
	if (tone === 'liquidation') {
		return 'linear-gradient(90deg, #1b4f88, #4e8dd0)';
	}
	if (tone === 'approved') {
		return 'linear-gradient(90deg, #17663a, #3fa45e)';
	}
	return 'linear-gradient(90deg, #607080, #94a3b8)';
};

const stateConfig = {
	loading: { text: 'Loading dashboard data...', cls: '' },
	empty: { text: 'No data found for this scope.', cls: '' },
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
	if (dashboardDom.recentRequestsTbody) {
		dashboardDom.recentRequestsTbody.closest('.kna-table-wrap').classList.toggle('d-none', !showContent);
	}
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

const cloneMockBase = () => JSON.parse(JSON.stringify(dashboardMockBase));

const buildDataByScope = (scope) => {
	const data = cloneMockBase();
	const multipliers = { today: 0.35, week: 0.75, month: 1 };
	const m = multipliers[scope] || 1;

	data.summary.openCashAdvance.count = Math.max(0, Math.round(data.summary.openCashAdvance.count * m));
	data.summary.forLiquidation.amount = Math.round(data.summary.forLiquidation.amount * m);
	data.summary.pendingReimbursements.amount = Math.round(data.summary.pendingReimbursements.amount * m);
	data.summary.monthTotal.amount = Math.round(data.summary.monthTotal.amount * m);

	data.monthBreakdown.cashAdvance = Math.round(data.monthBreakdown.cashAdvance * m);
	data.monthBreakdown.liquidated = Math.round(data.monthBreakdown.liquidated * m);
	data.monthBreakdown.reimbursed = Math.round(data.monthBreakdown.reimbursed * m);

	data.statusOverview = data.statusOverview.map((item) => {
		const next = { ...item };
		next.count = Math.min(item.total, Math.round(item.count * m));
		return next;
	});

	const rowCount = scope === 'today' ? 2 : (scope === 'week' ? 3 : 4);
	data.recentRequests = data.recentRequests.slice(0, rowCount).map((item) => ({
		...item,
		amount: Math.round(item.amount * m),
	}));

	const attentionCount = scope === 'today' ? 1 : (scope === 'week' ? 2 : 3);
	data.attention = data.attention.slice(0, attentionCount);

	return data;
};

const fetchDashboardData = (scope) =>
	new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(buildDataByScope(scope));
		}, 220);
	});

const renderSummary = () => {
	const data = dashboardState.data;
	dashboardDom.metricOpenCashAdvance.textContent = data.summary.openCashAdvance.count;

	dashboardDom.metricForLiquidation.textContent = formatPHP(data.summary.forLiquidation.amount);

	dashboardDom.metricPendingReimbursements.textContent = formatPHP(data.summary.pendingReimbursements.amount);

	dashboardDom.metricMonthTotal.textContent = formatPHP(data.summary.monthTotal.amount);

	dashboardDom.monthCashAdvance.textContent = formatPHP(data.monthBreakdown.cashAdvance);
	dashboardDom.monthLiquidated.textContent = formatPHP(data.monthBreakdown.liquidated);
	dashboardDom.monthReimbursed.textContent = formatPHP(data.monthBreakdown.reimbursed);
};

const renderRecentRequests = () => {
	const rows = (dashboardState.data && dashboardState.data.recentRequests) || [];
	dashboardDom.recentRequestCount.textContent = `${rows.length} item(s)`;
	dashboardDom.recentRequestsTbody.innerHTML = '';
	dashboardDom.recentRequestsMobile.innerHTML = '';

	if (!rows.length) {
		dashboardDom.recentRequestsTbody.innerHTML = '<tr><td colspan="6" class="kna-empty">No recent requests.</td></tr>';
		dashboardDom.recentRequestsMobile.innerHTML = '<div class="kna-empty">No recent requests.</div>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(row.type)}</td>
			<td>${escapeHtml(row.reference)}</td>
			<td class="text-truncate" style="max-width:260px;" title="${escapeHtml(row.purpose)}">${escapeHtml(row.purpose)}</td>
			<td class="text-right">${formatPHP(row.amount)}</td>
			<td><span class="${badgeClassForStatus(row.status)}">${escapeHtml(row.status)}</span></td>
			<td>${escapeHtml(row.updated)}</td>
		`;
		dashboardDom.recentRequestsTbody.appendChild(tr);

		const card = document.createElement('div');
		card.className = 'kna-item';
		card.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.reference)}</div>
				<div><span class="${badgeClassForStatus(row.status)}">${escapeHtml(row.status)}</span></div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">${escapeHtml(row.type)}</div>
				<div class="kna-small font-weight-bold">${formatPHP(row.amount)}</div>
			</div>
			<div class="kna-small text-muted mb-1">${escapeHtml(row.purpose)}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Updated</div>
				<div class="kna-small">${escapeHtml(row.updated)}</div>
			</div>
		`;
		dashboardDom.recentRequestsMobile.appendChild(card);
	});
};

const renderAttention = () => {
	const items = (dashboardState.data && dashboardState.data.attention) || [];
	dashboardDom.attentionCount.textContent = `${items.length} item(s)`;
	dashboardDom.attentionList.innerHTML = '';

	if (!items.length) {
		dashboardDom.attentionList.innerHTML = '<div class="kna-empty">Nothing urgent right now.</div>';
		return;
	}

	items.forEach((item) => {
		const wrapper = document.createElement('div');
		wrapper.className = 'kna-attention-item';
		const actionHtml = item.actionPath
			? `<a href="${base_url}${item.actionPath}" class="btn btn-outline-secondary btn-sm kna-small mt-2">${escapeHtml(item.actionLabel)}</a>`
			: `<button type="button" class="btn btn-outline-secondary btn-sm kna-small mt-2" disabled>${escapeHtml(item.actionLabel)}</button>`;

		wrapper.innerHTML = `
			<div class="kna-attention-head">
				<p class="kna-attention-title">${escapeHtml(item.title)}</p>
				<span class="${badgeClassForStatus(item.status)}">${escapeHtml(item.status)}</span>
			</div>
			<p class="kna-attention-meta">${escapeHtml(item.detail)}</p>
			${actionHtml}
		`;
		dashboardDom.attentionList.appendChild(wrapper);
	});
};

const renderStatusOverview = () => {
	const items = (dashboardState.data && dashboardState.data.statusOverview) || [];
	dashboardDom.statusOverviewList.innerHTML = '';

	if (!items.length) {
		dashboardDom.statusOverviewList.innerHTML = '<div class="kna-empty">No status data yet.</div>';
		return;
	}

	items.forEach((item) => {
		const percentage = item.total > 0 ? Math.min(100, Math.round((item.count / item.total) * 100)) : 0;
		const wrapper = document.createElement('div');
		wrapper.className = 'kna-status-item';
		wrapper.innerHTML = `
			<div class="kna-status-head">
				<p class="kna-status-title">${escapeHtml(item.label)}</p>
				<div class="kna-small text-muted">${item.count} item(s)</div>
			</div>
			<div class="kna-status-bar">
				<div class="kna-status-fill" style="width:${percentage}%;background:${statusBarColor(item.tone)};"></div>
			</div>
		`;
		dashboardDom.statusOverviewList.appendChild(wrapper);
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

		if (!data || !data.recentRequests || !data.recentRequests.length) {
			setSectionState('empty');
			return;
		}

		renderRecentRequests();
		renderAttention();
		renderStatusOverview();
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
	dashboardDom.recentRequestsTbody = document.getElementById('recentRequestsTbody');
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
};

const initDashboard = () => {
	cacheDom();
	bindEvents();
	loadDashboard('month');
};

$(document).ready(() => {
	initDashboard();
});
