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

const loadReplenishmentList = () => {
	ajax_loader('transactions/replenishment/api/list', { Take: 20 }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			return;
		}
		const rows = res.data || [];
		const tbody = document.getElementById('replenishmentListTbody');
		const resultCount = document.getElementById('resultCount');
		if (resultCount) resultCount.textContent = `${rows.length} record(s)`;
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

document.addEventListener('DOMContentLoaded', () => {
	if (!document.getElementById('replenishmentListTable')) {
		return;
	}

	loadReplenishmentList();

	const btnOpenNewReplenishment = document.getElementById('btnOpenNewReplenishment');
	if (btnOpenNewReplenishment) {
		btnOpenNewReplenishment.addEventListener('click', () => {
			goToPath('transactions/replenishment/add');
		});
	}
});
