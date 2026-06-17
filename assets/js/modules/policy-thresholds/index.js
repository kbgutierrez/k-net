const policyRows = [
	{ name: 'Block new CA when liquidation is rejected', appliesTo: 'Cash Advance', condition: 'Latest liquidation is Rejected', action: 'Block Submission', status: 'Active' },
	{ name: 'Remind pending approvers after 2 days', appliesTo: 'All Modules', condition: 'Request is pending for 2 days', action: 'Show Warning', status: 'Active' },
	{ name: 'Escalate pending approvals after 4 days', appliesTo: 'All Modules', condition: 'Request is pending for 4 days', action: 'Allow with Notice', status: 'Active' },
	{ name: 'Require finance review for reimbursements', appliesTo: 'Reimbursement', condition: 'Amount is above 3,000', action: 'Block Submission', status: 'Inactive' },
];

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const renderPolicies = () => {
	const tbody = document.getElementById('policyTbody');
	if (!tbody) {
		return;
	}

	tbody.innerHTML = policyRows.map((row) => {
		const status = row.status === 'Active'
			? '<span class="kna-toggle-on">Active</span>'
			: '<span class="kna-toggle-off">Inactive</span>';
		return `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.appliesTo)}</td><td>${escapeHtml(row.condition)}</td><td>${escapeHtml(row.action)}</td><td>${status}</td></tr>`;
	}).join('');
};

const createPolicy = () => {
	const name = document.getElementById('policyName');
	const appliesTo = document.getElementById('policyAppliesTo');
	const condition = document.getElementById('policyCondition');
	const action = document.getElementById('policyAction');
	const status = document.getElementById('policyStatus');
	if (!name || !appliesTo || !condition || !action || !status) {
		return;
	}

	if (!name.value.trim() || !condition.value.trim()) {
		Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please provide policy name and condition.' });
		return;
	}

	policyRows.unshift({
		name: name.value.trim(),
		appliesTo: appliesTo.value,
		condition: condition.value.trim(),
		action: action.value,
		status: status.value,
	});

	$('#modalPolicy').modal('hide');
	renderPolicies();
	Swal.fire({ icon: 'success', title: 'Policy Created', text: 'New policy rule added to mock list.' });
};

$(document).ready(() => {
	renderPolicies();
	const saveBtn = document.getElementById('btnSavePolicies');
	if (saveBtn) {
		saveBtn.addEventListener('click', () => {
			Swal.fire({ icon: 'success', title: 'Mock Save', text: 'Policy save is mocked for design validation.' });
		});
	}

	const newBtn = document.getElementById('btnNewPolicy');
	if (newBtn) {
		newBtn.addEventListener('click', () => {
			const name = document.getElementById('policyName');
			const condition = document.getElementById('policyCondition');
			if (name) name.value = '';
			if (condition) condition.value = '';
			$('#modalPolicy').modal('show');
		});
	}

	const createBtn = document.getElementById('btnCreatePolicy');
	if (createBtn) {
		createBtn.addEventListener('click', createPolicy);
	}
});
