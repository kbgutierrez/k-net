let cashAdvances = [];
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterDepartment: null,
	filterCompany: null,
	filterEmployee: null,
	filterStatus: null,
	resultCount: null,
	resultCountMobile: null,
	btnReset: null,
	desktopPagination: null,
	btnLoadMoreMobile: null,
	cashAdvanceTable: null,
	cashAdvanceTbody: null,
	cashAdvanceMobileList: null,
};

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const normalizeText = (value) => String(value ?? '').trim();

const formatPHP = (amount) => Number(amount || 0).toLocaleString('en-PH', {
	style: 'currency',
	currency: 'PHP',
});

const getStatusBadge = (status) => {
	const normalized = normalizeText(status);
	if (normalized === 'Pending Approval') return '<span class="kna-badge kna-badge-pending">Pending Approval</span>';
	if (normalized === 'For Liquidation') return '<span class="kna-badge kna-badge-liquidation">For Liquidation</span>';
	if (normalized === 'Approved') return '<span class="kna-badge kna-badge-approved">Approved</span>';
	if (normalized === 'Rejected') return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	if (normalized === 'Completed') return '<span class="kna-badge kna-badge-completed">Completed</span>';
	return `<span class="kna-badge kna-badge-pending">${escapeHtml(normalized || 'Pending')}</span>`;
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

const normalizeRow = (row) => ({
	id: Number(row.id || 0),
	refNo: normalizeText(row.cash_advance_id),
	employee: normalizeText(row.employee_name || row.user_name),
	department: normalizeText(row.department_name || row.department),
	company: normalizeText(row.company_name || row.company),
	amount: Number(row.amount || 0),
	purpose: normalizeText(row.description),
	neededDate: normalizeText(row.needed_date).slice(0, 10),
	requestedDate: normalizeText(row.created_date).slice(0, 10),
	status: normalizeText(row.status_name || row.status),
});

const uniqueValues = (rows, field) => {
	const values = rows.map((row) => normalizeText(row[field])).filter(Boolean);
	return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
};

const populateSelect = (selectElement, values, placeholder) => {
	if (!selectElement) return;
	selectElement.innerHTML = [`<option value="">${escapeHtml(placeholder)}</option>`]
		.concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
		.join('');
};

const refreshFilterOptions = () => {
	populateSelect(dom.filterDepartment, uniqueValues(cashAdvances, 'department'), 'All Departments');
	populateSelect(dom.filterCompany, uniqueValues(cashAdvances, 'company'), 'All Companies');
	populateSelect(dom.filterEmployee, uniqueValues(cashAdvances, 'employee'), 'All Employees');
};

const matchesFilters = (row) => {
	const department = normalizeText(dom.filterDepartment && dom.filterDepartment.value);
	const company = normalizeText(dom.filterCompany && dom.filterCompany.value);
	const employee = normalizeText(dom.filterEmployee && dom.filterEmployee.value);
	const status = normalizeText(dom.filterStatus && dom.filterStatus.value);
	const range = parseDateRange();

	if (department && row.department !== department) return false;
	if (company && row.company !== company) return false;
	if (employee && row.employee !== employee) return false;
	if (status && row.status !== status) return false;

	if (range.from && range.to && (row.requestedDate < range.from || row.requestedDate > range.to)) {
		return false;
	}

	return true;
};

const getFilteredRows = () => cashAdvances.filter(matchesFilters);

const renderDesktopPagination = (rows) => {
	if (!dom.desktopPagination) return;

	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	if (desktopPage > totalPages) desktopPage = totalPages;

	const canPrev = desktopPage > 1;
	const canNext = desktopPage < totalPages;
	let pageLinks = '';

	for (let page = 1; page <= totalPages; page += 1) {
		pageLinks += `
			<li class="page-item ${page === desktopPage ? 'active' : ''}">
				<a class="page-link" href="#" data-page="${page}">${page}</a>
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

const renderDesktopTable = (rows) => {
	if (!dom.cashAdvanceTbody) return;

	dom.cashAdvanceTbody.innerHTML = '';
	if (!rows.length) {
		dom.cashAdvanceTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="text-nowrap" style="max-width:170px;">${escapeHtml(row.refNo)}</td>
			<td>${escapeHtml(row.employee)}</td>
			<td>${escapeHtml(row.department)}</td>
			<td>${escapeHtml(row.company)}</td>
			<td class="text-right">${formatPHP(row.amount)}</td>
			<td class="text-truncate" style="max-width:360px;" title="${escapeHtml(row.purpose)}">${escapeHtml(row.purpose)}</td>
			<td>${escapeHtml(row.neededDate)}</td>
			<td>${escapeHtml(row.requestedDate)}</td>
			<td>${getStatusBadge(row.status)}</td>
			<td class="text-center kna-actions">
				<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-ref="${escapeHtml(row.refNo)}">View</button>
			</td>
		`;
		dom.cashAdvanceTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	if (!dom.cashAdvanceMobileList) return;

	const visibleRows = rows.slice(0, desktopPage * PAGE_SIZE);
	dom.cashAdvanceMobileList.innerHTML = '';

	if (!visibleRows.length) {
		dom.cashAdvanceMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	visibleRows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">Cash Advance No: ${escapeHtml(row.refNo)}</div>
				<div>${getStatusBadge(row.status)}</div>
			</div>
			<div class="kna-row"><div class="kna-small text-muted">Employee</div><div class="kna-small">${escapeHtml(row.employee)}</div></div>
			<div class="kna-row"><div class="kna-small text-muted">Department</div><div class="kna-small">${escapeHtml(row.department)}</div></div>
			<div class="kna-row"><div class="kna-small text-muted">Company</div><div class="kna-small">${escapeHtml(row.company)}</div></div>
			<div class="kna-row"><div class="kna-small text-muted">Amount</div><div class="kna-small font-weight-bold">${formatPHP(row.amount)}</div></div>
			<div class="kna-row"><div class="kna-small text-muted">Needed</div><div class="kna-small">${escapeHtml(row.neededDate)}</div></div>
			<div class="kna-small text-muted mt-1 mb-1 text-truncate">${escapeHtml(row.purpose)}</div>
			<button type="button" class="btn btn-outline-primary btn-sm kna-small w-100" data-action="view" data-ref="${escapeHtml(row.refNo)}">View Details</button>
		`;
		dom.cashAdvanceMobileList.appendChild(item);
	});

	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.style.display = visibleRows.length < rows.length ? 'inline-block' : 'none';
	}
};

const refreshUI = () => {
	const rows = getFilteredRows();
	const startIndex = (desktopPage - 1) * PAGE_SIZE;
	const desktopRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

	renderDesktopTable(desktopRows);
	renderMobileCards(rows);
	renderDesktopPagination(rows);

	if (dom.resultCount) dom.resultCount.textContent = `${rows.length} record(s)`;
	if (dom.resultCountMobile) dom.resultCountMobile.textContent = `${rows.length} record(s)`;
};

const loadCashAdvances = () => {
	const request = ajax_loader('reports/ca_reports/api/get', { Take: 0 });

	request.done((response) => {
		const res = typeof response === 'string' ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') return;

		cashAdvances = (res.data || []).map(normalizeRow);
		refreshFilterOptions();
		refreshUI();
	}).fail(() => {
		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load cash advance report records.',
		});
	});
};

const resetFilters = () => {
	desktopPage = 1;
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	if (dom.filterDepartment) dom.filterDepartment.value = '';
	if (dom.filterCompany) dom.filterCompany.value = '';
	if (dom.filterEmployee) dom.filterEmployee.value = '';
	if (dom.filterStatus) dom.filterStatus.value = '';
	refreshUI();
};

const applyFilters = () => {
	desktopPage = 1;
	refreshUI();
};

const goToPath = (path) => {
	window.location.href = `${base_url}reports/${path}`;
};

const cacheDom = () => {
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterDepartment = document.getElementById('filterDepartment');
	dom.filterCompany = document.getElementById('filterCompany');
	dom.filterEmployee = document.getElementById('filterEmployee');
	dom.filterStatus = document.getElementById('filterStatus');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.btnReset = document.getElementById('btnReset');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	dom.cashAdvanceTable = document.getElementById('cashAdvanceTable');
	dom.cashAdvanceTbody = document.getElementById('cashAdvanceTbody');
	dom.cashAdvanceMobileList = document.getElementById('cashAdvanceMobileList');
};

const bindEvents = () => {
	if (dom.filterDepartment) dom.filterDepartment.addEventListener('change', applyFilters);
	if (dom.filterCompany) dom.filterCompany.addEventListener('change', applyFilters);
	if (dom.filterEmployee) dom.filterEmployee.addEventListener('change', applyFilters);
	if (dom.filterStatus) dom.filterStatus.addEventListener('change', applyFilters);
	if (dom.btnReset) dom.btnReset.addEventListener('click', resetFilters);

	if (dom.desktopPagination) {
		dom.desktopPagination.addEventListener('click', (event) => {
			const target = event.target.closest('a.page-link');
			if (!target) return;
			event.preventDefault();

			const rows = getFilteredRows();
			const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
			if (target.dataset.page) {
				desktopPage = Math.min(totalPages, Math.max(1, Number(target.dataset.page)));
				refreshUI();
				return;
			}

			if (target.dataset.action === 'prev' && desktopPage > 1) {
				desktopPage -= 1;
				refreshUI();
				return;
			}

			if (target.dataset.action === 'next' && desktopPage < totalPages) {
				desktopPage += 1;
				refreshUI();
			}
		});
	}

	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.addEventListener('click', () => {
			desktopPage += 1;
			refreshUI();
		});
	}

	if (dom.cashAdvanceTable) {
		dom.cashAdvanceTable.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-action="view"]');
			if (!button) return;
			goToPath(`ca_reports/view/${encodeURIComponent(button.getAttribute('data-ref'))}`);
		});
	}

	if (dom.cashAdvanceMobileList) {
		dom.cashAdvanceMobileList.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-action="view"]');
			if (!button) return;
			goToPath(`ca_reports/view/${encodeURIComponent(button.getAttribute('data-ref'))}`);
		});
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
	loadCashAdvances();
};

$(document).ready(() => {
	init();
});