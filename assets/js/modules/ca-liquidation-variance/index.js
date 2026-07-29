let varianceRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;
const AGING_THRESHOLD_DAYS = 30;

const dom = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterCostCenter: null,
	filterOutstanding: null,
	btnApply: null,
	btnReset: null,
	btnExportExcel: null,
	sumCA: null,
	sumLiquidated: null,
	sumVariance: null,
	sumAging: null,
	varianceTbody: null,
	varianceMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	varianceTable: null,
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

const formatCostCenter = (row) =>
	row.costCenterId === '(Unassigned)' ? 'Unassigned' : window.knetFormatCodeName(row.costCenterId, row.costCenterName);

const formatMoney = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isOutstanding = (row) => Math.abs(row.variance) > 0.01;

const getAgeBadge = (ageDays, outstanding) => {
	if (!outstanding) {
		return `<span class="kna-badge kna-badge-ok">${ageDays}</span>`;
	}
	if (ageDays > AGING_THRESHOLD_DAYS) {
		return `<span class="kna-badge kna-badge-danger">${ageDays}</span>`;
	}
	return `<span class="kna-badge kna-badge-warn">${ageDays}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		cashAdvanceId: normalizeText(row.cash_advance_id),
		userName: normalizeText(row.user_name),
		costCenterId: normalizeText(row.cost_center_id) || '(Unassigned)',
		costCenterName: normalizeText(row.cost_center_name) || 'Unassigned',
		description: normalizeText(row.description),
		caAmount: Number(row.ca_amount || 0),
		liquidatedAmount: Number(row.liquidated_amount || 0),
		variance: Number(row.variance || 0),
		statusName: normalizeText(row.status_name),
		createdDate: toIsoDate(row.created_date),
		ageDays: Number(row.age_days || 0),
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

const loadVariance = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const range = parseDateRange();
	const payload = {
		DateFrom: range.from,
		DateTo: range.to,
	};

	const request = ajax_loader('reports/ca-liquidation-variance/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Load Failed', text: (res && res.response) ? res.response : 'Could not load report data.' });
			return;
		}

		varianceRows = normalizeApiRows(res.data);
		populateCostCenterFilter(varianceRows);
		desktopPage = 1;
		refreshUI();
	}).fail(() => {
		varianceRows = [];
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
	const outstandingOnly = normalizeText(dom.filterOutstanding.value).trim() === '1';

	if (costCenter && row.costCenterId !== costCenter) {
		return false;
	}
	if (outstandingOnly && !isOutstanding(row)) {
		return false;
	}
	return true;
};

const renderDesktopTable = (rows) => {
	dom.varianceTbody.innerHTML = '';

	if (!rows.length) {
		dom.varianceTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const outstanding = isOutstanding(row);
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="font-weight-bold" style="white-space:nowrap;"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.cashAdvanceId)}">${escapeHtml(row.cashAdvanceId)}</a></td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.userName)}">${escapeHtml(row.userName)}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(formatCostCenter(row))}">${escapeHtml(formatCostCenter(row))}</td>
			<td class="text-right" style="white-space:nowrap;">${formatMoney(row.caAmount)}</td>
			<td class="text-right" style="white-space:nowrap;">${formatMoney(row.liquidatedAmount)}</td>
			<td class="text-right" style="white-space:nowrap;">${formatMoney(row.variance)}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.statusName || '-')}</td>
			<td class="text-center" style="white-space:nowrap;">${getAgeBadge(row.ageDays, outstanding)}</td>
		`;
		dom.varianceTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.varianceMobileList.innerHTML = '';

	if (!rows.length) {
		dom.varianceMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const outstanding = isOutstanding(row);
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.cashAdvanceId)}">${escapeHtml(row.cashAdvanceId)}</a></div>
				<div>${getAgeBadge(row.ageDays, outstanding)}</div>
			</div>
			<div class="kna-small font-weight-bold">${escapeHtml(row.userName)}</div>
			<div class="kna-small text-muted mb-1">${escapeHtml(formatCostCenter(row))}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">CA Amount</div>
				<div class="kna-small">${formatMoney(row.caAmount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Liquidated</div>
				<div class="kna-small">${formatMoney(row.liquidatedAmount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Variance</div>
				<div class="kna-small">${formatMoney(row.variance)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Status</div>
				<div class="kna-small">${escapeHtml(row.statusName || '-')}</div>
			</div>
		`;
		dom.varianceMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	let ca = 0;
	let liquidated = 0;
	let variance = 0;
	let aging = 0;

	rows.forEach((row) => {
		ca += row.caAmount;
		liquidated += row.liquidatedAmount;
		if (isOutstanding(row)) {
			variance += row.variance;
			if (row.ageDays > AGING_THRESHOLD_DAYS) {
				aging += 1;
			}
		}
	});

	dom.sumCA.textContent = formatMoney(ca);
	dom.sumLiquidated.textContent = formatMoney(liquidated);
	dom.sumVariance.textContent = formatMoney(variance);
	dom.sumAging.textContent = String(aging);
};

const getFilteredRows = () => varianceRows.filter(matchesFilters);

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
	dom.filterOutstanding.value = '';
	loadVariance();
};

const exportExcel = () => {
	const params = new URLSearchParams();
	const range = parseDateRange();
	if (range.from) params.set('DateFrom', range.from);
	if (range.to) params.set('DateTo', range.to);
	window.location.href = `${base_url}reports/ca-liquidation-variance/download/excel?${params.toString()}`;
};

const cacheDom = () => {
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterCostCenter = document.getElementById('filterCostCenter');
	dom.filterOutstanding = document.getElementById('filterOutstanding');
	dom.btnApply = document.getElementById('btnApply');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnExportExcel = document.getElementById('btnExportExcel');
	dom.sumCA = document.getElementById('sumCA');
	dom.sumLiquidated = document.getElementById('sumLiquidated');
	dom.sumVariance = document.getElementById('sumVariance');
	dom.sumAging = document.getElementById('sumAging');
	dom.varianceTbody = document.getElementById('varianceTbody');
	dom.varianceMobileList = document.getElementById('varianceMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.varianceTable = document.getElementById('varianceTable');
};

const bindEvents = () => {
	dom.filterCostCenter.addEventListener('change', applyFilters);
	dom.filterOutstanding.addEventListener('change', applyFilters);
	dom.btnApply.addEventListener('click', loadVariance);
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

	if (dom.varianceTable) {
		dom.varianceTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.varianceMobileList) {
		dom.varianceMobileList.addEventListener('click', rowLinkHandler);
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
	loadVariance();
};

$(document).ready(() => {
	init();
});
