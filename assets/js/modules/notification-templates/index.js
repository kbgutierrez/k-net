const templateRows = [
	{ code: 'NTF_CA_APPROVE', event: 'Cash Advance Approved', channel: 'Email + In-app', status: 'Active' },
	{ code: 'NTF_LQ_REJECT', event: 'Liquidation Rejected', channel: 'Email', status: 'Active' },
	{ code: 'NTF_RB_PENDING', event: 'Reimbursement Pending Approval', channel: 'In-app', status: 'Active' },
	{ code: 'NTF_APPROVAL_ESCALATE', event: 'Approval Escalation', channel: 'Email + In-app', status: 'Draft' },
];

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const renderTemplates = () => {
	const tbody = document.getElementById('templateTbody');
	if (!tbody) {
		return;
	}

	tbody.innerHTML = templateRows.map((row) => `
		<tr>
			<td>${escapeHtml(row.code)}</td>
			<td>${escapeHtml(row.event)}</td>
			<td>${escapeHtml(row.channel)}</td>
			<td>${escapeHtml(row.status)}</td>
			<td class="text-center"><button class="btn btn-sm btn-outline-primary">Edit</button></td>
		</tr>
	`).join('');
};

$(document).ready(() => {
	renderTemplates();
	const btn = document.getElementById('btnNewTemplate');
	if (btn) {
		btn.addEventListener('click', () => Swal.fire({ icon: 'info', title: 'Mock Action', text: 'Template creation is mocked.' }));
	}
});
