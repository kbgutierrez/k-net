let rbExpenseItems = [];
let rbExpenseCounter = 0;
let rbReceiptOcr = null;
let rbCurrentId = '';
let rbCanEdit = true;

const rbDom = {
	reimbursementRef: null,
	rbDateRange: null,
	rbPurpose: null,
	rbTotalAmount: null,
	btnAddExpenseItem: null,
	expenseItemsContainer: null,
	btnSaveDraftReimbursement: null,
	btnSaveReimbursement: null,
};

const rbCreateItem = () => ({
	id: ++rbExpenseCounter,
	documentDate: '',
	reference: '',
	amount: '',
	isVattable: false,
	attachments: [],
	existingAttachments: [],
	remarks: '',
});

const rbFindItem = (id) => rbExpenseItems.find((item) => item.id === id);

const rbAllAttachments = (item) => {
	const existing = (item.existingAttachments || []).map((name) => ({ name }));
	return existing.concat(item.attachments || []);
};

const rbAttachmentsCsv = (item) => (item.existingAttachments || []).join(',');

const rbAttachmentsLabel = (item) => {
	const all = rbAllAttachments(item);
	if (!all.length) return 'No file';
	if (all.length === 1) return all[0].name;
	return `${all[0].name} + ${all.length - 1} more`;
};

const rbCalcTotals = () => {
	const total = rbExpenseItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
	if (rbDom.rbTotalAmount) {
		rbDom.rbTotalAmount.textContent = formatPHP(total);
	}

	const validDates = rbExpenseItems
		.map((item) => normalizeDate(item.documentDate))
		.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
		.sort();
	if (rbDom.rbDateRange) {
		if (!validDates.length) {
			rbDom.rbDateRange.value = '';
		} else {
			rbDom.rbDateRange.value = `${validDates[0]} to ${validDates[validDates.length - 1]}`;
		}
	}
};

const rbRenderItems = () => {
	if (!rbDom.expenseItemsContainer) return;
	if (!rbExpenseItems.length) {
		rbExpenseItems = [rbCreateItem()];
	}

	const rows = rbExpenseItems.map((item) => `
		<div class="kna-item-table kna-item-table-row" data-item-id="${item.id}">
			<div><input type="date" class="form-control form-control-sm" data-item-field="documentDate" data-item-id="${item.id}" value="${escapeHtml(item.documentDate)}"></div>
			<div><input type="text" class="form-control form-control-sm" data-item-field="reference" data-item-id="${item.id}" value="${escapeHtml(item.reference)}" placeholder="Invoice / OR no."></div>
			<div><input type="number" min="0" step="0.01" class="form-control form-control-sm text-right" data-item-field="amount" data-item-id="${item.id}" value="${escapeHtml(item.amount)}" placeholder="0.00"></div>
			<div><label class="kna-vat-wrap"><input type="checkbox" data-item-field="isVattable" data-item-id="${item.id}" ${item.isVattable ? 'checked' : ''}></label></div>
			<div>
				<div class="kna-attachment-cell">${escapeHtml(rbAttachmentsLabel(item))}</div>
				<div class="d-flex" style="gap:4px;">
					<button type="button" class="btn btn-outline-primary btn-sm kna-small" data-item-action="attach" data-item-id="${item.id}">Attach</button>
				</div>
				<input type="file" class="d-none" data-item-file="upload" data-item-id="${item.id}" accept="image/*" multiple>
				<input type="file" class="d-none" data-item-file="camera" data-item-id="${item.id}" accept="image/*" capture="environment">
			</div>
			<div><input type="text" class="form-control form-control-sm" data-item-field="remarks" data-item-id="${item.id}" value="${escapeHtml(item.remarks)}" placeholder="Remarks"></div>
			<div><button type="button" class="btn btn-outline-danger btn-sm" data-item-action="remove" data-item-id="${item.id}"><i class="fas fa-trash"></i></button></div>
		</div>
	`).join('');

	rbDom.expenseItemsContainer.innerHTML = `
		<div class="kna-item-table-wrap">
			<div class="kna-item-table kna-item-table-head">
				<div>Document Date</div>
				<div>Reference</div>
				<div>Amount</div>
				<div>VAT</div>
				<div>Attachment</div>
				<div>Remarks</div>
				<div>Actions</div>
			</div>
			${rows}
		</div>
	`;

	rbCalcTotals();
};

const rbCacheDom = () => {
	rbDom.reimbursementRef = document.getElementById('reimbursementRef');
	rbDom.rbDateRange = document.getElementById('rbDateRange');
	rbDom.rbPurpose = document.getElementById('rbPurpose');
	rbDom.rbTotalAmount = document.getElementById('rbTotalAmount');
	rbDom.btnAddExpenseItem = document.getElementById('btnAddExpenseItem');
	rbDom.expenseItemsContainer = document.getElementById('expenseItemsContainer');
	rbDom.btnSaveDraftReimbursement = document.getElementById('btnSaveDraftReimbursement');
	rbDom.btnSaveReimbursement = document.getElementById('btnSaveReimbursement');
};

const rbSetEditable = (editable) => {
	rbCanEdit = editable;
	const disabled = !editable;
	if (rbDom.rbPurpose) rbDom.rbPurpose.disabled = disabled;
	if (rbDom.btnAddExpenseItem) rbDom.btnAddExpenseItem.disabled = disabled;
	if (rbDom.btnSaveDraftReimbursement) rbDom.btnSaveDraftReimbursement.disabled = disabled;
	if (rbDom.btnSaveReimbursement) rbDom.btnSaveReimbursement.disabled = disabled;
};

const rbLoadDraft = () => {
	if (!rbCurrentId) {
		return;
	}

	ajax_loader('transactions/reimbursement/api/get/draft', { ReimbursementId: rbCurrentId }).done((response) => {
		const res = typeof response === 'string' ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data || !res.data.header) {
			Swal.fire({ icon: 'error', title: 'Unable to open draft', text: 'Draft reimbursement is not available.' }).then(() => {
				goToPath('transactions/reimbursement');
			});
			return;
		}

		const header = res.data.header;
		const details = res.data.details || [];
		rbDom.rbPurpose.value = normalizeDate(header.purpose);

		rbExpenseItems = details.map((detail) => ({
			id: ++rbExpenseCounter,
			documentDate: normalizeDate(detail.document_date).slice(0, 10),
			reference: normalizeDate(detail.reference_no),
			amount: normalizeDate(detail.actual_amount),
			isVattable: Boolean(Number(detail.is_vatable || 0)),
			existingAttachments: normalizeDate(detail.attachment).split(',').map((x) => x.trim()).filter(Boolean),
			attachments: [],
			remarks: normalizeDate(detail.description),
		}));
		if (!rbExpenseItems.length) {
			rbExpenseItems = [rbCreateItem()];
		}

		rbSetEditable(Boolean(res.data.canEdit));
		rbRenderItems();

		if (!res.data.canEdit) {
			Swal.fire({ icon: 'info', title: 'Draft Locked', text: `This draft is already ${res.data.draftAgeDays} day(s) old and can no longer be edited.` });
		}
	});
};

const rbValidate = () => {
	if (!rbDom.rbPurpose.value.trim()) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Purpose is required.' });
		return false;
	}
	if (!rbExpenseItems.length) {
		Swal.fire({ icon: 'warning', title: 'Item required', text: 'Please add at least one expense item.' });
		return false;
	}
	const incomplete = rbExpenseItems.find((item) => !item.documentDate || !item.reference || Number(item.amount || 0) <= 0 || !item.remarks);
	if (incomplete) {
		Swal.fire({ icon: 'warning', title: 'Incomplete item', text: 'Each item requires document date, reference, amount, and remarks.' });
		return false;
	}
	return true;
};

const rbSend = (statusCode) => {
	if (!rbCanEdit) {
		return;
	}
	if (!rbValidate()) {
		return;
	}

	const total = rbExpenseItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
	const range = parseDateRange(rbDom.rbDateRange.value);
	const payloadItems = rbExpenseItems.map((item) => ({
		DocumentDate: item.documentDate,
		ReferenceNo: item.reference,
		ActualAmount: Number(item.amount || 0),
		IsVatable: Boolean(item.isVattable),
		Description: item.remarks,
		Attachment: rbAttachmentsCsv(item),
	}));

	const formData = new FormData();
	if (rbCurrentId) {
		formData.append('ReimbursementId', rbCurrentId);
	}
	formData.append('StatusCode', statusCode);
	formData.append('Purpose', rbDom.rbPurpose.value.trim());
	formData.append('TotalAmount', String(total.toFixed(2)));
	formData.append('ExpenseRangeFrom', range.from);
	formData.append('ExpenseRangeTo', range.to);
	formData.append('Expenses', JSON.stringify(payloadItems));

	rbExpenseItems.forEach((item, index) => {
		(item.attachments || []).forEach((file) => {
			formData.append(`attachments[${index}][]`, file);
		});
	});

	ajax_loader_formdata_loading('transactions/reimbursement/api/save', formData).done((response) => {
		const res = typeof response === 'string' ? $.parseJSON(response) : response;
		if (res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Failed', text: res.response || 'Failed to save reimbursement.' });
			return;
		}
		Swal.fire({
			icon: 'success',
			title: statusCode === 'RB_DRAFT' ? 'Draft Saved' : 'Submitted',
			html: `Reimbursement processed.<br><strong>${escapeHtml(res.data && res.data.id ? res.data.id : '')}</strong>`,
		}).then(() => {
			goToPath('transactions/reimbursement');
		});
	});
};

const rbInit = () => {
	rbCacheDom();
	if (!rbDom.expenseItemsContainer) {
		return;
	}

	rbReceiptOcr = window.SharedReceiptOcr.create({
		maxAttachmentBytes: 2 * 1024 * 1024,
		getExpenseItem: rbFindItem,
		getExpenseTypeOptions: () => [],
		renderItems: rbRenderItems,
		normalizeDate,
		escapeHtml,
		swal: Swal,
		ajaxLoaderFormDataLoading: ajax_loader_formdata_loading,
		ocrEndpoint: 'transactions/liquidation/api/ocr',
	});

	rbCurrentId = normalizeDate(rbDom.reimbursementRef ? rbDom.reimbursementRef.value : '');
	rbExpenseItems = [rbCreateItem()];
	rbRenderItems();
	if (rbCurrentId) {
		rbLoadDraft();
	}

	rbDom.btnAddExpenseItem.addEventListener('click', () => {
		rbExpenseItems.push(rbCreateItem());
		rbRenderItems();
	});

	rbDom.btnSaveDraftReimbursement.addEventListener('click', () => rbSend('RB_DRAFT'));
	rbDom.btnSaveReimbursement.addEventListener('click', () => rbSend('RB_SUBMITTED'));

	rbDom.expenseItemsContainer.addEventListener('input', (event) => {
		const target = event.target;
		const itemId = Number(target.getAttribute('data-item-id'));
		const field = target.getAttribute('data-item-field');
		if (!itemId || !field) {
			return;
		}
		const item = rbFindItem(itemId);
		if (!item) {
			return;
		}
		if (field === 'isVattable') {
			item.isVattable = Boolean(target.checked);
		} else {
			item[field] = target.value;
		}
		rbCalcTotals();
	});

	rbDom.expenseItemsContainer.addEventListener('change', async (event) => {
		const target = event.target;
		const itemId = Number(target.getAttribute('data-item-id'));
		const mode = target.getAttribute('data-item-file');
		if (!itemId || (mode !== 'upload' && mode !== 'camera')) {
			return;
		}
		const incoming = await rbReceiptOcr.addItemAttachments(itemId, Array.from(target.files || []));
		if (incoming.length) {
			await rbReceiptOcr.runOcrAutofillForItem(itemId, incoming[0]);
		}
		target.value = '';
		rbRenderItems();
	});

	rbDom.expenseItemsContainer.addEventListener('click', (event) => {
		const button = event.target.closest('[data-item-action]');
		if (!button) {
			return;
		}
		const action = button.getAttribute('data-item-action');
		const itemId = Number(button.getAttribute('data-item-id'));
		if (!itemId) {
			return;
		}
		if (action === 'remove') {
			if (rbExpenseItems.length === 1) {
				Swal.fire({ icon: 'warning', title: 'Required', text: 'At least one item is required.' });
				return;
			}
			rbExpenseItems = rbExpenseItems.filter((x) => x.id !== itemId);
			rbRenderItems();
			return;
		}
		if (action === 'attach') {
			rbReceiptOcr.promptAttachmentSource(itemId, {
				onGallery: (targetItemId) => {
					const input = rbDom.expenseItemsContainer.querySelector(`[data-item-file="upload"][data-item-id="${targetItemId}"]`);
					if (input) {
						input.click();
					}
				},
				onCamera: async (targetItemId) => {
					const allowed = await rbReceiptOcr.ensureCameraPermission();
					if (!allowed) {
						return;
					}
					const input = rbDom.expenseItemsContainer.querySelector(`[data-item-file="camera"][data-item-id="${targetItemId}"]`);
					if (input) {
						input.click();
					}
				},
			});
		}
	});
};

$(document).ready(() => {
	rbInit();
});
