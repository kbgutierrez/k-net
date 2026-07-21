let rplClaimable = [];
let rplSelectedIds = new Set();

const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

const escapeHtml = (value) => String(value === null || value === undefined ? '' : value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

const openRmbDetailModal = (referenceNo) => {
	const overlay = document.getElementById('rmbDetailModalOverlay');
	const body = document.getElementById('rmbDetailModalBody');
	if (!overlay || !body) return;

	overlay.classList.remove('d-none');
	body.innerHTML = '<div class="text-center kna-small text-muted py-3">Loading...</div>';

	ajax_loader('transactions/reimbursement/api/get/team-full', { ReimbursementId: referenceNo }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			body.innerHTML = `<div class="text-center kna-small text-danger py-3">${escapeHtml(res.response || 'Failed to load reimbursement details.')}</div>`;
			return;
		}

		const header = res.data.header || {};
		const details = Array.isArray(res.data.details) ? res.data.details : [];

		const itemRows = details.map((item) => `
			<tr>
				<td>${escapeHtml(item.description || '-')}</td>
				<td>${escapeHtml(item.invoice_receipt_no || '-')}</td>
				<td>${escapeHtml(normalizeDate(item.document_date).slice(0, 10) || '-')}</td>
				<td class="text-right">${formatPHP(item.approved_amount ?? item.actual_amount)}</td>
			</tr>
		`).join('') || '<tr><td colspan="4" class="text-center text-muted">No expense items found.</td></tr>';

		body.innerHTML = `
			<div class="kna-info-row">
				<div>
					<div class="kna-form-label-sm">Reimbursement No</div>
					<div class="kna-readonly-value">${escapeHtml(header.reimbursement_id || referenceNo)}</div>
				</div>
				<div>
					<div class="kna-form-label-sm">Filed By</div>
					<div class="kna-readonly-value">${escapeHtml(header.user_name || '-')}</div>
				</div>
				<div>
					<div class="kna-form-label-sm">Total Amount</div>
					<div class="kna-readonly-value">${formatPHP(header.total_amount)}</div>
				</div>
			</div>
			<div class="kna-info-row">
				<div style="grid-column: 1 / -1;">
					<div class="kna-form-label-sm">Purpose / Description</div>
					<div class="kna-readonly-value">${escapeHtml(header.description || '-')}</div>
				</div>
			</div>
			<div class="kna-form-label-sm mb-1">Expense Items</div>
			<table class="kna-item-table" style="width:100%;">
				<thead>
					<tr>
						<th>Description</th>
						<th>Invoice/Receipt No</th>
						<th>Date</th>
						<th class="text-right">Amount</th>
					</tr>
				</thead>
				<tbody>${itemRows}</tbody>
			</table>
		`;
	}).fail(() => {
		body.innerHTML = '<div class="text-center kna-small text-danger py-3">Server error while fetching reimbursement details.</div>';
	});
};

const renderClaimable = () => {
	const tbody = document.getElementById('claimableTbody');
	if (!tbody) return;

	if (rplClaimable.length === 0) {
		tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted kna-small">No paid reimbursements available to claim.</td></tr>';
	} else {
		tbody.innerHTML = rplClaimable.map((row) => `
			<tr>
				<td><input type="checkbox" class="rpl-claim-checkbox" data-id="${row.reimbursementId}" data-amount="${row.totalAmount}" ${rplSelectedIds.has(row.reimbursementId) ? 'checked' : ''}></td>
				<td><a href="#" class="kna-rmb-link" data-view-rmb="${row.reimbursementId}">${row.reimbursementId}</a></td>
				<td>${row.salesman}</td>
				<td>${row.description}</td>
				<td class="text-right">${formatPHP(row.totalAmount)}</td>
			</tr>
		`).join('');
	}

	document.getElementById('claimableCount').textContent = `${rplClaimable.length} record(s)`;
	updateClaimedTotal();
};

const updateClaimedTotal = () => {
	const total = rplClaimable
		.filter((row) => rplSelectedIds.has(row.reimbursementId))
		.reduce((sum, row) => sum + row.totalAmount, 0);
	document.getElementById('claimedTotal').textContent = formatPHP(total);
};

const loadClaimable = () => {
	ajax_loader('transactions/replenishment/api/get/claimable', {}).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			return;
		}
		rplClaimable = (res.data || []).map((row) => ({
			reimbursementId: normalizeDate(row.reimbursement_id),
			salesman: normalizeDate(row.salesman),
			description: normalizeDate(row.description || ''),
			totalAmount: Number(row.total_amount || 0),
		}));
		rplSelectedIds = new Set();
		renderClaimable();
	});
};

const saveReplenishment = (statusCode) => {
	const ids = Array.from(rplSelectedIds);
	if (ids.length === 0) {
		alert('Select at least one paid reimbursement to claim.');
		return;
	}

	const payload = {
		ReimbursementIds: ids,
		Remarks: document.getElementById('rplRemarks').value.trim(),
		StatusCode: statusCode,
	};

	ajax_loader('transactions/replenishment/api/save', payload).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			alert(res.response || 'Failed to save replenishment request.');
			return;
		}
		goToPath('transactions/replenishment');
	}).fail(() => {
		alert('An error occurred while saving the replenishment request.');
	});
};

document.addEventListener('DOMContentLoaded', () => {
	if (!document.getElementById('claimableTable')) {
		return;
	}

	loadClaimable();

	document.getElementById('claimableTbody').addEventListener('change', (e) => {
		if (!e.target.classList.contains('rpl-claim-checkbox')) return;
		const id = e.target.getAttribute('data-id');
		if (e.target.checked) {
			rplSelectedIds.add(id);
		} else {
			rplSelectedIds.delete(id);
		}
		updateClaimedTotal();
	});

	document.getElementById('claimableTbody').addEventListener('click', (e) => {
		const link = e.target.closest('[data-view-rmb]');
		if (!link) return;
		e.preventDefault();
		openRmbDetailModal(link.getAttribute('data-view-rmb'));
	});

	const rmbDetailOverlay = document.getElementById('rmbDetailModalOverlay');
	const btnCloseRmbDetail = document.getElementById('btnCloseRmbDetail');
	if (rmbDetailOverlay) {
		rmbDetailOverlay.addEventListener('click', (e) => {
			if (e.target === rmbDetailOverlay) rmbDetailOverlay.classList.add('d-none');
		});
	}
	if (btnCloseRmbDetail) {
		btnCloseRmbDetail.addEventListener('click', () => rmbDetailOverlay.classList.add('d-none'));
	}

	document.getElementById('claimAll').addEventListener('change', (e) => {
		rplSelectedIds = e.target.checked ? new Set(rplClaimable.map((row) => row.reimbursementId)) : new Set();
		renderClaimable();
	});

	document.getElementById('btnSaveDraft').addEventListener('click', () => saveReplenishment('RPL_DRAFT'));
	document.getElementById('btnSubmitReplenishment').addEventListener('click', () => saveReplenishment('RPL_SUBMITTED'));
});
