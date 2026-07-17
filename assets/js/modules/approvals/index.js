
const APPROVALS_ENDPOINTS = {
	pending: 'transactions/approvals/api/get/header',
	past: 'transactions/approvals/api/get/past-header',
	payment: 'transactions/approvals/api/get/payment-queue',
};

let selectedApprovalTab = 'pending';

// Per-tab cache: rows already loaded, next cursor, and whether more rows exist.
const approvalsTabState = {
	pending: { rows: [], nextCursorId: null, hasMoreRows: false, loaded: false },
	past: { rows: [], nextCursorId: null, hasMoreRows: false, loaded: false },
	payment: { rows: [], nextCursorId: null, hasMoreRows: false, loaded: false },
};

let approvals = [];
let approvalsNextCursorId = null;
let approvalsHasMoreRows = false;
let approvalsIsLoadingRows = false;

let selectedTransactionType = 'ALL';
let approvalsDesktopPage = 1;

let approvalsDateRangePicker = null;

const APPROVALS_PAGE_SIZE = 10;

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const formatDisplayDate = (value) => {
	const raw = normalizeDate(value).slice(0, 10);
	if (!raw) {
		return '—';
	}
	const date = new Date(`${raw}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		return escapeHtml(raw);
	}
	return date.toLocaleDateString('en-PH', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	});
};

const getTransactionTypeLabel = (type) => {
	if (type === 'CASH_ADVANCE') return 'Cash Advance';
	if (type === 'LIQUIDATION') return 'Liquidation';
	if (type === 'REIMBURSEMENT') return 'Reimbursement';
	return escapeHtml(normalizeDate(type));
};

const normalizeApprovalRows = (rows) =>
	(rows || []).map((row) => ({
		approvalDetailId: Number(row.approval_detail_id || 0),
		referenceNo: normalizeDate(row.reference_no),
		transactionType: normalizeDate(row.transaction_type),
		userId: Number(row.user_id || 0),
		requestor: normalizeDate(row.requester_name),
		department: normalizeDate(row.department),
		amount: Number(row.ca_amount ?? row.lq_amount ?? 0),
		submittedDate: normalizeDate(row.submitted_date).slice(0, 10),
		decisionStatus: normalizeDate(row.decision_status).toUpperCase(),
		decidedDate: normalizeDate(row.decided_date).slice(0, 10),
		paymentAction: normalizeDate(row.payment_action).toUpperCase(),
	}));

const loadApprovals = (reset = false) => {
	if (approvalsIsLoadingRows) {
		return;
	}

	const tabState = approvalsTabState[selectedApprovalTab];

	if (reset) {
		tabState.rows = [];
		tabState.nextCursorId = null;
		tabState.hasMoreRows = false;
		tabState.loaded = false;
		approvalsDesktopPage = 1;
	}

	approvalsIsLoadingRows = true;

	// Take: 0 asks the SP for the exact full result set (no artificial cap);
	// client-side handles filtering & paging from there.
	const payload = {
		Take: reset ? 0 : APPROVALS_PAGE_SIZE,
	};

	if (tabState.nextCursorId !== null) {
		payload.CursorId = tabState.nextCursorId;
	}

	const requestedTab = selectedApprovalTab;

	ajax_loader(APPROVALS_ENDPOINTS[requestedTab], payload)
		.done((response) => {
			const res = (typeof response === 'string')
				? $.parseJSON(response)
				: response;

			if (res.status !== 'success') {
				approvalsIsLoadingRows = false;
				return;
			}

			const newRows = normalizeApprovalRows(res.data || []);
			const state = approvalsTabState[requestedTab];

			state.rows = reset
				? newRows
				: state.rows.concat(newRows);

			const pagination = res.pagination || {};

			state.hasMoreRows = Boolean(pagination.hasMore);
			state.nextCursorId = state.hasMoreRows
				? (pagination.nextCursorId || null)
				: null;
			state.loaded = true;

			approvalsIsLoadingRows = false;

			if (requestedTab === selectedApprovalTab) {
				approvals = state.rows;
				refreshApprovalsList();
			}
		})
		.fail(() => {
			approvalsIsLoadingRows = false;
		});
};

const matchesDateRange = (row) => {
	const selected = approvalsDateRangePicker ? approvalsDateRangePicker.selectedDates : [];
	if (selected.length !== 2 || !row.submittedDate) return true;

	const toIso = (date) => {
		const y = date.getFullYear();
		const m = `${date.getMonth() + 1}`.padStart(2, '0');
		const d = `${date.getDate()}`.padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	const from = toIso(selected[0]);
	const to = toIso(selected[1]);
	return row.submittedDate >= from && row.submittedDate <= to;
};

const getFilteredApprovals = () => approvals
	.filter((row) => selectedTransactionType === 'ALL' || row.transactionType === selectedTransactionType)
	.filter(matchesDateRange);

const renderDesktopPagination = (rows) => {
	const desktopPagination = document.getElementById('desktopPagination');
	if (!desktopPagination) {
		return;
	}

	if (!rows.length) {
		desktopPagination.innerHTML = '';
		return;
	}

	const totalPages = Math.max(1, Math.ceil(rows.length / APPROVALS_PAGE_SIZE));
	if (approvalsDesktopPage > totalPages) {
		approvalsDesktopPage = totalPages;
	}

	const canPrev = approvalsDesktopPage > 1;
	const canNext = approvalsDesktopPage < totalPages;

	let pageLinks = '';
	for (let page = 1; page <= totalPages; page += 1) {
		const active = page === approvalsDesktopPage ? 'active' : '';
		pageLinks += `<li class="page-item ${active}"><a class="page-link" href="#" data-action="page" data-page="${page}">${page}</a></li>`;
	}

	desktopPagination.innerHTML = `
		<li class="page-item ${canPrev ? '' : 'disabled'}">
			<a class="page-link" href="#" data-action="prev">&lsaquo;</a>
		</li>
		${pageLinks}
		<li class="page-item ${canNext ? '' : 'disabled'}">
			<a class="page-link" href="#" data-action="next">&rsaquo;</a>
		</li>
	`;
};

const goToDesktopPage = (targetPage) => {
	const rows = getFilteredApprovals();
	const totalPages = Math.max(1, Math.ceil(rows.length / APPROVALS_PAGE_SIZE));
	if (targetPage < 1 || targetPage > totalPages) {
		return;
	}
	approvalsDesktopPage = targetPage;
	refreshApprovalsList();
};

const isPastTab = () => selectedApprovalTab === 'past';
const isPaymentTab = () => selectedApprovalTab === 'payment';

const getStatusBadgeHtml = (decisionStatus) => {
	if (decisionStatus === 'APPROVED') {
		return '<span class="kna-badge kna-badge-approved">Approved</span>';
	}
	if (decisionStatus === 'REJECTED') {
		return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	}
	return '—';
};

const getPaymentActionBadgeHtml = (paymentAction) => {
	if (paymentAction === 'ADVISE') {
		return '<span class="kna-badge kna-badge-pending">Needs Advisory</span>';
	}
	if (paymentAction === 'RELEASE') {
		return '<span class="kna-badge kna-badge-partial">Needs Release</span>';
	}
	return '—';
};

const getPaymentActionLabel = (paymentAction) => (paymentAction === 'RELEASE' ? 'Release' : 'Advise');

const getReviewUrl = (row) => {
	const base = `${base_url}transactions/approvals/review/${encodeURIComponent(row.referenceNo)}`;
	return isPastTab() ? `${base}?mode=past` : base;
};

const renderMobileCards = (pageRows) => {
	const mobileList = document.getElementById('approvalsMobileList');
	if (!mobileList) {
		return;
	}

	if (!pageRows.length) {
		const emptyLabel = isPastTab() ? 'Past' : (isPaymentTab() ? 'Payment' : 'Pending');
		mobileList.innerHTML = `<div class="text-center text-muted kna-small py-4">No ${emptyLabel} Approvals</div>`;
		return;
	}

	mobileList.innerHTML = pageRows.map((row) => `
		<div class="kna-mobile-card">
			<div class="d-flex justify-content-between align-items-start">
				<div>
					<div class="font-weight-bold">${escapeHtml(row.referenceNo)}</div>
					<div class="text-muted kna-small">${escapeHtml(getTransactionTypeLabel(row.transactionType))}</div>
				</div>
				${isPastTab() ? `<div>${getStatusBadgeHtml(row.decisionStatus)}</div>` : ''}
				${isPaymentTab() ? `<div>${getPaymentActionBadgeHtml(row.paymentAction)}</div>` : ''}
			</div>
			<div class="mt-2 kna-small">
				<div><strong>Requestor:</strong> ${escapeHtml(row.requestor)}</div>
				<div><strong>Department:</strong> ${escapeHtml(row.department)}</div>
				<div><strong>Amount:</strong> ${formatPHP(row.amount)}</div>
				<div><strong>Date:</strong> ${formatDisplayDate(row.submittedDate)}</div>
			</div>
			<div class="mt-2">
				<a
					class="btn btn-primary btn-sm btn-block"
					href="${getReviewUrl(row)}">
					${isPastTab() ? 'View' : (isPaymentTab() ? getPaymentActionLabel(row.paymentAction) : 'Review')}
				</a>
			</div>
		</div>
	`).join('');
};

const refreshApprovalsList = () => {
	const tbodyMain = document.getElementById('matrixTbodyMain');
	const tbodyAction = document.getElementById('matrixTbodyAction');
	const resultCount = document.getElementById('resultCount');
	if (!tbodyMain || !tbodyAction) {
		return;
	}

	const rows = getFilteredApprovals();
	const totalPages = Math.max(1, Math.ceil(rows.length / APPROVALS_PAGE_SIZE));
	if (approvalsDesktopPage > totalPages) {
		approvalsDesktopPage = totalPages;
	}

	const start = (approvalsDesktopPage - 1) * APPROVALS_PAGE_SIZE;
	const pageRows = rows.slice(start, start + APPROVALS_PAGE_SIZE);
	const colCount = (isPastTab() || isPaymentTab()) ? 7 : 6;

	if (!pageRows.length) {
		const emptyLabel = isPastTab() ? 'Past' : (isPaymentTab() ? 'Payment' : 'Pending');
		tbodyMain.innerHTML = `
		<tr>
			<td colspan="${colCount}" class="text-center text-muted kna-small py-4">
				No ${emptyLabel} Approvals
			</td>
		</tr>
	`;

		tbodyAction.innerHTML = `
		<tr>
			<td></td>
		</tr>
	`;

		if (resultCount) {
			resultCount.textContent = '0 Records';
		}

		renderMobileCards([]);
		renderDesktopPagination([]);
		return;
	}

	tbodyMain.innerHTML = pageRows.map((row) => `
		<tr>
			<td><strong>${escapeHtml(row.referenceNo)}</strong></td>
			<td>${escapeHtml(getTransactionTypeLabel(row.transactionType))}</td>
			<td>${escapeHtml(row.requestor)}</td>
			<td>${escapeHtml(row.department)}</td>
			<td>${formatPHP(row.amount)}</td>
			<td>${formatDisplayDate(row.submittedDate)}</td>
			${isPastTab() ? `<td>${getStatusBadgeHtml(row.decisionStatus)}</td>` : ''}
			${isPaymentTab() ? `<td>${getPaymentActionBadgeHtml(row.paymentAction)}</td>` : ''}
		</tr>
	`).join('');

	tbodyAction.innerHTML = pageRows.map((row) => `
		<tr>
			<td>
				<a
					class="btn btn-outline-primary btn-xs kna-small py-1 px-2"
					href="${getReviewUrl(row)}">
					${isPastTab() ? 'View' : (isPaymentTab() ? getPaymentActionLabel(row.paymentAction) : 'Review')}
				</a>
			</td>
		</tr>
	`).join('');

	if (resultCount) {
		resultCount.textContent = `${rows.length} Record${rows.length === 1 ? '' : 's'}`;
	}

	renderMobileCards(pageRows);
	renderDesktopPagination(rows);
};

const updateApprovalTabChrome = () => {
	const pageTitle = document.getElementById('approvalsPageTitle');
	const resultLabel = document.getElementById('resultLabel');
	const statusColumnHeader = document.getElementById('statusColumnHeader');
	const paymentActionColumnHeader = document.getElementById('paymentActionColumnHeader');

	if (pageTitle) {
		pageTitle.textContent = isPastTab() ? 'Past Approvals' : (isPaymentTab() ? 'For Payment' : 'Pending Approvals');
	}
	if (resultLabel) {
		resultLabel.textContent = isPastTab() ? 'Already Reviewed' : (isPaymentTab() ? 'Awaiting Payment Action' : 'Awaiting Your Action');
	}
	if (statusColumnHeader) {
		statusColumnHeader.classList.toggle('d-none', !isPastTab());
	}
	if (paymentActionColumnHeader) {
		paymentActionColumnHeader.classList.toggle('d-none', !isPaymentTab());
	}
};

const switchApprovalTab = (tab) => {
	if (tab !== 'pending' && tab !== 'past' && tab !== 'payment') {
		return;
	}

	selectedApprovalTab = tab;
	approvalsDesktopPage = 1;
	updateApprovalTabChrome();

	const tabState = approvalsTabState[tab];
	if (tabState.loaded) {
		approvals = tabState.rows;
		refreshApprovalsList();
		return;
	}

	loadApprovals(true);
};

const initListPage = () => {
	const listPage = document.getElementById('approvalsListPage');
	if (!listPage) {
		return;
	}

	document.querySelectorAll('.kna-tab[data-approval-tab]').forEach((tab) => {
		tab.addEventListener('click', () => {
			document.querySelectorAll('.kna-tab[data-approval-tab]').forEach((el) => {
				el.classList.remove('is-active');
			});
			tab.classList.add('is-active');
			switchApprovalTab(tab.getAttribute('data-approval-tab') || 'pending');
		});
	});

	document.querySelectorAll('.kna-tab[data-transaction-type]').forEach((tab) => {
		tab.addEventListener('click', () => {
			document.querySelectorAll('.kna-tab[data-transaction-type]').forEach((el) => {
				el.classList.remove('is-active');
			});
			tab.classList.add('is-active');
			selectedTransactionType = tab.getAttribute('data-transaction-type') || 'ALL';
			approvalsDesktopPage = 1;
			refreshApprovalsList();
		});
	});

	const filterDateRange = document.getElementById('filterDateRange');
	if (filterDateRange && typeof flatpickr !== 'undefined') {
		approvalsDateRangePicker = flatpickr(filterDateRange, {
			mode: 'range',
			dateFormat: 'Y-m-d',
			allowInput: true,
			onChange: (selectedDates) => {
				if (selectedDates.length === 0 || selectedDates.length === 2) {
					approvalsDesktopPage = 1;
					refreshApprovalsList();
				}
			},
		});
	}

	const btnResetApprovalFilters = document.getElementById('btnResetApprovalFilters');
	if (btnResetApprovalFilters) {
		btnResetApprovalFilters.addEventListener('click', () => {
			if (approvalsDateRangePicker) approvalsDateRangePicker.clear();
			approvalsDesktopPage = 1;
			refreshApprovalsList();
		});
	}

	const desktopPagination = document.getElementById('desktopPagination');
	if (desktopPagination) {
		desktopPagination.addEventListener('click', (event) => {
			const btn = event.target.closest('a[data-action]');
			if (!btn) {
				return;
			}
			event.preventDefault();
			if (btn.getAttribute('data-action') === 'prev') {
				goToDesktopPage(approvalsDesktopPage - 1);
				return;
			}
			if (btn.getAttribute('data-action') === 'next') {
				goToDesktopPage(approvalsDesktopPage + 1);
				return;
			}
			const page = Number(btn.getAttribute('data-page'));
			if (page) {
				goToDesktopPage(page);
			}
		});
	}

	loadApprovals(true);
};

const initModule = () => {
	if (document.getElementById('approvalsListPage')) {
		initListPage();
	} else if (document.getElementById('approvalRef') && typeof initReviewPage === 'function') {
		initReviewPage();
	}
};

$(document).ready(() => {
	initModule();
});
