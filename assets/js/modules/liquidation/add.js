
let expenseItems = [];
let expenseItemCounter = 0;

const domAdd = {
	liquidationRef: null,
	draftEditWindowDays: null,
	isEditMode: null,
	newCaRef: null,
	newCaAmount: null,
	newCaDate: null,
	newDateRange: null,
	newLiquidatedAmount: null,
	newVariance: null,
	newPurpose: null,
	btnAddExpenseItem: null,
	expenseItemsContainer: null,
	btnSaveDraftLiquidation: null,
	btnSaveNewLiquidation: null,
};

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
let liquidationReceiptOcr = null;
let currentLiquidationId = '';
let draftCanEdit = true;
let draftEditWindowDays = 7;
let draftAgeDays = 0;

let expenseTypeOptions = [];

const getExpenseTypeById = (idValue) =>
	expenseTypeOptions.find((item) => String(item.id) === String(idValue));

const expenseTypeOptionsMarkup = (selectedValue) =>
	`<option value="">Select type</option>${expenseTypeOptions
		.map((option) => {
			const id = normalizeDate(option.id);
			const categoryName = normalizeDate(option.categoryName);
			const description = normalizeDate(option.description);
			return `<option value="${escapeHtml(id)}" title="${escapeHtml(description)}" ${String(selectedValue) === String(id) ? 'selected' : ''}>${escapeHtml(categoryName)}</option>`;
		})
		.join('')}`;

const createExpenseItem = () => ({
	id: ++expenseItemCounter,
	documentDate: '',
	expenseType: '',
	reference: '',
	amount: '',
	isVattable: false,
	existingAttachments: [],
	attachments: [],
	remarks: '',
});

const findExpenseItem = (itemId) => expenseItems.find((item) => item.id === itemId);

const getAllAttachmentObjects = (item) => {
	const existing = (item.existingAttachments || []).map((name) => ({ name }));
	const current = item.attachments || [];
	return existing.concat(current);
};

const getAttachmentNamesCsv = (item) => {
	const existing = (item.existingAttachments || []).map((name) => normalizeDate(name)).filter(Boolean);
	return existing.join(',');
};

const getItemAmount = (item) => Number(item.amount || 0);

const updateTotalFromItems = () => {
	const total = expenseItems.reduce((sum, item) => sum + getItemAmount(item), 0);
	if (domAdd.newLiquidatedAmount) {
		domAdd.newLiquidatedAmount.textContent = formatPHP(total);
	}
	updateVarianceSummary();
};

const updateVarianceSummary = () => {
	if (!domAdd.newVariance) {
		return;
	}

	const cashAdvanceAmount = Number(domAdd.newCaAmount ? domAdd.newCaAmount.value : 0);
	const totalAmount = expenseItems.reduce((sum, item) => sum + getItemAmount(item), 0);
	const refundAmount = cashAdvanceAmount > totalAmount ? (cashAdvanceAmount - totalAmount) : 0;
	const reimburseAmount = totalAmount > cashAdvanceAmount ? (totalAmount - cashAdvanceAmount) : 0;

	let varianceHtml = '<span class="text-muted">-</span>';
	if (totalAmount > 0 && refundAmount > 0) {
		varianceHtml = `<span class="kna-var-badge kna-var-return">${formatPHP(refundAmount)} to return</span>`;
	} else if (totalAmount > 0 && reimburseAmount > 0) {
		varianceHtml = `<span class="kna-var-badge kna-var-reimburse">${formatPHP(reimburseAmount)} to reimburse</span>`;
	} else if (totalAmount > 0) {
		varianceHtml = '<span class="kna-var-badge kna-var-balanced">0.00</span>';
	}

	domAdd.newVariance.innerHTML = varianceHtml;
};

const getExpenseDocumentDateRange = () => {
	const validDates = expenseItems
		.map((item) => normalizeDate(item.documentDate))
		.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
		.sort();

	if (!validDates.length) {
		return { from: '', to: '' };
	}

	return {
		from: validDates[0],
		to: validDates[validDates.length - 1],
	};
};

const syncDateRangeFromDocumentDates = () => {
	if (!domAdd.newDateRange) {
		return;
	}

	const range = getExpenseDocumentDateRange();
	domAdd.newDateRange.value = range.from && range.to ? `${range.from} to ${range.to}` : '';
};

const loadExpenseTypes = () => {
	const request = ajax_loader('transactions/liquidation/api/get/expense_types', {});

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			expenseTypeOptions = [];
			renderExpenseItems();
			return;
		}

		const options = (res.data || []).map((item) => ({
			id: Number(item.id || 0),
			categoryName: normalizeDate(item.category_name),
			description: normalizeDate(item.description),
		})).filter((item) => item.id && item.categoryName);

		if (!options.length) {
			expenseTypeOptions = [];
			renderExpenseItems();
			return;
		}

		expenseTypeOptions = options;
		renderExpenseItems();
	}).fail(() => {
		expenseTypeOptions = [];
		renderExpenseItems();
	});

	return request;
};

const resetCashAdvanceDetails = () => {
	domAdd.newCaAmount.value = Number(0).toFixed(2);
	domAdd.newCaDate.value = '';
	domAdd.newPurpose.value = '';
	updateVarianceSummary();
};

const loadPendingCashAdvanceNumbers = () => {
	const request = ajax_loader('transactions/liquidation/api/get/pending/ca_no', {});

	request.done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			domAdd.newCaRef.innerHTML = '<option value="">No pending cash advance</option>';
			resetCashAdvanceDetails();
			Swal.fire({
				icon: 'error',
				title: 'Load Failed',
				text: res.response || 'Unable to load pending cash advances.',
			});
			return;
		}

		const options = (res.data || []).map((item) => normalizeDate(item.cash_advance_id)).filter(Boolean);
		domAdd.newCaRef.innerHTML = '<option value="">Select cash advance</option>';

		options.forEach((caNo) => {
			const option = document.createElement('option');
			option.value = caNo;
			option.textContent = caNo;
			domAdd.newCaRef.appendChild(option);
		});

		if (options.length === 0) {
			resetCashAdvanceDetails();
		}
	}).fail(() => {
		domAdd.newCaRef.innerHTML = '<option value="">No pending cash advance</option>';
		resetCashAdvanceDetails();
		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load pending cash advance numbers.',
		});
	});

	return request;
};

const syncCashAdvanceDetails = () => {
	const ref = normalizeDate(domAdd.newCaRef.value);
	if (!ref) {
		resetCashAdvanceDetails();
		return;
	}

	ajax_loader('transactions/liquidation/api/get/ca_details', { CashAdvanceId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			resetCashAdvanceDetails();
			Swal.fire({
				icon: 'error',
				title: 'Load Failed',
				text: res.response || 'Could not load cash advance details.',
			});
			return;
		}

		const details = res.data;
		domAdd.newCaAmount.value = Number(details.amount || 0).toFixed(2);
		domAdd.newCaDate.value = normalizeDate(details.created_date).slice(0, 10);
		domAdd.newPurpose.value = normalizeDate(details.description);
		updateVarianceSummary();
	}).fail(() => {
		resetCashAdvanceDetails();
		Swal.fire({
			icon: 'error',
			title: 'Load Failed',
			text: 'Could not load cash advance details.',
		});
	});
};

const attachmentsLabel = (attachments, isOcrLoading = false) => {
	if (!liquidationReceiptOcr) {
		return isOcrLoading ? 'Loading…' : 'No file';
	}
	return liquidationReceiptOcr.attachmentsLabel(attachments, isOcrLoading);
};

const addItemAttachments = async (itemId, incomingFiles) => {
	if (!liquidationReceiptOcr) {
		return [];
	}
	return liquidationReceiptOcr.addItemAttachments(itemId, incomingFiles);
};

const runOcrAutofillForItem = async (itemId, file) => {
	if (!liquidationReceiptOcr) {
		return;
	}
	return liquidationReceiptOcr.runOcrAutofillForItem(itemId, file);
};

const ensureCameraPermission = async () => {
	if (!liquidationReceiptOcr) {
		return false;
	}
	return liquidationReceiptOcr.ensureCameraPermission();
};

const promptAttachmentSource = (itemId) => {
	if (!liquidationReceiptOcr) {
		return;
	}
	liquidationReceiptOcr.promptAttachmentSource(itemId, {
		onGallery: (targetItemId) => {
			const uploadInput = domAdd.expenseItemsContainer.querySelector(`[data-item-file="upload"][data-item-id="${targetItemId}"]`);
			if (uploadInput) {
				uploadInput.click();
			}
		},
		onCamera: async (targetItemId) => {
			const cameraInput = domAdd.expenseItemsContainer.querySelector(`[data-item-file="camera"][data-item-id="${targetItemId}"]`);
			if (cameraInput) {
				const allowed = await ensureCameraPermission();
				if (allowed) {
					cameraInput.click();
				}
			}
		},
	});
};

const renderExpenseItems = () => {
	if (!domAdd.expenseItemsContainer) {
		return;
	}
	if (!expenseItems.length) {
		expenseItems = [createExpenseItem()];
	}

	const desktopRowsHtml = expenseItems
		.map((item, index) => {
			const selectedExpenseType = getExpenseTypeById(item.expenseType);
			const selectedExpenseDescription = normalizeDate((selectedExpenseType || {}).description);
			const isOcrLoading = liquidationReceiptOcr ? liquidationReceiptOcr.isItemOcrLoading(item.id) : false;
			const allAttachments = getAllAttachmentObjects(item);
			return `
				<div class="kna-item-table kna-item-table-row" data-item-id="${item.id}">
					<div><input type="date" class="form-control form-control-sm" data-item-field="documentDate" data-item-id="${item.id}" value="${escapeHtml(item.documentDate)}"></div>
					<div><select class="form-control form-control-sm" data-item-field="expenseType" data-item-id="${item.id}" title="${escapeHtml(selectedExpenseDescription)}">${expenseTypeOptionsMarkup(item.expenseType)}</select></div>
					<div><input type="text" class="form-control form-control-sm" data-item-field="reference" data-item-id="${item.id}" value="${escapeHtml(item.reference)}" placeholder="Invoice / OR no."></div>
					<div><input type="number" min="0" step="0.01" class="form-control form-control-sm text-right" data-item-field="amount" data-item-id="${item.id}" value="${escapeHtml(item.amount)}" placeholder="0.00"></div>
					<div><label class="kna-vat-wrap"><input type="checkbox" class="kna-vat-input" data-item-field="isVattable" data-item-id="${item.id}" ${item.isVattable ? 'checked' : ''}></label></div>
					<div>
						<div class="kna-attachment-cell">${attachmentsLabel(allAttachments, isOcrLoading)}</div>
						<button type="button" class="btn btn-outline-primary btn-sm kna-small" data-item-action="attach" data-item-id="${item.id}">Attach</button>
						<input type="file" class="d-none" data-item-file="upload" data-item-id="${item.id}" accept="image/*" multiple>
						<input type="file" class="d-none" data-item-file="camera" data-item-id="${item.id}" accept="image/*" capture="environment">
					</div>
					<div><input type="text" class="form-control form-control-sm" data-item-field="remarks" data-item-id="${item.id}" value="${escapeHtml(item.remarks)}" placeholder="Remarks"></div>
					<div><button type="button" class="btn btn-outline-danger btn-sm kna-icon-btn" data-item-action="remove" data-item-id="${item.id}" title="Remove item"><i class="fas fa-trash"></i></button></div>
				</div>
			`;
		})
		.join('');

	const mobileCardsHtml = expenseItems
		.map((item, index) => {
			const selectedExpenseType = getExpenseTypeById(item.expenseType);
			const selectedExpenseDescription = normalizeDate((selectedExpenseType || {}).description);
			const isOcrLoading = liquidationReceiptOcr ? liquidationReceiptOcr.isItemOcrLoading(item.id) : false;
			const allAttachments = getAllAttachmentObjects(item);
			const attachmentSummary = attachmentsLabel(allAttachments, isOcrLoading);
			const hasAnyAttachment = allAttachments.length > 0;
			const attachmentButtonLabel = hasAnyAttachment ? 'Attachment' : 'Attach';
			const attachmentButtonClass = hasAnyAttachment ? 'btn btn-outline-primary btn-sm kna-small' : 'btn btn-warning btn-sm kna-small';
			return `
				<div class="kna-exp-card" data-item-id="${item.id}">
					<div class="kna-exp-card-head">
						<div>
							<div class="kna-exp-card-title">Item <span class="kna-exp-card-sub">#${index + 1}</span></div>
							<div class="kna-exp-card-meta">${escapeHtml(selectedExpenseType ? selectedExpenseType.categoryName : 'Tap attach to add a receipt')}</div>
						</div>
						<div class="kna-exp-card-actions">
							<button type="button" class="${attachmentButtonClass}" data-item-action="attach" data-item-id="${item.id}">${attachmentButtonLabel}</button>
							<button type="button" class="btn btn-outline-danger btn-sm kna-small" data-item-action="remove" data-item-id="${item.id}" title="Remove item"><i class="fas fa-trash"></i></button>
						</div>
					</div>

					<div class="kna-exp-card-grid">
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">Document Date</span>
							<input type="date" class="form-control form-control-sm" data-item-field="documentDate" data-item-id="${item.id}" value="${escapeHtml(item.documentDate)}">
						</div>
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">Expense Type</span>
							<select class="form-control form-control-sm" data-item-field="expenseType" data-item-id="${item.id}" title="${escapeHtml(selectedExpenseDescription)}">${expenseTypeOptionsMarkup(item.expenseType)}</select>
						</div>
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">Reference</span>
							<input type="text" class="form-control form-control-sm" data-item-field="reference" data-item-id="${item.id}" value="${escapeHtml(item.reference)}" placeholder="Invoice / OR no.">
						</div>
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">Amount</span>
							<input type="number" min="0" step="0.01" class="form-control form-control-sm text-right" data-item-field="amount" data-item-id="${item.id}" value="${escapeHtml(item.amount)}" placeholder="0.00">
						</div>
						<div class="kna-exp-card-field">
							<span class="kna-exp-card-label">VAT</span>
							<label class="kna-vat-wrap"><input type="checkbox" class="kna-vat-input" data-item-field="isVattable" data-item-id="${item.id}" ${item.isVattable ? 'checked' : ''}></label>
						</div>
						<div class="kna-exp-card-field kna-exp-card-field-full">
							<span class="kna-exp-card-label">Attachment</span>
							<span class="kna-exp-card-value kna-exp-card-attach">${attachmentSummary}</span>
							<input type="file" class="d-none" data-item-file="upload" data-item-id="${item.id}" accept="image/*" multiple>
							<input type="file" class="d-none" data-item-file="camera" data-item-id="${item.id}" accept="image/*" capture="environment">
						</div>
						<div class="kna-exp-card-field kna-exp-card-field-full">
							<span class="kna-exp-card-label">Remarks</span>
							<input type="text" class="form-control form-control-sm" data-item-field="remarks" data-item-id="${item.id}" value="${escapeHtml(item.remarks)}" placeholder="Remarks">
						</div>
					</div>
				</div>
			`;
		})
		.join('');

	domAdd.expenseItemsContainer.innerHTML = `
		<div class="kna-exp-summary">
			<div class="kna-item-table-wrap">
				<div class="kna-item-table kna-item-table-head">
					<div>Document date</div>
					<div>Expense Type</div>
					<div>Reference</div>
					<div>Amount</div>
					<div>Vattable</div>
					<div>Attachment</div>
					<div>Remarks</div>
					<div>Actions</div>
				</div>
				${desktopRowsHtml}
			</div>
		</div>
		<div class="kna-exp-mobile">
			${mobileCardsHtml}
		</div>
	`;

	updateTotalFromItems();
	syncDateRangeFromDocumentDates();
};

const getFormState = () => {
	const caRef = normalizeDate(domAdd.newCaRef.value);
	const totalAmount = Number(normalizeDate(domAdd.newLiquidatedAmount ? domAdd.newLiquidatedAmount.textContent : '0').replace(/[^0-9.\-]/g, '') || 0);
	const autoRange = getExpenseDocumentDateRange();
	const dateFrom = autoRange.from;
	const dateTo = autoRange.to;
	const purpose = normalizeDate(domAdd.newPurpose.value);

	return {
		caRef,
		totalAmount,
		dateFrom,
		dateTo,
		purpose,
	};
};

const validateBeforeSave = (statusCode) => {
	const state = getFormState();
	const itemWithMissingFields = expenseItems.find(
		(item) => !item.documentDate || !item.expenseType || !item.reference || Number(item.amount || 0) <= 0 || !item.remarks,
	);

	if (!state.caRef || !state.dateFrom || !state.dateTo || !state.purpose) {
		Swal.fire({
			icon: 'warning',
			title: 'Missing fields',
			text: 'Cash advance, document dates, and notes are required.',
		});
		return null;
	}

	if (state.dateFrom > state.dateTo) {
		Swal.fire({
			icon: 'warning',
			title: 'Invalid expense range',
			text: 'Expense range start must not be later than end.',
		});
		return null;
	}

	if (!expenseItems.length) {
		Swal.fire({
			icon: 'warning',
			title: 'Item required',
			text: 'Please add at least one expense item.',
		});
		return null;
	}

	if (itemWithMissingFields) {
		Swal.fire({
			icon: 'warning',
			title: 'Incomplete item',
			text: 'Each item requires document date, expense type, reference, amount, and remarks.',
		});
		return null;
	}

	if (state.totalAmount <= 0) {
		Swal.fire({
			icon: 'warning',
			title: 'Invalid total',
			text: 'Total must be greater than 0.',
		});
		return null;
	}

	if (statusCode === 'LQ_SUBMITTED' && !draftCanEdit) {
		Swal.fire({
			icon: 'warning',
			title: 'Draft locked',
			text: `This draft is already ${draftAgeDays} day(s) old and can no longer be edited.`,
		});
		return null;
	}

	return state;
};

const sendLiquidation = (statusCode) => {
	const state = validateBeforeSave(statusCode);
	if (!state) {
		return;
	}

	const itemWithoutAttachment = expenseItems.find((item) => getAllAttachmentObjects(item).length === 0);
	const cashAdvanceAmount = Number(domAdd.newCaAmount.value || 0);
	const refundAmount = cashAdvanceAmount > state.totalAmount ? (cashAdvanceAmount - state.totalAmount) : 0;
	const reimburseAmount = state.totalAmount > cashAdvanceAmount ? (state.totalAmount - cashAdvanceAmount) : 0;

	const postToServer = () => {
		const expensePayload = expenseItems.map((item) => ({
			DocumentDate: item.documentDate,
			ExpenseCategory: Number(item.expenseType),
			InvoiceReceiptNo: item.reference,
			ActualAmount: Number(item.amount || 0),
			IsVatable: Boolean(item.isVattable),
			Description: item.remarks,
			Attachment: getAttachmentNamesCsv(item),
		}));

		const formData = new FormData();
		if (currentLiquidationId) {
			formData.append('LiquidationId', currentLiquidationId);
		}
		formData.append('CashAdvanceId', state.caRef);
		formData.append('CashAdvanceAmount', cashAdvanceAmount.toFixed(2));
		formData.append('TotalAmountSpent', state.totalAmount.toFixed(2));
		formData.append('RefundAmount', refundAmount.toFixed(2));
		formData.append('ReimburseAmount', reimburseAmount.toFixed(2));
		formData.append('StatusCode', statusCode);
		formData.append('Description', state.purpose);
		formData.append('ExpenseRangeFrom', state.dateFrom);
		formData.append('ExpenseRangeTo', state.dateTo);
		formData.append('Expenses', JSON.stringify(expensePayload));

		expenseItems.forEach((item, index) => {
			(item.attachments || []).forEach((file) => {
				formData.append(`attachments[${index}][]`, file);
			});
		});

		ajax_loader_formdata_loading('transactions/liquidation/api/save', formData).done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				Swal.fire({
					icon: 'error',
					title: 'Failed',
					text: res.response || 'Failed to save liquidation.',
				});
				return;
			}

			const generatedId = res.data && res.data.id ? normalizeDate(res.data.id) : '';
			if (generatedId) {
				currentLiquidationId = generatedId;
				if (domAdd.liquidationRef) {
					domAdd.liquidationRef.value = generatedId;
				}
			}

			if (statusCode === 'LQ_DRAFT') {
				Swal.fire({
					icon: 'success',
					title: 'Draft Saved',
					html: `Draft saved successfully.<br><strong>${escapeHtml(generatedId || currentLiquidationId)}</strong>`,
				}).then(() => {
					goToPath('transactions/liquidation');
				});
				return;
			}

			Swal.fire({
				icon: 'success',
				title: 'Submitted',
				html: `Liquidation submitted successfully.<br><strong>${escapeHtml(generatedId || currentLiquidationId)}</strong>`,
			}).then(() => {
				goToPath('transactions/liquidation');
			});
		}).fail(() => {
			Swal.fire({
				icon: 'error',
				title: 'Request Failed',
				text: 'Could not connect to the server.',
			});
		});
	};

	if (statusCode === 'LQ_SUBMITTED' && itemWithoutAttachment) {
		Swal.fire({
			icon: 'warning',
			title: 'Missing attachment',
			text: 'Some expense items do not have attachments. Please confirm if you want to continue.',
			showCancelButton: true,
			confirmButtonText: 'Continue',
			cancelButtonText: 'Review items',
			reverseButtons: true,
		}).then((result) => {
			if (result.isConfirmed) {
				postToServer();
			}
		});
		return;
	}

	if (statusCode === 'LQ_SUBMITTED') {
		Swal.fire({
			icon: 'question',
			title: 'Confirm Submission',
			text: 'Are you sure you want to proceed?',
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No',
			reverseButtons: true,
		}).then((result) => {
			if (result.isConfirmed) {
				postToServer();
			}
		});
		return;
	}

	postToServer();
};

const cacheAddDom = () => {
	domAdd.liquidationRef = document.getElementById('liquidationRef');
	domAdd.draftEditWindowDays = document.getElementById('draftEditWindowDays');
	domAdd.isEditMode = document.getElementById('isEditMode');
	domAdd.newCaRef = document.getElementById('newCaRef');
	domAdd.newCaAmount = document.getElementById('newCaAmount');
	domAdd.newCaDate = document.getElementById('newCaDate');
	domAdd.newDateRange = document.getElementById('newDateRange');
	domAdd.newLiquidatedAmount = document.getElementById('newLiquidatedAmount');
	domAdd.newVariance = document.getElementById('newVariance');
	domAdd.newPurpose = document.getElementById('newPurpose');
	domAdd.btnAddExpenseItem = document.getElementById('btnAddExpenseItem');
	domAdd.expenseItemsContainer = document.getElementById('expenseItemsContainer');
	domAdd.btnSaveDraftLiquidation = document.getElementById('btnSaveDraftLiquidation');
	domAdd.btnSaveNewLiquidation = document.getElementById('btnSaveNewLiquidation');
};

const setEditability = (editable) => {
	draftCanEdit = editable;
	const disabled = !editable;

	if (domAdd.newCaRef) {
		domAdd.newCaRef.disabled = disabled || Boolean(currentLiquidationId);
	}
	if (domAdd.btnAddExpenseItem) {
		domAdd.btnAddExpenseItem.disabled = disabled;
	}
	if (domAdd.btnSaveNewLiquidation) {
		domAdd.btnSaveNewLiquidation.disabled = disabled;
	}
	if (domAdd.btnSaveDraftLiquidation) {
		domAdd.btnSaveDraftLiquidation.disabled = disabled;
	}
};

const loadDraftForEdit = () => {
	const draftRef = normalizeDate(domAdd.liquidationRef ? domAdd.liquidationRef.value : '');
	if (!draftRef) {
		return $.Deferred().resolve().promise();
	}

	currentLiquidationId = draftRef;

	return ajax_loader('transactions/liquidation/api/get/draft', { LiquidationId: draftRef }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data || !res.data.header) {
			Swal.fire({
				icon: 'error',
				title: 'Unable to open draft',
				text: res.response || 'Draft liquidation is not available.',
			}).then(() => {
				goToPath('transactions/liquidation');
			});
			return;
		}

		const payload = res.data;
		const header = payload.header;
		const details = payload.details || [];
		const draftCaRef = normalizeDate(header.cash_advance_id);

		draftAgeDays = Number(payload.draftAgeDays || 0);
		draftEditWindowDays = Number(payload.draftEditWindowDays || draftEditWindowDays || 7);
		setEditability(Boolean(payload.canEdit));

		if (draftCaRef && !domAdd.newCaRef.querySelector(`option[value="${draftCaRef}"]`)) {
			const option = document.createElement('option');
			option.value = draftCaRef;
			option.textContent = draftCaRef;
			domAdd.newCaRef.appendChild(option);
		}
		domAdd.newCaRef.value = draftCaRef;
		domAdd.newCaAmount.value = Number(header.ca_amount || 0).toFixed(2);
		domAdd.newCaDate.value = normalizeDate(header.created_date).slice(0, 10);
		domAdd.newPurpose.value = normalizeDate(header.description);

		expenseItems = details.map((detail) => ({
			id: ++expenseItemCounter,
			documentDate: normalizeDate(detail.document_date).slice(0, 10),
			expenseType: normalizeDate(detail.expense_category || detail.expense_category_id || ''),
			reference: normalizeDate(detail.invoice_receipt_no),
			amount: normalizeDate(detail.actual_amount),
			isVattable: Boolean(Number(detail.is_vatable || 0)),
			existingAttachments: normalizeDate(detail.attachment)
				.split(',')
				.map((name) => name.trim())
				.filter(Boolean),
			attachments: [],
			remarks: normalizeDate(detail.description),
		}));

		if (!expenseItems.length) {
			expenseItems = [createExpenseItem()];
		}

		renderExpenseItems();

		if (!payload.canEdit) {
			Swal.fire({
				icon: 'info',
				title: 'Draft Locked',
				text: `This draft is ${draftAgeDays} day(s) old. Drafts can only be edited within ${draftEditWindowDays} day(s).`,
			});
		}
	}).fail(() => {
		Swal.fire({
			icon: 'error',
			title: 'Unable to open draft',
			text: 'Could not load draft liquidation.',
		}).then(() => {
			goToPath('transactions/liquidation');
		});
	});
};

const initAddPage = () => {
	cacheAddDom();
	draftEditWindowDays = Number(domAdd.draftEditWindowDays ? domAdd.draftEditWindowDays.value : 7) || 7;
	currentLiquidationId = normalizeDate(domAdd.liquidationRef ? domAdd.liquidationRef.value : '');
	liquidationReceiptOcr = window.SharedReceiptOcr.create({
		maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
		getExpenseItem: findExpenseItem,
		getExpenseTypeOptions: () => expenseTypeOptions,
		renderItems: renderExpenseItems,
		normalizeDate,
		escapeHtml,
		swal: Swal,
		ajaxLoaderFormDataLoading: ajax_loader_formdata_loading,
		ocrEndpoint: 'transactions/liquidation/api/ocr',
	});
	if (domAdd.newDateRange) {
		domAdd.newDateRange.setAttribute('readonly', 'readonly');
		domAdd.newDateRange.setAttribute('placeholder', 'Auto based on document dates');
	}
	expenseItems = [createExpenseItem()];
	renderExpenseItems();
	resetCashAdvanceDetails();
	loadExpenseTypes();
	if (currentLiquidationId) {
		loadDraftForEdit();
	} else {
		loadPendingCashAdvanceNumbers();
	}

	domAdd.btnSaveNewLiquidation.addEventListener('click', () => sendLiquidation('LQ_SUBMITTED'));
	if (domAdd.btnSaveDraftLiquidation) {
		domAdd.btnSaveDraftLiquidation.addEventListener('click', () => sendLiquidation('LQ_DRAFT'));
	}
	domAdd.btnAddExpenseItem.addEventListener('click', () => {
		expenseItems.push(createExpenseItem());
		renderExpenseItems();
	});

	domAdd.newCaRef.addEventListener('change', syncCashAdvanceDetails);

	domAdd.expenseItemsContainer.addEventListener('input', (event) => {
		const target = event.target;
		const itemId = Number(target.getAttribute('data-item-id'));
		const field = target.getAttribute('data-item-field');
		if (!itemId || !field) {
			return;
		}

		const item = findExpenseItem(itemId);
		if (!item) {
			return;
		}

		if (field === 'isVattable') {
			item.isVattable = Boolean(target.checked);
			return;
		}

		item[field] = target.value;
		if (field === 'expenseType') {
			const selectedExpenseType = getExpenseTypeById(target.value);
			target.title = normalizeDate((selectedExpenseType || {}).description);
		}
		if (field === 'amount') {
			updateTotalFromItems();
			return;
		}
		if (field === 'documentDate') {
			syncDateRangeFromDocumentDates();
		}
	});

	domAdd.expenseItemsContainer.addEventListener('change', async (event) => {
		const target = event.target;
		const itemId = Number(target.getAttribute('data-item-id'));
		const fileMode = target.getAttribute('data-item-file');
		if (!itemId || !fileMode) {
			return;
		}

		const acceptedFiles = await addItemAttachments(itemId, Array.from(target.files || []));
		if (acceptedFiles.length) {
			await runOcrAutofillForItem(itemId, acceptedFiles[0]);
		}
		target.value = '';
		renderExpenseItems();
	});

	domAdd.expenseItemsContainer.addEventListener('click', (event) => {
		const actionBtn = event.target.closest('[data-item-action]');
		if (!actionBtn) {
			return;
		}

		const itemId = Number(actionBtn.getAttribute('data-item-id'));
		const action = actionBtn.getAttribute('data-item-action');
		if (!itemId || !action) {
			return;
		}

		if (action === 'remove') {
			expenseItems = expenseItems.filter((item) => item.id !== itemId);
			renderExpenseItems();
			return;
		}

		if (action === 'attach') {
			promptAttachmentSource(itemId);
		}
	});
};
