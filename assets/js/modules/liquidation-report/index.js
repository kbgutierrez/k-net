let liquidationRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterDateRange: null,
	filterDateRangePicker: null,
	filterDepartment: null,
	filterCompany: null,
	filterEmployee: null,
	filterStatus: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumLiquidated: null,
	sumRefund: null,
	sumReimburse: null,
	liquidationTbody: null,
	liquidationMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	liquidationTable: null,
};

const normalizeText = (value) => (value || value === 0 ? String(value) : '');

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

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getStatusBadge = (status) => {
	const normalized = normalizeText(status);
	if (normalized === 'Completed') return `<span class="kna-badge kna-badge-completed">${escapeHtml(normalized)}</span>`;
	return `<span class="kna-badge kna-badge-lq">${escapeHtml(normalized || '-')}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		liquidationId: normalizeText(row.liquidation_id),
		cashAdvanceId: normalizeText(row.cash_advance_id),
		employeeName: normalizeText(row.employee_name),
		companyName: normalizeText(row.company_name),
		departmentName: normalizeText(row.department_name),
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		caAmount: Number(row.ca_amount) || 0,
		totalAmountSpent: Number(row.total_amount_spent) || 0,
		refundAmount: Number(row.refund_amount) || 0,
		reimburseAmount: Number(row.reimburse_amount) || 0,
		description: normalizeText(row.description),
		submittedDate: toIsoDate(row.submitted_date),
		statusName: normalizeText(row.status_name),
	}));

const uniqueValues = (rows, field) => {
	const values = rows.map((row) => row[field]).filter(Boolean);
	return Array.from(new Set(values)).sort((left, right) => String(left).localeCompare(String(right)));
};

const populateSelect = (selectElement, values, placeholder) => {
	if (!selectElement) return;
	const current = selectElement.value;
	selectElement.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
		.concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
		.join('');
	selectElement.value = current;
};

const refreshFilterOptions = () => {
	populateSelect(dom.filterDepartment, uniqueValues(liquidationRows, 'departmentName'), 'All Departments');
	populateSelect(dom.filterCompany, uniqueValues(liquidationRows, 'companyName'), 'All Companies');
	populateSelect(dom.filterEmployee, uniqueValues(liquidationRows, 'employeeName'), 'All Employees');
	populateSelect(dom.filterStatus, uniqueValues(liquidationRows, 'statusName'), 'All Status');
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

const loadLiquidations = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const request = ajax_loader('reports/liquidation-report/api/get', { Take: 0 });

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		liquidationRows = normalizeApiRows(res.data);
		refreshFilterOptions();
		refreshUI();
	}).fail(() => {
		liquidationRows = [];
		refreshUI();

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load liquidation report.',
		});
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
	desktopPage = Math.min(targetPage, totalPages);
	refreshUI();
};

const matchesFilters = (row) => {
	const keyword = normalizeText(dom.filterKeyword.value).trim().toLowerCase();
	const department = normalizeText(dom.filterDepartment.value);
	const company = normalizeText(dom.filterCompany.value);
	const employee = normalizeText(dom.filterEmployee.value);
	const status = normalizeText(dom.filterStatus.value);
	const range = parseDateRange();

	if (department && row.departmentName !== department) return false;
	if (company && row.companyName !== company) return false;
	if (employee && row.employeeName !== employee) return false;
	if (status && row.statusName !== status) return false;

	if (range.from && row.submittedDate < range.from) return false;
	if (range.to && row.submittedDate > range.to) return false;

	if (keyword) {
		const haystack = `${row.liquidationId} ${row.cashAdvanceId} ${row.description} ${row.employeeName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) return false;
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.liquidationTbody.innerHTML = '';

	if (!rows.length) {
		dom.liquidationTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		const costCenterDisplay = window.knetFormatCodeName(row.costCenterId, row.costCenterName);
		tr.innerHTML = `
			<td class="font-weight-bold" style="white-space:nowrap;"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.liquidationId)}">${escapeHtml(row.liquidationId || '-')}</a></td>
			<td style="white-space:nowrap;"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.cashAdvanceId)}">${escapeHtml(row.cashAdvanceId || '-')}</a></td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.employeeName)}">${escapeHtml(row.employeeName || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.departmentName)}">${escapeHtml(row.departmentName || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(costCenterDisplay)}">${escapeHtml(costCenterDisplay)}</td>
			<td class="text-right" style="white-space:nowrap;">${formatAmount(row.caAmount)}</td>
			<td class="text-right" style="white-space:nowrap;">${formatAmount(row.totalAmountSpent)}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.description)}">${escapeHtml(row.description || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.submittedDate || '-')}</td>
			<td style="white-space:nowrap;">${getStatusBadge(row.statusName)}</td>
		`;
		dom.liquidationTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.liquidationMobileList.innerHTML = '';

	if (!rows.length) {
		dom.liquidationMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		const costCenterDisplay = window.knetFormatCodeName(row.costCenterId, row.costCenterName);
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.liquidationId)}">${escapeHtml(row.liquidationId || '-')}</a></div>
				<div>${getStatusBadge(row.statusName)}</div>
			</div>
			<div class="kna-small">${escapeHtml(row.employeeName || '-')} &middot; ${escapeHtml(row.departmentName || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cash Advance</div>
				<div class="kna-small"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.cashAdvanceId)}">${escapeHtml(row.cashAdvanceId || '-')}</a></div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(costCenterDisplay)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Liquidated</div>
				<div class="kna-small font-weight-bold">${formatAmount(row.totalAmountSpent)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Submitted</div>
				<div class="kna-small">${escapeHtml(row.submittedDate || '-')}</div>
			</div>
		`;
		dom.liquidationMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	dom.sumLiquidated.textContent = formatAmount(rows.reduce((sum, r) => sum + r.totalAmountSpent, 0));
	dom.sumRefund.textContent = formatAmount(rows.reduce((sum, r) => sum + r.refundAmount, 0));
	dom.sumReimburse.textContent = formatAmount(rows.reduce((sum, r) => sum + r.reimburseAmount, 0));
};

const getFilteredRows = () => liquidationRows.filter(matchesFilters);

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
	dom.filterKeyword.value = '';
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	dom.filterDepartment.value = '';
	dom.filterCompany.value = '';
	dom.filterEmployee.value = '';
	dom.filterStatus.value = '';
	refreshUI();
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const range = parseDateRange();
	const department = normalizeText(dom.filterDepartment.value);
	const company = normalizeText(dom.filterCompany.value);
	const employee = normalizeText(dom.filterEmployee.value);
	const status = normalizeText(dom.filterStatus.value);

	if (range.from) params.set('DateFrom', range.from);
	if (range.to) params.set('DateTo', range.to);
	if (department) params.set('Department', department);
	if (company) params.set('Company', company);
	if (employee) params.set('Employee', employee);
	if (status) params.set('Status', status);

	const query = params.toString();
	window.location.href = `${base_url}reports/liquidation-report/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterDepartment = document.getElementById('filterDepartment');
	dom.filterCompany = document.getElementById('filterCompany');
	dom.filterEmployee = document.getElementById('filterEmployee');
	dom.filterStatus = document.getElementById('filterStatus');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumLiquidated = document.getElementById('sumLiquidated');
	dom.sumRefund = document.getElementById('sumRefund');
	dom.sumReimburse = document.getElementById('sumReimburse');
	dom.liquidationTbody = document.getElementById('liquidationTbody');
	dom.liquidationMobileList = document.getElementById('liquidationMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.liquidationTable = document.getElementById('liquidationTable');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterDepartment.addEventListener('change', applyFilters);
	dom.filterCompany.addEventListener('change', applyFilters);
	dom.filterEmployee.addEventListener('change', applyFilters);
	dom.filterStatus.addEventListener('change', applyFilters);
	dom.btnReset.addEventListener('click', resetFilters);
	dom.btnDownloadExcel.addEventListener('click', downloadExcel);

	if (dom.desktopPagination) {
		dom.desktopPagination.addEventListener('click', (event) => {
			const target = event.target.closest('a.page-link');
			if (!target) return;
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
		if (!link) return;
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.liquidationTable) {
		dom.liquidationTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.liquidationMobileList) {
		dom.liquidationMobileList.addEventListener('click', rowLinkHandler);
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
	loadLiquidations();
};

$(document).ready(() => {
	init();
});
