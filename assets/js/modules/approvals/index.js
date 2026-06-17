
let approvals = [];
let approvalsNextCursorId = null;
let approvalsHasMoreRows = false;
let approvalsIsLoadingRows = false;

let selectedTransactionType = 'ALL';
let approvalsDesktopPage = 1;

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
	}));

const loadApprovals = (reset = false) => {
	if (approvalsIsLoadingRows) {
		return;
	}

	if (reset) {
		approvals = [];
		approvalsNextCursorId = null;
		approvalsHasMoreRows = false;
		approvalsDesktopPage = 1;
	}

	approvalsIsLoadingRows = true;

	const payload = {
		Take: 20,
	};

	if (approvalsNextCursorId !== null) {
		payload.CursorId = approvalsNextCursorId;
	}

	ajax_loader('transactions/approvals/api/get/header', payload)
		.done((response) => {
			const res = (typeof response === 'string')
				? $.parseJSON(response)
				: response;

			if (res.status !== 'success') {
				approvalsIsLoadingRows = false;
				return;
			}

			const newRows = normalizeApprovalRows(res.data || []);

			approvals = reset
				? newRows
				: approvals.concat(newRows);

			const pagination = res.pagination || {};

			approvalsHasMoreRows = Boolean(pagination.hasMore);
			approvalsNextCursorId = approvalsHasMoreRows
				? (pagination.nextCursorId || null)
				: null;

			approvalsIsLoadingRows = false;

			refreshApprovalsList();
		})
		.fail(() => {
			approvalsIsLoadingRows = false;
		});
};

const getFilteredApprovals = () => (selectedTransactionType === 'ALL'
	? approvals
	: approvals.filter((row) => row.transactionType === selectedTransactionType));

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

	if (!pageRows.length) {
		tbodyMain.innerHTML = `
		<tr>
			<td colspan="6" class="text-center text-muted kna-small py-4">
				No Pending Approvals
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
		</tr>
	`).join('');

	tbodyAction.innerHTML = pageRows.map((row) => `
		<tr>
			<td>
				<a
					class="btn btn-outline-primary btn-xs kna-small py-1 px-2"
					href="${base_url}transactions/approvals/review/${encodeURIComponent(row.referenceNo)}">
					Review
				</a>
			</td>
		</tr>
	`).join('');

	if (resultCount) {
		resultCount.textContent = `${rows.length} Record${rows.length === 1 ? '' : 's'}`;
	}

	renderDesktopPagination(rows);
};

const initListPage = () => {
	const listPage = document.getElementById('approvalsListPage');
	if (!listPage) {
		return;
	}

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
