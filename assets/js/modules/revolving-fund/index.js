const rfData = {
	setup: [
		{ fundCode: 'RF-SF-01', scopeType: 'Department', scopeValue: 'Sales Force', opening: 50000, available: 38250, status: 'Active' },
		{ fundCode: 'RF-OPS-01', scopeType: 'Company', scopeValue: 'K-Net Main', opening: 30000, available: 25600, status: 'Active' },
	],
	assignment: [
		{ assigneeType: 'Person', assignee: 'Mila Ramos', fundCode: 'RF-SF-01', status: 'Active', effectiveDate: '2026-01-01' },
		{ assigneeType: 'Department', assignee: 'Operations', fundCode: 'RF-OPS-01', status: 'Active', effectiveDate: '2026-03-15' },
	],
	adjustment: [
		{ trxDate: '2026-05-27', fundCode: 'RF-SF-01', type: 'TOPUP', amount: 10000, remarks: 'Month-end replenishment' },
		{ trxDate: '2026-05-29', fundCode: 'RF-SF-01', type: 'ADJUSTMENT', amount: -500, remarks: 'Manual correction' },
	],
};

let activeTab = 'setup';

const formatPHP = (amount) => Number(amount || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const tableConfig = {
	setup: {
		headers: ['Fund Code', 'Scope Type', 'Scope Value', 'Opening Balance', 'Available Balance', 'Status'],
		row: (r) => `<td>${escapeHtml(r.fundCode)}</td><td>${escapeHtml(r.scopeType)}</td><td>${escapeHtml(r.scopeValue)}</td><td class="text-right">${formatPHP(r.opening)}</td><td class="text-right">${formatPHP(r.available)}</td><td>${escapeHtml(r.status)}</td>`,
		btn: 'Add Fund',
	},
	assignment: {
		headers: ['Assignee Type', 'Assignee', 'Fund Code', 'Status', 'Effective Date'],
		row: (r) => `<td>${escapeHtml(r.assigneeType)}</td><td>${escapeHtml(r.assignee)}</td><td>${escapeHtml(r.fundCode)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.effectiveDate)}</td>`,
		btn: 'Add Assignment',
	},
	adjustment: {
		headers: ['Date', 'Fund Code', 'Type', 'Amount', 'Remarks'],
		row: (r) => `<td>${escapeHtml(r.trxDate)}</td><td>${escapeHtml(r.fundCode)}</td><td>${escapeHtml(r.type)}</td><td class="text-right">${formatPHP(r.amount)}</td><td>${escapeHtml(r.remarks)}</td>`,
		btn: 'Add Adjustment',
	},
};

const formTemplate = {
	setup: () => `
		<div class="form-row">
			<div class="form-group col-md-6">
				<label class="kna-form-label kna-small">Fund Code</label>
				<input type="text" id="rfFundCode" class="form-control form-control-sm kna-small" placeholder="RF-SF-02">
			</div>
			<div class="form-group col-md-6">
				<label class="kna-form-label kna-small">Scope Type</label>
				<select id="rfScopeType" class="form-control form-control-sm kna-small">
					<option value="Person">Person</option>
					<option value="Department">Department</option>
					<option value="Company">Company</option>
				</select>
			</div>
		</div>
		<div class="form-row">
			<div class="form-group col-md-6">
				<label class="kna-form-label kna-small">Scope Value</label>
				<input type="text" id="rfScopeValue" class="form-control form-control-sm kna-small" placeholder="Sales Force">
			</div>
			<div class="form-group col-md-3">
				<label class="kna-form-label kna-small">Opening Balance</label>
				<input type="number" id="rfOpening" class="form-control form-control-sm kna-small" min="0" step="0.01" placeholder="0.00">
			</div>
			<div class="form-group col-md-3">
				<label class="kna-form-label kna-small">Status</label>
				<select id="rfStatus" class="form-control form-control-sm kna-small">
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
			</div>
		</div>
	`,
	assignment: () => `
		<div class="form-row">
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Assignee Type</label>
				<select id="rfAssigneeType" class="form-control form-control-sm kna-small">
					<option value="Person">Person</option>
					<option value="Department">Department</option>
					<option value="Company">Company</option>
				</select>
			</div>
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Assignee</label>
				<input type="text" id="rfAssignee" class="form-control form-control-sm kna-small" placeholder="Mila Ramos">
			</div>
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Fund Code</label>
				<input type="text" id="rfAssignFundCode" class="form-control form-control-sm kna-small" placeholder="RF-SF-01">
			</div>
		</div>
		<div class="form-row">
			<div class="form-group col-md-6">
				<label class="kna-form-label kna-small">Status</label>
				<select id="rfAssignStatus" class="form-control form-control-sm kna-small">
					<option value="Active">Active</option>
					<option value="Inactive">Inactive</option>
				</select>
			</div>
			<div class="form-group col-md-6">
				<label class="kna-form-label kna-small">Effective Date</label>
				<input type="date" id="rfEffectiveDate" class="form-control form-control-sm kna-small">
			</div>
		</div>
	`,
	adjustment: () => `
		<div class="form-row">
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Date</label>
				<input type="date" id="rfTrxDate" class="form-control form-control-sm kna-small">
			</div>
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Fund Code</label>
				<input type="text" id="rfAdjFundCode" class="form-control form-control-sm kna-small" placeholder="RF-SF-01">
			</div>
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Type</label>
				<select id="rfAdjType" class="form-control form-control-sm kna-small">
					<option value="TOPUP">TOPUP</option>
					<option value="ADJUSTMENT">ADJUSTMENT</option>
				</select>
			</div>
		</div>
		<div class="form-row">
			<div class="form-group col-md-4">
				<label class="kna-form-label kna-small">Amount</label>
				<input type="number" id="rfAdjAmount" class="form-control form-control-sm kna-small" step="0.01" placeholder="0.00">
			</div>
			<div class="form-group col-md-8">
				<label class="kna-form-label kna-small">Remarks</label>
				<input type="text" id="rfAdjRemarks" class="form-control form-control-sm kna-small" placeholder="Reason or note">
			</div>
		</div>
	`,
};

const render = () => {
	const cfg = tableConfig[activeTab];
	document.getElementById('rfHead').innerHTML = cfg.headers.map((h) => `<th>${h}</th>`).join('');
	document.getElementById('rfTbody').innerHTML = rfData[activeTab].map((r) => `<tr>${cfg.row(r)}</tr>`).join('');
	document.getElementById('btnRfAction').textContent = cfg.btn;
};

const setTodayIfEmpty = (id) => {
	const input = document.getElementById(id);
	if (!input || input.value) {
		return;
	}
	const today = new Date();
	const y = today.getFullYear();
	const m = `${today.getMonth() + 1}`.padStart(2, '0');
	const d = `${today.getDate()}`.padStart(2, '0');
	input.value = `${y}-${m}-${d}`;
};

const openActionModal = () => {
	const title = document.getElementById('rfModalTitle');
	const body = document.getElementById('rfModalBody');
	if (!title || !body) {
		return;
	}
	title.textContent = tableConfig[activeTab].btn;
	body.innerHTML = formTemplate[activeTab]();
	if (activeTab === 'assignment') {
		setTodayIfEmpty('rfEffectiveDate');
	}
	if (activeTab === 'adjustment') {
		setTodayIfEmpty('rfTrxDate');
	}
	$('#modalRfAction').modal('show');
};

const saveActiveTab = () => {
	if (activeTab === 'setup') {
		const fundCode = document.getElementById('rfFundCode');
		const scopeType = document.getElementById('rfScopeType');
		const scopeValue = document.getElementById('rfScopeValue');
		const opening = document.getElementById('rfOpening');
		const status = document.getElementById('rfStatus');
		if (!fundCode || !scopeType || !scopeValue || !opening || !status) return;
		if (!fundCode.value.trim() || !scopeValue.value.trim() || Number(opening.value || 0) < 0) {
			Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please complete setup fields.' });
			return;
		}
		rfData.setup.unshift({
			fundCode: fundCode.value.trim(),
			scopeType: scopeType.value,
			scopeValue: scopeValue.value.trim(),
			opening: Number(opening.value),
			available: Number(opening.value),
			status: status.value,
		});
	}

	if (activeTab === 'assignment') {
		const assigneeType = document.getElementById('rfAssigneeType');
		const assignee = document.getElementById('rfAssignee');
		const fundCode = document.getElementById('rfAssignFundCode');
		const status = document.getElementById('rfAssignStatus');
		const effectiveDate = document.getElementById('rfEffectiveDate');
		if (!assigneeType || !assignee || !fundCode || !status || !effectiveDate) return;
		if (!assignee.value.trim() || !fundCode.value.trim() || !effectiveDate.value) {
			Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please complete assignment fields.' });
			return;
		}
		rfData.assignment.unshift({
			assigneeType: assigneeType.value,
			assignee: assignee.value.trim(),
			fundCode: fundCode.value.trim(),
			status: status.value,
			effectiveDate: effectiveDate.value,
		});
	}

	if (activeTab === 'adjustment') {
		const trxDate = document.getElementById('rfTrxDate');
		const fundCode = document.getElementById('rfAdjFundCode');
		const type = document.getElementById('rfAdjType');
		const amount = document.getElementById('rfAdjAmount');
		const remarks = document.getElementById('rfAdjRemarks');
		if (!trxDate || !fundCode || !type || !amount || !remarks) return;
		if (!trxDate.value || !fundCode.value.trim() || !remarks.value.trim() || Number(amount.value || 0) === 0) {
			Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please complete adjustment fields.' });
			return;
		}
		rfData.adjustment.unshift({
			trxDate: trxDate.value,
			fundCode: fundCode.value.trim(),
			type: type.value,
			amount: Number(amount.value),
			remarks: remarks.value.trim(),
		});
	}

	$('#modalRfAction').modal('hide');
	render();
	Swal.fire({ icon: 'success', title: 'Saved', text: `${tableConfig[activeTab].btn} completed (mock).` });
};

$(document).ready(() => {
	render();
	document.querySelectorAll('[data-tab]').forEach((btn) => {
		btn.addEventListener('click', () => {
			activeTab = btn.getAttribute('data-tab');
			document.querySelectorAll('[data-tab]').forEach((x) => x.classList.remove('is-active'));
			btn.classList.add('is-active');
			render();
		});
	});

	document.getElementById('btnRfAction').addEventListener('click', () => {
		openActionModal();
	});

	const saveBtn = document.getElementById('btnSaveRf');
	if (saveBtn) {
		saveBtn.addEventListener('click', saveActiveTab);
	}
});
