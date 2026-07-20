const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeText = (value) => (value !== null && value !== undefined ? String(value) : '');

const escapeHtml = (value) => normalizeText(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

const STATUS_BADGE_CLASS = {
	'Draft': 'kna-badge-draft',
	'Submitted': 'kna-badge-pending',
	'Pending Approval': 'kna-badge-pending',
	'Approved': 'kna-badge-approved',
	'Payment Advised - For Release': 'kna-badge-pending',
	'Completed': 'kna-badge-paid',
	'Rejected': 'kna-badge-rejected',
};

const formatTimelineDate = (rawDate) => {
	if (!rawDate) return '-';
	const date = new Date(String(rawDate).replace(' ', 'T'));
	if (Number.isNaN(date.getTime())) return normalizeText(rawDate);
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	let hh = date.getHours();
	const ampm = hh >= 12 ? 'PM' : 'AM';
	hh = hh % 12;
	hh = hh ? hh : 12;
	const min = String(date.getMinutes()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd} ${String(hh).padStart(2, '0')}:${min}${ampm}`;
};

const ACTION_LABELS = {
	SAVED_DRAFT: 'saved a draft of the replenishment',
	SUBMITTED: 'submitted the replenishment',
	APPROVED: 'approved the replenishment',
	REJECTED: 'rejected the replenishment',
	RELEASED: 'released payment for the replenishment',
};

const renderHistoryTimeline = (auditTrail) => {
	const container = document.getElementById('viewTimeline');
	if (!container) return;

	if (!auditTrail || !auditTrail.length) {
		container.innerHTML = `
			<li class="kna-timeline-item">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">No history available</span>
				</div>
				<div class="kna-timeline-item-remarks">This request has no recorded history yet.</div>
			</li>
		`;
		return;
	}

	const sorted = [...auditTrail].sort((a, b) => {
		const da = new Date(normalizeText(a.created_date).replace(' ', 'T'));
		const db = new Date(normalizeText(b.created_date).replace(' ', 'T'));
		return da - db;
	});

	container.innerHTML = sorted.map((entry) => {
		const action = normalizeText(entry.action).toUpperCase();
		const actorName = normalizeText(entry.changed_by_name || 'Unknown User');
		const remarks = normalizeText(entry.remarks);
		const actionLabel = ACTION_LABELS[action] || action.toLowerCase().replace(/_/g, ' ');
		let text = `${escapeHtml(actorName)} ${escapeHtml(actionLabel)}`;
		if (remarks) text += ` &mdash; <em>"${escapeHtml(remarks)}"</em>`;

		return `
			<li class="kna-timeline-item">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">${escapeHtml(formatTimelineDate(entry.created_date))}</span>
				</div>
				<div class="kna-timeline-item-remarks">${text}</div>
			</li>
		`;
	}).join('');
};

const loadTimeline = () => {
	const refEl = document.getElementById('replenishmentRef');
	const ref = refEl ? refEl.value : '';
	if (!ref) return;

	ajax_loader('transactions/replenishment/api/timeline', { ReferenceNo: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			renderHistoryTimeline([]);
			return;
		}
		renderHistoryTimeline(res.data && res.data.audit_trail ? res.data.audit_trail : []);
	}).fail(() => renderHistoryTimeline([]));
};

const initHistoryModal = () => {
	const overlay = document.getElementById('historyModalOverlay');
	const closeBtn = document.getElementById('btnCloseHistory');
	const openBtn = document.getElementById('btnShowHistory');
	if (!overlay) return;
	const open = () => overlay.classList.remove('d-none');
	const close = () => overlay.classList.add('d-none');
	if (openBtn) openBtn.addEventListener('click', open);
	if (closeBtn) closeBtn.addEventListener('click', close);
	overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
};

const renderClaims = (details) => {
	const container = document.getElementById('viewClaims');
	if (!container) return;

	if (!details || !details.length) {
		container.innerHTML = '<div class="kna-small text-muted">No claims found.</div>';
		return;
	}

	const total = details.reduce((sum, row) => sum + Number(row.amount || 0), 0);

	const rows = details.map((row) => `
		<tr>
			<td>${escapeHtml(row.reimbursement_id)}</td>
			<td>${escapeHtml(row.description || '-')}</td>
			<td>${normalizeText(row.reimbursement_date).slice(0, 10)}</td>
			<td class="text-right">${formatPHP(row.amount)}</td>
		</tr>
	`).join('');

	container.innerHTML = `
		<div class="table-responsive">
			<table class="kna-claim-table" style="width:100%;">
				<thead>
					<tr>
						<th>Reimbursement No</th>
						<th>Description</th>
						<th>Paid Date</th>
						<th class="text-right">Amount</th>
					</tr>
				</thead>
				<tbody>${rows}</tbody>
				<tfoot>
					<tr>
						<td colspan="3">Total</td>
						<td class="text-right">${formatPHP(total)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	`;
};

const renderHeader = (header) => {
	const statusName = normalizeText(header.status_name);
	const badgeClass = STATUS_BADGE_CLASS[statusName] || 'kna-badge-draft';

	const setText = (id, value) => {
		const el = document.getElementById(id);
		if (el) el.textContent = value;
	};

	setText('viewReplenishmentNo', normalizeText(header.replenishment_id) || '-');
	setText('viewSubmittedDate', normalizeText(header.created_date).slice(0, 10) || '-');
	setText('viewFundCode', normalizeText(header.fund_code) || '-');
	setText('viewTotalAmount', formatPHP(header.total_amount));
	setText('viewRequestedBy', normalizeText(header.user_name) || '-');
	setText('viewRemarks', normalizeText(header.remarks) || 'No remarks');

	const statusEl = document.getElementById('viewStatus');
	if (statusEl) {
		statusEl.innerHTML = `<span class="kna-badge ${badgeClass}">${escapeHtml(statusName)}</span>`;
	}
};

const loadReplenishmentDetail = () => {
	const refEl = document.getElementById('replenishmentRef');
	const ref = refEl ? refEl.value : '';
	if (!ref) return;

	ajax_loader('transactions/replenishment/api/get', { ReplenishmentId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			return;
		}
		renderHeader(res.data.header || {});
		renderClaims(res.data.details || []);
	});
};

document.addEventListener('DOMContentLoaded', () => {
	if (!document.getElementById('replenishmentRef')) {
		return;
	}

	initHistoryModal();
	loadReplenishmentDetail();
	loadTimeline();
});
