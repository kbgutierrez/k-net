let rplClaimable = [];
let rplSelectedIds = new Set();

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

const STATUS_BADGE_CLASS = {
	'Draft': 'kna-badge-draft',
	'Submitted': 'kna-badge-pending',
	'Pending Approval': 'kna-badge-pending',
	'Approved': 'kna-badge-approved',
	'Payment Advised - For Release': 'kna-badge-pending',
	'Completed': 'kna-badge-paid',
	'Rejected': 'kna-badge-rejected',
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
				<td>${row.reimbursementId}</td>
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

const loadReplenishmentList = () => {
	ajax_loader('transactions/replenishment/api/list', { Take: 20 }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			return;
		}
		const rows = res.data || [];
		const tbody = document.getElementById('replenishmentListTbody');
		if (!tbody) return;

		if (rows.length === 0) {
			tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted kna-small">No replenishment requests yet.</td></tr>';
			return;
		}

		tbody.innerHTML = rows.map((row) => {
			const statusName = normalizeDate(row.status_name);
			const badgeClass = STATUS_BADGE_CLASS[statusName] || 'kna-badge-draft';
			return `
				<tr>
					<td>${normalizeDate(row.replenishment_id)}</td>
					<td class="text-right">${formatPHP(row.total_amount)}</td>
					<td>${normalizeDate(row.created_date).slice(0, 10)}</td>
					<td><span class="kna-badge ${badgeClass}">${statusName}</span></td>
				</tr>
			`;
		}).join('');
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
		document.getElementById('rplRemarks').value = '';
		loadClaimable();
		loadReplenishmentList();
	}).fail(() => {
		alert('An error occurred while saving the replenishment request.');
	});
};

document.addEventListener('DOMContentLoaded', () => {
	if (!document.getElementById('claimableTable')) {
		return;
	}

	loadClaimable();
	loadReplenishmentList();

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

	document.getElementById('claimAll').addEventListener('change', (e) => {
		rplSelectedIds = e.target.checked ? new Set(rplClaimable.map((row) => row.reimbursementId)) : new Set();
		renderClaimable();
	});

	document.getElementById('btnSaveDraft').addEventListener('click', () => saveReplenishment('RPL_DRAFT'));
	document.getElementById('btnSubmitReplenishment').addEventListener('click', () => saveReplenishment('RPL_SUBMITTED'));
});
