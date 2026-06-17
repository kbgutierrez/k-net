const rbDetailDom = {
	ref: null,
	viewRbNo: null,
	viewRbDate: null,
	viewRbStatus: null,
	viewRbPurpose: null,
	viewRbRange: null,
	viewRbTotal: null,
	viewExpenseItems: null,
};

const rbDetailStatusBadge = (status) => {
	if (status === 'Draft') return '<span class="kna-badge kna-badge-draft">Draft</span>';
	if (status === 'Approved') return '<span class="kna-badge kna-badge-approved">Approved</span>';
	if (status === 'Rejected') return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	return '<span class="kna-badge kna-badge-pending">Submitted</span>';
};

const rbRenderDetailItems = (items) => {
	if (!rbDetailDom.viewExpenseItems) return;
	if (!items || !items.length) {
		rbDetailDom.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">No expense items found.</div>';
		return;
	}

	const rows = items.map((item, idx) => {
		const attachments = normalizeDate(item.attachment).split(',').map((x) => x.trim()).filter(Boolean);
		const attachmentText = attachments.length ? escapeHtml(attachments.join(', ')) : '—';
		return `
			<tr>
				<td>${idx + 1}</td>
				<td>${escapeHtml(normalizeDate(item.document_date).slice(0, 10))}</td>
				<td>${escapeHtml(normalizeDate(item.reference_no))}</td>
				<td class="text-right">${formatPHP(Number(item.actual_amount || 0))}</td>
				<td>${Number(item.is_vatable || 0) ? 'Yes' : 'No'}</td>
				<td>${attachmentText}</td>
				<td>${escapeHtml(normalizeDate(item.description))}</td>
			</tr>
		`;
	}).join('');

	const total = items.reduce((sum, item) => sum + Number(item.actual_amount || 0), 0);

	rbDetailDom.viewExpenseItems.innerHTML = `
		<table class="kna-exp-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Date</th>
					<th>Reference</th>
					<th class="text-right">Amount</th>
					<th>VAT</th>
					<th>Attachment</th>
					<th>Remarks</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
			<tfoot>
				<tr>
					<td colspan="3" class="text-right"><strong>Total</strong></td>
					<td class="text-right"><strong>${formatPHP(total)}</strong></td>
					<td colspan="3"></td>
				</tr>
			</tfoot>
		</table>
	`;
};

const rbInitDetail = () => {
	rbDetailDom.ref = document.getElementById('reimbursementRef');
	rbDetailDom.viewRbNo = document.getElementById('viewRbNo');
	rbDetailDom.viewRbDate = document.getElementById('viewRbDate');
	rbDetailDom.viewRbStatus = document.getElementById('viewRbStatus');
	rbDetailDom.viewRbPurpose = document.getElementById('viewRbPurpose');
	rbDetailDom.viewRbRange = document.getElementById('viewRbRange');
	rbDetailDom.viewRbTotal = document.getElementById('viewRbTotal');
	rbDetailDom.viewExpenseItems = document.getElementById('viewExpenseItems');

	if (!rbDetailDom.ref) {
		return;
	}
	const ref = normalizeDate(rbDetailDom.ref.value);
	if (!ref) {
		return;
	}

	ajax_loader('transactions/reimbursement/api/get/header', {}).done((response) => {
		const res = typeof response === 'string' ? $.parseJSON(response) : response;
		if (res.status !== 'success') return;
		const row = (res.data || []).find((x) => normalizeDate(x.id) === ref || normalizeDate(x.reimbursement_id) === ref);
		if (!row) return;

		rbDetailDom.viewRbNo.textContent = normalizeDate(row.reimbursement_id);
		rbDetailDom.viewRbDate.textContent = normalizeDate(row.submitted_date).slice(0, 10);
		rbDetailDom.viewRbStatus.innerHTML = rbDetailStatusBadge(normalizeDate(row.status_name));
		rbDetailDom.viewRbPurpose.textContent = normalizeDate(row.purpose) || '-';
		rbDetailDom.viewRbTotal.textContent = formatPHP(Number(row.total_amount || 0));
		rbDetailDom.viewRbRange.textContent = `${normalizeDate(row.expense_range_from || '').slice(0, 10)} to ${normalizeDate(row.expense_range_to || '').slice(0, 10)}`;
	});

	ajax_loader('transactions/reimbursement/api/get/details', { ReimbursementId: ref }).done((response) => {
		const res = typeof response === 'string' ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			rbDetailDom.viewExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
			return;
		}
		rbRenderDetailItems(res.data || []);
	});
};

$(document).ready(() => {
	rbInitDetail();
});
