const workflowRules = [
	{ module: 'CA', currentStage: 'Draft', action: 'Submit', nextStage: 'For Approval', condition: 'Required fields are complete' },
	{ module: 'CA', currentStage: 'For Approval', action: 'Approve', nextStage: 'Approved', condition: 'All required approvers completed' },
	{ module: 'LQ', currentStage: 'Submitted', action: 'Approve', nextStage: 'Approved', condition: 'Approval matrix has no pending approver' },
	{ module: 'LQ', currentStage: 'Submitted', action: 'Return for correction', nextStage: 'Needs Update', condition: 'Reviewer gives correction notes' },
	{ module: 'RB', currentStage: 'For Approval', action: 'Approve', nextStage: 'Approved', condition: 'Finance Manager approves request' },
];

let editIndex = -1;

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const renderRules = () => {
	const tbody = document.getElementById('rulesTbody');
	if (!tbody) {
		return;
	}

	tbody.innerHTML = workflowRules.map((rule, index) => `
		<tr>
			<td>${escapeHtml(rule.module)}</td>
			<td><span class="kna-tag">${escapeHtml(rule.currentStage)}</span></td>
			<td>${escapeHtml(rule.action)}</td>
			<td><span class="kna-tag">${escapeHtml(rule.nextStage)}</span></td>
			<td>${escapeHtml(rule.condition)}</td>
			<td class="text-center"><button class="btn btn-sm btn-outline-primary" data-action="edit" data-index="${index}">Edit</button></td>
		</tr>
	`).join('');
};

const resetRuleForm = () => {
	editIndex = -1;
	const title = document.getElementById('ruleModalTitle');
	if (title) {
		title.textContent = 'New Rule';
	}
	const defaults = {
		ruleModule: 'CA',
		ruleCurrent: '',
		ruleAction: '',
		ruleNext: '',
		ruleCondition: '',
	};
	Object.keys(defaults).forEach((id) => {
		const el = document.getElementById(id);
		if (el) {
			el.value = defaults[id];
		}
	});
};

const openEdit = (index) => {
	const rule = workflowRules[index];
	if (!rule) {
		return;
	}
	editIndex = index;
	const title = document.getElementById('ruleModalTitle');
	if (title) {
		title.textContent = 'Edit Rule';
	}
	const fieldMap = {
		ruleModule: rule.module,
		ruleCurrent: rule.currentStage,
		ruleAction: rule.action,
		ruleNext: rule.nextStage,
		ruleCondition: rule.condition,
	};
	Object.keys(fieldMap).forEach((id) => {
		const el = document.getElementById(id);
		if (el) {
			el.value = fieldMap[id];
		}
	});
	$('#modalRule').modal('show');
};

const saveRule = () => {
	const moduleEl = document.getElementById('ruleModule');
	const currentEl = document.getElementById('ruleCurrent');
	const actionEl = document.getElementById('ruleAction');
	const nextEl = document.getElementById('ruleNext');
	const conditionEl = document.getElementById('ruleCondition');
	if (!moduleEl || !currentEl || !actionEl || !nextEl || !conditionEl) {
		return;
	}

	if (!currentEl.value.trim() || !actionEl.value.trim() || !nextEl.value.trim() || !conditionEl.value.trim()) {
		Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please fill all fields before saving.' });
		return;
	}

	const payload = {
		module: moduleEl.value,
		currentStage: currentEl.value.trim(),
		action: actionEl.value.trim(),
		nextStage: nextEl.value.trim(),
		condition: conditionEl.value.trim(),
	};

	if (editIndex >= 0) {
		workflowRules[editIndex] = payload;
	} else {
		workflowRules.unshift(payload);
	}

	$('#modalRule').modal('hide');
	renderRules();
	resetRuleForm();
	Swal.fire({ icon: 'success', title: 'Saved', text: 'Workflow rule saved (mock).' });
};

$(document).ready(() => {
	renderRules();
	const btn = document.getElementById('btnAddRule');
	if (btn) {
		btn.addEventListener('click', () => {
			resetRuleForm();
			$('#modalRule').modal('show');
		});
	}

	const saveBtn = document.getElementById('btnSaveRule');
	if (saveBtn) {
		saveBtn.addEventListener('click', saveRule);
	}

	document.addEventListener('click', (e) => {
		const target = e.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		if (target.getAttribute('data-action') !== 'edit') {
			return;
		}
		const index = Number(target.getAttribute('data-index'));
		if (Number.isNaN(index)) {
			return;
		}
		openEdit(index);
	});
});
