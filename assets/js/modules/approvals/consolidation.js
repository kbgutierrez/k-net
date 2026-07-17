let consolidationFlatRows = [];
let consolidationDateRangePicker = null;
let consolidationSelectedRefs = new Set();

const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const normalizeStr = (value) => (value ? String(value) : '');

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const formatDisplayDate = (value) => {
	const raw = normalizeStr(value).slice(0, 10);
	if (!raw) {
		return '—';
	}
	const date = new Date(`${raw}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		return escapeHtml(raw);
	}
	return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
};

const notify = (title, text, icon) => {
	if (typeof Swal !== 'undefined') {
		Swal.fire({ title, text, icon, confirmButtonText: 'OK' });
		return;
	}
	// eslint-disable-next-line no-alert
	alert(`${title}\n${text}`);
};

const confirmAction = (title, text) => {
	if (typeof Swal !== 'undefined') {
		return Swal.fire({
			title,
			text,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Yes, proceed',
			cancelButtonText: 'Cancel',
		}).then((result) => result.isConfirmed);
	}
	// eslint-disable-next-line no-alert
	return Promise.resolve(confirm(`${title}\n${text}`));
};

const loadSalesOffices = () => {
	ajax_loader('maintenance/approval-matrix/api/get/sales-offices', {})
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') return;
			const select = document.getElementById('filterSalesOffice');
			if (!select) return;
			(res.data || []).forEach((office) => {
				const opt = document.createElement('option');
				opt.value = office.SOffcCode || '';
				opt.textContent = `${office.SOffcCode || ''} - ${office.SoffcNm || ''}`;
				select.appendChild(opt);
			});
		});
};

const loadSalesDistricts = (officeCode) => {
	const districtSelect = document.getElementById('filterSalesDistrict');
	if (!districtSelect) return;

	districtSelect.innerHTML = '<option value="">All Sales Districts</option>';

	if (!officeCode) {
		districtSelect.disabled = true;
		return;
	}

	districtSelect.disabled = false;

	ajax_loader('maintenance/approval-matrix/api/get/sales-districts', { SOffcCode: officeCode })
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') return;
			(res.data || []).forEach((district) => {
				const opt = document.createElement('option');
				opt.value = district.SDstCode || '';
				opt.textContent = `${district.SDstCode || ''} - ${district.SDstNm || ''}`;
				districtSelect.appendChild(opt);
			});
		});
};

const buildCategories = (rows) => {
	const map = new Map();
	rows.forEach((row) => {
		const code = normalizeStr(row.expense_category);
		if (!code || map.has(code)) return;
		map.set(code, { code, name: normalizeStr(row.category_name) || code });
	});
	return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
};

const buildColumns = (rows) => {
	const map = new Map();
	rows.forEach((row) => {
		const refNo = normalizeStr(row.reimbursement_id);
		if (!refNo) return;

		if (!map.has(refNo)) {
			const filedBy = Number(row.filed_by || 0);
			const salesmanUserId = Number(row.salesman_user_id || 0);
			map.set(refNo, {
				reimbursementId: refNo,
				salesmanName: normalizeStr(row.salesman_name),
				filedByName: normalizeStr(row.filed_by_name),
				isProxy: Boolean(filedBy) && filedBy !== salesmanUserId,
				salesOfficeName: normalizeStr(row.sales_office_name),
				salesDistrictName: normalizeStr(row.sales_district_name),
				payableTo: normalizeStr(row.payable_to),
				createdDate: normalizeStr(row.created_date),
				amounts: new Map(),
			});
		}

		const column = map.get(refNo);
		const code = normalizeStr(row.expense_category);
		if (!code) return;
		const current = column.amounts.get(code) || 0;
		column.amounts.set(code, current + Number(row.amount || 0));
	});

	return Array.from(map.values()).sort((a, b) => a.salesmanName.localeCompare(b.salesmanName));
};

const renderPivot = () => {
	const thead = document.getElementById('pivotThead');
	const tbody = document.getElementById('pivotTbody');
	const tfoot = document.getElementById('pivotTfoot');
	const summary = document.getElementById('consolidationSummary');
	const btnApprove = document.getElementById('btnApproveSelected');
	if (!thead || !tbody || !tfoot) return;

	const categories = buildCategories(consolidationFlatRows);
	const columns = buildColumns(consolidationFlatRows);

	consolidationSelectedRefs = new Set(
		Array.from(consolidationSelectedRefs).filter((ref) => columns.some((c) => c.reimbursementId === ref))
	);

	if (summary) {
		summary.textContent = columns.length
			? `${columns.length} reimbursement${columns.length === 1 ? '' : 's'} pending your decision`
			: 'No reimbursements pending your decision for this period.';
	}

	if (!columns.length) {
		thead.innerHTML = '';
		tfoot.innerHTML = '';
		tbody.innerHTML = `
			<tr>
				<td class="text-center text-muted kna-small py-4">No data for the selected filters.</td>
			</tr>
		`;
		if (btnApprove) btnApprove.disabled = true;
		return;
	}

	thead.innerHTML = `
		<tr>
			<th class="kna-pivot-rowhead">GL Account (Expense Type)</th>
			${columns.map((col) => `
				<th>
					<div class="d-flex align-items-start" style="gap:.35rem;">
						<input type="checkbox" class="kna-col-checkbox" data-ref="${escapeHtml(col.reimbursementId)}" ${consolidationSelectedRefs.has(col.reimbursementId) ? 'checked' : ''}>
						<div>
							<span class="kna-pivot-col-name">${escapeHtml(col.salesmanName)}</span>
							<span class="kna-pivot-col-meta">${escapeHtml(col.reimbursementId)}</span>
							${col.isProxy ? `<span class="kna-badge-proxy">Filed by ${escapeHtml(col.filedByName)}</span>` : ''}
							<div class="kna-pivot-col-meta">${escapeHtml(col.salesDistrictName)}</div>
							<div class="kna-pivot-col-meta">${formatDisplayDate(col.createdDate)}</div>
							<a href="${base_url}transactions/approvals/review/${encodeURIComponent(col.reimbursementId)}" class="kna-small">View / Reject</a>
						</div>
					</div>
				</th>
			`).join('')}
			<th class="text-right">Row Total</th>
		</tr>
	`;

	tbody.innerHTML = categories.map((cat) => {
		const rowTotal = columns.reduce((sum, col) => sum + (col.amounts.get(cat.code) || 0), 0);
		return `
			<tr>
				<td class="kna-pivot-rowhead">${escapeHtml(cat.code)} - ${escapeHtml(cat.name)}</td>
				${columns.map((col) => `<td class="kna-pivot-amount">${formatPHP(col.amounts.get(cat.code) || 0)}</td>`).join('')}
				<td class="kna-pivot-amount"><strong>${formatPHP(rowTotal)}</strong></td>
			</tr>
		`;
	}).join('');

	const grandTotal = columns.reduce((sum, col) => {
		let colSum = 0;
		col.amounts.forEach((amount) => { colSum += amount; });
		return sum + colSum;
	}, 0);

	tfoot.innerHTML = `
		<tr>
			<td class="kna-pivot-rowhead">Column Total</td>
			${columns.map((col) => {
				let colSum = 0;
				col.amounts.forEach((amount) => { colSum += amount; });
				return `<td class="kna-pivot-amount">${formatPHP(colSum)}</td>`;
			}).join('')}
			<td class="kna-pivot-amount">${formatPHP(grandTotal)}</td>
		</tr>
	`;

	if (btnApprove) {
		btnApprove.disabled = consolidationSelectedRefs.size === 0;
	}
};

const loadPivot = () => {
	const selected = consolidationDateRangePicker ? consolidationDateRangePicker.selectedDates : [];
	if (selected.length !== 2) {
		notify('Period Required', 'Please select a complete date range before loading.', 'warning');
		return;
	}

	const toIso = (date) => {
		const y = date.getFullYear();
		const m = `${date.getMonth() + 1}`.padStart(2, '0');
		const d = `${date.getDate()}`.padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	const payload = {
		date_from: toIso(selected[0]),
		date_to: toIso(selected[1]),
		sales_office_code: document.getElementById('filterSalesOffice')?.value || '',
		sales_district_code: document.getElementById('filterSalesDistrict')?.value || '',
	};

	const summary = document.getElementById('consolidationSummary');
	if (summary) summary.textContent = 'Loading...';

	ajax_loader('transactions/approvals/api/get/consolidation-pivot', payload)
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				notify('Unable to Load', res.response || 'Something went wrong while loading Batch Approval.', 'error');
				return;
			}
			consolidationFlatRows = res.data || [];
			consolidationSelectedRefs = new Set();
			renderPivot();
		})
		.fail(() => {
			notify('Unable to Load', 'Something went wrong while loading Batch Approval. Please try again.', 'error');
		});
};

const approveSelected = () => {
	const refs = Array.from(consolidationSelectedRefs);
	if (!refs.length) return;

	confirmAction(
		'Approve Selected Reimbursements?',
		`This will approve ${refs.length} reimbursement${refs.length === 1 ? '' : 's'} and move ${refs.length === 1 ? 'it' : 'them'} to the next approval step.`
	).then((confirmed) => {
		if (!confirmed) return;

		ajax_loader('transactions/approvals/api/bulk-decision', { reference_numbers: refs })
			.done((response) => {
				const res = (typeof response === 'string') ? $.parseJSON(response) : response;
				if (res.status !== 'success') {
					notify('Unable to Process', res.response || 'Something went wrong while approving.', 'error');
					return;
				}

				const { approved = [], errors = [] } = res.data || {};

				if (errors.length) {
					notify(
						'Partially Completed',
						`${approved.length} approved. ${errors.length} could not be processed: ${errors.map((e) => e.reference_no).join(', ')}.`,
						'warning'
					);
				} else {
					notify('Approved', `${approved.length} reimbursement${approved.length === 1 ? '' : 's'} approved successfully.`, 'success');
				}

				loadPivot();
			})
			.fail(() => {
				notify('Unable to Process', 'Something went wrong while approving. Please try again.', 'error');
			});
	});
};

const initConsolidationPage = () => {
	const page = document.getElementById('consolidationPage');
	if (!page) return;

	loadSalesOffices();

	const officeSelect = document.getElementById('filterSalesOffice');
	if (officeSelect) {
		officeSelect.addEventListener('change', () => {
			loadSalesDistricts(officeSelect.value);
		});
	}

	const dateInput = document.getElementById('filterConsolidationDateRange');
	if (dateInput && typeof flatpickr !== 'undefined') {
		consolidationDateRangePicker = flatpickr(dateInput, {
			mode: 'range',
			dateFormat: 'Y-m-d',
			allowInput: true,
		});
	}

	const btnLoad = document.getElementById('btnLoadConsolidation');
	if (btnLoad) {
		btnLoad.addEventListener('click', loadPivot);
	}

	const btnReset = document.getElementById('btnResetConsolidationFilters');
	if (btnReset) {
		btnReset.addEventListener('click', () => {
			if (consolidationDateRangePicker) consolidationDateRangePicker.clear();
			if (officeSelect) officeSelect.value = '';
			loadSalesDistricts('');
			consolidationFlatRows = [];
			consolidationSelectedRefs = new Set();
			renderPivot();
		});
	}

	const btnApprove = document.getElementById('btnApproveSelected');
	if (btnApprove) {
		btnApprove.addEventListener('click', approveSelected);
	}

	const pivotTable = document.getElementById('pivotTable');
	if (pivotTable) {
		pivotTable.addEventListener('change', (event) => {
			const checkbox = event.target.closest('.kna-col-checkbox');
			if (!checkbox) return;
			const ref = checkbox.getAttribute('data-ref');
			if (!ref) return;
			if (checkbox.checked) {
				consolidationSelectedRefs.add(ref);
			} else {
				consolidationSelectedRefs.delete(ref);
			}
			const btnApproveSelected = document.getElementById('btnApproveSelected');
			if (btnApproveSelected) {
				btnApproveSelected.disabled = consolidationSelectedRefs.size === 0;
			}
		});
	}
};

$(document).ready(() => {
	initConsolidationPage();
});
