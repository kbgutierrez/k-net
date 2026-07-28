let breakdownRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterDateRange: null,
	filterDateRangePicker: null,
	filterCategory: null,
	filterSource: null,
	btnApply: null,
	btnReset: null,
	btnExportExcel: null,
	sumTotal: null,
	sumRMB: null,
	sumLQ: null,
	breakdownTbody: null,
	breakdownMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	breakdownTable: null,
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

const getSourceBadge = (source) => {
	if (source === 'REIMBURSEMENT') return '<span class="kna-badge kna-badge-rmb">Reimbursement</span>';
	if (source === 'LIQUIDATION') return '<span class="kna-badge kna-badge-lq">Liquidation</span>';
	return escapeHtml(source || '-');
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		sourceModule: normalizeText(row.source_module),
		referenceNo: normalizeText(row.reference_no),
		expenseCategory: normalizeText(row.expense_category) || '(No GL Code)',
		categoryName: normalizeText(row.category_name) || 'Unassigned',
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		documentDate: toIsoDate(row.document_date),
		invoiceReceiptNo: normalizeText(row.invoice_receipt_no),
		actualAmount: Number(row.actual_amount || 0),
		netAmount: Number(row.net_amount || 0),
		vatAmount: Number(row.vat_amount || 0),
		approvedAmount: row.approved_amount !== null && row.approved_amount !== undefined ? Number(row.approved_amount) : null,
		vendorName: normalizeText(row.vendor_name),
		vendorTin: normalizeText(row.vendor_tin),
	}));

const populateCategoryFilter = (rows) => {
	const seen = new Map();
	rows.forEach((row) => {
		if (!seen.has(row.expenseCategory)) {
			seen.set(row.expenseCategory, row.categoryName);
		}
	});

	const current = dom.filterCategory.value;
	const options = ['<option value="">All GL Codes</option>'];
	Array.from(seen.entries())
		.sort((a, b) => a[1].localeCompare(b[1]))
		.forEach(([code, name]) => {
			options.push(`<option value="${escapeHtml(code)}">${escapeHtml(name)}</option>`);
		});
	dom.filterCategory.innerHTML = options.join('');
	dom.filterCategory.value = current;
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

const loadBreakdown = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const range = parseDateRange();
	const payload = {
		DateFrom: range.from,
		DateTo: range.to,
	};

	const request = ajax_loader('reports/gl-breakdown/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Load Failed', text: (res && res.response) ? res.response : 'Could not load report data.' });
			return;
		}

		breakdownRows = normalizeApiRows(res.data);
		populateCategoryFilter(breakdownRows);
		desktopPage = 1;
		refreshUI();
	}).fail(() => {
		breakdownRows = [];
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
	const category = normalizeText(dom.filterCategory.value).trim();
	const source = normalizeText(dom.filterSource.value).trim();

	if (category && row.expenseCategory !== category) {
		return false;
	}
	if (source && row.sourceModule !== source) {
		return false;
	}
	return true;
};

const renderDesktopTable = (rows) => {
	dom.breakdownTbody.innerHTML = '';

	if (!rows.length) {
		dom.breakdownTbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		const categoryDisplay = window.knetFormatCodeName(row.expenseCategory, row.categoryName);
		const costCenterDisplay = window.knetFormatCodeName(row.costCenterId, row.costCenterName);
		tr.innerHTML = `
			<td>${getSourceBadge(row.sourceModule)}</td>
			<td><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td style="max-width:220px;white-space:normal;word-break:break-word;" title="${escapeHtml(categoryDisplay)}">${escapeHtml(categoryDisplay)}</td>
			<td style="max-width:170px;white-space:normal;word-break:break-word;" title="${escapeHtml(costCenterDisplay)}">${escapeHtml(costCenterDisplay)}</td>
			<td>${escapeHtml(row.documentDate || '-')}</td>
			<td>${escapeHtml(row.invoiceReceiptNo || '-')}</td>
			<td class="text-right">${formatMoney(row.actualAmount)}</td>
			<td class="text-right">${formatMoney(row.netAmount)}</td>
			<td class="text-right">${formatMoney(row.vatAmount)}</td>
			<td style="max-width:180px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.vendorName)}">${escapeHtml(row.vendorName || '-')}</td>
			<td>${escapeHtml(row.vendorTin || '-')}</td>
		`;
		dom.breakdownTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.breakdownMobileList.innerHTML = '';

	if (!rows.length) {
		dom.breakdownMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></div>
				<div>${getSourceBadge(row.sourceModule)}</div>
			</div>
			<div class="kna-small font-weight-bold">${escapeHtml(window.knetFormatCodeName(row.expenseCategory, row.categoryName))}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Actual Amount</div>
				<div class="kna-small">${formatMoney(row.actualAmount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Document Date</div>
				<div class="kna-small">${escapeHtml(row.documentDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Invoice No.</div>
				<div class="kna-small">${escapeHtml(row.invoiceReceiptNo || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Vendor</div>
				<div class="kna-small">${escapeHtml(row.vendorName || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Vendor TIN</div>
				<div class="kna-small">${escapeHtml(row.vendorTin || '-')}</div>
			</div>
		`;
		dom.breakdownMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	let total = 0;
	let rmb = 0;
	let lq = 0;

	rows.forEach((row) => {
		total += row.actualAmount;
		if (row.sourceModule === 'REIMBURSEMENT') rmb += row.actualAmount;
		if (row.sourceModule === 'LIQUIDATION') lq += row.actualAmount;
	});

	dom.sumTotal.textContent = formatMoney(total);
	dom.sumRMB.textContent = formatMoney(rmb);
	dom.sumLQ.textContent = formatMoney(lq);
};

const getFilteredRows = () => breakdownRows.filter(matchesFilters);

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
	dom.filterCategory.value = '';
	dom.filterSource.value = '';
	loadBreakdown();
};

const exportExcel = () => {
	const params = new URLSearchParams();
	const range = parseDateRange();
	if (range.from) params.set('DateFrom', range.from);
	if (range.to) params.set('DateTo', range.to);
	window.location.href = `${base_url}reports/gl-breakdown/download/excel?${params.toString()}`;
};

const cacheDom = () => {
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterCategory = document.getElementById('filterCategory');
	dom.filterSource = document.getElementById('filterSource');
	dom.btnApply = document.getElementById('btnApply');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnExportExcel = document.getElementById('btnExportExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumRMB = document.getElementById('sumRMB');
	dom.sumLQ = document.getElementById('sumLQ');
	dom.breakdownTbody = document.getElementById('breakdownTbody');
	dom.breakdownMobileList = document.getElementById('breakdownMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.breakdownTable = document.getElementById('breakdownTable');
};

const bindEvents = () => {
	dom.filterCategory.addEventListener('change', applyFilters);
	dom.filterSource.addEventListener('change', applyFilters);
	dom.btnApply.addEventListener('click', loadBreakdown);
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

	if (dom.breakdownTable) {
		dom.breakdownTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.breakdownMobileList) {
		dom.breakdownMobileList.addEventListener('click', rowLinkHandler);
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
	loadBreakdown();
};

$(document).ready(() => {
	init();
});
