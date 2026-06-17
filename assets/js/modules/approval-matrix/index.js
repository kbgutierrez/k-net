let allMatrixRows = [];
let selectedTransactionType = 'ALL';
let matrixDesktopPage = 1;

const MATRIX_PAGE_SIZE = 10;

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const normalizeText = (value) => (value ? String(value) : '');

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const formatDate = (value) => {
	if (!value) {
		return '—';
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return escapeHtml(value);
	}
	return date.toLocaleString('en-PH', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const statusBadge = (isActive) => (Number(isActive)
	? '<span class="kna-badge kna-badge-active">Active</span>'
	: '<span class="kna-badge kna-badge-inactive">Inactive</span>');

const getTransactionTypeLabel = (type) => {
	if (type === 'CASH_ADVANCE') return 'Cash Advance';
	if (type === 'LIQUIDATION') return 'Liquidation';
	if (type === 'REIMBURSEMENT') return 'Reimbursement';
	return escapeHtml(normalizeText(type));
};

const normalizeRows = (rows) =>
	(rows || []).map((row) => ({
		id: normalizeText(row.id),
		matrix_name: normalizeText(row.matrix_name),
		transaction_type: normalizeText(row.transaction_type),
		department: normalizeText(row.department_name || row.department || ''),
		min_amount: Number(row.min_amount || 0),
		max_amount: Number(row.max_amount || 0),
		is_active: Number(row.is_active || 0),
		created_by: normalizeText(row.created_by_name || row.created_by || ''),
		created_date: normalizeText(row.created_date || ''),
		updated_by: normalizeText(row.updated_by_name || row.updated_by || ''),
		updated_date: normalizeText(row.updated_date || ''),
	}));

const getFilteredRows = () => (selectedTransactionType === 'ALL'
	? allMatrixRows
	: allMatrixRows.filter((row) => row.transaction_type === selectedTransactionType));

const setTableState = (message) => {
	const tbodyMain = document.getElementById('matrixTbodyMain');
	const tbodyAction = document.getElementById('matrixTbodyAction');
	const desktopPagination = document.getElementById('desktopPagination');
	const resultCount = document.getElementById('resultCount');
	if (tbodyMain) tbodyMain.innerHTML = `<tr><td colspan="9" class="text-center text-muted kna-small py-3">${escapeHtml(message)}</td></tr>`;
	if (tbodyAction) tbodyAction.innerHTML = '<tr><td></td></tr>';
	if (desktopPagination) desktopPagination.innerHTML = '';
	if (resultCount) resultCount.textContent = '0 record(s)';
};

const renderDesktopPagination = (rows) => {
	const desktopPagination = document.getElementById('desktopPagination');
	if (!desktopPagination) {
		return;
	}

	if (!rows.length) {
		desktopPagination.innerHTML = '';
		return;
	}

	const totalPages = Math.max(1, Math.ceil(rows.length / MATRIX_PAGE_SIZE));
	if (matrixDesktopPage > totalPages) {
		matrixDesktopPage = totalPages;
	}

	const canPrev = matrixDesktopPage > 1;
	const canNext = matrixDesktopPage < totalPages;

	let pageLinks = '';
	for (let page = 1; page <= totalPages; page += 1) {
		const active = page === matrixDesktopPage ? 'active' : '';
		pageLinks += `<li class="page-item ${active}"><a class="page-link" href="#" data-action="page" data-page="${page}">${page}</a></li>`;
	}

	desktopPagination.innerHTML = `
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
	const totalPages = Math.max(1, Math.ceil(rows.length / MATRIX_PAGE_SIZE));
	if (targetPage > totalPages) {
		return;
	}

	matrixDesktopPage = targetPage;
	renderRows();
};

const renderRows = () => {
	const tbodyMain = document.getElementById('matrixTbodyMain');
	const tbodyAction = document.getElementById('matrixTbodyAction');
	const resultCount = document.getElementById('resultCount');
	if (!tbodyMain || !tbodyAction) {
		return;
	}

	const rows = getFilteredRows();
	if (resultCount) {
		resultCount.textContent = `${rows.length} record(s)`;
	}

	if (!rows.length) {
		setTableState('No approval matrix records found.');
		return;
	}

	const startIndex = (matrixDesktopPage - 1) * MATRIX_PAGE_SIZE;
	const pageRows = rows.slice(startIndex, startIndex + MATRIX_PAGE_SIZE);

	tbodyMain.innerHTML = pageRows.map((row) => `
		<tr>
			<td>${escapeHtml(row.matrix_name)}</td>
			<td>${escapeHtml(getTransactionTypeLabel(row.transaction_type))}</td>
			<td>${escapeHtml(row.department)}</td>
			<td>${escapeHtml(formatAmount(row.min_amount))} - ${escapeHtml(formatAmount(row.max_amount))}</td>
			<td>${statusBadge(row.is_active)}</td>
			<td>${escapeHtml(row.created_by)}</td>
			<td>${escapeHtml(formatDate(row.created_date))}</td>
			<td>${escapeHtml(row.updated_by || '—')}</td>
			<td>${escapeHtml(formatDate(row.updated_date))}</td>
		</tr>
	`).join('');

	tbodyAction.innerHTML = pageRows.map((row) => `
		<tr>
			<td>
				<a class="btn btn-sm btn-outline-primary kna-small" href="${base_url}maintenance/approval-matrix/edit/${row.id}">Edit</a>
			</td>
		</tr>
	`).join('');

	renderDesktopPagination(rows);
};

const loadMatrices = () => {
	setTableState('Loading...');

	ajax_loader('maintenance/approval-matrix/api/get/header', {})
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				setTableState('No records found.');
				return;
			}
			allMatrixRows = normalizeRows(res.data || []);
			matrixDesktopPage = 1;
			renderRows();
		})
		.fail(() => {
			setTableState('No records found.');
		});
};

const bindEvents = () => {
	document.querySelectorAll('[data-transaction-type]').forEach((btn) => {
		btn.addEventListener('click', () => {
			selectedTransactionType = btn.getAttribute('data-transaction-type') || 'ALL';
			matrixDesktopPage = 1;
			document.querySelectorAll('[data-transaction-type]').forEach((el) => el.classList.remove('is-active'));
			btn.classList.add('is-active');
			renderRows();
		});
	});

	const desktopPagination = document.getElementById('desktopPagination');
	if (desktopPagination) {
		desktopPagination.addEventListener('click', (event) => {
			const btn = event.target.closest('a[data-action]');
			if (!btn) {
				return;
			}

			event.preventDefault();
			if (btn.getAttribute('data-action') === 'prev') {
				goToDesktopPage(matrixDesktopPage - 1);
				return;
			}
			if (btn.getAttribute('data-action') === 'next') {
				goToDesktopPage(matrixDesktopPage + 1);
				return;
			}

			const page = Number(btn.getAttribute('data-page') || 1);
			goToDesktopPage(page);
		});
	}
};

$(document).ready(() => {
	loadMatrices();
	bindEvents();
});
