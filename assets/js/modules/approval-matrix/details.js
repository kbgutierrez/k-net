let detailsApproverOptions = [];
let detailsDepartmentOptions = [];
let isRefreshingOptions = false;

const detailsDom = {
	matrixId: null,
	matrixName: null,
	transactionType: null,
	departmentId: null,
	minAmount: null,
	maxAmount: null,
	isActive: null,
	approverRows: null,
	btnAddApprover: null,
	btnSaveMatrix: null,
};

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const normalizeText = (value) => (value ? String(value).trim() : '');

const buildApproverSelectMarkup = (selectedId = '') => {
	const opts = ['<option value="">Select approver</option>'].concat(
		detailsApproverOptions.map((a) => {
			const val = escapeHtml(String(a.id));
			const label = escapeHtml(`${normalizeText(a.firstname)} ${normalizeText(a.lastname)} - ${normalizeText(a.designation)} (${normalizeText(a.department)})`);
			const sel = String(a.id) === String(selectedId) ? 'selected' : '';
			return `<option value="${val}" ${sel}>${label}</option>`;
		}),
	);
	return opts.join('');
};

const detailsApproverRowMarkup = (detail = {}) => {
	const approverId = String(detail.approver_id || '');
	const order = Number(detail.approval_order || 1);
	const type = String(detail.approval_type || 'SEQUENTIAL').toUpperCase() === 'PARALLEL' ? 'PARALLEL' : 'SEQUENTIAL';
	return `
		<div class="kna-approver-row" data-approver-row style="position: relative;">
			<div class="form-row align-items-end">
				<div class="form-group col-md-6 mb-1 select2-parent-container">
					<label class="kna-form-label kna-small">Approver</label>
					<select class="form-control form-control-sm kna-small js-approver-id">${buildApproverSelectMarkup(approverId)}</select>
				</div>
				<div class="form-group col-md-2 mb-1">
					<label class="kna-form-label kna-small">Order</label>
					<input type="number" min="1" class="form-control form-control-sm kna-small js-approver-order" value="${escapeHtml(String(order))}" readonly>
				</div>
				<div class="form-group col-md-3 mb-1">
					<label class="kna-form-label kna-small">Approval Type</label>
					<select class="form-control form-control-sm kna-small js-approver-type">
						<option value="SEQUENTIAL" ${type === 'SEQUENTIAL' ? 'selected' : ''}>Sequential</option>
						<option value="PARALLEL" ${type === 'PARALLEL' ? 'selected' : ''}>Parallel</option>
					</select>
				</div>
				<div class="form-group col-md-1 mb-1 text-right">
					<button type="button" class="btn btn-outline-danger btn-sm kna-small" data-remove-approver>&times;</button>
				</div>
			</div>
		</div>
	`;
};

const initApproverRowSelect2 = (rowEl) => {
	const $row = $(rowEl);
	
	$row.find('.js-approver-id').select2({ 
		width: '100%', 
		placeholder: 'Select approver',
		dropdownParent: $row.find('.select2-parent-container') 
	});
	
	$row.find('.js-approver-type').select2({ 
		width: '100%', 
		minimumResultsForSearch: Infinity,
		dropdownParent: $row 
	});
};

const getApproverRows = () => Array.from(document.querySelectorAll('[data-approver-row]'));
const getApprovalType = (row) => String($(row).find('.js-approver-type').val() || 'SEQUENTIAL').toUpperCase();

const renumberApproverOrders = () => {
	let currentLevel = 0;
	let previousApprovalType = 'SEQUENTIAL';
	getApproverRows().forEach((row, index) => {
		const orderInput = row.querySelector('.js-approver-order');
		const approvalType = getApprovalType(row);

		if (index === 0) {
			currentLevel = 1;
		} else if (approvalType === 'PARALLEL') {
			if (previousApprovalType !== 'PARALLEL') {
				currentLevel += 1;
			}
		} else {
			currentLevel += 1;
		}

		if (orderInput) {
			orderInput.value = String(currentLevel);
		}
		previousApprovalType = approvalType;
	});
};

const normalizeDuplicateApprovers = () => {
	const seen = new Set();
	getApproverRows().forEach((row) => {
		const select = row.querySelector('.js-approver-id');
		if (!select) return;
		const value = String(select.value || '');
		if (!value) return;

		if (seen.has(value)) {
			$(select).val(null).trigger('change.select2');
			return;
		}
		seen.add(value);
	});
};

const refreshApproverOptions = () => {
	if (isRefreshingOptions) return;
	isRefreshingOptions = true;

	normalizeDuplicateApprovers();

	const rows = getApproverRows();
	
	const selectedIds = rows
		.map((row) => String(row.querySelector('.js-approver-id')?.value || ''))
		.filter(Boolean);

	rows.forEach((row) => {
		const select = row.querySelector('.js-approver-id');
		if (!select) return;

		const currentValue = String(select.value || '');
		let hasChanges = false;

		Array.from(select.options).forEach((option) => {
			const optionValue = String(option.value || '');
			if (!optionValue) return;

			const shouldDisable = selectedIds.includes(optionValue) && optionValue !== currentValue;

			if (option.disabled !== shouldDisable) {
				option.disabled = shouldDisable;
				hasChanges = true;
			}
		});

		if (hasChanges) {
			$(select).trigger('change.select2');
		}
	});

	isRefreshingOptions = false;
};

const renderDetailsApproverRows = (details) => {
	if (!detailsDom.approverRows) {
		return;
	}
	const source = Array.isArray(details) && details.length ? details : [{}];
	detailsDom.approverRows.innerHTML = source.map((d) => detailsApproverRowMarkup(d)).join('');
	Array.from(detailsDom.approverRows.querySelectorAll('[data-approver-row]')).forEach((row) => {
		initApproverRowSelect2(row);
	});
	renumberApproverOrders();
	refreshApproverOptions();
};

const populateDetailsDepartmentSelect = (selectedId) => {
	if (!detailsDom.departmentId) {
		return;
	}
	detailsDom.departmentId.innerHTML = ['<option value="">Select department</option>'].concat(
		detailsDepartmentOptions.map((d) => {
			const sel = String(d.department_id) === String(selectedId) ? 'selected' : '';
			return `<option value="${escapeHtml(String(d.department_id))}" ${sel}>${escapeHtml(d.department)}</option>`;
		}),
	).join('');
	$(detailsDom.departmentId).select2({ width: '100%', placeholder: 'Select department' });
};

const loadApprovers = (onDone) => {
	ajax_loader('maintenance/approval-matrix/api/get/approvers', {})
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status === 'success') {
				detailsApproverOptions = res.data || [];
			}
			if (typeof onDone === 'function') {
				onDone();
			}
		})
		.fail(() => {
			if (typeof onDone === 'function') {
				onDone();
			}
		});
};

const loadDepartments = (onDone) => {
	ajax_loader('maintenance/approval-matrix/api/get/departments', {})
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status === 'success') {
				detailsDepartmentOptions = res.data || [];
			}
			if (typeof onDone === 'function') {
				onDone();
			}
		})
		.fail(() => {
			if (typeof onDone === 'function') {
				onDone();
			}
		});
};

const loadMatrixHeader = (matrixId) => {
	ajax_loader(`maintenance/approval-matrix/api/get/details/header/${matrixId}`, { MatrixId: matrixId })
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status !== 'success' || !res.data) {
				return;
			}
			const header = res.data;
			if (detailsDom.matrixName) detailsDom.matrixName.value = normalizeText(header.matrix_name);
			if (detailsDom.transactionType) detailsDom.transactionType.value = normalizeText(header.transaction_type) || 'CASH_ADVANCE';
			if (detailsDom.minAmount) detailsDom.minAmount.value = Number(header.min_amount || 0).toFixed(2);
			if (detailsDom.maxAmount) detailsDom.maxAmount.value = Number(header.max_amount || 0).toFixed(2);
			if (detailsDom.isActive) detailsDom.isActive.value = Number(header.is_active || 0) ? '1' : '0';
			
			populateDetailsDepartmentSelect(String(header.department_id || ''));
			
			// Re-init Select2 for header fields after values are set
			$(detailsDom.transactionType).select2({ width: '100%', minimumResultsForSearch: Infinity });
			$(detailsDom.isActive).select2({ width: '100%', minimumResultsForSearch: Infinity });
		});
};

const loadMatrixDetails = (matrixId) => {
	ajax_loader('maintenance/approval-matrix/api/get/details', { MatrixId: matrixId })
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (res.status === 'success') {
				renderDetailsApproverRows(res.data || []);
			}
		});
};

const collectApprovers = () => {
	const rows = Array.from(document.querySelectorAll('[data-approver-row]'));
	return rows.map((row) => ({
		approver_id: String($(row).find('.js-approver-id').val() || ''),
		approval_order: Number((row.querySelector('.js-approver-order') || {}).value || 0),
		approval_type: String($(row).find('.js-approver-type').val() || 'SEQUENTIAL'),
	})).filter((item) => item.approver_id && item.approval_order > 0);
};

const validateDetailsForm = (payload) => {
	if (!payload.matrix_name) {
		return 'Matrix name is required.';
	}
	if (!payload.transaction_type) {
		return 'Transaction type is required.';
	}
	if (!payload.department_id) {
		return 'Department is required.';
	}
	if (Number(payload.min_amount) > Number(payload.max_amount)) {
		return 'Min amount must be less than or equal to max amount.';
	}
	if (!payload.details.length) {
		return 'At least one approver is required.';
	}
	return '';
};

const saveChanges = () => {
	renumberApproverOrders();

	const matrixId = Number((detailsDom.matrixId && detailsDom.matrixId.value) || 0);

	const payload = {
		id: matrixId,
		matrix_name: normalizeText(detailsDom.matrixName.value),
		transaction_type: String(detailsDom.transactionType.value || ''),
		department_id: String(detailsDom.departmentId.value || ''),
		min_amount: Number(detailsDom.minAmount.value || 0),
		max_amount: Number(detailsDom.maxAmount.value || 0),
		is_active: Number((detailsDom.isActive && detailsDom.isActive.value) || 1),
		details: collectApprovers(),
	};

	const error = validateDetailsForm(payload);
	if (error) {
		Swal.fire({ icon: 'warning', title: 'Validation', text: error });
		return;
	}

	Swal.fire({
		icon: 'question',
		title: 'Confirm Update',
		text: 'Are you sure you want to update this approval matrix?',
		showCancelButton: true,
		confirmButtonText: 'Yes',
		cancelButtonText: 'No',
		reverseButtons: true,
	}).then((result) => {
		if (result.isConfirmed) {
			ajax_loader('maintenance/approval-matrix/api/update', payload)
				.done((response) => {
					const res = typeof response === 'string' ? $.parseJSON(response) : response;
					if (res.status === 'success') {
						Swal.fire({ icon: 'success', title: 'Updated', text: 'Approval matrix updated successfully.' })
							.then(() => {
								window.location.href = `${base_url}maintenance/approval-matrix`;
							});
					} else {
						Swal.fire({ icon: 'error', title: 'Error', text: res.response || 'Failed to update.' });
					}
				})
				.fail(() => {
					Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to update. Please try again.' });
				});
		}
	});
};

const cacheDetailsDom = () => {
	detailsDom.matrixId = document.getElementById('matrixId');
	detailsDom.matrixName = document.getElementById('matrixName');
	detailsDom.transactionType = document.getElementById('transactionType');
	detailsDom.departmentId = document.getElementById('departmentId');
	detailsDom.minAmount = document.getElementById('minAmount');
	detailsDom.maxAmount = document.getElementById('maxAmount');
	detailsDom.isActive = document.getElementById('isActive');
	detailsDom.approverRows = document.getElementById('approverRows');
	detailsDom.btnAddApprover = document.getElementById('btnAddApprover');
	detailsDom.btnSaveMatrix = document.getElementById('btnSaveMatrix');
};

const bindDetailsEvents = () => {
	if (detailsDom.btnAddApprover) {
		detailsDom.btnAddApprover.addEventListener('click', () => {
			if (!detailsDom.approverRows) {
				return;
			}
			detailsDom.approverRows.insertAdjacentHTML('beforeend', detailsApproverRowMarkup());
			const lastRow = detailsDom.approverRows.querySelector('[data-approver-row]:last-child');
			if (lastRow) {
				initApproverRowSelect2(lastRow);
				lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
			renumberApproverOrders();
			refreshApproverOptions();
		});
	}

	if (detailsDom.btnSaveMatrix) {
		detailsDom.btnSaveMatrix.addEventListener('click', saveChanges);
	}

	document.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement) || target.getAttribute('data-remove-approver') === null) {
			return;
		}
		const rows = document.querySelectorAll('[data-approver-row]');
		if (rows.length <= 1) {
			Swal.fire({ icon: 'warning', title: 'Required', text: 'At least one approver row is required.' });
			return;
		}
		const row = target.closest('[data-approver-row]');
		if (row) {
			// Explicitly unbind Select2 and nullify value BEFORE dropping the row from DOM
			const $approverSelect = $(row).find('.js-approver-id');
			const $typeSelect = $(row).find('.js-approver-type');
			
			if ($approverSelect.data('select2')) {
				$approverSelect.val(null).trigger('change.select2');
				$approverSelect.select2('destroy');
			}
			if ($typeSelect.data('select2')) {
				$typeSelect.select2('destroy');
			}

			row.remove();
			
			renumberApproverOrders();
			refreshApproverOptions();
		}
	});

	if (detailsDom.approverRows) {
		$(detailsDom.approverRows).on('change select2:select select2:clear', '.js-approver-type', () => {
			renumberApproverOrders();
		});

		$(detailsDom.approverRows).on('select2:select select2:clear', '.js-approver-id', function () {
			refreshApproverOptions();
			renumberApproverOrders();
		});
	}
};

$(document).ready(() => {
	cacheDetailsDom();
	bindDetailsEvents();

	const matrixId = Number((detailsDom.matrixId && detailsDom.matrixId.value) || 0);
	if (matrixId <= 0) {
		return;
	}

	// Load approvers and departments first, then load matrix data
	loadApprovers(() => {
		loadDepartments(() => {
			populateDetailsDepartmentSelect('');
			loadMatrixHeader(matrixId);
			loadMatrixDetails(matrixId);
		});
	});
});