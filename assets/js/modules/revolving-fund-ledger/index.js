let ledgerRows = [];
let nextCursorId = null;
let hasMoreRows = false;
let isLoadingRows = false;
let desktopPage = 1;
let fundOptionsLoaded = false;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterFundCode: null,
	filterDateRange: null,
	filterDateRangePicker: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumTopups: null,
	sumDraws: null,
	sumBalance: null,
	ledgerTbody: null,
	ledgerMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	btnLoadMoreMobile: null,
	ledgerTable: null,
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

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getAmountBadgeClass = (amount) => (amount >= 0 ? 'kna-badge-credit' : 'kna-badge-debit');

const isDrillableReference = (ref) => /^(CA|RPL|RMB|LQ)/i.test(normalizeText(ref));

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

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		fundId: Number(row.fund_id),
		fundCode: normalizeText(row.fund_code),
		fundScopeName: normalizeText(row.fund_scope_name),
		trxDate: normalizeText(row.trx_date),
		trxType: normalizeText(row.trx_type),
		trxTypeName: normalizeText(row.trx_type_name),
		amount: Number(row.amount) || 0,
		balanceAfter: Number(row.balance_after) || 0,
		referenceType: normalizeText(row.reference_type),
		referenceId: row.reference_id,
		referenceNo: normalizeText(row.reference_no),
		employeeName: normalizeText(row.employee_name),
		employeePosition: normalizeText(row.employee_position),
		remarks: normalizeText(row.remarks),
		createdByName: normalizeText(row.created_by_name),
		createdDate: normalizeText(row.created_date),
	}));

const updateLoadMoreButtons = () => {
	const show = hasMoreRows && !isLoadingRows;
	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.style.display = show ? 'inline-block' : 'none';
		dom.btnLoadMoreMobile.disabled = isLoadingRows;
	}
};

const populateFundOptions = (rows) => {
	if (fundOptionsLoaded || !dom.filterFundCode) {
		return;
	}

	const codes = Array.from(new Set(rows.map((r) => r.fundCode).filter(Boolean))).sort();
	codes.forEach((code) => {
		const option = document.createElement('option');
		option.value = code;
		option.textContent = code;
		dom.filterFundCode.appendChild(option);
	});

	fundOptionsLoaded = codes.length > 0;
};

const loadLedger = (reset = false) => {
	if (isLoadingRows) {
		return null;
	}

	if (reset) {
		desktopPage = 1;
		nextCursorId = null;
		hasMoreRows = false;
		ledgerRows = [];
		refreshUI();
	}

	isLoadingRows = true;
	updateLoadMoreButtons();

	const payload = { Take: reset ? 0 : PAGE_SIZE };
	if (!reset && nextCursorId !== null) {
		payload.CursorId = nextCursorId;
	}

	const fundCode = normalizeText(dom.filterFundCode.value).trim();
	const { from: dateFrom, to: dateTo } = parseDateRange();
	if (fundCode) payload.FundCode = fundCode;
	if (dateFrom) payload.DateFrom = dateFrom;
	if (dateTo) payload.DateTo = dateTo;

	const request = ajax_loader('reports/revolving-fund-ledger/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		const rows = normalizeApiRows(res.data);
		ledgerRows = reset ? rows : ledgerRows.concat(rows);
		populateFundOptions(ledgerRows);

		const pagination = res.pagination || {};
		hasMoreRows = Boolean(pagination.hasMore);
		nextCursorId = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
			? Number(pagination.nextCursorId)
			: (rows.length ? rows[rows.length - 1].id : nextCursorId);

		refreshUI();
	}).fail(() => {
		if (reset) {
			ledgerRows = [];
			refreshUI();
		}

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load the revolving fund ledger.',
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
		const request = loadLedger(false);
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

	if (keyword) {
		const haystack = `${row.fundCode} ${row.remarks} ${row.referenceNo} ${row.employeeName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.ledgerTbody.innerHTML = '';

	if (!rows.length) {
		dom.ledgerTbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		const refCell = isDrillableReference(row.referenceNo)
			? `<a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo)}</a>`
			: escapeHtml(row.referenceNo || '-');
		tr.innerHTML = `
			<td style="white-space:nowrap;">${escapeHtml(toIsoDate(row.trxDate) || '-')}</td>
			<td class="font-weight-bold" style="white-space:nowrap;">${escapeHtml(row.fundCode || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.fundScopeName)}">${escapeHtml(row.fundScopeName || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.trxTypeName || row.trxType || '-')}</td>
			<td style="white-space:nowrap;">${refCell}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.employeeName)}">${escapeHtml(row.employeeName || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.employeePosition)}">${escapeHtml(row.employeePosition || '-')}</td>
			<td class="text-right" style="white-space:nowrap;"><span class="kna-badge ${getAmountBadgeClass(row.amount)}">${formatAmount(row.amount)}</span></td>
			<td class="text-right" style="white-space:nowrap;">${formatAmount(row.balanceAfter)}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.remarks)}">${escapeHtml(row.remarks || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.createdByName)}">${escapeHtml(row.createdByName || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(toDisplayDateTime(row.createdDate) || '-')}</td>
		`;
		dom.ledgerTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.ledgerMobileList.innerHTML = '';

	if (!rows.length) {
		dom.ledgerMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.fundCode || '-')}</div>
				<div class="kna-small">${escapeHtml(toIsoDate(row.trxDate) || '-')}</div>
			</div>
			<div class="kna-small">${escapeHtml(row.trxTypeName || row.trxType || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Reference</div>
				<div class="kna-small">${isDrillableReference(row.referenceNo) ? `<a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo)}</a>` : escapeHtml(row.referenceNo || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Employee</div>
				<div class="kna-small">${escapeHtml(row.employeeName || '-')}${row.employeePosition ? ' &middot; ' + escapeHtml(row.employeePosition) : ''}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small font-weight-bold"><span class="kna-badge ${getAmountBadgeClass(row.amount)}">${formatAmount(row.amount)}</span></div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Balance After</div>
				<div class="kna-small">${formatAmount(row.balanceAfter)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created By</div>
				<div class="kna-small">${escapeHtml(row.createdByName || '-')}</div>
			</div>
		`;
		dom.ledgerMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);

	const topups = rows.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
	const draws = rows.filter((r) => r.amount < 0).reduce((sum, r) => sum + Math.abs(r.amount), 0);
	dom.sumTopups.textContent = formatAmount(topups);
	dom.sumDraws.textContent = formatAmount(draws);

	const fundCode = normalizeText(dom.filterFundCode.value).trim();
	let balance = 0;
	if (fundCode) {
		const fundRows = ledgerRows.filter((r) => r.fundCode === fundCode);
		if (fundRows.length) {
			balance = fundRows.reduce((latest, r) => (r.id > latest.id ? r : latest), fundRows[0]).balanceAfter;
		}
	} else if (rows.length) {
		balance = rows.reduce((latest, r) => (r.id > latest.id ? r : latest), rows[0]).balanceAfter;
	}
	dom.sumBalance.textContent = formatAmount(balance);
};

const getFilteredRows = () => ledgerRows.filter(matchesFilters);

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
	loadLedger(true);
};

const applyKeywordOnly = () => {
	desktopPage = 1;
	refreshUI();
};

const resetFilters = () => {
	desktopPage = 1;
	dom.filterKeyword.value = '';
	dom.filterFundCode.value = '';
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	loadLedger(true);
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const fundCode = normalizeText(dom.filterFundCode.value).trim();
	const { from: dateFrom, to: dateTo } = parseDateRange();

	if (fundCode) params.set('FundCode', fundCode);
	if (dateFrom) params.set('DateFrom', dateFrom);
	if (dateTo) params.set('DateTo', dateTo);

	const query = params.toString();
	window.location.href = `${base_url}reports/revolving-fund-ledger/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterFundCode = document.getElementById('filterFundCode');
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumTopups = document.getElementById('sumTopups');
	dom.sumDraws = document.getElementById('sumDraws');
	dom.sumBalance = document.getElementById('sumBalance');
	dom.ledgerTbody = document.getElementById('ledgerTbody');
	dom.ledgerMobileList = document.getElementById('ledgerMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	dom.ledgerTable = document.getElementById('ledgerTable');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyKeywordOnly);
	dom.filterFundCode.addEventListener('change', applyFilters);
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
		dom.btnLoadMoreMobile.addEventListener('click', () => loadLedger(false));
	}

	const rowLinkHandler = (event) => {
		const link = event.target.closest('a.kna-row-link');
		if (!link) {
			return;
		}
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.ledgerTable) {
		dom.ledgerTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.ledgerMobileList) {
		dom.ledgerMobileList.addEventListener('click', rowLinkHandler);
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
	loadLedger(true);
};

$(document).ready(() => {
	init();
});
