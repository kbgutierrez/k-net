let expenseTypes = [];
let nextCursorId = null;
let hasMoreRows = false;
let isLoadingRows = false;
let desktopPage = 1;
const PAGE_SIZE = 10;

const dom = {
	filterKeyword: null,
	filterStatus: null,
	btnReset: null,
	sumTotal: null,
	sumActive: null,
	sumInactive: null,
	expenseTypesTbody: null,
	expenseTypesMobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	btnLoadMoreMobile: null,
	expenseTypesTable: null,
	btnOpenNewExpenseType: null,
	btnSaveExpenseType: null,
	expenseTypeMode: null,
	expenseTypeId: null,
	expenseTypeCategoryName: null,
	expenseTypeDescription: null,
	expenseTypeStatus: null,
	modalExpenseTypeLabel: null,
	viewExpenseTypeId: null,
	viewExpenseTypeStatus: null,
	viewExpenseTypeCreatedBy: null,
	viewExpenseTypeUpdatedBy: null,
	viewExpenseTypeCategoryName: null,
	viewExpenseTypeDescription: null,
	viewExpenseTypeCreatedDate: null,
	viewExpenseTypeUpdatedDate: null,
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

const getStatusBadge = (statusCode, statusName) => {
	if (statusCode === 'CAT_ACTIVE') {
		return '<span class="kna-badge kna-badge-active">Active</span>';
	}
	if (statusCode === 'CAT_INACTIVE') {
		return '<span class="kna-badge kna-badge-inactive">Inactive</span>';
	}
	return `<span class="kna-badge kna-badge-inactive">${escapeHtml(statusName || statusCode || 'Unknown')}</span>`;
};

const normalizeApiRows = (rows) =>
	(rows || []).map((row) => ({
		id: Number(row.id),
		categoryName: normalizeText(row.category_name),
		description: normalizeText(row.description),
		createdBy: normalizeText(row.created_by_name || row.created_by),
		updatedBy: normalizeText(row.updated_by_name),
		createdDate: toIsoDate(row.created_date),
		updatedDate: toIsoDate(row.updated_date),
		statusCode: normalizeText(row.status),
		statusName: normalizeText(row.status_name),
	}));

const updateLoadMoreButtons = () => {
	const show = hasMoreRows && !isLoadingRows;
	if (dom.btnLoadMoreMobile) {
		dom.btnLoadMoreMobile.style.display = show ? 'inline-block' : 'none';
		dom.btnLoadMoreMobile.disabled = isLoadingRows;
	}
};

const loadExpenseTypes = (reset = false) => {
	if (isLoadingRows) {
		return null;
	}

	if (reset) {
		desktopPage = 1;
		nextCursorId = null;
		hasMoreRows = false;
		expenseTypes = [];
		refreshUI();
	}

	isLoadingRows = true;
	updateLoadMoreButtons();

	const payload = { Take: PAGE_SIZE };
	if (nextCursorId !== null) {
		payload.CursorId = nextCursorId;
	}

	const request = ajax_loader('maintenance/expense-types/api/get', payload);

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (!res || res.status !== 'success') {
			return;
		}

		const rows = normalizeApiRows(res.data);
		expenseTypes = reset ? rows : expenseTypes.concat(rows);

		const pagination = res.pagination || {};
		hasMoreRows = Boolean(pagination.hasMore);
		nextCursorId = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
			? Number(pagination.nextCursorId)
			: (rows.length ? rows[rows.length - 1].id : nextCursorId);

		refreshUI();
	}).fail(() => {
		if (reset) {
			expenseTypes = [];
			refreshUI();
		}

		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load expense types.',
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

const goToDesktopPage = (targetPage) => {
	if (targetPage < 1) {
		return;
	}

	const rows = getFilteredRows();
	const loadedPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

	if (targetPage <= loadedPages) {
		desktopPage = targetPage;
		refreshUI();
		return;
	}

	if (targetPage === loadedPages + 1 && hasMoreRows) {
		const request = loadExpenseTypes(false);
		if (request) {
			request.done(() => {
				desktopPage = targetPage;
				refreshUI();
			});
		}
	}
};

const matchesFilters = (row) => {
	const keyword = normalizeText(dom.filterKeyword.value).trim().toLowerCase();
	const status = normalizeText(dom.filterStatus.value).trim();

	if (status && row.statusCode !== status) {
		return false;
	}

	if (keyword) {
		const haystack = `${row.categoryName} ${row.description}`.toLowerCase();
		if (haystack.indexOf(keyword) === -1) {
			return false;
		}
	}

	return true;
};

const renderDesktopTable = (rows) => {
	dom.expenseTypesTbody.innerHTML = '';

	if (!rows.length) {
		dom.expenseTypesTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td class="text-truncate" style="max-width:200px;" title="${escapeHtml(row.categoryName)}">${escapeHtml(row.categoryName)}</td>
			<td class="text-truncate" style="max-width:420px;" title="${escapeHtml(row.description)}">${escapeHtml(row.description || '-')}</td>
			<td>${getStatusBadge(row.statusCode, row.statusName)}</td>
			<td class="text-truncate" style="max-width:140px;" title="${escapeHtml(row.createdBy || '-')}">${escapeHtml(row.createdBy || '-')}</td>
			<td>${escapeHtml(row.createdDate || '-')}</td>
			<td class="text-truncate" style="max-width:120px;" title="${escapeHtml(row.updatedBy || '-')}">${escapeHtml(row.updatedBy || '-')}</td>
			<td>${escapeHtml(row.updatedDate || '-')}</td>
			<td class="text-center kna-actions">
				<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-id="${row.id}">View</button>
				<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${row.id}">Edit</button>
			</td>
		`;
		dom.expenseTypesTbody.appendChild(tr);
	});
};

const renderMobileCards = (rows) => {
	dom.expenseTypesMobileList.innerHTML = '';

	if (!rows.length) {
		dom.expenseTypesMobileList.innerHTML = '<div class="kna-small text-center text-muted py-2">No records found</div>';
		return;
	}

	rows.forEach((row) => {
		const item = document.createElement('div');
		item.className = 'kna-item';
		item.innerHTML = `
			<div class="kna-row">
				<div class="kna-small font-weight-bold">${escapeHtml(row.categoryName)}</div>
				<div>${getStatusBadge(row.statusCode, row.statusName)}</div>
			</div>
			<div class="kna-small text-muted mb-1">${escapeHtml(row.description || '-')}</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created By</div>
				<div class="kna-small">${escapeHtml(row.createdBy || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Created Date</div>
				<div class="kna-small">${escapeHtml(row.createdDate || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Updated By</div>
				<div class="kna-small">${escapeHtml(row.updatedBy || '-')}</div>
			</div>
			<div class="kna-row">
				<div class="kna-small text-muted">Updated Date</div>
				<div class="kna-small">${escapeHtml(row.updatedDate || '-')}</div>
			</div>
			<div class="d-flex mt-2" style="gap:6px;">
				<button type="button" class="btn btn-outline-primary btn-sm kna-small w-50" data-action="view" data-id="${row.id}">View</button>
				<button type="button" class="btn btn-outline-secondary btn-sm kna-small w-50" data-action="edit" data-id="${row.id}">Edit</button>
			</div>
		`;
		dom.expenseTypesMobileList.appendChild(item);
	});
};

const renderSummary = (rows) => {
	const total = rows.length;
	const active = rows.filter((row) => row.statusCode === 'CAT_ACTIVE').length;
	const inactive = rows.filter((row) => row.statusCode === 'CAT_INACTIVE').length;

	dom.sumTotal.textContent = String(total);
	dom.sumActive.textContent = String(active);
	dom.sumInactive.textContent = String(inactive);
};

const getFilteredRows = () => expenseTypes.filter(matchesFilters);

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
	refreshUI();
};

const findRowById = (id) => expenseTypes.find((row) => Number(row.id) === Number(id));

const openViewModal = (id) => {
	const row = findRowById(id);
	if (!row) {
		return;
	}

	dom.viewExpenseTypeId.textContent = row.id;
	dom.viewExpenseTypeStatus.innerHTML = getStatusBadge(row.statusCode, row.statusName);
	dom.viewExpenseTypeCreatedBy.textContent = row.createdBy || '-';
	dom.viewExpenseTypeUpdatedBy.textContent = row.updatedBy || '-';
	dom.viewExpenseTypeCategoryName.textContent = row.categoryName || '-';
	dom.viewExpenseTypeDescription.textContent = row.description || '-';
	dom.viewExpenseTypeCreatedDate.textContent = row.createdDate || '-';
	dom.viewExpenseTypeUpdatedDate.textContent = row.updatedDate || '-';

	$('#modalViewExpenseType').modal('show');
};

const openCreateModal = () => {
	dom.expenseTypeMode.value = 'create';
	dom.expenseTypeId.value = '';
	dom.expenseTypeCategoryName.value = '';
	dom.expenseTypeDescription.value = '';
	dom.expenseTypeStatus.value = 'CAT_ACTIVE';
	dom.modalExpenseTypeLabel.textContent = 'New Expense Type';
	$('#modalExpenseType').modal('show');
};

const openEditModal = (id) => {
	const row = findRowById(id);
	if (!row) {
		return;
	}

	dom.expenseTypeMode.value = 'edit';
	dom.expenseTypeId.value = String(row.id);
	dom.expenseTypeCategoryName.value = row.categoryName;
	dom.expenseTypeDescription.value = row.description;
	dom.expenseTypeStatus.value = row.statusCode || 'CAT_ACTIVE';
	dom.modalExpenseTypeLabel.textContent = 'Edit Expense Type';
	$('#modalExpenseType').modal('show');
};

const validateForm = () => {
	const categoryName = normalizeText(dom.expenseTypeCategoryName.value).trim();
	if (!categoryName) {
		Swal.fire({
			icon: 'warning',
			title: 'Missing fields',
			text: 'Category name is required.',
		});
		return false;
	}
	return true;
};

const saveExpenseType = () => {
	if (!validateForm()) {
		return;
	}

	const mode = normalizeText(dom.expenseTypeMode.value);
	const endpoint = mode === 'edit' ? 'maintenance/expense-types/api/update' : 'maintenance/expense-types/api/save';
	const payload = {
		CategoryName: normalizeText(dom.expenseTypeCategoryName.value).trim(),
		Description: normalizeText(dom.expenseTypeDescription.value).trim(),
		Status: normalizeText(dom.expenseTypeStatus.value) || 'CAT_ACTIVE',
	};

	if (mode === 'edit') {
		payload.Id = Number(dom.expenseTypeId.value || 0);
	}

	Swal.fire({
		icon: 'question',
		title: mode === 'edit' ? 'Confirm Update' : 'Confirm Save',
		text: mode === 'edit' ? 'Save changes to this expense type?' : 'Create this expense type?',
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
				$('#modalExpenseType').modal('hide');
				Swal.fire({
					icon: 'success',
					title: 'Saved',
					text: res.response || 'Expense type saved successfully.',
				});
				loadExpenseTypes(true);
				return;
			}

			Swal.fire({
				icon: 'error',
				title: 'Failed',
				text: (res && res.response) ? res.response : 'Failed to save expense type.',
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
	dom.btnReset = document.getElementById('btnReset');
	dom.sumTotal = document.getElementById('sumTotal');
	dom.sumActive = document.getElementById('sumActive');
	dom.sumInactive = document.getElementById('sumInactive');
	dom.expenseTypesTbody = document.getElementById('expenseTypesTbody');
	dom.expenseTypesMobileList = document.getElementById('expenseTypesMobileList');
	dom.resultCount = document.getElementById('resultCount');
	dom.resultCountMobile = document.getElementById('resultCountMobile');
	dom.desktopPagination = document.getElementById('desktopPagination');
	dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
	dom.expenseTypesTable = document.getElementById('expenseTypesTable');
	dom.btnOpenNewExpenseType = document.getElementById('btnOpenNewExpenseType');
	dom.btnSaveExpenseType = document.getElementById('btnSaveExpenseType');
	dom.expenseTypeMode = document.getElementById('expenseTypeMode');
	dom.expenseTypeId = document.getElementById('expenseTypeId');
	dom.expenseTypeCategoryName = document.getElementById('expenseTypeCategoryName');
	dom.expenseTypeDescription = document.getElementById('expenseTypeDescription');
	dom.expenseTypeStatus = document.getElementById('expenseTypeStatus');
	dom.modalExpenseTypeLabel = document.getElementById('modalExpenseTypeLabel');

	dom.viewExpenseTypeId = document.getElementById('viewExpenseTypeId');
	dom.viewExpenseTypeStatus = document.getElementById('viewExpenseTypeStatus');
	dom.viewExpenseTypeCreatedBy = document.getElementById('viewExpenseTypeCreatedBy');
	dom.viewExpenseTypeUpdatedBy = document.getElementById('viewExpenseTypeUpdatedBy');
	dom.viewExpenseTypeCategoryName = document.getElementById('viewExpenseTypeCategoryName');
	dom.viewExpenseTypeDescription = document.getElementById('viewExpenseTypeDescription');
	dom.viewExpenseTypeCreatedDate = document.getElementById('viewExpenseTypeCreatedDate');
	dom.viewExpenseTypeUpdatedDate = document.getElementById('viewExpenseTypeUpdatedDate');
};

const bindEvents = () => {
	dom.filterKeyword.addEventListener('input', applyFilters);
	dom.filterStatus.addEventListener('change', applyFilters);
	dom.btnReset.addEventListener('click', resetFilters);
	dom.btnOpenNewExpenseType.addEventListener('click', openCreateModal);
	dom.btnSaveExpenseType.addEventListener('click', saveExpenseType);

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
		dom.btnLoadMoreMobile.addEventListener('click', () => loadExpenseTypes(false));
	}

	if (dom.expenseTypesTable) {
		dom.expenseTypesTable.addEventListener('click', (event) => {
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

	if (dom.expenseTypesMobileList) {
		dom.expenseTypesMobileList.addEventListener('click', (event) => {
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
	loadExpenseTypes(true);
};

$(document).ready(() => {
	init();
});
