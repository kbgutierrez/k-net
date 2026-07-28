const PAGE_SIZE = 20;

let currentPage = 1;
let maxKnownPage = 1;
let isLoadingRows = false;

const pageCache = {};
const cursorForPage = { 1: null };
const hasMoreAfterPage = {};

const dom = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterTransactionType: null,
	filterAction: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumLoaded: null,
	sumPage: null,
	sumHasMore: null,
	auditTbody: null,
	auditMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	btnPrevMobile: null,
	btnNextMobile: null,
};

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value));

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const toDisplayDate = (value) => normalizeText(value).replace('T', ' ').slice(0, 19);

// Audit trail spans transaction types with no dedicated view page (bank
// account masterlist edits, revolving fund adjustments, etc.) — only
// link the reference when it actually looks like a transaction ref,
// otherwise leave it as plain text instead of a dead/misleading link.
const isDrillableReference = (ref) => /^(CA|RPL|RMB|LQ)/i.test(normalizeText(ref));

const goToReference = (referenceNo) => {
	if (!referenceNo || typeof window.knetResolveTransactionRoute !== 'function') {
		return;
	}
	window.location.href = `${base_url}${window.knetResolveTransactionRoute(referenceNo, false, false)}`;
};

const getActionBadge = (action) => {
	const value = normalizeText(action);
	let cls = 'kna-badge-other';
	if (value === 'CREATE' || value === 'SUBMITTED' || value === 'RESUBMITTED') cls = 'kna-badge-create';
	if (value.indexOf('UPDATE') !== -1 || value === 'SAVED_DRAFT') cls = 'kna-badge-update';
	if (value.indexOf('APPROV') !== -1 || value.indexOf('COMPLETED') !== -1 || value.indexOf('RELEASE') !== -1 || value.indexOf('PAID') !== -1) cls = 'kna-badge-approve';
	if (value.indexOf('REJECT') !== -1) cls = 'kna-badge-reject';
	return `<span class="kna-badge ${cls}">${escapeHtml(value || '-')}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		transactionType: normalizeText(row.transaction_type),
		transactionId: normalizeText(row.transaction_id),
		action: normalizeText(row.action),
		entityType: normalizeText(row.entity_type),
		entityId: normalizeText(row.entity_id),
		fieldName: normalizeText(row.field_name),
		oldValue: normalizeText(row.old_value),
		newValue: normalizeText(row.new_value),
		changedBy: normalizeText(row.changed_by_name || row.changed_by),
		createdDate: toDisplayDate(row.created_date),
		remarks: normalizeText(row.remarks),
	}));

const parseDateRange = () => {
	if (!dom.filterDateRangePicker || !Array.isArray(dom.filterDateRangePicker.selectedDates) || dom.filterDateRangePicker.selectedDates.length !== 2) {
		return { from: '', to: '' };
	}
	return {
		from: dom.filterDateRangePicker.selectedDates[0].toISOString().slice(0, 10),
		to: dom.filterDateRangePicker.selectedDates[1].toISOString().slice(0, 10),
	};
};

const getFilters = () => {
	const range = parseDateRange();
	return {
		DateFrom: range.from,
		DateTo: range.to,
		TransactionType: normalizeText(dom.filterTransactionType.value).trim(),
		Action: normalizeText(dom.filterAction.value).trim(),
	};
};

const renderDesktopTable = (rows) => {
	dom.auditTbody.innerHTML = '';

	if (!rows.length) {
		dom.auditTbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${row.id}</td>
			<td>${escapeHtml(row.transactionType || '-')}</td>
			<td>${isDrillableReference(row.transactionId) ? `<a href="#" class="kna-row-link" data-ref="${escapeHtml(row.transactionId)}">${escapeHtml(row.transactionId)}</a>` : escapeHtml(row.transactionId || '-')}</td>
			<td>${getActionBadge(row.action)}</td>
			<td>${escapeHtml(row.entityType || '-')}</td>
			<td>${escapeHtml(row.entityId || '-')}</td>
			<td>${escapeHtml(row.fieldName || '-')}</td>
			<td style="max-width:110px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.oldValue)}">${escapeHtml(row.oldValue || '-')}</td>
			<td style="max-width:110px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.newValue)}">${escapeHtml(row.newValue || '-')}</td>
			<td style="max-width:140px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.changedBy)}">${escapeHtml(row.changedBy || '-')}</td>
			<td>${escapeHtml(row.createdDate || '-')}</td>
			<td style="max-width:160px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.remarks)}">${escapeHtml(row.remarks || '-')}</td>
		`;
		dom.auditTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.auditMobileList.innerHTML = '';

	if (!rows.length) {
		dom.auditMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.transactionType || '-')} #${isDrillableReference(row.transactionId) ? `<a href="#" class="kna-row-link" data-ref="${escapeHtml(row.transactionId)}">${escapeHtml(row.transactionId)}</a>` : escapeHtml(row.transactionId || '-')}</div>
				<div>${getActionBadge(row.action)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Entity</div>
				<div class="kna-small">${escapeHtml(row.entityType || '-')} / ${escapeHtml(row.entityId || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Changed By</div>
				<div class="kna-small">${escapeHtml(row.changedBy || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Date/Time</div>
				<div class="kna-small">${escapeHtml(row.createdDate || '-')}</div>
			</div>
		`;
		dom.auditMobileList.appendChild(item);
	});
};

const renderDesktopPagination = () => {
	if (!dom.desktopPagination) {
		return;
	}

	const hasMore = Boolean(hasMoreAfterPage[maxKnownPage]);
	const totalPages = maxKnownPage + (hasMore ? 1 : 0);

	const canPrev = currentPage > 1;
	const canNext = currentPage < totalPages;

	const WINDOW_SIZE = 5;
	let windowStart = Math.max(1, currentPage - Math.floor(WINDOW_SIZE / 2));
	let windowEnd = Math.min(totalPages, windowStart + WINDOW_SIZE - 1);
	windowStart = Math.max(1, windowEnd - WINDOW_SIZE + 1);

	let pageLinks = '';

	if (windowStart > 1) {
		pageLinks += `
			<li class="page-item">
				<a class="page-link" href="#" data-page="1">1</a>
			</li>
			<li class="page-item disabled"><span class="page-link">&hellip;</span></li>
		`;
	}

	for (let page = windowStart; page <= windowEnd; page += 1) {
		pageLinks += `
			<li class="page-item ${page === currentPage ? 'active' : ''}">
				<a class="page-link" href="#" data-page="${page}">${page}</a>
			</li>
		`;
	}

	if (windowEnd < totalPages) {
		pageLinks += `
			<li class="page-item disabled"><span class="page-link">&hellip;</span></li>
			<li class="page-item">
				<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
			</li>
		`;
	}

	dom.desktopPagination.innerHTML = `
		<li class="page-item ${canPrev ? '' : 'disabled'}">
			<a class="page-link" href="#" data-action="prev">&lsaquo;</a>
		</li>
		${pageLinks}
		<li class="page-item ${canNext ? '' : 'disabled'}">
			<a class="page-link" href="#" data-action="next">&rsaquo;</a>
		</li>
	`;
};

const refreshUI = () => {
	const rows = pageCache[currentPage] || [];

	renderDesktopTable(rows);
	renderMobileCards(rows);
	renderDesktopPagination();

	dom.resultCount.textContent = `${rows.length} record(s) on this page`;
	dom.resultCountMobile.textContent = `${rows.length} record(s) on this page`;
	dom.sumLoaded.textContent = String(rows.length);
	dom.sumPage.textContent = String(currentPage);
	dom.sumHasMore.textContent = hasMoreAfterPage[currentPage] ? 'Yes' : 'No';

	if (dom.btnPrevMobile) dom.btnPrevMobile.disabled = currentPage <= 1;
	if (dom.btnNextMobile) {
		const hasMore = Boolean(hasMoreAfterPage[maxKnownPage]);
		const totalPages = maxKnownPage + (hasMore ? 1 : 0);
		dom.btnNextMobile.disabled = currentPage >= totalPages;
	}
};

const loadPage = (pageNum) => {
	if (isLoadingRows) {
		return null;
	}

	if (pageCache[pageNum] && cursorForPage[pageNum] !== undefined) {
		currentPage = pageNum;
		refreshUI();
		return null;
	}

	if (cursorForPage[pageNum] === undefined) {
		// Forward-only cursor: can't jump ahead of the furthest fetched page.
		return null;
	}

	isLoadingRows = true;

	const payload = Object.assign({ Take: PAGE_SIZE }, getFilters());
	if (cursorForPage[pageNum] !== null) {
		payload.CursorId = cursorForPage[pageNum];
	}

	const request = ajax_loader('reports/audit-trail/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Load Failed', text: (res && res.response) || 'Could not load audit trail.' });
			return;
		}

		const rows = normalizeApiRows(res.data);
		const pagination = res.pagination || {};

		pageCache[pageNum] = rows;
		hasMoreAfterPage[pageNum] = Boolean(pagination.hasMore);
		cursorForPage[pageNum + 1] = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
			? Number(pagination.nextCursorId)
			: null;

		maxKnownPage = Math.max(maxKnownPage, pageNum);
		currentPage = pageNum;
		refreshUI();
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Request Failed', text: 'Could not connect to the server.' });
	}).always(() => {
		isLoadingRows = false;
	});

	return request;
};

const resetAndLoad = () => {
	Object.keys(pageCache).forEach((key) => delete pageCache[key]);
	Object.keys(hasMoreAfterPage).forEach((key) => delete hasMoreAfterPage[key]);
	Object.keys(cursorForPage).forEach((key) => delete cursorForPage[key]);
	cursorForPage[1] = null;
	maxKnownPage = 1;
	currentPage = 1;
	loadPage(1);
};

const applyFilters = () => {
	resetAndLoad();
};

const resetFilters = () => {
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	dom.filterTransactionType.value = '';
	dom.filterAction.value = '';
	resetAndLoad();
};

const downloadExcel = () => {
	const filters = getFilters();
	const query = $.param(filters);
	window.location.href = `${base_url}reports/audit-trail/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterTransactionType = document.getElementById('filterTransactionType');
	dom.filterAction = document.getElementById('filterAction');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumLoaded = document.getElementById('sumLoaded');
	dom.sumPage = document.getElementById('sumPage');
	dom.sumHasMore = document.getElementById('sumHasMore');
	dom.auditTbody = document.getElementById('auditTbody');
	dom.auditMobileList = document.getElementById('auditMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnPrevMobile = document.getElementById('btnPrevMobile');
	dom.btnNextMobile = document.getElementById('btnNextMobile');
};

const bindEvents = () => {
	dom.filterTransactionType.addEventListener('change', applyFilters);
	dom.filterAction.addEventListener('change', applyFilters);
	dom.btnReset.addEventListener('click', resetFilters);
	dom.btnDownloadExcel.addEventListener('click', downloadExcel);

	if (dom.desktopPagination) {
		dom.desktopPagination.addEventListener('click', (event) => {
			const target = event.target.closest('a.page-link');
			if (!target) {
				return;
			}

			event.preventDefault();

			if (target.dataset.page) {
				loadPage(Number(target.dataset.page));
				return;
			}

			if (target.dataset.action === 'prev') {
				loadPage(currentPage - 1);
				return;
			}

			if (target.dataset.action === 'next') {
				loadPage(currentPage + 1);
			}
		});
	}

	if (dom.btnPrevMobile) {
		dom.btnPrevMobile.addEventListener('click', () => loadPage(currentPage - 1));
	}
	if (dom.btnNextMobile) {
		dom.btnNextMobile.addEventListener('click', () => loadPage(currentPage + 1));
	}

	const rowLinkHandler = (event) => {
		const link = event.target.closest('a.kna-row-link');
		if (!link) {
			return;
		}
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.auditTbody) {
		dom.auditTbody.addEventListener('click', rowLinkHandler);
	}
	if (dom.auditMobileList) {
		dom.auditMobileList.addEventListener('click', rowLinkHandler);
	}
};

const init = () => {
	cacheDom();

	if (dom.filterDateRange && typeof flatpickr !== 'undefined') {
		dom.filterDateRangePicker = flatpickr(dom.filterDateRange, {
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

	bindEvents();
	loadPage(1);
};

$(document).ready(() => {
	init();
});
