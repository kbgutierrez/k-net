let teamViewReimbursementId = '';
let teamViewCanCorrect = false;
let teamViewItems = [];
let costCenterOptions = [];
let expenseTypeOptions = [];
let payableToUserOptions = [];
let currentEditItem = null;
let teamViewOcr = null;

const IMG_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;
const ATTACHMENTS_BASE = base_url + 'assets/uploads/attachments/';

const calculateVat = (grossAmount, isVatable) => {
	if (!isVatable || !grossAmount) return { netAmount: grossAmount, vatAmount: 0 };
	const net = Number(grossAmount) / 1.12;
	const vat = Number(grossAmount) - net;
	return { netAmount: Math.round(net * 100) / 100, vatAmount: Math.round(vat * 100) / 100 };
};

const renderAttachmentLink = (name) => {
	const url = ATTACHMENTS_BASE + encodeURIComponent(name);
	return IMG_EXTS.test(name)
		? `<span class="kna-thumb-wrap"><img src="${url}" alt="${teamViewEscapeHtml(name)}" style="max-width:32px;max-height:32px;border-radius:4px;margin-right:4px;" loading="lazy"><a href="${url}" target="_blank" rel="noopener">${teamViewEscapeHtml(name)}</a></span>`
		: `<a href="${url}" target="_blank" rel="noopener"><i class="fas fa-file-alt"></i> ${teamViewEscapeHtml(name)}</a>`;
};

const renderAttachmentList = (attachmentCsv) => {
	const names = (attachmentCsv || '').split(',').map((n) => n.trim()).filter(Boolean);
	if (!names.length) return '—';
	return names.map(renderAttachmentLink).join('<br>');
};

const teamViewFormatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const teamViewEscapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const teamViewFormatDate = (value) => {
	const raw = value ? String(value).slice(0, 10) : '';
	if (!raw) return '—';
	const date = new Date(`${raw}T00:00:00`);
	if (Number.isNaN(date.getTime())) return teamViewEscapeHtml(raw);
	return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
};

const teamViewNotify = (title, text, icon) => {
	if (typeof Swal !== 'undefined') {
		Swal.fire({ title, text, icon, confirmButtonText: 'OK' });
		return;
	}
	// eslint-disable-next-line no-alert
	alert(`${title}\n${text}`);
};

const getStatusBadgeClass = (statusCode) => {
	if (statusCode === 'RMB_APPROVED' || statusCode === 'RMB_PAID') return 'kna-badge-approved';
	if (statusCode === 'RMB_REJECTED') return 'kna-badge-rejected';
	return 'kna-badge-pending';
};

/* ─── Dropdown data (cost centers / expense types), same JSON-blob pattern as add.php/review.js ─── */

const loadDropdownData = () => {
	try {
		costCenterOptions = JSON.parse(document.getElementById('costCentersData')?.value || '[]');
	} catch (e) {
		costCenterOptions = [];
	}
	try {
		expenseTypeOptions = JSON.parse(document.getElementById('expenseTypesData')?.value || '[]');
	} catch (e) {
		expenseTypeOptions = [];
	}
	try {
		payableToUserOptions = JSON.parse(document.getElementById('payableToUsersData')?.value || '[]');
	} catch (e) {
		payableToUserOptions = [];
	}
};

const populatePayableToSelect = (selectedUserId, fallbackDisplayText) => {
	const select = document.getElementById('teamViewPayableTo');
	if (!select) return;

	const selected = String(selectedUserId || '');
	let opts = payableToUserOptions.map((u) => {
		const value = String(u.id || '');
		const isSelected = value === selected ? 'selected' : '';
		const label = `${u.firstname} ${u.lastname}${u.designation ? ' (' + u.designation + ')' : ''}`;
		return `<option value="${teamViewEscapeHtml(value)}" ${isSelected}>${teamViewEscapeHtml(label)}</option>`;
	}).join('');

	// Legacy free-typed value (or nothing picked yet) has no matching
	// id — show the resolved text as a disabled placeholder instead of
	// leaving the field blank; saving requires a fresh pick.
	if (!selected && fallbackDisplayText) {
		opts = `<option value="" selected disabled>${teamViewEscapeHtml(fallbackDisplayText)} (re-select to change)</option>${opts}`;
	}

	select.innerHTML = `<option value="">Select payable to</option>${opts}`;

	if (window.jQuery && jQuery.fn.select2) {
		const $s = jQuery(select);
		if ($s.hasClass('select2-hidden-accessible')) $s.select2('destroy');
		$s.select2({
			placeholder: 'Select payable to',
			allowClear: true,
			width: '100%',
			dropdownAutoWidth: false,
		});
		const $c = $s.next('.select2-container');
		$c.find('.select2-selection--single').css({ height: '32px', border: '1px solid #ced4da', borderRadius: '4px', background: '#fff' });
		$c.find('.select2-selection__rendered').css({ lineHeight: '30px', paddingLeft: '10px', paddingRight: '20px', fontSize: '12px', color: '#495057' });
		$c.find('.select2-selection__arrow').css({ height: '30px', width: '20px' });
	}
};

const getExpenseTypeDisplayText = (opt) => opt
	? `${teamViewEscapeHtml(opt.expense_code || '')} - ${teamViewEscapeHtml(opt.long_text || opt.category_name || '')}`.replace(/^ - | - $/g, '')
	: '';

const populateCostCenterSelect = (selectedCode) => {
	const select = document.getElementById('teamViewCostCenterId');
	if (!select) return;
	select.innerHTML = '<option value="">Select cost center</option>' + costCenterOptions.map((cc) => {
		const code = cc.cost_center_code || '';
		const selected = String(code) === String(selectedCode) ? 'selected' : '';
		return `<option value="${teamViewEscapeHtml(code)}" ${selected}>${teamViewEscapeHtml(code)} - ${teamViewEscapeHtml(cc.cost_center_name || '')}</option>`;
	}).join('');
};

const populateExpenseTypeSelect = (selectedCode) => {
	const select = document.getElementById('editItemExpenseCategory');
	if (!select) return;
	select.innerHTML = '<option value="">Select expense type</option>' + expenseTypeOptions.map((opt) => {
		const code = opt.expense_code || '';
		const selected = String(code) === String(selectedCode) ? 'selected' : '';
		return `<option value="${teamViewEscapeHtml(code)}" ${selected}>${getExpenseTypeDisplayText(opt)}</option>`;
	}).join('');

	if (window.jQuery && jQuery.fn.select2) {
		const $s = jQuery(select);
		if ($s.hasClass('select2-hidden-accessible')) $s.select2('destroy');
		$s.select2({
			placeholder: 'Select expense type',
			allowClear: false,
			width: '100%',
			dropdownAutoWidth: false,
			minimumResultsForSearch: 5,
			dropdownParent: jQuery('#modalEditTeamItem'),
		});
		// Same explicit sizing as reimbursement/add.js's initExpenseTypeSelect2 -
		// Select2's default theme renders noticeably bigger than our compact
		// form-control-sm inputs, so force it to match instead of relying on
		// stylesheet load order.
		const $c = $s.next('.select2-container');
		$c.find('.select2-selection--single').css({ height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff' });
		$c.find('.select2-selection__rendered').css({ lineHeight: '26px', paddingLeft: '8px', paddingRight: '20px', fontSize: '10px', color: '#374151' });
		$c.find('.select2-selection__arrow').css({ height: '26px', width: '20px' });
		$c.find('.select2-selection__arrow b').css({ borderWidth: '3px 3px 0 3px', marginTop: '-2px' });
	}
};

/* ─── OCR integration (same shared helper used by Reimbursement's own filing form) ─── */

const initOcr = () => {
	if (!window.SharedReceiptOcr) return;
	teamViewOcr = window.SharedReceiptOcr.create({
		ocrEndpoint: 'transactions/reimbursement/api/ocr',
		getExpenseItem: (id) => (currentEditItem && String(currentEditItem.id) === String(id) ? currentEditItem : null),
		getExpenseTypeOptions: () => expenseTypeOptions,
		renderItems: syncEditModalFromCurrentItem,
	});
};

const renderOcrStatusHtml = () => {
	if (!teamViewOcr || !currentEditItem) return '';
	const s = teamViewOcr.getItemOcrState(currentEditItem.id);
	if (!s || s.status === 'idle') return '';
	const manualBtn = `<button type="button" class="kna-ocr-manual-btn" id="btnEditItemOcrManual">Enter manually</button>`;
	const map = {
		scanning: `<div class="kna-ocr-status kna-ocr-scanning"><i class="fas fa-spinner fa-spin"></i> <span>Reading receipt…</span>${manualBtn}</div>`,
		success: `<div class="kna-ocr-status kna-ocr-success"><i class="fas fa-check"></i> <span>Auto-filled from receipt — please review</span></div>`,
		timeout: `<div class="kna-ocr-status kna-ocr-error"><i class="fas fa-exclamation-triangle"></i> <span>${teamViewEscapeHtml(s.error || '')}</span>${manualBtn}</div>`,
		error: `<div class="kna-ocr-status kna-ocr-error"><i class="fas fa-exclamation-triangle"></i> <span>${teamViewEscapeHtml(s.error || '')}</span>${manualBtn}</div>`,
		manual: '',
	};
	return map[s.status] || '';
};

const syncEditModalFromCurrentItem = () => {
	if (!currentEditItem) return;

	const summaryEl = document.getElementById('editItemAttachmentSummary');
	if (summaryEl) {
		if (currentEditItem.attachments && currentEditItem.attachments.length) {
			summaryEl.innerHTML = teamViewOcr ? teamViewOcr.attachmentsLabel(currentEditItem.attachments, currentEditItem.id) : currentEditItem.attachments[0].name;
		} else {
			summaryEl.innerHTML = renderAttachmentList(currentEditItem.existingAttachment);
		}
	}

	const statusEl = document.getElementById('editItemOcrStatus');
	if (statusEl) {
		statusEl.innerHTML = renderOcrStatusHtml();
		const manualBtn = document.getElementById('btnEditItemOcrManual');
		if (manualBtn) manualBtn.addEventListener('click', () => teamViewOcr.markManual(currentEditItem.id));
	}

	document.getElementById('editItemDocumentDate').value = currentEditItem.documentDate || '';
	populateExpenseTypeSelect(currentEditItem.expenseType || '');
	document.getElementById('editItemInvoiceReceiptNo').value = currentEditItem.reference || '';
	document.getElementById('editItemActualAmount').value = currentEditItem.amount || 0;
	document.getElementById('editItemIsVatable').checked = Boolean(currentEditItem.isVattable);
	document.getElementById('editItemDescription').value = currentEditItem.remarks || '';
	document.getElementById('editItemVendorName').value = currentEditItem.vendorName || '';
	document.getElementById('editItemVendorAddress').value = currentEditItem.vendorAddress || '';
	document.getElementById('editItemVendorTin').value = currentEditItem.vendorTin || '';

	recalculateEditItemVat();
};

const syncCurrentItemFromModalInputs = () => {
	if (!currentEditItem) return;
	currentEditItem.documentDate = document.getElementById('editItemDocumentDate').value;
	currentEditItem.expenseType = document.getElementById('editItemExpenseCategory').value;
	currentEditItem.reference = document.getElementById('editItemInvoiceReceiptNo').value;
	currentEditItem.amount = document.getElementById('editItemActualAmount').value;
	currentEditItem.isVattable = document.getElementById('editItemIsVatable').checked;
	currentEditItem.remarks = document.getElementById('editItemDescription').value;
	currentEditItem.vendorName = document.getElementById('editItemVendorName').value;
	currentEditItem.vendorAddress = document.getElementById('editItemVendorAddress').value;
	currentEditItem.vendorTin = document.getElementById('editItemVendorTin').value;
};

const promptAttach = () => {
	if (!teamViewOcr || !currentEditItem) return;
	teamViewOcr.promptAttachmentSource(currentEditItem.id, {
		onGallery: () => document.getElementById('editItemAttachmentUpload')?.click(),
		onCamera: async () => {
			if (await teamViewOcr.ensureCameraPermission()) {
				document.getElementById('editItemAttachmentCamera')?.click();
			}
		},
	});
};

const onAttachmentFileChosen = async (files) => {
	if (!teamViewOcr || !currentEditItem || !files || !files.length) return;
	currentEditItem.attachments = [];
	teamViewOcr.cancelOcr(currentEditItem.id);
	const accepted = await teamViewOcr.addItemAttachments(currentEditItem.id, Array.from(files));
	syncEditModalFromCurrentItem();
	if (accepted && accepted.length) {
		teamViewOcr.runOcrAutofillForItem(currentEditItem.id, accepted[0]);
	}
};

/* ─── Header + line item rendering ─── */

const renderTeamViewHeader = (header, canCorrect) => {
	const salesmanEl = document.getElementById('teamViewSalesman');
	const proxyBadge = document.getElementById('teamViewProxyBadge');
	const statusEl = document.getElementById('teamViewStatus');
	const totalEl = document.getElementById('teamViewTotal');
	const submittedEl = document.getElementById('teamViewSubmitted');
	const banner = document.getElementById('teamViewReadonlyBanner');

	if (salesmanEl) salesmanEl.textContent = header.user_name || '—';

	const filedBy = Number(header.filed_by || 0);
	const ownerId = Number(header.user_id || 0);
	if (proxyBadge) {
		if (filedBy && filedBy !== ownerId) {
			proxyBadge.textContent = `Filed by ${header.filed_by_name || ''}`;
			proxyBadge.classList.remove('d-none');
		} else {
			proxyBadge.classList.add('d-none');
		}
	}

	if (statusEl) {
		statusEl.innerHTML = `<span class="kna-badge ${getStatusBadgeClass(header.status_code)}">${teamViewEscapeHtml(header.status_name || header.status_code || '—')}</span>`;
	}

	if (totalEl) totalEl.textContent = teamViewFormatPHP(header.total_amount);
	if (submittedEl) submittedEl.textContent = teamViewFormatDate(header.created_date);

	populateCostCenterSelect(header.cost_center_id || '');

	const costCenterSelect = document.getElementById('teamViewCostCenterId');
	const payableToInput = document.getElementById('teamViewPayableTo');
	const addressInput = document.getElementById('teamViewAddress');
	const ioInput = document.getElementById('teamViewIo');

	populatePayableToSelect(header.payable_to_user_id, header.payable_to);
	if (addressInput) addressInput.value = header.address || '';
	if (ioInput) ioInput.value = header.io_number || '';

	if (!canCorrect) {
		[costCenterSelect, addressInput, ioInput].forEach((el) => {
			if (el) el.setAttribute('disabled', 'disabled');
		});
		if (payableToInput && window.jQuery) jQuery(payableToInput).prop('disabled', true);
		const btnSaveHeader = document.getElementById('btnSaveTeamHeader');
		if (btnSaveHeader) btnSaveHeader.classList.add('d-none');

		if (banner) {
			banner.textContent = 'This reimbursement has already been finalized and can no longer be corrected — view only.';
			banner.classList.remove('d-none');
		}
	}
};

const renderTeamViewItems = (items, canCorrect) => {
	const tbody = document.getElementById('teamViewItemsTbody');
	if (!tbody) return;

	if (!items.length) {
		tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted kna-small py-4">No line items.</td></tr>';
		return;
	}

	tbody.innerHTML = items.map((item) => `
		<tr>
			<td>${teamViewEscapeHtml(item.expense_category || '')} - ${teamViewEscapeHtml(item.category_name || '')}</td>
			<td>${teamViewEscapeHtml(item.description || '')}</td>
			<td>${teamViewEscapeHtml(item.invoice_receipt_no || '')}</td>
			<td>${teamViewFormatDate(item.document_date)}</td>
			<td class="text-right">${teamViewFormatPHP(item.actual_amount)}</td>
			<td>${teamViewEscapeHtml(item.vendor_name || '')}</td>
			<td>${renderAttachmentList(item.attachment)}</td>
			<td>
				${canCorrect ? `<button type="button" class="btn btn-outline-primary btn-xs kna-small py-1 px-2 btn-edit-item" data-detail-id="${item.id}">Edit</button>` : '—'}
			</td>
		</tr>
	`).join('');
};

const loadTeamViewData = () => {
	ajax_loader('transactions/reimbursement/api/get/team-full', { ReimbursementId: teamViewReimbursementId })
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				teamViewNotify('Unable to Load', res.response || 'Something went wrong while loading this reimbursement.', 'error');
				return;
			}

			const { header, details, canCorrect } = res.data || {};
			teamViewItems = details || [];
			teamViewCanCorrect = Boolean(canCorrect);

			renderTeamViewHeader(header || {}, teamViewCanCorrect);
			renderTeamViewItems(teamViewItems, teamViewCanCorrect);
		})
		.fail(() => {
			teamViewNotify('Unable to Load', 'Something went wrong while loading this reimbursement. Please try again.', 'error');
		});
};

const openEditItemModal = (detailId) => {
	const item = teamViewItems.find((i) => Number(i.id) === Number(detailId));
	if (!item) return;

	if (teamViewOcr) teamViewOcr.cancelOcr(item.id);

	currentEditItem = {
		id: item.id,
		documentDate: item.document_date ? String(item.document_date).slice(0, 10) : '',
		expenseType: item.expense_category || '',
		reference: item.invoice_receipt_no || '',
		amount: item.actual_amount || 0,
		isVattable: Boolean(Number(item.is_vatable)),
		remarks: item.description || '',
		vendorName: item.vendor_name || '',
		vendorAddress: item.vendor_address || '',
		vendorTin: item.vendor_tin || '',
		existingAttachment: item.attachment || '',
		attachments: [],
	};

	document.getElementById('editItemDetailId').value = item.id;
	syncEditModalFromCurrentItem();

	$('#modalEditTeamItem').modal('show');
};

const recalculateEditItemVat = () => {
	const gross = Number(document.getElementById('editItemActualAmount').value || 0);
	const isVatable = document.getElementById('editItemIsVatable').checked;
	const { netAmount, vatAmount } = calculateVat(gross, isVatable);
	document.getElementById('editItemNetAmount').value = netAmount;
	document.getElementById('editItemVatAmount').value = vatAmount;
};

const saveTeamItem = () => {
	syncCurrentItemFromModalInputs();

	const formData = new FormData();
	formData.append('ReimbursementId', teamViewReimbursementId);
	formData.append('DetailId', document.getElementById('editItemDetailId').value);
	formData.append('ExpenseCategory', document.getElementById('editItemExpenseCategory').value);
	formData.append('Description', document.getElementById('editItemDescription').value);
	formData.append('InvoiceReceiptNo', document.getElementById('editItemInvoiceReceiptNo').value);
	formData.append('DocumentDate', document.getElementById('editItemDocumentDate').value);
	formData.append('ActualAmount', document.getElementById('editItemActualAmount').value);
	formData.append('NetAmount', document.getElementById('editItemNetAmount').value);
	formData.append('VatAmount', document.getElementById('editItemVatAmount').value);
	formData.append('IsVatable', document.getElementById('editItemIsVatable').checked ? 1 : 0);
	formData.append('VendorName', document.getElementById('editItemVendorName').value);
	formData.append('VendorTin', document.getElementById('editItemVendorTin').value);
	formData.append('VendorAddress', document.getElementById('editItemVendorAddress').value);

	if (currentEditItem && currentEditItem.attachments && currentEditItem.attachments.length) {
		formData.append('Attachment', currentEditItem.attachments[0]);
	}

	ajax_loader_formdata('transactions/reimbursement/api/update/team-item', formData)
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				teamViewNotify('Unable to Save', res.response || 'Something went wrong while saving.', 'error');
				return;
			}
			$('#modalEditTeamItem').modal('hide');
			teamViewNotify('Saved', 'Line item corrected successfully.', 'success');
			loadTeamViewData();
		})
		.fail(() => {
			teamViewNotify('Unable to Save', 'Something went wrong while saving. Please try again.', 'error');
		});
};

const saveTeamHeader = () => {
	const payload = {
		ReimbursementId: teamViewReimbursementId,
		CostCenterId: document.getElementById('teamViewCostCenterId').value,
		PayableTo: document.getElementById('teamViewPayableTo').value,
		Address: document.getElementById('teamViewAddress').value,
		IO: document.getElementById('teamViewIo').value,
	};

	ajax_loader('transactions/reimbursement/api/update/team-header', payload)
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				teamViewNotify('Unable to Save', res.response || 'Something went wrong while saving.', 'error');
				return;
			}
			teamViewNotify('Saved', 'Reimbursement details corrected successfully.', 'success');
		})
		.fail(() => {
			teamViewNotify('Unable to Save', 'Something went wrong while saving. Please try again.', 'error');
		});
};

const initTeamViewPage = () => {
	const page = document.getElementById('teamViewPage');
	if (!page) return;

	teamViewReimbursementId = page.getAttribute('data-reimbursement-id') || '';

	loadDropdownData();
	initOcr();

	const tbody = document.getElementById('teamViewItemsTbody');
	if (tbody) {
		tbody.addEventListener('click', (event) => {
			const btn = event.target.closest('.btn-edit-item');
			if (!btn) return;
			openEditItemModal(btn.getAttribute('data-detail-id'));
		});
	}

	const btnSaveTeamItem = document.getElementById('btnSaveTeamItem');
	if (btnSaveTeamItem) btnSaveTeamItem.addEventListener('click', saveTeamItem);

	const editItemActualAmount = document.getElementById('editItemActualAmount');
	if (editItemActualAmount) editItemActualAmount.addEventListener('input', recalculateEditItemVat);

	const editItemIsVatable = document.getElementById('editItemIsVatable');
	if (editItemIsVatable) editItemIsVatable.addEventListener('change', recalculateEditItemVat);

	const btnEditItemAttach = document.getElementById('btnEditItemAttach');
	if (btnEditItemAttach) btnEditItemAttach.addEventListener('click', promptAttach);

	const editItemAttachmentUpload = document.getElementById('editItemAttachmentUpload');
	if (editItemAttachmentUpload) editItemAttachmentUpload.addEventListener('change', (e) => onAttachmentFileChosen(e.target.files));

	const editItemAttachmentCamera = document.getElementById('editItemAttachmentCamera');
	if (editItemAttachmentCamera) editItemAttachmentCamera.addEventListener('change', (e) => onAttachmentFileChosen(e.target.files));

	const btnSaveTeamHeader = document.getElementById('btnSaveTeamHeader');
	if (btnSaveTeamHeader) btnSaveTeamHeader.addEventListener('click', saveTeamHeader);

	loadTeamViewData();
};

$(document).ready(() => {
	initTeamViewPage();
});
