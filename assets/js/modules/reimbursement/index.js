let reimbursements = [];
let rmbNextCursorId = null;
let rmbHasMoreRows = false;
let rmbIsLoadingRows = false;
let rmbDesktopPage = 1;
const RMB_PAGE_SIZE = 10;

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		reimbursementNo: normalizeDate(row.reimbursement_id),
		description: normalizeDate(row.description || ''),
		totalAmount: Number(row.total_amount || 0),
		submittedDate: normalizeDate(row.submitted_date || '').slice(0, 10),
		statusCode: normalizeDate(row.status_code),
		status: normalizeDate(row.status_name),
	}));

const loadReimbursements = (reset = false) => {
	if (rmbIsLoadingRows) {
		return;
	}
	if (reset) {
		reimbursements = [];
		rmbNextCursorId = null;
		rmbHasMoreRows = false;
		rmbDesktopPage = 1;
	}
	rmbIsLoadingRows = true;
	updateLoadMoreButton();

	const payload = { Take: 20 };
	if (rmbNextCursorId !== null) {
		payload.CursorId = rmbNextCursorId;
	}

	ajax_loader('transactions/reimbursement/api/list', payload).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			rmbIsLoadingRows = false;
			updateLoadMoreButton();
			return;
		}

		const newRows = normalizeApiRows(res.data || []);
		reimbursements = reset ? newRows : reimbursements.concat(newRows);
		const pagination = res.pagination || {};
		rmbHasMoreRows = Boolean(pagination.hasMore);
		rmbNextCursorId = rmbHasMoreRows ? (pagination.nextCursorId || null) : null;

		rmbIsLoadingRows = false;
		updateLoadMoreButton();
		refreshUI();
	}).fail(() => {
		rmbIsLoadingRows = false;
		updateLoadMoreButton();
	});
};

const updateLoadMoreButton = () => {
	if (!domList.btnLoadMoreMobile) {
		return;
	}
	if (rmbIsLoadingRows) {
		domList.btnLoadMoreMobile.disabled = true;
		domList.btnLoadMoreMobile.textContent = 'Loading…';
		domList.btnLoadMoreMobile.classList.remove('d-none');
		return;
	}
	if (rmbHasMoreRows) {
		domList.btnLoadMoreMobile.disabled = false;
		domList.btnLoadMoreMobile.textContent = 'Load More';
		domList.btnLoadMoreMobile.classList.remove('d-none');
	} else {
		domList.btnLoadMoreMobile.classList.add('d-none');
	}
};

// Shared utility functions
const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

const parseDateRange = (rangeText) => {
	const value = normalizeDate(rangeText);
	if (!value) {
		return { from: '', to: '' };
	}

	const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i);
	if (!match) {
		const parts = value.split(' to ').map((part) => normalizeDate(part).trim()).filter(Boolean);
		if (parts.length === 2) {
			return { from: parts[0], to: parts[1] };
		}
		return { from: '', to: '' };
	}

	return { from: match[1], to: match[2] };
};

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const getStatusBadge = (status) => {
	if (status === 'Draft') {
		return '<span class="kna-badge kna-badge-draft">Draft</span>';
	}
	if (status === 'Approved') {
		return '<span class="kna-badge kna-badge-approved">Approved</span>';
	}
	if (status === 'Rejected') {
		return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	}
	if (status === 'Paid') {
		return '<span class="kna-badge kna-badge-paid">Paid</span>';
	}
	return '<span class="kna-badge kna-badge-pending">Submitted</span>';
};

const inAmountRange = (amount, range) => {
	if (!range) {
		return true;
	}

	const [min, max] = range.split('-').map(Number);
	return Number(amount) >= min && Number(amount) <= max;
};

const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};

// List page DOM & functions
const domList = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterStatus: null,
	filterAmountRange: null,
	sumTotalReimbursement: null,
	sumPendingReview: null,
	sumApprovedReimbursement: null,
	sumRejected: null,
	reimbursementTbody: null,
	reimbursementMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	btnSearch: null,
	btnReset: null,
	btnOpenNewReimbursement: null,
	reimbursementTable: null,
	btnLoadMoreMobile: null,
	desktopPagination: null,
};

const matchesFilters = (row) => {
	const range = domList.filterDateRangePicker ? parseDateRange(domList.filterDateRangePicker.value) : { from: '', to: '' };
	const status = domList.filterStatus.value;
	const amountRange = domList.filterAmountRange.value;

	if (status && row.status !== status) {
		return false;
	}
	if (range.from && row.submittedDate < range.from) {
		return false;
	}
	if (range.to && row.submittedDate > range.to) {
		return false;
	}
	if (!inAmountRange(row.totalAmount, amountRange)) {
		return false;
	}

	return true;
};

const renderDesktopTable = (rows) => {
	domList.reimbursementTbody.innerHTML = '';

	if (!rows.length) {
		domList.reimbursementTbody.innerHTML =
			'<tr><td colspan="5" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const isDraft = row.statusCode === 'RMB_DRAFT' || row.status === 'Draft';
		const actionButton = isDraft
			? `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-ref="${escapeHtml(row.reimbursementNo)}">Edit Draft</button>`
			: (row.status === 'Submitted' || row.status === 'Pending Approval')
				? `<button type="button" class="btn btn-sm btn-outline-warning" data-action="edit-submitted" data-ref="${escapeHtml(row.reimbursementNo)}">Edit</button>
           <button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-ref="${escapeHtml(row.reimbursementNo)}">View</button>`
				: `<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-ref="${escapeHtml(row.reimbursementNo)}">View</button>`;
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(row.reimbursementNo)}</td>
			<td class="text-right">${formatPHP(row.totalAmount)}</td>
			<td>${escapeHtml(row.submittedDate)}</td>
			<td>${getStatusBadge(row.status)}</td>
			<td class="text-center kna-actions">
				${actionButton}
			</td>
		`;
		domList.reimbursementTbody.appendChild(tr);
	});
};

const renderDesktopPagination = (rows) => {
	if (!domList.desktopPagination) {
		return;
	}

	const totalPages = Math.max(1, Math.ceil(rows.length / RMB_PAGE_SIZE));
	if (rmbDesktopPage > totalPages) {
		rmbDesktopPage = totalPages;
	}

	const canPrev = rmbDesktopPage > 1;
	const canNext = rmbDesktopPage < totalPages || rmbHasMoreRows;

	let pageLinks = '';
	for (let page = 1; page <= totalPages; page += 1) {
		const active = page === rmbDesktopPage ? 'active' : '';
		pageLinks += `<li class="page-item ${active}"><a class="page-link" href="#" data-action="page" data-page="${page}">${page}</a></li>`;
	}

	domList.desktopPagination.innerHTML = `
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
	if (targetPage < 1) {
		return;
	}

	const rows = getFilteredRows();
	const totalPages = Math.max(1, Math.ceil(rows.length / RMB_PAGE_SIZE));

	if (targetPage > totalPages) {
		return;
	}

	rmbDesktopPage = targetPage;
	refreshUI();
};

const renderMobileCards = (rows) => {
	domList.reimbursementMobileList.innerHTML = '';

	if (!rows.length) {
		domList.reimbursementMobileList.innerHTML =
			'<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const isDraft = row.statusCode === 'RMB_DRAFT' || row.status === 'Draft';
		const actionButton = isDraft
			? `<button type="button" class="btn btn-outline-secondary btn-sm kna-small w-100" data-action="edit" data-ref="${escapeHtml(row.reimbursementNo)}">Edit Draft</button>`
			: (row.status === 'Submitted' || row.status === 'Pending Approval')
				? `<button type="button" class="btn btn-outline-warning btn-sm kna-small w-100 mb-1" data-action="edit-submitted" data-ref="${escapeHtml(row.reimbursementNo)}">Edit</button>
           <button type="button" class="btn btn-outline-primary btn-sm kna-small w-100" data-action="view" data-ref="${escapeHtml(row.reimbursementNo)}">View Details</button>`
				: `<button type="button" class="btn btn-outline-primary btn-sm kna-small w-100" data-action="view" data-ref="${escapeHtml(row.reimbursementNo)}">View Details</button>`;
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.reimbursementNo)}</div>
				<div>${getStatusBadge(row.status)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Total Amount</div>
				<div class="kna-small font-weight-bold">${formatPHP(row.totalAmount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Submitted</div>
				<div class="kna-small">${escapeHtml(row.submittedDate)}</div>
			</div>
			${actionButton}
		`;
		domList.reimbursementMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	const totalReimbursement = rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const pendingReview = rows
		.filter((row) => row.status === 'Submitted')
		.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const approved = rows
		.filter((row) => row.status === 'Approved')
		.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const rejected = rows
		.filter((row) => row.status === 'Rejected')
		.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);

	domList.sumTotalReimbursement.textContent = formatPHP(totalReimbursement);
	domList.sumPendingReview.textContent = formatPHP(pendingReview);
	domList.sumApprovedReimbursement.textContent = formatPHP(approved);
	domList.sumRejected.textContent = formatPHP(rejected);
};

const getFilteredRows = () => reimbursements.filter(matchesFilters);

const applyFilters = () => {
	rmbDesktopPage = 1;
	refreshUI();
};

const refreshUI = () => {
	const rows = getFilteredRows();
	const startIndex = (rmbDesktopPage - 1) * RMB_PAGE_SIZE;
	const desktopRows = rows.slice(startIndex, startIndex + RMB_PAGE_SIZE);
	renderSummary(rows);
	renderDesktopTable(desktopRows);
	renderDesktopPagination(rows);
	renderMobileCards(rows);
	domList.resultCount.textContent = `${rows.length} record(s)`;
	domList.resultCountMobile.textContent = `${rows.length} record(s)`;
	updateLoadMoreButton();
};

const resetFilters = () => {
	if (domList.filterDateRangePicker) {
		domList.filterDateRangePicker.clear();
	}
	domList.filterStatus.value = '';
	domList.filterAmountRange.value = '';
	applyFilters();
};

const cacheListDom = () => {
	domList.filterDateRange = document.getElementById('filterDateRange');
	domList.filterDateRangePicker = document.getElementById('filterDateRange');
	domList.filterStatus = document.getElementById('filterStatus');
	domList.filterAmountRange = document.getElementById('filterAmountRange');
	domList.sumTotalReimbursement = document.getElementById('sumTotalReimbursement');
	domList.sumPendingReview = document.getElementById('sumPendingReview');
	domList.sumApprovedReimbursement = document.getElementById('sumApprovedReimbursement');
	domList.sumRejected = document.getElementById('sumRejected');
	domList.reimbursementTbody = document.getElementById('reimbursementTbody');
	domList.reimbursementMobileList = document.getElementById('reimbursementMobileList');
	domList.resultCount = document.getElementById('resultCount');
	domList.resultCountMobile = document.getElementById('resultCountMobile');
	domList.btnSearch = document.getElementById('btnSearch');
	domList.btnReset = document.getElementById('btnReset');
	domList.btnOpenNewReimbursement = document.getElementById('btnOpenNewReimbursement');
	domList.reimbursementTable = document.getElementById('reimbursementTable');
	domList.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	domList.desktopPagination = document.getElementById('desktopPagination');
};

const initListPage = () => {
	cacheListDom();
	if (domList.filterDateRange) {
		domList.filterDateRangePicker = flatpickr(domList.filterDateRange, {
			mode: 'range',
			dateFormat: 'Y-m-d',
			allowInput: false,
			onChange: (selectedDates) => {
				if (selectedDates.length === 0 || selectedDates.length === 2) {
					applyFilters();
				}
			},
		});
	}
	domList.filterStatus.addEventListener('change', applyFilters);
	domList.filterAmountRange.addEventListener('change', applyFilters);
	domList.btnReset.addEventListener('click', resetFilters);
	domList.btnOpenNewReimbursement.addEventListener('click', () => {
		goToPath('transactions/reimbursement/add');
	});

	domList.reimbursementTable.addEventListener('click', (event) => {
		const btn = event.target.closest('button[data-action]');
		if (!btn) {
			return;
		}
		const action = btn.getAttribute('data-action');
		if (action === 'edit') {
			goToPath(`transactions/reimbursement/add/${btn.getAttribute('data-ref')}`);
			return;
		}
		if (action === 'edit-submitted') {
			goToPath(`transactions/reimbursement/edit/${btn.getAttribute('data-ref')}`);
			return;
		}
		goToPath(`transactions/reimbursement/view/${btn.getAttribute('data-ref')}`);
	});

	domList.reimbursementMobileList.addEventListener('click', (event) => {
		const btn = event.target.closest('button[data-action]');
		if (!btn) {
			return;
		}
		const action = btn.getAttribute('data-action');
		if (action === 'edit') {
			goToPath(`transactions/reimbursement/add/${btn.getAttribute('data-ref')}`);
			return;
		}
		if (action === 'edit-submitted') {
			goToPath(`transactions/reimbursement/edit/${btn.getAttribute('data-ref')}`);
			return;
		}
		goToPath(`transactions/reimbursement/view/${btn.getAttribute('data-ref')}`);
	});

	if (domList.btnLoadMoreMobile) {
		domList.btnLoadMoreMobile.addEventListener('click', () => loadReimbursements(false));
	}

	if (domList.desktopPagination) {
		domList.desktopPagination.addEventListener('click', (event) => {
			const btn = event.target.closest('a[data-action]');
			if (!btn) {
				return;
			}

			event.preventDefault();
			if (btn.getAttribute('data-action') === 'prev') {
				goToDesktopPage(rmbDesktopPage - 1);
				return;
			}
			if (btn.getAttribute('data-action') === 'next') {
				goToDesktopPage(rmbDesktopPage + 1);
				return;
			}
			const page = Number(btn.getAttribute('data-page'));
			if (page) {
				goToDesktopPage(page);
			}
		});
	}

	loadReimbursements(true);
};

// Router: Initialize the correct page
const initModule = () => {
	if (document.getElementById('reimbursementTable')) {
		initListPage();
	} else if (document.getElementById('expenseItemsContainer')) {
		initAddPage();
	} else if (document.getElementById('editPageMarker')) {
		initEditPage();
	} else if (document.getElementById('reimbursementRef')) {
		initDetailPage();
	}
};

$(document).ready(() => {
	initModule();
});