let turnaroundRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterType: null,
	filterDateRange: null,
	filterDateRangePicker: null,
	filterAllApprovers: null,
	btnApply: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumAvgHours: null,
	sumAvgDays: null,
	sumMaxHours: null,
	turnaroundTbody: null,
	turnaroundMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	turnaroundTable: null,
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
const toIsoDateTime = (value) => normalizeText(value).slice(0, 16).replace('T', ' ');

const goToReference = (referenceNo) => {
	if (!referenceNo || typeof window.knetResolveTransactionRoute !== 'function') {
		return;
	}
	// This report can include decided items from other approvers when
	// viewing "All Approvers" — Approvals review scopes its data to the
	// CURRENT session user, so a manager clicking someone else's decided
	// row may land on an empty review page rather than an error; that's
	// an acceptable rough edge rather than blocking the drill-down entirely.
	window.location.href = `${base_url}${window.knetResolveTransactionRoute(referenceNo, true, false)}`;
};

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getTypeBadge = (type) => {
	const label = {
		CASH_ADVANCE: 'Cash Advance',
		REIMBURSEMENT: 'Reimbursement',
		LIQUIDATION: 'Liquidation',
	}[type] || (type || '-');
	return `<span class="kna-badge kna-badge-ok">${escapeHtml(label)}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		approvalHeaderId: Number(row.approval_header_id),
		approvalDetailId: Number(row.approval_detail_id),
		transactionType: normalizeText(row.transaction_type),
		referenceNo: normalizeText(row.reference_no),
		requesterName: normalizeText(row.requester_name),
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		approverName: normalizeText(row.approver_name),
		status: normalizeText(row.status),
		amount: Number(row.amount) || 0,
		submittedDate: toIsoDateTime(row.submitted_date),
		decidedDate: toIsoDateTime(row.decided_date),
		turnaroundHours: Number(row.turnaround_hours) || 0,
		turnaroundDays: Number(row.turnaround_days) || 0,
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

const buildServerFilters = () => {
	const payload = { Take: 0 };
	if (dom.filterAllApprovers.checked) {
		payload.AllApprovers = 1;
	}
	const range = parseDateRange();
	if (range.from) payload.DateFrom = range.from;
	if (range.to) payload.DateTo = range.to;
	return payload;
};

const loadTurnaround = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const request = ajax_loader('reports/approval-turnaround/api/get', buildServerFilters());

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		turnaroundRows = normalizeApiRows(res.data);
		desktopPage = 1;
		refreshUI();
	}).fail(() => {
		turnaroundRows = [];
		refreshUI();

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load approval turnaround data.',
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

	if (type && row.transactionType !== type) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.referenceNo} ${row.requesterName} ${row.costCenterName} ${row.approverName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.turnaroundTbody.innerHTML = '';

	if (!rows.length) {
		dom.turnaroundTbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No decided approvals found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${getTypeBadge(row.transactionType)}</td>
			<td class="font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.requesterName)}">${escapeHtml(row.requesterName || '-')}</td>
			<td style="max-width:170px;white-space:normal;word-break:break-word;" title="${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.approverName)}">${escapeHtml(row.approverName || '-')}</td>
			<td class="text-right">${formatAmount(row.amount)}</td>
			<td>${escapeHtml(row.status || '-')}</td>
			<td>${escapeHtml(row.submittedDate || '-')}</td>
			<td>${escapeHtml(row.decidedDate || '-')}</td>
			<td class="text-center">${row.turnaroundHours}</td>
			<td class="text-center">${row.turnaroundDays}</td>
		`;
		dom.turnaroundTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.turnaroundMobileList.innerHTML = '';

	if (!rows.length) {
		dom.turnaroundMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No decided approvals found</div>';
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
			<div class="kna-small">${escapeHtml(row.requesterName || '-')} &middot; ${escapeHtml(row.status || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Approver</div>
				<div class="kna-small">${escapeHtml(row.approverName || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small font-weight-bold">${formatAmount(row.amount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Submitted &rarr; Decided</div>
				<div class="kna-small">${escapeHtml(row.submittedDate || '-')} &rarr; ${escapeHtml(row.decidedDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Turnaround</div>
				<div class="kna-small">${row.turnaroundHours}h / ${row.turnaroundDays}d</div>
			</div>
		`;
		dom.turnaroundMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	if (!rows.length) {
		dom.sumAvgHours.textContent = '0';
		dom.sumAvgDays.textContent = '0';
		dom.sumMaxHours.textContent = '0';
		return;
	}

	const totalHours = rows.reduce((sum, r) => sum + r.turnaroundHours, 0);
	const totalDays = rows.reduce((sum, r) => sum + r.turnaroundDays, 0);
	const maxHours = rows.reduce((max, r) => Math.max(max, r.turnaroundHours), 0);

	dom.sumAvgHours.textContent = (totalHours / rows.length).toFixed(1);
	dom.sumAvgDays.textContent = (totalDays / rows.length).toFixed(1);
	dom.sumMaxHours.textContent = String(maxHours);
};

const getFilteredRows = () => turnaroundRows.filter(matchesFilters);

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

const applyClientFilters = () => {
	desktopPage = 1;
	refreshUI();
};

const applyServerFilters = () => {
	loadTurnaround();
};

const resetFilters = () => {
	desktopPage = 1;
	dom.filterKeyword.value = '';
	dom.filterType.value = '';
	if (dom.filterDateRangePicker) dom.filterDateRangePicker.clear();
	dom.filterAllApprovers.checked = false;
	loadTurnaround();
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const keyword = normalizeText(dom.filterKeyword.value).trim();
	const type = normalizeText(dom.filterType.value).trim();
	const range = parseDateRange();

	if (keyword) params.set('Keyword', keyword);
	if (type) params.set('Type', type);
	if (range.from) params.set('DateFrom', range.from);
	if (range.to) params.set('DateTo', range.to);
	if (dom.filterAllApprovers.checked) params.set('AllApprovers', '1');

	const query = params.toString();
	window.location.href = `${base_url}reports/approval-turnaround/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterType = document.getElementById('filterType');
	dom.filterDateRange = document.getElementById('filterDateRange');
	dom.filterAllApprovers = document.getElementById('filterAllApprovers');
	dom.btnApply = document.getElementById('btnApply');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumAvgHours = document.getElementById('sumAvgHours');
	dom.sumAvgDays = document.getElementById('sumAvgDays');
	dom.sumMaxHours = document.getElementById('sumMaxHours');
	dom.turnaroundTbody = document.getElementById('turnaroundTbody');
	dom.turnaroundMobileList = document.getElementById('turnaroundMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.turnaroundTable = document.getElementById('turnaroundTable');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyClientFilters);
	dom.filterType.addEventListener('change', applyClientFilters);
	dom.btnApply.addEventListener('click', applyServerFilters);
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

	if (dom.turnaroundTable) {
		dom.turnaroundTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.turnaroundMobileList) {
		dom.turnaroundMobileList.addEventListener('click', rowLinkHandler);
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
					applyServerFilters();
				}
			},
		});
	}

	bindEvents();
	loadTurnaround();
};

$(document).ready(() => {
	init();
});
