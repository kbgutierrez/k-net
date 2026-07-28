let gapRows = [];
let desktopPage = 1;
let isLoadingRows = false;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterTransactionType: null,
	filterCategory: null,
	btnReset: null,
	btnDownloadExcel: null,
	sumTotal: null,
	sumDepartments: null,
	sumTypes: null,
	gapTbody: null,
	gapMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
};

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value));

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const getCategoryBadge = (cat) => {
	if (cat === 'SD') return '<span class="kna-badge kna-badge-sd">SD</span>';
	if (cat === 'GA') return '<span class="kna-badge kna-badge-ga">GA</span>';
	return `<span class="kna-badge kna-badge-gap">${escapeHtml(cat || '-')}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		departmentId: Number(row.department_id),
		departmentCode: normalizeText(row.department_code),
		departmentName: normalizeText(row.department_name),
		shortName: normalizeText(row.short_name),
		category: normalizeText(row.category).trim(),
		transactionType: normalizeText(row.transaction_type),
	}));

const loadGaps = () => {
	if (isLoadingRows) {
		return null;
	}

	isLoadingRows = true;

	const request = ajax_loader('reports/approval-matrix-coverage/api/get', {});

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Load Failed', text: (res && res.response) || 'Could not load coverage gaps.' });
			return;
		}

		gapRows = normalizeApiRows(res.data);
		desktopPage = 1;
		refreshUI();
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Request Failed', text: 'Could not connect to the server.' });
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
	const transactionType = normalizeText(dom.filterTransactionType.value).trim();
	const category = normalizeText(dom.filterCategory.value).trim();

	if (transactionType !== '' && row.transactionType !== transactionType) {
		return false;
	}

	if (category !== '' && row.category !== category) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.departmentCode} ${row.departmentName} ${row.shortName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.gapTbody.innerHTML = '';

	if (!rows.length) {
		dom.gapTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No coverage gaps found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="font-weight-bold">${escapeHtml(row.departmentCode || '-')}</td>
			<td style="max-width:220px;white-space:normal;word-break:break-word;" title="${escapeHtml(row.departmentName)}">${escapeHtml(row.departmentName || '-')}</td>
			<td>${escapeHtml(row.shortName || '-')}</td>
			<td>${getCategoryBadge(row.category)}</td>
			<td><span class="kna-badge kna-badge-gap">${escapeHtml(row.transactionType || '-')}</span></td>
		`;
		dom.gapTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.gapMobileList.innerHTML = '';

	if (!rows.length) {
		dom.gapMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No coverage gaps found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.departmentCode || '-')}</div>
				<div>${getCategoryBadge(row.category)}</div>
			</div>
			<div class="kna-small font-weight-bold">${escapeHtml(row.departmentName)}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Uncovered Type</div>
				<div><span class="kna-badge kna-badge-gap">${escapeHtml(row.transactionType || '-')}</span></div>
			</div>
		`;
		dom.gapMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	dom.sumTotal.textContent = String(rows.length);
	dom.sumDepartments.textContent = String(new Set(rows.map((row) => row.departmentId)).size);
	dom.sumTypes.textContent = String(new Set(rows.map((row) => row.transactionType)).size);
};

const getFilteredRows = () => gapRows.filter(matchesFilters);

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
	dom.filterTransactionType.value = '';
	dom.filterCategory.value = '';
	refreshUI();
};

const downloadExcel = () => {
	const transactionType = normalizeText(dom.filterTransactionType.value).trim();
	const query = $.param({ TransactionType: transactionType });
	window.location.href = `${base_url}reports/approval-matrix-coverage/download/excel${query ? '?' + query : ''}`;
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterTransactionType = document.getElementById('filterTransactionType');
	dom.filterCategory = document.getElementById('filterCategory');
	dom.btnReset = document.getElementById('btnReset');
	dom.btnDownloadExcel = document.getElementById('btnDownloadExcel');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumDepartments = document.getElementById('sumDepartments');
	dom.sumTypes = document.getElementById('sumTypes');
	dom.gapTbody = document.getElementById('gapTbody');
	dom.gapMobileList = document.getElementById('gapMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterTransactionType.addEventListener('change', applyFilters);
	dom.filterCategory.addEventListener('change', applyFilters);
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
};

const init = () => {
	cacheDom();
	bindEvents();
	loadGaps();
};

$(document).ready(() => {
	init();
});
