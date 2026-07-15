let expenseItems = [], expenseItemCounter = 0, expenseTypeOptions = [];
let reimbursementReceiptOcr = null, currentReimbursementId = '', draftCanEdit = true;
let draftEditWindowDays = 7, draftAgeDays = 0;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const domAdd = {};

// ─── Helpers ───
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const getExpenseTypeByCode = (code) => expenseTypeOptions.find((it) => String(it.expense_code) === String(code));
const getExpenseTypeDisplayText = (opt) => opt ? `${normalizeDate(opt.expense_code)} - ${normalizeDate(opt.long_text)}`.replace(/^ - | - $/g, '') : '';
const findExpenseItem = (id) => expenseItems.find((it) => it.id === id);
const getItemAmount = (it) => Number(it.amount || 0);
const getAllAttachments = (it) => (it.existingAttachments || []).map((n) => ({ name: n })).concat(it.attachments || []);
const getAttachmentNamesCsv = (it) => (it.existingAttachments || []).map(normalizeDate).filter(Boolean).join(',');
const createExpenseItem = () => ({ id: ++expenseItemCounter, documentDate: '', expenseType: '', reference: '', amount: '', isVattable: false, existingAttachments: [], attachments: [], remarks: '', vendorName: '', vendorAddress: '', vendorTin: '' });
const itemField = (label, cls, inputHtml) => `<div class="kna-item-field ${cls}"><span class="kna-item-field-label">${label}</span>${inputHtml}</div>`;

const swal = (icon, title, text, opts = {}) => Swal.fire({ icon, title, text, ...opts });
const parseRes = (r) => (typeof r === 'string' ? jQuery.parseJSON(r) : r);
const safeNum = (v) => Number(v || 0);

// ─── Expense Type Options ───
const expenseTypeOptionsMarkup = (selected) => {
	const opts = expenseTypeOptions.map((o) => {
		const code = normalizeDate(o.expense_code), txt = getExpenseTypeDisplayText(o), desc = normalizeDate(o.description);
		return `<option value="${escapeHtml(code)}" title="${escapeHtml(desc)}" ${String(selected) === String(code) ? 'selected' : ''}>${escapeHtml(txt)}</option>`;
	}).join('');
	return `<option value="">Select type</option>${opts}`;
};

// Select2's own .trigger('change') never reaches native addEventListener('change', ...)
// listeners, so the expense type field must be synced to item state via a jQuery-bound
// handler on the element itself, not the delegated native `onChange` on the container.
const applyExpenseTypeSelection = (selectEl) => {
	const itemId = Number(selectEl.getAttribute('data-item-id'));
	const item = findExpenseItem(itemId);
	if (!item) return;
	item.expenseType = selectEl.value;
	selectEl.title = normalizeDate((getExpenseTypeByCode(selectEl.value) || {}).description);
};

const initExpenseTypeSelect2 = () => {
	if (!domAdd.expenseItemsContainer || typeof jQuery.fn?.select2 === 'undefined') return;
	jQuery(domAdd.expenseItemsContainer).find('select[data-item-field="expenseType"]').each(function () {
		const $s = jQuery(this);
		if ($s.hasClass('select2-hidden-accessible')) $s.select2('destroy');
		const $dropdownParent = $s.closest('.page-inner').length ? $s.closest('.page-inner') : jQuery(document.body);
		$s.select2({ placeholder: 'Select type', allowClear: false, width: '100%', dropdownAutoWidth: false, minimumResultsForSearch: 5, dropdownParent: $dropdownParent });
		const $c = $s.next('.select2-container');
		$c.find('.select2-selection--single').css({ height: '30px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', fontSize: '10px' });
		$c.find('.select2-selection__rendered').css({ lineHeight: '28px', paddingLeft: '8px', paddingRight: '20px', color: '#374151' });
		$c.find('.select2-selection__arrow').css({ height: '28px', width: '20px' });
		$c.find('.select2-selection__arrow b').css({ borderWidth: '3px 3px 0 3px', marginTop: '-2px' });
		$s.on('change', function () { applyExpenseTypeSelection(this); });
		const cv = $s.attr('data-current-value') || $s.val();
		if (cv) $s.val(cv).trigger('change');
	});
};

const initCostCenterSelect2 = () => {
	if (!domAdd.newCostCenter || typeof jQuery.fn?.select2 === 'undefined') return;
	const $s = jQuery(domAdd.newCostCenter);
	if ($s.hasClass('select2-hidden-accessible')) $s.select2('destroy');
	const $dropdownParent = $s.closest('.page-inner').length ? $s.closest('.page-inner') : jQuery(document.body);
	$s.select2({ placeholder: 'Select cost center', allowClear: false, width: '100%', dropdownAutoWidth: false, minimumResultsForSearch: 5, dropdownParent: $dropdownParent });
	const $c = $s.next('.select2-container');
	$c.find('.select2-selection--single').css({ height: '32px', border: '1px solid #ced4da', borderRadius: '4px', background: '#fff', fontSize: '12px' });
	$c.find('.select2-selection__rendered').css({ lineHeight: '30px', paddingLeft: '10px', paddingRight: '20px', color: '#495057' });
	$c.find('.select2-selection__arrow').css({ height: '30px', width: '20px' });
	$c.find('.select2-selection__arrow b').css({ borderWidth: '3px 3px 0 3px', marginTop: '-2px' });
};

// ─── Cost Center Options ───
const getCostCenterOptions = (selectedValue) => {
	const dataEl = document.getElementById('costCentersData');
	if (!dataEl) return '<option value="">No options available</option>';
	try {
		const centers = JSON.parse(dataEl.value);
		if (!Array.isArray(centers) || centers.length === 0) return '<option value="">No options available</option>';
		const opts = centers.map((cc) => {
			const value = escapeHtml(cc.cost_center_code || '');
			const text = escapeHtml((cc.cost_center_code ? cc.cost_center_code + ' - ' : '') + (cc.cost_center_name || ''));
			const selected = value === normalizeDate(selectedValue) ? ' selected' : '';
			return `<option value="${value}"${selected}>${text}</option>`;
		}).join('');
		return `<option value="">Select cost center</option>${opts}`;
	} catch (e) {
		return '<option value="">Error loading options</option>';
	}
};

// ─── Totals & Date Range ───
const getTotal = () => expenseItems.reduce((s, it) => s + getItemAmount(it), 0);

const updateTotal = () => {
	if (domAdd.newTotalAmount) domAdd.newTotalAmount.textContent = formatPHP(getTotal());
};

const getDateRange = () => {
	const dates = expenseItems.map((it) => normalizeDate(it.documentDate)).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort();
	return dates.length ? { from: dates[0], to: dates[dates.length - 1] } : { from: '', to: '' };
};

const syncDateRange = () => {
	const { from, to } = getDateRange();
	if (domAdd.newDateRange) domAdd.newDateRange.value = from && to ? `${from} to ${to}` : '';
};

// ─── DOM Cache ───
const cacheAddDom = () => {
	const ids = ['reimbursementRef', 'draftEditWindowDays', 'isEditMode', 'newDescription', 'newDateRange', 'newTotalAmount', 'newPayableTo', 'newAddress', 'newCostCenter', 'newIoNumber', 'btnAddExpenseItem', 'expenseItemsContainer', 'btnSaveDraftReimbursement', 'btnSaveNewReimbursement'];
	ids.forEach((id) => { domAdd[id] = document.getElementById(id); });
};

// ─── Expense Types ───
const loadExpenseTypes = () => {
	jQuery.ajax({ url: base_url + 'transactions/reimbursement/api/get/expense_types', type: 'POST', dataType: 'json', headers: { Authorization: 'Bearer 12345678' } })
		.done((r) => {
			const res = parseRes(r);
			if (res.status !== 'success') { expenseTypeOptions = []; renderExpenseItems(); return; }
			expenseTypeOptions = (res.data || []).map((it) => ({ id: Number(it.id || 0), expense_code: normalizeDate(it.expense_code), long_text: normalizeDate(it.long_text), description: normalizeDate(it.description), categoryName: normalizeDate(it.category_name) })).filter((it) => it.expense_code);
			renderExpenseItems();
		})
		.fail(() => { expenseTypeOptions = []; renderExpenseItems(); });
};

// ─── OCR Helpers ───
const ocr = {
	label: (atts, id) => reimbursementReceiptOcr ? reimbursementReceiptOcr.attachmentsLabel(atts, id) : '<span class="kna-attachment-cell"><span class="text-muted">No file</span></span>',
	add: (id, files) => reimbursementReceiptOcr ? reimbursementReceiptOcr.addItemAttachments(id, files) : Promise.resolve([]),
	run: (id, file) => reimbursementReceiptOcr?.runOcrAutofillForItem(id, file),
	camPerm: () => reimbursementReceiptOcr?.ensureCameraPermission(),
	prompt: (id) => {
		if (!reimbursementReceiptOcr) return;
		reimbursementReceiptOcr.promptAttachmentSource(id, {
			onGallery: (tid) => { const el = qs(`[data-item-file="upload"][data-item-id="${tid}"]`, domAdd.expenseItemsContainer); if (el) el.click(); },
			onCamera: async (tid) => { const el = qs(`[data-item-file="camera"][data-item-id="${tid}"]`, domAdd.expenseItemsContainer); if (el && await ocr.camPerm()) el.click(); }
		});
	},
	statusHtml: (id) => {
		if (!reimbursementReceiptOcr) return '';
		const s = reimbursementReceiptOcr.getItemOcrState ? reimbursementReceiptOcr.getItemOcrState(id) : null;
		if (!s || s.status === 'idle') return '';
		const manualBtn = `<button type="button" class="kna-ocr-manual-btn" data-item-action="ocrManual" data-item-id="${id}">Enter manually</button>`;
		const map = {
			scanning: `<div class="kna-ocr-status kna-ocr-scanning"><i class="fas fa-spinner fa-spin"></i> <span>Reading…</span>${manualBtn}</div>`,
			success: `<div class="kna-ocr-status kna-ocr-success"><i class="fas fa-check"></i></div>`,
			timeout: `<div class="kna-ocr-status kna-ocr-error"><i class="fas fa-exclamation-triangle"></i> <span>${escapeHtml(s.error)}</span>${manualBtn}</div>`,
			error: `<div class="kna-ocr-status kna-ocr-error"><i class="fas fa-exclamation-triangle"></i> <span>${escapeHtml(s.error)}</span>${manualBtn}</div>`,
			manual: ''
		};
		return map[s.status] || '';
	}
};

// ─── Render ───
const renderExpenseItems = () => {
	if (!domAdd.expenseItemsContainer) return;
	if (!expenseItems.length) expenseItems = [createExpenseItem()];

	const rows = expenseItems.map((it, i) => {
		const et = getExpenseTypeByCode(it.expenseType), desc = normalizeDate((et || {}).description);
		const atts = getAllAttachments(it), summary = ocr.label(atts, it.id), hasAtt = atts.length > 0;
		const btnLabel = hasAtt ? 'Replace' : 'Attach';
		return `
			<div class="kna-item-row" data-item-id="${it.id}">
				<div class="kna-item-row-index">${i + 1}</div>
				<div class="kna-item-row-fields">
					${itemField('Doc Date', 'kna-f-date', `<input type="date" class="form-control form-control-sm" data-item-field="documentDate" data-item-id="${it.id}" value="${escapeHtml(it.documentDate)}">`)}
					${itemField('Expense Type', 'kna-f-type', `<select class="form-control form-control-sm kna-expense-type-select" data-item-field="expenseType" data-item-id="${it.id}" data-current-value="${escapeHtml(it.expenseType)}" title="${escapeHtml(desc)}">${expenseTypeOptionsMarkup(it.expenseType)}</select>`)}
					${itemField('Reference', 'kna-f-ref', `<input type="text" class="form-control form-control-sm" data-item-field="reference" data-item-id="${it.id}" value="${escapeHtml(it.reference)}" placeholder="Invoice / OR no.">`)}
					${itemField('Amount', 'kna-f-amount', `<input type="number" min="0" step="0.01" class="form-control form-control-sm text-right" data-item-field="amount" data-item-id="${it.id}" value="${escapeHtml(it.amount)}" placeholder="0.00">`)}
					${itemField('VAT', 'kna-f-vat', `<label class="kna-vat-wrap"><input type="checkbox" class="kna-vat-input" data-item-field="isVattable" data-item-id="${it.id}" ${it.isVattable ? 'checked' : ''}></label>`)}
					${itemField('Vendor Name', 'kna-f-vendor', `<input type="text" class="form-control form-control-sm" data-item-field="vendorName" data-item-id="${it.id}" value="${escapeHtml(it.vendorName)}" placeholder="Vendor name">`)}
					${itemField('Vendor Address', 'kna-f-vendor', `<input type="text" class="form-control form-control-sm" data-item-field="vendorAddress" data-item-id="${it.id}" value="${escapeHtml(it.vendorAddress)}" placeholder="Address">`)}
					${itemField('TIN', 'kna-f-tin', `<input type="text" class="form-control form-control-sm" data-item-field="vendorTin" data-item-id="${it.id}" value="${escapeHtml(it.vendorTin)}" placeholder="TIN">`)}
					<div class="kna-item-field kna-f-attach">
						<span class="kna-item-field-label">Attachment</span>
						<div class="kna-item-attach-inline">
							<span class="kna-attachment-cell">${summary}</span>
							<button type="button" class="btn btn-outline-primary btn-sm kna-small" data-item-action="attach" data-item-id="${it.id}">${btnLabel}</button>
							<input type="file" class="d-none" data-item-file="upload" data-item-id="${it.id}" accept="image/*,application/pdf" multiple>
							<input type="file" class="d-none" data-item-file="camera" data-item-id="${it.id}" accept="image/*" capture="environment">
						</div>
						${ocr.statusHtml(it.id)}
					</div>
					${itemField('Remarks', 'kna-f-remarks', `<input type="text" class="form-control form-control-sm" data-item-field="remarks" data-item-id="${it.id}" value="${escapeHtml(it.remarks)}" placeholder="Remarks">`)}
				</div>
				<button type="button" class="kna-item-row-remove" data-item-action="remove" data-item-id="${it.id}" title="Remove item"><i class="fas fa-trash"></i></button>
			</div>`;
	}).join('');

	domAdd.expenseItemsContainer.innerHTML = `<div class="kna-item-rows">${rows}</div>`;

	initExpenseTypeSelect2();
	updateTotal();
	syncDateRange();
};

// ─── Form State & Validation ───
const getFormState = () => {
	const totalAmount = Number(normalizeDate(domAdd.newTotalAmount?.textContent || '0').replace(/[^0-9.\-]/g, '') || 0);
	const { from: dateFrom, to: dateTo } = getDateRange();
	return {
		totalAmount, dateFrom, dateTo,
		description: normalizeDate(domAdd.newDescription.value),
		payableTo: normalizeDate(domAdd.newPayableTo?.value || ''),
		address: normalizeDate(domAdd.newAddress?.value || ''),
		costCenterId: normalizeDate(domAdd.newCostCenter?.value || ''),
		ioNumber: normalizeDate(domAdd.newIoNumber?.value || ''),
	};
};

const validateBeforeSave = (statusCode) => {
	const state = getFormState();
	const missingIndex = expenseItems.findIndex((it) => !normalizeDate(it.documentDate) || !normalizeDate(it.expenseType) || !normalizeDate(it.reference) || getItemAmount(it) <= 0 || !normalizeDate(it.remarks));

	if (!state.description) return swal('warning', 'Missing fields', 'Description is required.'), null;
	if (!expenseItems.length) return swal('warning', 'Item required', 'Please add at least one expense item.'), null;
	if (missingIndex >= 0) {
		const item = expenseItems[missingIndex] || {};
		const missingFields = [];
		if (!normalizeDate(item.documentDate)) missingFields.push('Document Date');
		if (!normalizeDate(item.expenseType)) missingFields.push('Expense Type');
		if (!normalizeDate(item.reference)) missingFields.push('Reference');
		if (getItemAmount(item) <= 0) missingFields.push('Amount (> 0)');
		if (!normalizeDate(item.remarks)) missingFields.push('Remarks');
		return Swal.fire({ icon: 'warning', title: 'Incomplete item', html: `Row <strong>${missingIndex + 1}</strong> is missing: <strong>${escapeHtml(missingFields.join(', '))}</strong>.` }), null;
	}
	if (state.totalAmount <= 0) return swal('warning', 'Invalid total', 'Total must be greater than 0.'), null;
	if (statusCode === 'RMB_SUBMITTED' && !draftCanEdit) return swal('warning', 'Draft locked', `This draft is already ${draftAgeDays} day(s) old and can no longer be edited.`), null;

	return state;
};

// ─── Save / Submit ───
const sendReimbursement = (statusCode) => {
	const state = validateBeforeSave(statusCode);
	if (!state) return;

	const noAtt = expenseItems.find((it) => !getAllAttachments(it).length);

	const post = () => {
		const fd = new FormData();
		if (currentReimbursementId) fd.append('ReimbursementId', currentReimbursementId);
		fd.append('TotalAmount', state.totalAmount.toFixed(2));
		fd.append('StatusCode', statusCode);
		fd.append('Description', state.description);
		fd.append('CostCenterId', state.costCenterId);
		fd.append('PayableTo', state.payableTo);
		fd.append('Address', state.address);
		fd.append('IoNumber', state.ioNumber);
		fd.append('Expenses', JSON.stringify(expenseItems.map((it) => ({
			DocumentDate: it.documentDate, ExpenseCategory: it.expenseType, InvoiceReceiptNo: it.reference,
			ActualAmount: getItemAmount(it), IsVatable: Boolean(it.isVattable), Description: it.remarks,
			Attachment: getAttachmentNamesCsv(it), VendorName: it.vendorName || '', VendorAddress: it.vendorAddress || '', VendorTin: it.vendorTin || ''
		}))));
		expenseItems.forEach((it, i) => { (it.attachments || []).forEach((f) => fd.append(`attachments[${i}][]`, f)); });

		ajax_loader_formdata_loading('transactions/reimbursement/api/save', fd)
			.done((r) => {
				const res = parseRes(r);
				if (res.status !== 'success') return swal('error', 'Failed', res.response || 'Failed to save reimbursement.');
				const gid = res.data && res.data.id ? normalizeDate(res.data.id) : '';
				if (gid) { currentReimbursementId = gid; if (domAdd.reimbursementRef) domAdd.reimbursementRef.value = gid; }
				const isDraft = statusCode === 'RMB_DRAFT';
				const displayId = normalizeDate(gid || currentReimbursementId || '');

				Swal.fire({
					icon: 'success',
					title: isDraft ? 'Draft Saved' : 'Submitted',
					html: `${isDraft ? 'Draft saved' : 'Reimbursement submitted'} successfully.<br><strong>${escapeHtml(displayId || 'ID not available')}</strong>`,
				}).then(() => goToPath('transactions/reimbursement'));
			})
			.fail(() => swal('error', 'Request Failed', 'Could not connect to the server.'));
	};

	if (statusCode === 'RMB_SUBMITTED' && noAtt) {
		swal('warning', 'Missing attachment', 'Some expense items do not have attachments. Please confirm if you want to continue.', { showCancelButton: true, confirmButtonText: 'Continue', cancelButtonText: 'Review items', reverseButtons: true })
			.then((r) => { if (r.isConfirmed) post(); });
		return;
	}
	if (statusCode === 'RMB_SUBMITTED') {
		swal('question', 'Confirm Submission', 'Are you sure you want to proceed?', { showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No', reverseButtons: true })
			.then((r) => { if (r.isConfirmed) post(); });
		return;
	}
	post();
};

// ─── Editability & Draft ───
const setEditability = (editable) => {
	draftCanEdit = editable;
	const d = !editable;
	['newDescription', 'newPayableTo', 'newAddress', 'newCostCenter', 'newIoNumber', 'btnAddExpenseItem', 'btnSaveNewReimbursement', 'btnSaveDraftReimbursement'].forEach((k) => { if (domAdd[k]) domAdd[k].disabled = d; });
};

const loadDraftForEdit = () => {
	const draftRef = normalizeDate(domAdd.reimbursementRef?.value || '');
	if (!draftRef) return jQuery.Deferred().resolve().promise();
	currentReimbursementId = draftRef;

	return ajax_loader('transactions/reimbursement/api/get', { ReimbursementId: draftRef })
		.done((r) => {
			const res = parseRes(r);
			if (res.status !== 'success' || !res.data || !res.data.header) {
				swal('error', 'Unable to open draft', res.response || 'Draft reimbursement is not available.').then(() => goToPath('transactions/reimbursement'));
				return;
			}
			const payload = res.data, header = payload.header, details = payload.details || [];
			draftAgeDays = safeNum(payload.draftAgeDays);
			draftEditWindowDays = safeNum(payload.draftEditWindowDays) || draftEditWindowDays;
			setEditability(Boolean(payload.canEdit));

			domAdd.newDescription.value = normalizeDate(header.description);
			if (domAdd.newPayableTo) domAdd.newPayableTo.value = normalizeDate(header.payable_to);
			if (domAdd.newAddress) domAdd.newAddress.value = normalizeDate(header.address);
			if (domAdd.newIoNumber) domAdd.newIoNumber.value = normalizeDate(header.io_number);
			if (domAdd.newCostCenter) { domAdd.newCostCenter.innerHTML = getCostCenterOptions(header.cost_center_id); initCostCenterSelect2(); }

			expenseItems = details.map((d) => ({
				id: ++expenseItemCounter, documentDate: normalizeDate(d.document_date).slice(0, 10),
				expenseType: normalizeDate(d.expense_category || ''),
				reference: normalizeDate(d.invoice_receipt_no), amount: normalizeDate(d.actual_amount),
				isVattable: Boolean(Number(d.is_vatable || 0)),
				existingAttachments: normalizeDate(d.attachment).split(',').map((n) => n.trim()).filter(Boolean),
				attachments: [], remarks: normalizeDate(d.description),
				vendorName: normalizeDate(d.vendor_name || ''), vendorAddress: normalizeDate(d.vendor_address || ''), vendorTin: normalizeDate(d.vendor_tin || ''),
			}));
			if (!expenseItems.length) expenseItems = [createExpenseItem()];
			renderExpenseItems();
			if (!payload.canEdit) swal('info', 'Draft Locked', `This draft is ${draftAgeDays} day(s) old. Drafts can only be edited within ${draftEditWindowDays} day(s).`);
		})
		.fail(() => swal('error', 'Unable to open draft', 'Could not load draft reimbursement.').then(() => goToPath('transactions/reimbursement')));
};

// ─── Event Handlers ───
const onInput = (e) => {
	const t = e.target, itemId = Number(t.getAttribute('data-item-id')), field = t.getAttribute('data-item-field');
	if (!itemId || !field) return;
	const item = findExpenseItem(itemId);
	if (!item) return;
	if (field === 'isVattable') { item.isVattable = Boolean(t.checked); return; }
	item[field] = t.value;
	if (field === 'expenseType') t.title = normalizeDate((getExpenseTypeByCode(t.value) || {}).description);
	if (field === 'amount') { updateTotal(); return; }
	if (field === 'documentDate') syncDateRange();
};

const onChange = async (e) => {
	const t = e.target, itemId = Number(t.getAttribute('data-item-id')), fileMode = t.getAttribute('data-item-file');
	if (!itemId || !fileMode) return;
	const item = findExpenseItem(itemId);
	if (!item) return;

	item.attachments = []; item.existingAttachments = [];
	if (reimbursementReceiptOcr) reimbursementReceiptOcr.cancelOcr(itemId);
	const accepted = await ocr.add(itemId, Array.from(t.files || []));
	if (accepted.length) { item.attachments = [accepted[0]]; ocr.run(itemId, accepted[0]); }
	t.value = '';
	renderExpenseItems();
};

const onClick = (e) => {
	const btn = e.target.closest('[data-item-action]');
	if (!btn) return;
	const itemId = Number(btn.getAttribute('data-item-id')), action = btn.getAttribute('data-item-action');
	if (!itemId || !action) return;
	const item = findExpenseItem(itemId);
	if (!item) return;

	switch (action) {
		case 'remove':
			expenseItems = expenseItems.filter((it) => it.id !== itemId);
			renderExpenseItems();
			break;
		case 'attach': ocr.prompt(itemId); break;
		case 'ocrManual': if (reimbursementReceiptOcr && reimbursementReceiptOcr.markManual) reimbursementReceiptOcr.markManual(itemId); break;
	}
};

// ─── Init ───
const initAddPage = () => {
	cacheAddDom();
	draftEditWindowDays = safeNum(domAdd.draftEditWindowDays?.value) || 7;
	currentReimbursementId = normalizeDate(domAdd.reimbursementRef?.value || '');
	if (domAdd.newCostCenter) { domAdd.newCostCenter.innerHTML = getCostCenterOptions(''); initCostCenterSelect2(); }

	reimbursementReceiptOcr = window.SharedReceiptOcr && window.SharedReceiptOcr.create({
		maxAttachmentBytes: MAX_ATTACHMENT_BYTES, getExpenseItem: findExpenseItem, getExpenseTypeOptions: () => expenseTypeOptions,
		renderItems: renderExpenseItems, normalizeDate, escapeHtml, swal: Swal,
		ajaxLoaderFormDataLoading: ajax_loader_formdata_loading,
		ocrEndpoint: 'transactions/reimbursement/api/ocr', baseUrl: base_url
	});

	expenseItems = [createExpenseItem()];
	renderExpenseItems();
	loadExpenseTypes();
	if (currentReimbursementId) loadDraftForEdit();

	domAdd.btnSaveNewReimbursement?.addEventListener('click', () => sendReimbursement('RMB_SUBMITTED'));
	domAdd.btnSaveDraftReimbursement?.addEventListener('click', () => sendReimbursement('RMB_DRAFT'));
	domAdd.btnAddExpenseItem?.addEventListener('click', () => { expenseItems.push(createExpenseItem()); renderExpenseItems(); });
	domAdd.expenseItemsContainer?.addEventListener('input', onInput);
	domAdd.expenseItemsContainer?.addEventListener('change', onChange);
	domAdd.expenseItemsContainer?.addEventListener('click', onClick);
};
