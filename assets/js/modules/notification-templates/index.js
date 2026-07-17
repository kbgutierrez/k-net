let ntActiveTab = 'templates';

let allTemplateRows = [];
let templatesDesktopPage = 1;
const TEMPLATES_PAGE_SIZE = 10;

let logRows = [];
let logNextCursorId = null;
let logHasMoreRows = false;
let logIsLoading = false;

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const normalizeText = (value) => (value ? String(value) : '');

const formatDate = (value) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return escapeHtml(value);
	return date.toLocaleString('en-PH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getTransactionTypeLabel = (type) => {
	if (type === 'CASH_ADVANCE') return 'Cash Advance';
	if (type === 'LIQUIDATION') return 'Liquidation';
	if (type === 'REIMBURSEMENT') return 'Reimbursement';
	return 'All Types';
};

const statusBadge = (isActive) => (Number(isActive)
	? '<span class="kna-badge kna-badge-active">Active</span>'
	: '<span class="kna-badge kna-badge-inactive">Inactive</span>');

const sentStatusBadge = (status) => (String(status).toUpperCase() === 'SENT'
	? '<span class="kna-badge kna-badge-sent">Sent</span>'
	: '<span class="kna-badge kna-badge-failed">Failed</span>');

/* ─── Tabs ─── */
const switchNtTab = (tab) => {
	ntActiveTab = tab;
	document.querySelectorAll('.kna-tab[data-nt-tab]').forEach((el) => el.classList.remove('is-active'));
	const activeBtn = document.querySelector(`.kna-tab[data-nt-tab="${tab}"]`);
	if (activeBtn) activeBtn.classList.add('is-active');

	const panelTemplates = document.getElementById('ntPanelTemplates');
	const panelLog = document.getElementById('ntPanelLog');
	const btnNewTemplate = document.getElementById('btnNewTemplate');
	if (panelTemplates) panelTemplates.classList.toggle('d-none', tab !== 'templates');
	if (panelLog) panelLog.classList.toggle('d-none', tab !== 'log');
	if (btnNewTemplate) btnNewTemplate.style.display = tab === 'templates' ? '' : 'none';

	if (tab === 'log' && logRows.length === 0) {
		loadLog(true);
	}
};

/* ─── Templates tab ─── */
const renderTemplatesPagination = (rows) => {
	const pagination = document.getElementById('templatesPagination');
	if (!pagination) return;
	if (!rows.length) { pagination.innerHTML = ''; return; }

	const totalPages = Math.max(1, Math.ceil(rows.length / TEMPLATES_PAGE_SIZE));
	if (templatesDesktopPage > totalPages) templatesDesktopPage = totalPages;

	let links = '';
	for (let page = 1; page <= totalPages; page += 1) {
		links += `<li class="page-item ${page === templatesDesktopPage ? 'active' : ''}"><a class="page-link" href="#" data-action="page" data-page="${page}">${page}</a></li>`;
	}
	pagination.innerHTML = `
		<li class="page-item ${templatesDesktopPage > 1 ? '' : 'disabled'}"><a class="page-link" href="#" data-action="prev">&lsaquo;</a></li>
		${links}
		<li class="page-item ${templatesDesktopPage < totalPages ? '' : 'disabled'}"><a class="page-link" href="#" data-action="next">&rsaquo;</a></li>
	`;
};

const renderTemplateRows = () => {
	const tbodyMain = document.getElementById('templatesTbodyMain');
	const tbodyAction = document.getElementById('templatesTbodyAction');
	const resultCount = document.getElementById('templatesResultCount');
	if (!tbodyMain || !tbodyAction) return;

	if (resultCount) resultCount.textContent = `${allTemplateRows.length} record(s)`;

	if (!allTemplateRows.length) {
		tbodyMain.innerHTML = '<tr><td colspan="5" class="text-center text-muted kna-small py-3">No templates found.</td></tr>';
		tbodyAction.innerHTML = '<tr><td></td></tr>';
		renderTemplatesPagination([]);
		return;
	}

	const start = (templatesDesktopPage - 1) * TEMPLATES_PAGE_SIZE;
	const pageRows = allTemplateRows.slice(start, start + TEMPLATES_PAGE_SIZE);

	tbodyMain.innerHTML = pageRows.map((row) => `
		<tr>
			<td>${escapeHtml(row.event_code)}</td>
			<td>${escapeHtml(getTransactionTypeLabel(row.transaction_type))}</td>
			<td>${escapeHtml(row.subject)}</td>
			<td>${statusBadge(row.is_active)}</td>
			<td>${formatDate(row.updated_date)}</td>
		</tr>
	`).join('');

	tbodyAction.innerHTML = pageRows.map((row) => `
		<tr><td><a class="btn btn-sm btn-outline-primary kna-small" href="${base_url}maintenance/notification-templates/edit/${row.id}">Edit</a></td></tr>
	`).join('');

	renderTemplatesPagination(allTemplateRows);
};

const loadTemplates = () => {
	ajax_loader('maintenance/notification-templates/api/get/header', { Take: 0 })
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			allTemplateRows = (res.status === 'success' ? (res.data || []) : []).map((row) => ({
				id: normalizeText(row.id),
				event_code: normalizeText(row.event_code),
				transaction_type: normalizeText(row.transaction_type),
				subject: normalizeText(row.subject),
				is_active: Number(row.is_active || 0),
				updated_date: normalizeText(row.updated_date),
			}));
			templatesDesktopPage = 1;
			renderTemplateRows();
		})
		.fail(() => { renderTemplateRows(); });
};

/* ─── Sent Log tab ─── */
const renderLogRows = () => {
	const tbodyMain = document.getElementById('logTbodyMain');
	const resultCount = document.getElementById('logResultCount');
	if (!tbodyMain) return;

	if (resultCount) resultCount.textContent = `${logRows.length} record(s) loaded`;

	if (!logRows.length) {
		tbodyMain.innerHTML = '<tr><td colspan="7" class="text-center text-muted kna-small py-3">No sent notifications yet.</td></tr>';
		return;
	}

	tbodyMain.innerHTML = logRows.map((row) => `
		<tr>
			<td>${escapeHtml(row.event_code)}</td>
			<td>${escapeHtml(row.reference_no || '—')}</td>
			<td>${escapeHtml(row.recipient_name || row.recipient_email)}<div class="text-muted">${escapeHtml(row.recipient_email)}</div></td>
			<td>${escapeHtml(row.subject || '—')}</td>
			<td>${sentStatusBadge(row.status)}</td>
			<td class="text-danger">${escapeHtml(row.error_message || '—')}</td>
			<td>${formatDate(row.sent_date)}</td>
		</tr>
	`).join('');
};

const loadLog = (reset = false) => {
	if (logIsLoading) return;
	if (reset) { logRows = []; logNextCursorId = null; logHasMoreRows = false; }

	logIsLoading = true;
	const payload = { Take: 50 };
	if (logNextCursorId !== null) payload.CursorId = logNextCursorId;

	ajax_loader('maintenance/notification-templates/api/get/log', payload)
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			logIsLoading = false;
			if (res.status !== 'success') { renderLogRows(); return; }

			const newRows = res.data || [];
			logRows = reset ? newRows : logRows.concat(newRows);

			const pagination = res.pagination || {};
			logHasMoreRows = Boolean(pagination.hasMore);
			logNextCursorId = logHasMoreRows ? (pagination.nextCursorId || null) : null;

			renderLogRows();
			renderLogLoadMore();
		})
		.fail(() => { logIsLoading = false; renderLogRows(); });
};

const renderLogLoadMore = () => {
	const pagination = document.getElementById('logPagination');
	if (!pagination) return;
	pagination.innerHTML = logHasMoreRows
		? '<li class="page-item"><a class="page-link" href="#" id="btnLoadMoreLog">Load More</a></li>'
		: '';
	const btn = document.getElementById('btnLoadMoreLog');
	if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); loadLog(false); });
};

/* ─── Init ─── */
const bindEvents = () => {
	document.querySelectorAll('.kna-tab[data-nt-tab]').forEach((btn) => {
		btn.addEventListener('click', () => switchNtTab(btn.getAttribute('data-nt-tab') || 'templates'));
	});

	const templatesPagination = document.getElementById('templatesPagination');
	if (templatesPagination) {
		templatesPagination.addEventListener('click', (event) => {
			const btn = event.target.closest('a[data-action]');
			if (!btn) return;
			event.preventDefault();
			const totalPages = Math.max(1, Math.ceil(allTemplateRows.length / TEMPLATES_PAGE_SIZE));
			if (btn.getAttribute('data-action') === 'prev') templatesDesktopPage = Math.max(1, templatesDesktopPage - 1);
			else if (btn.getAttribute('data-action') === 'next') templatesDesktopPage = Math.min(totalPages, templatesDesktopPage + 1);
			else templatesDesktopPage = Number(btn.getAttribute('data-page') || 1);
			renderTemplateRows();
		});
	}
};

$(document).ready(() => {
	bindEvents();
	loadTemplates();
});
