let agingRows = [];
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterType: null,
	filterMinAging: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumOver7: null,
	sumOver14: null,
	sumOldest: null,
	agingTbody: null,
	agingMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	agingTable: null,
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
	window.location.href = `${base_url}${window.knetResolveTransactionRoute(referenceNo, true, true)}`;
};

const formatAmount = (value) => {
	const num = Number(value) || 0;
	return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getTypeBadge = (type) => {
	const map = {
		CASH_ADVANCE: ['kna-badge-ok', 'Cash Advance'],
		REIMBURSEMENT: ['kna-badge-warn', 'Reimbursement'],
		LIQUIDATION: ['kna-badge-danger', 'Liquidation'],
	};
	const entry = map[type] || ['kna-badge-ok', type || '-'];
	return `<span class="kna-badge ${entry[0]}">${escapeHtml(entry[1])}</span>`;
};

const getAgingBadge = (days) => {
	if (days >= 14) return `<span class="kna-badge kna-badge-danger">${days}</span>`;
	if (days >= 7) return `<span class="kna-badge kna-badge-warn">${days}</span>`;
	return `<span class="kna-badge kna-badge-ok">${days}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		approvalHeaderId: Number(row.approval_header_id),
		approvalDetailId: Number(row.approval_detail_id),
		transactionType: normalizeText(row.transaction_type),
		referenceNo: normalizeText(row.reference_no),
		requesterName: normalizeText(row.requester_name),
		department: normalizeText(row.department),
		costCenterId: normalizeText(row.cost_center_id),
		costCenterName: normalizeText(row.cost_center_name),
		approvalOrder: Number(row.approval_order) || 0,
		amount: Number(row.amount) || 0,
		submittedDate: toIsoDate(row.submitted_date),
		agingDays: Number(row.aging_days) || 0,
	}));

const loadAging = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const request = ajax_loader('reports/pending-approvals-aging/api/get', { Take: 0 });

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		agingRows = normalizeApiRows(res.data);
		refreshUI();
	}).fail(() => {
		agingRows = [];
		refreshUI();

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load pending approvals.',
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
	const minAgingRaw = normalizeText(dom.filterMinAging.value).trim();
	const minAging = minAgingRaw !== '' ? Number(minAgingRaw) : null;

	if (type && row.transactionType !== type) {
		return false;
	}

	if (minAging !== null && row.agingDays < minAging) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.referenceNo} ${row.requesterName} ${row.costCenterName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.agingTbody.innerHTML = '';

	if (!rows.length) {
		dom.agingTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No pending items found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${getTypeBadge(row.transactionType)}</td>
			<td class="font-weight-bold"><a href="#" class="kna-row-link" data-ref="${escapeHtml(row.referenceNo)}">${escapeHtml(row.referenceNo || '-')}</a></td>
			<td style="max-width:160px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.requesterName)}">${escapeHtml(row.requesterName || '-')}</td>
			<td style="max-width:150px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.department)}">${escapeHtml(row.department || '-')}</td>
			<td style="max-width:170px;white-space:normal;word-break:break-word;" title="${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</td>
			<td class="text-right">${formatAmount(row.amount)}</td>
			<td>${escapeHtml(row.submittedDate || '-')}</td>
			<td class="text-center">${getAgingBadge(row.agingDays)}</td>
		`;
		dom.agingTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.agingMobileList.innerHTML = '';

	if (!rows.length) {
		dom.agingMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No pending items found</div>';
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
			<div class="kna-small">${escapeHtml(row.requesterName || '-')} &middot; ${escapeHtml(row.department || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Cost Center</div>
				<div class="kna-small">${escapeHtml(window.knetFormatCodeName(row.costCenterId, row.costCenterName))}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Amount</div>
				<div class="kna-small font-weight-bold">${formatAmount(row.amount)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Submitted</div>
				<div class="kna-small">${escapeHtml(row.submittedDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Aging (Days)</div>
				<div>${getAgingBadge(row.agingDays)}</div>
			</div>
		`;
		dom.agingMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	dom.sumOver7.textContent = String(rows.filter((r) => r.agingDays >= 7).length);
	dom.sumOver14.textContent = String(rows.filter((r) => r.agingDays >= 14).length);
	const oldest = rows.reduce((max, r) => Math.max(max, r.agingDays), 0);
	dom.sumOldest.textContent = String(oldest);
};

const getFilteredRows = () => agingRows.filter(matchesFilters);

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
	dom.filterMinAging.value = '';
	refreshUI();
};

const downloadExcel = () => {
	const params = new URLSearchParams();
	const keyword = normalizeText(dom.filterKeyword.value).trim();
	const type = normalizeText(dom.filterType.value).trim();
	const minAging = normalizeText(dom.filterMinAging.value).trim();

	if (keyword) params.set('Keyword', keyword);
	if (type) params.set('Type', type);
	if (minAging) params.set('MinAgingDays', minAging);

	const query = params.toString();
	window.location.href = `${base_url}reports/pending-approvals-aging/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterType = document.getElementById('filterType');
	dom.filterMinAging = document.getElementById('filterMinAging');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumOver7 = document.getElementById('sumOver7');
	dom.sumOver14 = document.getElementById('sumOver14');
	dom.sumOldest = document.getElementById('sumOldest');
	dom.agingTbody = document.getElementById('agingTbody');
	dom.agingMobileList = document.getElementById('agingMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.agingTable = document.getElementById('agingTable');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterType.addEventListener('change', applyFilters);
	dom.filterMinAging.addEventListener('input', applyFilters);
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

	if (dom.agingTable) {
		dom.agingTable.addEventListener('click', rowLinkHandler);
	}
	if (dom.agingMobileList) {
		dom.agingMobileList.addEventListener('click', rowLinkHandler);
	}
};

const init = () => {
	cacheDom();
	bindEvents();
	loadAging();
};

$(document).ready(() => {
	init();
});
