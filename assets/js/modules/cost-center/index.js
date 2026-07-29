let costCenters = [];
let nextCursorId = null;
let hasMoreRows = false;
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterStatus: null,
	filterCategory: null,
	btnReset: null,
	sumTotal: null,
	sumActive: null,
	sumInactive: null,
	sumCategory: null,
	costCenterTbody: null,
	costCenterMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	btnLoadMoreMobile: null,
	costCenterTable: null,
	btnOpenNewCostCenter: null,
	btnSaveCostCenter: null,
	costCenterMode: null,
	costCenterId: null,
	costCenterCode: null,
	costCenterName: null,
	costCenterCategory: null,
	costCenterStatus: null,
	modalCostCenterLabel: null,
	viewCostCenterId: null,
	viewCostCenterCode: null,
	viewCostCenterName: null,
	viewCostCenterStatus: null,
	viewCostCenterCategory: null,
	viewCostCenterCreatedBy: null,
	viewCostCenterUpdatedBy: null,
	viewCostCenterCreatedDate: null,
	viewCostCenterUpdatedDate: null,
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

const getStatusBadge = (isActive) =>
	isActive
		? '<span class="kna-badge kna-badge-active">Active</span>'
		: '<span class="kna-badge kna-badge-inactive">Inactive</span>';

const getCategoryBadge = (cat) => {
	if (cat === 'SD') return '<span class="kna-badge kna-badge-sd">SD</span>';
	if (cat === 'GA') return '<span class="kna-badge kna-badge-ga">GA</span>';
	return `<span class="kna-badge kna-badge-inactive">${escapeHtml(cat || '-')}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		costCenterCode: normalizeText(row.cost_center_code),
		costCenterName: normalizeText(row.cost_center_name),
		category: normalizeText(row.category),
		isActive: Number(row.is_active) === 1,
		createdBy: normalizeText(row.created_by_name || row.created_by),
		updatedBy: normalizeText(row.updated_by_name || row.updated_by),
		createdDate: toIsoDate(row.created_date),
		updatedDate: toIsoDate(row.updated_date),
	}));

const updateLoadMoreButtons = () => {
	const show = hasMoreRows && !isLoadingRows;
	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.style.display = show ? 'inline-block' : 'none';
		dom.btnLoadMoreMobile.disabled = isLoadingRows;
	}
};

const loadCostCenters = (reset = false) => {
	if (isLoadingRows) {
		return null;
	}

	if (reset) {
		desktopPage = 1;
		nextCursorId = null;
		hasMoreRows = false;
		costCenters = [];
		refreshUI();
	}

	isLoadingRows = true;
	updateLoadMoreButtons();

	// Take: 0 asks the SP for the exact full result set (no artificial cap);
	// client-side handles filtering & paging from there.
	const payload = { Take: reset ? 0 : PAGE_SIZE };
	if (!reset && nextCursorId !== null) {
		payload.CursorId = nextCursorId;
	}

	const request = ajax_loader('maintenance/cost-center/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		const rows = normalizeApiRows(res.data);
		costCenters = reset ? rows : costCenters.concat(rows);

		const pagination = res.pagination || {};
		hasMoreRows = Boolean(pagination.hasMore);
		nextCursorId = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
			? Number(pagination.nextCursorId)
			: (rows.length ? rows[rows.length - 1].id : nextCursorId);

		refreshUI();
	}).fail(() => {
		if (reset) {
			costCenters = [];
			refreshUI();
		}

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load cost centers.',
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

	// Show a sliding window of page numbers around the current page
	// instead of every page — a 23-page list showing all 23 numbers
	// doesn't fit and isn't useful; centering the window keeps the
	// current page visible while paging through in either direction.
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
		const request = loadCostCenters(false);
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
	const status = normalizeText(dom.filterStatus.value).trim();
	const category = normalizeText(dom.filterCategory.value).trim();

	if (status !== '' && String(row.isActive ? 1 : 0) !== status) {
		return false;
	}

	if (category && row.category !== category) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.costCenterCode} ${row.costCenterName}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.costCenterTbody.innerHTML = '';

	if (!rows.length) {
		dom.costCenterTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="font-weight-bold" style="white-space:nowrap;">${escapeHtml(row.costCenterCode || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.costCenterName)}">${escapeHtml(row.costCenterName)}</td>
			<td style="white-space:nowrap;">${getCategoryBadge(row.category)}</td>
			<td style="white-space:nowrap;">${getStatusBadge(row.isActive)}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.createdBy || '-')}">${escapeHtml(row.createdBy || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.createdDate || '-')}</td>
			<td style="white-space:normal;overflow-wrap:break-word;" title="${escapeHtml(row.updatedBy || '-')}">${escapeHtml(row.updatedBy || '-')}</td>
			<td style="white-space:nowrap;">${escapeHtml(row.updatedDate || '-')}</td>
			<td class="text-center kna-actions">
				<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-id="${row.id}">View</button>
				<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${row.id}">Edit</button>
			</td>
		`;
		dom.costCenterTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.costCenterMobileList.innerHTML = '';

	if (!rows.length) {
		dom.costCenterMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.costCenterCode || '-')}</div>
				<div>${getStatusBadge(row.isActive)}</div>
			</div>
			<div class="kna-small font-weight-bold">${escapeHtml(row.costCenterName)}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Category</div>
				<div class="kna-small">${getCategoryBadge(row.category)}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created By</div>
				<div class="kna-small">${escapeHtml(row.createdBy || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created Date</div>
				<div class="kna-small">${escapeHtml(row.createdDate || '-')}</div>
			</div>
			<div class="d-flex mt-2" style="gap:6px;">
				<button type="button" class="btn btn-outline-primary btn-sm kna-small w-50" data-action="view" data-id="${row.id}">View</button>
				<button type="button" class="btn btn-outline-secondary btn-sm kna-small w-50" data-action="edit" data-id="${row.id}">Edit</button>
			</div>
		`;
		dom.costCenterMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	const total = rows.length;
	const active = rows.filter((row) => row.isActive).length;
	const inactive = rows.filter((row) => !row.isActive).length;
	const sd = rows.filter((row) => row.category === 'SD').length;
	const ga = rows.filter((row) => row.category === 'GA').length;

	dom.sumTotal.textContent = String(total);
	dom.sumActive.textContent = String(active);
	dom.sumInactive.textContent = String(inactive);
	if (dom.sumCategory) dom.sumCategory.textContent = `${sd} / ${ga}`;
};

const getFilteredRows = () => costCenters.filter(matchesFilters);

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
	refreshUI();
};

const resetFilters = () => {
	desktopPage = 1;
	dom.filterKeyword.value = '';
	dom.filterStatus.value = '';
	dom.filterCategory.value = '';
	refreshUI();
};

const findRowById = (id) => costCenters.find((row) => Number(row.id) === Number(id));

const openViewModal = (id) => {
	const row = findRowById(id);
	if (!row) {
		return;
	}

	dom.viewCostCenterId.textContent = row.id;
	dom.viewCostCenterCode.textContent = row.costCenterCode || '-';
	dom.viewCostCenterName.textContent = row.costCenterName || '-';
	dom.viewCostCenterStatus.innerHTML = getStatusBadge(row.isActive);
	dom.viewCostCenterCategory.innerHTML = getCategoryBadge(row.category);
	dom.viewCostCenterCreatedBy.textContent = row.createdBy || '-';
	dom.viewCostCenterUpdatedBy.textContent = row.updatedBy || '-';
	dom.viewCostCenterCreatedDate.textContent = row.createdDate || '-';
	dom.viewCostCenterUpdatedDate.textContent = row.updatedDate || '-';

	$('#modalViewCostCenter').modal('show');
};

const openCreateModal = () => {
	dom.costCenterMode.value = 'create';
	dom.costCenterId.value = '';
	dom.costCenterCode.value = '';
	dom.costCenterName.value = '';
	dom.costCenterCategory.value = 'SD';
	dom.costCenterStatus.value = '1';
	dom.modalCostCenterLabel.textContent = 'New Cost Center';
	$('#modalCostCenter').modal('show');
};

const openEditModal = (id) => {
	const row = findRowById(id);
	if (!row) {
		return;
	}

	dom.costCenterMode.value = 'edit';
	dom.costCenterId.value = String(row.id);
	dom.costCenterCode.value = row.costCenterCode;
	dom.costCenterName.value = row.costCenterName;
	dom.costCenterCategory.value = row.category || 'SD';
	dom.costCenterStatus.value = row.isActive ? '1' : '0';
	dom.modalCostCenterLabel.textContent = 'Edit Cost Center';
	$('#modalCostCenter').modal('show');
};

const validateForm = () => {
	const costCenterCode = normalizeText(dom.costCenterCode.value).trim();
	const costCenterName = normalizeText(dom.costCenterName.value).trim();
	const category = normalizeText(dom.costCenterCategory.value).trim();

	if (!costCenterCode) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Cost center code is required.' });
		return false;
	}
	if (!costCenterName) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Cost center name is required.' });
		return false;
	}
	if (!category) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Category (SD/GA) is required.' });
		return false;
	}
	return true;
};

const saveCostCenter = () => {
	if (!validateForm()) {
		return;
	}

	const mode = normalizeText(dom.costCenterMode.value);
	const endpoint = mode === 'edit' ? 'maintenance/cost-center/api/update' : 'maintenance/cost-center/api/save';
	const payload = {
		CostCenterCode: normalizeText(dom.costCenterCode.value).trim(),
		CostCenterName: normalizeText(dom.costCenterName.value).trim(),
		Category: normalizeText(dom.costCenterCategory.value).trim(),
		IsActive: normalizeText(dom.costCenterStatus.value) === '1' ? 1 : 0,
	};

	if (mode === 'edit') {
		payload.Id = Number(dom.costCenterId.value || 0);
	}

	Swal.fire({
		icon: 'question',
		title: mode === 'edit' ? 'Confirm Update' : 'Confirm Save',
		text: mode === 'edit' ? 'Save changes to this cost center?' : 'Create this cost center?',
		showCancelButton: true,
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
		reverseButtons: true,
	}).then((result) => {
		if (!result.isConfirmed) {
			return;
		}

		ajax_loader(endpoint, payload).done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;

			if (res && res.status === 'success') {
				$('#modalCostCenter').modal('hide');
				Swal.fire({
					icon: 'success',
					title: 'Saved',
					text: res.response || 'Cost center saved successfully.',
				});
				loadCostCenters(true);
				return;
			}

			Swal.fire({
				icon: 'error',
				title: 'Failed',
				text: (res && res.response) ? res.response : 'Failed to save cost center.',
			});
		}).fail(() => {
			Swal.fire({
				icon: 'error',
				title: 'Request Failed',
				text: 'Could not connect to the server.',
			});
		});
	});
};

const cacheDom = () => {
	dom.filterKeyword = document.getElementById('filterKeyword');
	dom.filterStatus = document.getElementById('filterStatus');
	dom.filterCategory = document.getElementById('filterCategory');
	dom.btnReset = document.getElementById('btnReset');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumActive = document.getElementById('sumActive');
	dom.sumInactive = document.getElementById('sumInactive');
	dom.sumCategory = document.getElementById('sumCategory');
	dom.costCenterTbody = document.getElementById('costCenterTbody');
	dom.costCenterMobileList = document.getElementById('costCenterMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	dom.costCenterTable = document.getElementById('costCenterTable');
	dom.btnOpenNewCostCenter = document.getElementById('btnOpenNewCostCenter');
	dom.btnSaveCostCenter = document.getElementById('btnSaveCostCenter');
	dom.costCenterMode = document.getElementById('costCenterMode');
	dom.costCenterId = document.getElementById('costCenterId');
	dom.costCenterCode = document.getElementById('costCenterCode');
	dom.costCenterName = document.getElementById('costCenterName');
	dom.costCenterCategory = document.getElementById('costCenterCategory');
	dom.costCenterStatus = document.getElementById('costCenterStatus');
	dom.modalCostCenterLabel = document.getElementById('modalCostCenterLabel');

	dom.viewCostCenterId = document.getElementById('viewCostCenterId');
	dom.viewCostCenterCode = document.getElementById('viewCostCenterCode');
	dom.viewCostCenterName = document.getElementById('viewCostCenterName');
	dom.viewCostCenterStatus = document.getElementById('viewCostCenterStatus');
	dom.viewCostCenterCategory = document.getElementById('viewCostCenterCategory');
	dom.viewCostCenterCreatedBy = document.getElementById('viewCostCenterCreatedBy');
	dom.viewCostCenterUpdatedBy = document.getElementById('viewCostCenterUpdatedBy');
	dom.viewCostCenterCreatedDate = document.getElementById('viewCostCenterCreatedDate');
	dom.viewCostCenterUpdatedDate = document.getElementById('viewCostCenterUpdatedDate');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterStatus.addEventListener('change', applyFilters);
	dom.filterCategory.addEventListener('change', applyFilters);
	dom.btnReset.addEventListener('click', resetFilters);
	dom.btnOpenNewCostCenter.addEventListener('click', openCreateModal);
	dom.btnSaveCostCenter.addEventListener('click', saveCostCenter);

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
		dom.btnLoadMoreMobile.addEventListener('click', () => loadCostCenters(false));
	}

	if (dom.costCenterTable) {
		dom.costCenterTable.addEventListener('click', (event) => {
			const btn = event.target.closest('button[data-action]');
			if (!btn) {
				return;
			}

			const id = Number(btn.getAttribute('data-id'));
			const action = btn.getAttribute('data-action');
			if (action === 'view') {
				openViewModal(id);
			}
			if (action === 'edit') {
				openEditModal(id);
			}
		});
	}

	if (dom.costCenterMobileList) {
		dom.costCenterMobileList.addEventListener('click', (event) => {
			const btn = event.target.closest('button[data-action]');
			if (!btn) {
				return;
			}

			const id = Number(btn.getAttribute('data-id'));
			const action = btn.getAttribute('data-action');
			if (action === 'view') {
				openViewModal(id);
			}
			if (action === 'edit') {
				openEditModal(id);
			}
		});
	}
};

const init = () => {
	cacheDom();
	bindEvents();
	loadCostCenters(true);
};

$(document).ready(() => {
	init();
});
