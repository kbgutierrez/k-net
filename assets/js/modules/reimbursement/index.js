let reimbursements = [];
let rbPage = 1;
const RB_PAGE_SIZE = 10;

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const parseDateRange = (rangeText) => {
	const value = normalizeDate(rangeText).trim();
	if (!value) {
		return { from: '', to: '' };
	}
	const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i);
	if (match) {
		return { from: match[1], to: match[2] };
	}
	return { from: '', to: '' };
};

const inAmountRange = (amount, range) => {
	if (!range) {
		return true;
	}
	const [min, max] = range.split('-').map(Number);
	const val = Number(amount || 0);
	return val >= min && val <= max;
};

const getStatusBadge = (status) => {
	if (status === 'Draft') {
		return '<span class="kna-badge kna-badge-draft">Draft</span>';
	}
	if (status === 'Approved') {
		return '<span class="kna-badge kna-badge-approved">Approved</span>';
	}
	if (status === 'Rejected') {
		return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	}
	return '<span class="kna-badge kna-badge-pending">Submitted</span>';
};

const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};

const cacheListDom = () => ({
	btnOpen: document.getElementById('btnOpenNewReimbursement'),
	filterDateRange: document.getElementById('filterDateRange'),
	filterStatus: document.getElementById('filterStatus'),
	filterAmountRange: document.getElementById('filterAmountRange'),
	btnReset: document.getElementById('btnReset'),
	tbody: document.getElementById('reimbursementTbody'),
	resultCount: document.getElementById('resultCount'),
	sumTotalReimbursement: document.getElementById('sumTotalReimbursement'),
	sumPendingReview: document.getElementById('sumPendingReview'),
	sumDraft: document.getElementById('sumDraft'),
	sumVat: document.getElementById('sumVat'),
	desktopPagination: document.getElementById('desktopPagination'),
});

const loadReimbursements = (onDone) => {
	ajax_loader('transactions/reimbursement/api/get/header', {})
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				reimbursements = [];
				onDone();
				return;
			}

			reimbursements = (res.data || []).map((row) => ({
				id: normalizeDate(row.id),
				reimbursementNo: normalizeDate(row.reimbursement_id),
				purpose: normalizeDate(row.purpose),
				totalAmount: Number(row.total_amount || 0),
				submittedDate: normalizeDate(row.submitted_date).slice(0, 10),
				statusCode: normalizeDate(row.status_code),
				status: normalizeDate(row.status_name),
				hasVat: Boolean(Number(row.has_vat || 0)),
			}));

			onDone();
		})
		.fail(() => {
			reimbursements = [];
			onDone();
		});
};

const getFilteredRows = (dom) => {
	const status = dom.filterStatus.value;
	const amountRange = dom.filterAmountRange.value;
	const range = parseDateRange(dom.filterDateRange.value);

	return reimbursements.filter((row) => {
		if (status && row.status !== status) {
			return false;
		}
		if (range.from && row.submittedDate < range.from) {
			return false;
		}
		if (range.to && row.submittedDate > range.to) {
			return false;
		}
		if (!inAmountRange(row.totalAmount, amountRange)) {
			return false;
		}
		return true;
	});
};

const renderSummary = (rows, dom) => {
	const totalAmount = rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const submittedAmount = rows
		.filter((row) => row.status === 'Submitted')
		.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const draftAmount = rows
		.filter((row) => row.status === 'Draft')
		.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
	const vatCount = rows.filter((row) => row.hasVat).length;

	dom.sumTotalReimbursement.textContent = formatPHP(totalAmount);
	dom.sumPendingReview.textContent = formatPHP(submittedAmount);
	dom.sumDraft.textContent = formatPHP(draftAmount);
	dom.sumVat.textContent = String(vatCount);
};

const renderTable = (rows, dom) => {
	if (!rows.length) {
		dom.tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No records found</td></tr>';
		return;
	}

	dom.tbody.innerHTML = rows.map((row) => {
		const isDraft = row.statusCode === 'RB_DRAFT' || row.status === 'Draft';
		const actionBtn = isDraft
			? `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-ref="${escapeHtml(row.reimbursementNo)}">Edit Draft</button>`
			: `<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-ref="${escapeHtml(row.reimbursementNo)}">View</button>`;

		return `
			<tr>
				<td>${escapeHtml(row.reimbursementNo)}</td>
				<td>${escapeHtml(row.purpose)}</td>
				<td class="text-right">${formatPHP(row.totalAmount)}</td>
				<td>${escapeHtml(row.submittedDate)}</td>
				<td>${row.hasVat ? 'Yes' : 'No'}</td>
				<td>${getStatusBadge(row.status)}</td>
				<td class="text-center">${actionBtn}</td>
			</tr>
		`;
	}).join('');
};

const renderPagination = (rows, dom) => {
	const totalPages = Math.max(1, Math.ceil(rows.length / RB_PAGE_SIZE));
	if (rbPage > totalPages) {
		rbPage = totalPages;
	}

	let html = `<li class="page-item ${rbPage <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page-action="prev">&lsaquo;</a></li>`;
	for (let i = 1; i <= totalPages; i += 1) {
		html += `<li class="page-item ${i === rbPage ? 'active' : ''}"><a class="page-link" href="#" data-page-action="page" data-page="${i}">${i}</a></li>`;
	}
	html += `<li class="page-item ${rbPage >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page-action="next">&rsaquo;</a></li>`;

	dom.desktopPagination.innerHTML = html;
};

const refreshList = (dom) => {
	const rows = getFilteredRows(dom);
	const start = (rbPage - 1) * RB_PAGE_SIZE;
	const pageRows = rows.slice(start, start + RB_PAGE_SIZE);
	renderSummary(rows, dom);
	renderTable(pageRows, dom);
	renderPagination(rows, dom);
	dom.resultCount.textContent = `${rows.length} record(s)`;
};

const initListPage = () => {
	const dom = cacheListDom();
	if (!dom.tbody) {
		return;
	}

	dom.btnOpen.addEventListener('click', () => goToPath('transactions/reimbursement/add'));
	dom.filterDateRange.addEventListener('input', () => { rbPage = 1; refreshList(dom); });
	dom.filterStatus.addEventListener('change', () => { rbPage = 1; refreshList(dom); });
	dom.filterAmountRange.addEventListener('change', () => { rbPage = 1; refreshList(dom); });

	dom.btnReset.addEventListener('click', () => {
		dom.filterDateRange.value = '';
		dom.filterStatus.value = '';
		dom.filterAmountRange.value = '';
		rbPage = 1;
		refreshList(dom);
	});

	dom.tbody.addEventListener('click', (event) => {
		const button = event.target.closest('[data-action]');
		if (!button) {
			return;
		}
		const action = button.getAttribute('data-action');
		const ref = button.getAttribute('data-ref');
		if (!ref) {
			return;
		}
		if (action === 'edit') {
			goToPath(`transactions/reimbursement/add/${encodeURIComponent(ref)}`);
			return;
		}
		goToPath(`transactions/reimbursement/view/${encodeURIComponent(ref)}`);
	});

	dom.desktopPagination.addEventListener('click', (event) => {
		const link = event.target.closest('[data-page-action]');
		if (!link) {
			return;
		}
		event.preventDefault();
		const action = link.getAttribute('data-page-action');
		const totalPages = Math.max(1, Math.ceil(getFilteredRows(dom).length / RB_PAGE_SIZE));
		if (action === 'prev' && rbPage > 1) {
			rbPage -= 1;
		} else if (action === 'next' && rbPage < totalPages) {
			rbPage += 1;
		} else if (action === 'page') {
			const next = Number(link.getAttribute('data-page'));
			if (next >= 1 && next <= totalPages) {
				rbPage = next;
			}
		}
		refreshList(dom);
	});

	loadReimbursements(() => refreshList(dom));
};

$(document).ready(() => {
	initListPage();
});
