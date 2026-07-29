let historyRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterType: null,
	filterStatus: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumCa: null,
	sumRmb: null,
	sumLqRpl: null,
	historyTbody: null,
	historyMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	historyTable: null,
	profileEmployee: null,
	profilePosition: null,
	profileDepartment: null,
	profileCompany: null,
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

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getTypeBadge = (type) => {
	const map = {
		CASH_ADVANCE: ['kna-badge-ca', 'Cash Advance'],
		REPLENISHMENT: ['kna-badge-rpl', 'Replenishment'],
		REIMBURSEMENT: ['kna-badge-rmb', 'Reimbursement'],
		LIQUIDATION: ['kna-badge-lq', 'Liquidation'],
	};
	const entry = map[type] || ['kna-badge-lq', type || '-'];
	return `<span class="kna-badge ${entry[0]}">${escapeHtml(entry[1])}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		transactionType: normalizeText(row.transaction_type),
		referenceNo: normalizeText(row.reference_no),
		amount: Number(row.amount) || 0,
		statusCode: normalizeText(row.status_code),
		statusName: normalizeText(row.status_name),
		description: normalizeText(row.description),
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		neededDate: toIsoDate(row.needed_date),
		employeeName: normalizeText(row.employee_name),
		companyName: normalizeText(row.company_name),
		departmentName: normalizeText(row.department_name),
		position: normalizeText(row.position),
		createdDate: toIsoDate(row.created_date),
		updatedDate: toIsoDate(row.updated_date),
	}));

const updateProfileStrip = (rows) => {
	const first = rows[0];
	if (dom.profileEmployee) dom.profileEmployee.textContent = first ? (first.employeeName || '-') : '-';
	if (dom.profilePosition) dom.profilePosition.textContent = first ? (first.position || '-') : '-';
	if (dom.profileDepartment) dom.profileDepartment.textContent = first ? (first.departmentName || '-') : '-';
	if (dom.profileCompany) dom.profileCompany.textContent = first ? (first.companyName || '-') : '-';
};

const loadHistory = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const request = ajax_loader('reports/my-transaction-history/api/get', { Take: 0 });

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		historyRows = normalizeApiRows(res.data);
		updateProfileStrip(historyRows);
		refreshUI();
	}).fail(() => {
		historyRows = [];
		refreshUI();

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load transaction history.',
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
	const type = normalizeText(dom.filterType.value).trim();
	const status = normalizeText(dom.filterStatus.value).trim();

	if (type && row.transactionType !== type) {
		return false;
	}

	if (status && row.statusName !== status) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.referenceNo} ${row.description} ${row.costCenterName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.historyTbody.innerHTML = '';

	if (!rows.length) {
		dom.historyTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td style="white-space:nowrap;">${getTypeBadge(row.transactionType)}</td>
			<td class="font-weight-bold" style="white-space:nowrap;"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.description)}">${escapeHtml(row.description || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</td>
			<td class="text-right" style="white-space:nowrap;">${formatAmount(row.amount)}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.statusName || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.neededDate || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.createdDate || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.updatedDate || '-')}</td>
		`;
		dom.historyTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.historyMobileList.innerHTML = '';

	if (!rows.length) {
		dom.historyMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div>${getTypeBadge(row.transactionType)}</div>
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></div>
			</div>
			<div class="kna-small">${escapeHtml(row.description || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small font-weight-bold">${formatAmount(row.amount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Status</div>
				<div class="kna-small">${escapeHtml(row.statusName || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Needed Date</div>
				<div class="kna-small">${escapeHtml(row.neededDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created Date</div>
				<div class="kna-small">${escapeHtml(row.createdDate || '-')}</div>
			</div>
		`;
		dom.historyMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	dom.sumCa.textContent = String(rows.filter((r) => r.transactionType === 'CASH_ADVANCE').length);
	dom.sumRmb.textContent = String(rows.filter((r) => r.transactionType === 'REIMBURSEMENT').length);
	dom.sumLqRpl.textContent = String(rows.filter((r) => r.transactionType === 'LIQUIDATION' || r.transactionType === 'REPLENISHMENT').length);
};

const getFilteredRows = () => historyRows.filter(matchesFilters);

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
	dom.filterType.value = '';
	dom.filterStatus.value = '';
	refreshUI();
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const keyword = normalizeText(dom.filterKeyword.value).trim();
	const type = normalizeText(dom.filterType.value).trim();
	const status = normalizeText(dom.filterStatus.value).trim();

	if (keyword) params.set('Keyword', keyword);
	if (type) params.set('Type', type);
	if (status) params.set('Status', status);

	const query = params.toString();
	window.location.href = `${base_url}reports/my-transaction-history/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterType = document.getElementById('filterType');
	dom.filterStatus = document.getElementById('filterStatus');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumCa = document.getElementById('sumCa');
	dom.sumRmb = document.getElementById('sumRmb');
	dom.sumLqRpl = document.getElementById('sumLqRpl');
	dom.historyTbody = document.getElementById('historyTbody');
	dom.historyMobileList = document.getElementById('historyMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.historyTable = document.getElementById('historyTable');
	dom.profileEmployee = document.getElementById('profileEmployee');
	dom.profilePosition = document.getElementById('profilePosition');
	dom.profileDepartment = document.getElementById('profileDepartment');
	dom.profileCompany = document.getElementById('profileCompany');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterType.addEventListener('change', applyFilters);
	dom.filterStatus.addEventListener('change', applyFilters);
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

	const rowLinkHandler = (event) => {
		const link = event.target.closest('a.kna-row-link');
		if (!link) {
			return;
		}
		event.preventDefault();
		goToReference(link.dataset.ref);
	};

	if (dom.historyTable) {
		dom.historyTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.historyMobileList) {
		dom.historyMobileList.addEventListener('click', rowLinkHandler);
	}
};

const init = () => {
	cacheDom();
	bindEvents();
	loadHistory();
};

$(document).ready(() => {
	init();
});
