let rplClaimable = [];
let rplSelectedIds = new Set();

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeDate = (value) => (value ? String(value) : '');

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

	document.getElementById('claimAll').addEventListener('change', (e) => {
		rplSelectedIds = e.target.checked ? new Set(rplClaimable.map((row) => row.reimbursementId)) : new Set();
		renderClaimable();
	});

	document.getElementById('btnSaveDraft').addEventListener('click', () => saveReplenishment('RPL_DRAFT'));
	document.getElementById('btnSubmitReplenishment').addEventListener('click', () => saveReplenishment('RPL_SUBMITTED'));
});
