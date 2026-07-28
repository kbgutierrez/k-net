let utilizationRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterCostCenter: null,
	filterType: null,
	btnApply: null,
	btnReset: null,
	btnExportExcel: null,
	sumTotal: null,
	sumCA: null,
	sumRMB: null,
	sumLQ: null,
	utilizationTbody: null,
	utilizationMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	utilizationTable: null,
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

const goToReference = (referenceNo) => {
	if (!referenceNo || typeof window.knetResolveTransactionRoute !== 'function') {
		return;
	}
	window.location.href = `${base_url}${window.knetResolveTransactionRoute(referenceNo, false, false)}`;
};

const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getTypeBadge = (type) => {
	if (type === 'CASH_ADVANCE') return '<span class="kna-badge kna-badge-ca">Cash Advance</span>';
	if (type === 'REIMBURSEMENT') return '<span class="kna-badge kna-badge-rmb">Reimbursement</span>';
	if (type === 'LIQUIDATION') return '<span class="kna-badge kna-badge-lq">Liquidation</span>';
	return escapeHtml(type || '-');
};

const formatCostCenter = (row) =>
	row.costCenterId === '(Unassigned)' ? 'Unassigned' : window.knetFormatCodeName(row.costCenterId, row.costCenterName);

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		costCenterId: normalizeText(row.cost_center_id) || '(Unassigned)',
		costCenterName: normalizeText(row.cost_center_name) || 'Unassigned',
		transactionType: normalizeText(row.transaction_type),
		referenceNo: normalizeText(row.reference_no),
		amount: Number(row.amount || 0),
		transactionDate: toIsoDate(row.transaction_date),
		statusName: normalizeText(row.status_name),
	}));

const populateCostCenterFilter = (rows) => {
	const seen = new Map();
	rows.forEach((row) => {
		if (!seen.has(row.costCenterId)) {
			seen.set(row.costCenterId, row.costCenterName);
		}
	});

	const current = dom.filterCostCenter.value;
	const options = ['<option value="">All Cost Centers</option>'];
	Array.from(seen.entries())
		.sort((a, b) => a[1].localeCompare(b[1]))
		.forEach(([id, name]) => {
			options.push(`<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`);
		});
	dom.filterCostCenter.innerHTML = options.join('');
	dom.filterCostCenter.value = current;
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

const loadUtilization = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const range = parseDateRange();
	const payload = {
		DateFrom: range.from,
		DateTo: range.to,
	};

	const request = ajax_loader('reports/cost-center-utilization/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Load Failed', text: (res && res.response) ? res.response : 'Could not load report data.' });
			return;
		}

		utilizationRows = normalizeApiRows(res.data);
		populateCostCenterFilter(utilizationRows);
		desktopPage = 1;
		refreshUI();
	}).fail(() => {
		utilizationRows = [];
		refreshUI();
		Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Could not load report data.' });
	}).always(() => {
		isLoadingRows = false;
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
	const canNext = desktopPage < totalPages;

	const WINDOW_SIZE = 5;
	let windowStart = Math.max(1, desktopPage - Math.floor(WINDOW_SIZE / 2));
	let windowEnd = Math.min(totalPages, windowStart + WINDOW_SIZE - 1);
	windowStart = Math.max(1, windowEnd - WINDOW_SIZE + 1);

	let pageLinks = '';
	if (windowStart > 1) {
		pageLinks += `
			<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>
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
			<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>
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
	desktopPage = Math.min(targetPage, totalPages);
	refreshUI();
};

const matchesFilters = (row) => {
	const costCenter = normalizeText(dom.filterCostCenter.value).trim();
	const type = normalizeText(dom.filterType.value).trim();

	if (costCenter && row.costCenterId !== costCenter) {
		return false;
	}
	if (type && row.transactionType !== type) {
		return false;
	}
	return true;
};

const renderDesktopTable = (rows) => {
	dom.utilizationTbody.innerHTML = '';

	if (!rows.length) {
		dom.utilizationTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="font-weight-bold" style="max-width:250px;white-space:normal;word-break:break-word;" title="${escapeHtml(formatCostCenter(row))}">${escapeHtml(formatCostCenter(row))}</td>
			<td>${getTypeBadge(row.transactionType)}</td>
			<td><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td class="text-right">${formatMoney(row.amount)}</td>
			<td>${escapeHtml(row.transactionDate || '-')}</td>
			<td>${escapeHtml(row.statusName || '-')}</td>
		`;
		dom.utilizationTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.utilizationMobileList.innerHTML = '';

	if (!rows.length) {
		dom.utilizationMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></div>
				<div>${getTypeBadge(row.transactionType)}</div>
			</div>
			<div class="kna-small font-weight-bold">${escapeHtml(formatCostCenter(row))}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small">${formatMoney(row.amount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Date</div>
				<div class="kna-small">${escapeHtml(row.transactionDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Status</div>
				<div class="kna-small">${escapeHtml(row.statusName || '-')}</div>
			</div>
		`;
		dom.utilizationMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	let total = 0;
	let ca = 0;
	let rmb = 0;
	let lq = 0;

	rows.forEach((row) => {
		total += row.amount;
		if (row.transactionType === 'CASH_ADVANCE') ca += row.amount;
		if (row.transactionType === 'REIMBURSEMENT') rmb += row.amount;
		if (row.transactionType === 'LIQUIDATION') lq += row.amount;
	});

	dom.sumTotal.textContent = formatMoney(total);
	dom.sumCA.textContent = formatMoney(ca);
	dom.sumRMB.textContent = formatMoney(rmb);
	dom.sumLQ.textContent = formatMoney(lq);
};

const getFilteredRows = () => utilizationRows.filter(matchesFilters);

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
};

const applyFilters = () => {
	desktopPage = 1;
	refreshUI();
};

const resetFilters = () => {
	desktopPage = 1;
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	dom.filterCostCenter.value = '';
	dom.filterType.value = '';
	loadUtilization();
};

const exportExcel = () => {
	const params = new URLSearchParams();
	const range = parseDateRange();
	if (range.from) params.set('DateFrom', range.from);
	if (range.to) params.set('DateTo', range.to);
	window.location.href = `${base_url}reports/cost-center-utilization/download/excel?${params.toString()}`;
};

const cacheDom = () => {
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterCostCenter = document.getElementById('filterCostCenter');
	dom.filterType = document.getElementById('filterType');
	dom.btnApply = document.getElementById('btnApply');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnExportExcel = document.getElementById('btnExportExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumCA = document.getElementById('sumCA');
	dom.sumRMB = document.getElementById('sumRMB');
	dom.sumLQ = document.getElementById('sumLQ');
	dom.utilizationTbody = document.getElementById('utilizationTbody');
	dom.utilizationMobileList = document.getElementById('utilizationMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.utilizationTable = document.getElementById('utilizationTable');
};

const bindEvents = () => {
	dom.filterCostCenter.addEventListener('change', applyFilters);
	dom.filterType.addEventListener('change', applyFilters);
	dom.btnApply.addEventListener('click', loadUtilization);
	dom.btnReset.addEventListener('click', resetFilters);
	dom.btnExportExcel.addEventListener('click', exportExcel);

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

	const rowLinkHandler = (event) => {
		const link = event.target.closest('a.kna-row-link');
		if (!link) {
			return;
		}
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.utilizationTable) {
		dom.utilizationTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.utilizationMobileList) {
		dom.utilizationMobileList.addEventListener('click', rowLinkHandler);
	}
};

const init = () => {
	cacheDom();

	if (dom.filterDateRange && typeof flatpickr !== 'undefined') {
		dom.filterDateRangePicker = flatpickr(dom.filterDateRange, {
			mode: 'range',
			dateFormat: 'Y-m-d',
			allowInput: false,
		});
	}

	bindEvents();
	loadUtilization();
};

$(document).ready(() => {
	init();
});
