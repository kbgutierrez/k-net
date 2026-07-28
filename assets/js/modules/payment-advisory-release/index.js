let registerRows = [];
let nextCursorId = null;
let hasMoreRows = false;
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterEvent: null,
	filterType: null,
	filterDateRange: null,
	filterDateRangePicker: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumAdvised: null,
	sumReleased: null,
	sumAmount: null,
	registerTbody: null,
	registerMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	btnLoadMoreMobile: null,
	registerTable: null,
};

const normalizeText = (value) => (value ? String(value) : '');

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const toIsoDate = (value) => normalizeText(value).slice(0, 10);
const toDisplayDateTime = (value) => normalizeText(value).slice(0, 19).replace('T', ' ');

const goToReference = (referenceNo) => {
	if (!referenceNo || typeof window.knetResolveTransactionRoute !== 'function') {
		return;
	}
	window.location.href = `${base_url}${window.knetResolveTransactionRoute(referenceNo, false, false)}`;
};

const parseDateRange = () => {
	if (!dom.filterDateRangePicker || !Array.isArray(dom.filterDateRangePicker.selectedDates) || dom.filterDateRangePicker.selectedDates.length !== 2) {
		return { from: '', to: '' };
	}
	return {
		from: dom.filterDateRangePicker.selectedDates[0].toISOString().slice(0, 10),
		to: dom.filterDateRangePicker.selectedDates[1].toISOString().slice(0, 10),
	};
};

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getEventBadge = (eventType) =>
	eventType === 'ADVISED'
		? '<span class="kna-badge kna-badge-advised">Advised</span>'
		: '<span class="kna-badge kna-badge-released">Released</span>';

const getTypeLabel = (type) => {
	const map = {
		CASH_ADVANCE: 'Cash Advance',
		REIMBURSEMENT: 'Reimbursement',
		LIQUIDATION: 'Liquidation',
		REPLENISHMENT: 'Replenishment',
	};
	return map[type] || (type || '-');
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		transactionType: normalizeText(row.transaction_type),
		referenceNo: normalizeText(row.reference_no),
		action: normalizeText(row.action),
		eventType: normalizeText(row.event_type),
		requesterName: normalizeText(row.requester_name),
		payableTo: normalizeText(row.payable_to),
		department: normalizeText(row.department),
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		amount: Number(row.amount) || 0,
		actorName: normalizeText(row.actor_name),
		createdDate: normalizeText(row.created_date),
		remarks: normalizeText(row.remarks),
	}));

const updateLoadMoreButtons = () => {
	const show = hasMoreRows && !isLoadingRows;
	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.style.display = show ? 'inline-block' : 'none';
		dom.btnLoadMoreMobile.disabled = isLoadingRows;
	}
};

const loadRegister = (reset = false) => {
	if (isLoadingRows) {
		return null;
	}

	if (reset) {
		desktopPage = 1;
		nextCursorId = null;
		hasMoreRows = false;
		registerRows = [];
		refreshUI();
	}

	isLoadingRows = true;
	updateLoadMoreButtons();

	const payload = { Take: reset ? 0 : PAGE_SIZE };
	if (!reset && nextCursorId !== null) {
		payload.CursorId = nextCursorId;
	}

	const request = ajax_loader('reports/payment-advisory-release/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		const rows = normalizeApiRows(res.data);
		registerRows = reset ? rows : registerRows.concat(rows);

		const pagination = res.pagination || {};
		hasMoreRows = Boolean(pagination.hasMore);
		nextCursorId = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
			? Number(pagination.nextCursorId)
			: (rows.length ? rows[rows.length - 1].id : nextCursorId);

		refreshUI();
	}).fail(() => {
		if (reset) {
			registerRows = [];
			refreshUI();
		}

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load the payment register.',
		});
	}).always(() => {
		isLoadingRows = false;
		updateLoadMoreButtons();
	});

	return request;
};

const renderDesktopPagination = (rows) => {
	if (!dom.desktopPagination) {
		return;
	}

	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	if (desktopPage > totalPages) {
		desktopPage = totalPages;
	}

	const canPrev = desktopPage > 1;
	const canNext = desktopPage < totalPages || hasMoreRows;

	const WINDOW_SIZE = 5;
	let windowStart = Math.max(1, desktopPage - Math.floor(WINDOW_SIZE / 2));
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
			<li class="page-item ${page === desktopPage ? 'active' : ''}">
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

const goToDesktopPage = (targetPage) => {
	if (targetPage < 1) {
		return;
	}

	const rows = getFilteredRows();
	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

	if (targetPage > totalPages && hasMoreRows) {
		const request = loadRegister(false);
		if (request) {
			request.done(() => {
				desktopPage = targetPage;
				refreshUI();
			});
		}
		return;
	}

	desktopPage = Math.min(targetPage, totalPages);
	refreshUI();
};

const matchesFilters = (row) => {
	const keyword = normalizeText(dom.filterKeyword.value).trim().toLowerCase();
	const eventType = normalizeText(dom.filterEvent.value).trim();
	const type = normalizeText(dom.filterType.value).trim();
	const range = parseDateRange();
	const dateFrom = range.from;
	const dateTo = range.to;

	if (eventType && row.eventType !== eventType) {
		return false;
	}

	if (type && row.transactionType !== type) {
		return false;
	}

	const rowDate = toIsoDate(row.createdDate);
	if (dateFrom && rowDate < dateFrom) {
		return false;
	}
	if (dateTo && rowDate > dateTo) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.referenceNo} ${row.requesterName} ${row.actorName} ${row.costCenterName} ${row.payableTo}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.registerTbody.innerHTML = '';

	if (!rows.length) {
		dom.registerTbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td>${escapeHtml(getTypeLabel(row.transactionType))}</td>
			<td>${getEventBadge(row.eventType)}</td>
			<td style="max-width:160px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.requesterName)}">${escapeHtml(row.requesterName || '-')}</td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.payableTo)}">${escapeHtml(row.payableTo || '-')}</td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.department)}">${escapeHtml(row.department || '-')}</td>
			<td style="max-width:170px;white-space:normal;word-break:break-word;" title="${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</td>
			<td class="text-right">${formatAmount(row.amount)}</td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.actorName)}">${escapeHtml(row.actorName || '-')}</td>
			<td>${escapeHtml(toDisplayDateTime(row.createdDate) || '-')}</td>
			<td style="max-width:180px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.remarks)}">${escapeHtml(row.remarks || '-')}</td>
		`;
		dom.registerTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.registerMobileList.innerHTML = '';

	if (!rows.length) {
		dom.registerMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></div>
				<div>${getEventBadge(row.eventType)}</div>
			</div>
			<div class="kna-small">${escapeHtml(getTypeLabel(row.transactionType))} &middot; ${escapeHtml(row.requesterName || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Payable To</div>
				<div class="kna-small">${escapeHtml(row.payableTo || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small font-weight-bold">${formatAmount(row.amount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Actioned By</div>
				<div class="kna-small">${escapeHtml(row.actorName || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Date/Time</div>
				<div class="kna-small">${escapeHtml(toDisplayDateTime(row.createdDate) || '-')}</div>
			</div>
		`;
		dom.registerMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	dom.sumAdvised.textContent = String(rows.filter((r) => r.eventType === 'ADVISED').length);
	dom.sumReleased.textContent = String(rows.filter((r) => r.eventType === 'RELEASED').length);
	const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
	dom.sumAmount.textContent = formatAmount(totalAmount);
};

const getFilteredRows = () => registerRows.filter(matchesFilters);

const refreshUI = () => {
	const rows = getFilteredRows();
	const startIndex = (desktopPage - 1) * PAGE_SIZE;
	const desktopRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

	renderSummary(rows);
	renderDesktopTable(desktopRows);
	renderMobileCards(rows);
	renderDesktopPagination(rows);

	dom.resultCount.textContent = `${rows.length} record(s)`;
	dom.resultCountMobile.textContent = `${rows.length} record(s)`;
	updateLoadMoreButtons();
};

const applyFilters = () => {
	desktopPage = 1;
	refreshUI();
};

const resetFilters = () => {
	desktopPage = 1;
	dom.filterKeyword.value = '';
	dom.filterEvent.value = '';
	dom.filterType.value = '';
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	refreshUI();
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const keyword = normalizeText(dom.filterKeyword.value).trim();
	const eventType = normalizeText(dom.filterEvent.value).trim();
	const type = normalizeText(dom.filterType.value).trim();
	const { from: dateFrom, to: dateTo } = parseDateRange();

	if (keyword) params.set('Keyword', keyword);
	if (eventType) params.set('EventType', eventType);
	if (type) params.set('TransactionType', type);
	if (dateFrom) params.set('DateFrom', dateFrom);
	if (dateTo) params.set('DateTo', dateTo);

	const query = params.toString();
	window.location.href = `${base_url}reports/payment-advisory-release/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterEvent = document.getElementById('filterEvent');
	dom.filterType = document.getElementById('filterType');
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumAdvised = document.getElementById('sumAdvised');
	dom.sumReleased = document.getElementById('sumReleased');
	dom.sumAmount = document.getElementById('sumAmount');
	dom.registerTbody = document.getElementById('registerTbody');
	dom.registerMobileList = document.getElementById('registerMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	dom.registerTable = document.getElementById('registerTable');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterEvent.addEventListener('change', applyFilters);
	dom.filterType.addEventListener('change', applyFilters);
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
				goToDesktopPage(Number(target.dataset.page));
				return;
			}

			if (target.dataset.action === 'prev') {
				goToDesktopPage(desktopPage - 1);
				return;
			}

			if (target.dataset.action === 'next') {
				goToDesktopPage(desktopPage + 1);
			}
		});
	}

	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.addEventListener('click', () => loadRegister(false));
	}

	const rowLinkHandler = (event) => {
		const link = event.target.closest('a.kna-row-link');
		if (!link) {
			return;
		}
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.registerTable) {
		dom.registerTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.registerMobileList) {
		dom.registerMobileList.addEventListener('click', rowLinkHandler);
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
	loadRegister(true);
};

$(document).ready(() => {
	init();
});
