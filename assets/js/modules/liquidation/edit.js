let editExpenseItems = [];
let editExpenseItemCounter = 0;
let editExpenseTypeOptions = [];
let editLiquidationData = null;

// === OCR module instance for edit page ===
let editReceiptOcr = null;

const domEdit = {
    liquidationRef: null,
    cashAdvanceId: null,
    editLiquidationNo: null,
    editCaRef: null,
    editCaAmount: null,
    editCaDate: null,
    editExpenseDate: null,
    editLiquidatedAmount: null,
    editVariance: null,
    editPurpose: null,
    editStatus: null,
    editSubmittedDate: null,
    editExpenseItems: null,
    editItemCount: null,
    rejectedBanner: null,
    rejectedCount: null,
    btnAddNewItem: null,
    btnSaveEdit: null,
    btnSaveAsDraft: null,
};

const EDIT_IMG_EXTS = /\.(jpg|jpeg|png|gif|webp)$/i;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

// Store object URLs to prevent memory leaks
const editObjectUrls = new Map();

const revokeEditObjectUrls = (editId) => {
    const urls = editObjectUrls.get(editId);
    if (urls) {
        urls.forEach((url) => {
            try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        });
        editObjectUrls.delete(editId);
    }
};

const storeEditObjectUrl = (editId, url) => {
    if (!editObjectUrls.has(editId)) {
        editObjectUrls.set(editId, []);
    }
    editObjectUrls.get(editId).push(url);
};

// ===== ATTACHMENT HELPERS =====

const getEditItemAttachmentNames = (item) => {
    const existing = (item.existingAttachments || []).map((name) => normalizeDate(name)).filter(Boolean);
    const newFiles = (item.newAttachments || []).map((f) => f.name || f.fileName || '').filter(Boolean);
    return existing.concat(newFiles);
};

const getEditItemAttachmentNamesCsv = (item) => {
    const newFiles = (item.newAttachments || []).map((f) => f.name || f.fileName || '').filter(Boolean);
    if (newFiles.length > 0) {
        return newFiles.join(',');
    }
    const existing = (item.existingAttachments || []).map((name) => normalizeDate(name)).filter(Boolean);
    const keptExisting = existing.filter((name) => !(item.removedAttachments || []).includes(name));
    return keptExisting.join(',');
};

const normalizeDate = (value) => (value ? String(value) : '');
const formatPHP = (amount) => {
	const value = Number(amount || 0);
	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
};

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const getStatusBadge = (status) => {
	if (status === 'Draft') {
		return '<span class="kna-badge kna-badge-draft">Draft</span>';
	}
	if (status === 'Approved') {
		return '<span class="kna-badge kna-badge-approved">Approved</span>';
	}
	if (status === 'Rejected') {
		return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
	}
	return '<span class="kna-badge kna-badge-pending">Submitted</span>';
};

const openEditLightbox = (url) => {
    const lb = document.getElementById('knaLightbox');
    const img = document.getElementById('knaLightboxImg');
    if (lb && img) {
        img.src = url;
        lb.classList.remove('d-none');
    }
};

const renderEditAttachment = (name, item, isRemoved = false) => {
    const url = `${base_url}assets/uploads/attachments/${encodeURIComponent(name)}`;
    if (EDIT_IMG_EXTS.test(name)) {
        return `<span class="kna-thumb-wrap ${isRemoved ? 'removed' : ''}" data-lightbox="${escapeHtml(url)}" data-filename="${escapeHtml(name)}" data-edit-id="${item._editId}">
            ${!isRemoved ? `<button type="button" class="kna-thumb-remove" data-edit-action="removeAttachment" data-edit-id="${item._editId}" data-filename="${escapeHtml(name)}" title="Remove attachment">&#x2715;</button>` : ''}
            <img class="kna-thumb" src="${url}" alt="${escapeHtml(name)}" loading="lazy">
            <span class="kna-thumb-label">${escapeHtml(name)}</span>
            ${isRemoved ? `<span class="kna-attach-undo" data-edit-action="undoRemoveAttachment" data-edit-id="${item._editId}" data-filename="${escapeHtml(name)}">Undo</span>` : ''}
        </span>`;
    }
    return `<span class="kna-file-wrap ${isRemoved ? 'removed' : ''}" data-filename="${escapeHtml(name)}" data-edit-id="${item._editId}">
            <i class="fas fa-file-alt" style="color:#6366f1;font-size:11px;"></i>
            <a href="${url}" target="_blank" rel="noopener">${escapeHtml(name)}</a>
            ${!isRemoved ? `<i class="fas fa-times kna-file-remove" data-edit-action="removeAttachment" data-edit-id="${item._editId}" data-filename="${escapeHtml(name)}" title="Remove attachment"></i>` : ''}
            ${isRemoved ? `<span class="kna-attach-undo" data-edit-action="undoRemoveAttachment" data-edit-id="${item._editId}" data-filename="${escapeHtml(name)}">Undo</span>` : ''}
        </span>`;
};

const getEditExpenseTypeById = (idValue) =>
    editExpenseTypeOptions.find((item) => String(item.id) === String(idValue));

const editExpenseTypeOptionsMarkup = (selectedValue) =>
    `<option value="">Select type</option>${editExpenseTypeOptions
        .map((option) => {
            const id = normalizeDate(option.id);
            const categoryName = normalizeDate(option.categoryName);
            const description = normalizeDate(option.description);
            return `<option value="${escapeHtml(id)}" title="${escapeHtml(description)}" ${String(selectedValue) === String(id) ? 'selected' : ''}>${escapeHtml(categoryName)}</option>`;
        })
        .join('')}`;

const getItemApprovalStatus = (item) => {
    const approvals = item.approvals || [];
    if (!approvals.length) {
        return { status: 'pending', canEdit: true, rejections: [] };
    }

    const rejections = approvals.filter((a) => normalizeDate(a.status) === 'REJECTED');
    const hasApproved = approvals.some((a) => normalizeDate(a.status) === 'APPROVED');
    const hasRejected = rejections.length > 0;
    const allApproved = approvals.every((a) => normalizeDate(a.status) === 'APPROVED');

    if (allApproved) {
        return { status: 'approved', canEdit: false, rejections: [] };
    }
    if (hasRejected) {
        return { status: 'rejected', canEdit: true, rejections };
    }
    if (hasApproved) {
        return { status: 'partial', canEdit: true, rejections: [] };
    }
    return { status: 'pending', canEdit: true, rejections: [] };
};

const buildRejectionRibbon = (rejections) => {
    if (!rejections || !rejections.length) {
        return '';
    }
    const pills = rejections.map((rej) => {
        const approver = normalizeDate(rej.approver_name || rej.approver || 'Approver');
        const reason = normalizeDate(rej.remarks || rej.rejection_reason || 'No reason provided');
        return `<span class="kna-rejection-pill"><i class="fas fa-times-circle"></i> <strong>${escapeHtml(approver)}:</strong> "${escapeHtml(reason)}"</span>`;
    }).join('');

    return `
        <div class="kna-rejection-ribbon">
            <span class="kna-rejection-ribbon-label"><i class="fas fa-exclamation-circle"></i> Rejected</span>
            ${pills}
        </div>
    `;
};
const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};


const renderEditExpenseItems = () => {
    const container = domEdit.editExpenseItems;
    if (!container) {
        return;
    }

    if (!editExpenseItems || !editExpenseItems.length) {
        container.innerHTML = '<div class="text-muted kna-small py-2">No expense items found.</div>';
        return;
    }

    let rejectedCount = 0;

    // Desktop: grid-based table rows
    let desktopRowsHtml = '';
    editExpenseItems.forEach((item, i) => {
        const approval = getItemApprovalStatus(item);
        const isLocked = !approval.canEdit;
        const isRejected = approval.status === 'rejected';
        const rowClass = isLocked ? 'kna-row-locked' : (isRejected ? 'kna-row-rejected' : '');
        const disabledAttr = isLocked ? 'disabled' : '';
        const lockIcon = isLocked ? '<i class="fas fa-lock kna-lock-icon" title="Approved — cannot edit"></i> ' : '';

        if (isRejected) {
            rejectedCount++;
        }

        const docDate = normalizeDate(item.document_date || '').slice(0, 10);
        const category = normalizeDate(item.expense_category || item.expense_category_id || '');
        const reference = normalizeDate(item.invoice_receipt_no || '') || '';
        const amount = Number(item.actual_amount || 0);
        const isVattable = Boolean(Number(item.is_vatable || 0));
        const description = normalizeDate(item.description || '');

        const existingAttachments = item.existingAttachments || [];
        const removedAttachments = item.removedAttachments || [];
        const newAttachments = item.newAttachments || [];

        const isOcrLoading = editReceiptOcr ? editReceiptOcr.isItemOcrLoading(item._editId) : false;
        const hasCompressed = newAttachments.some((f) => f._wasCompressed);

        // === CHANGED: Single attachment display - show ONLY new OR existing (not both) ===
        let attachHtml = '';
        let hasAttachment = false;
        
        // Priority: show new attachment (it replaces existing)
        if (newAttachments.length > 0) {
            const file = newAttachments[0];
            const name = file.name || file.fileName || 'New file';
            // Use stored object URL or create new one
            let objectUrl = file._objectUrl;
            if (!objectUrl) {
                objectUrl = URL.createObjectURL(file);
                file._objectUrl = objectUrl; // Store on file object to persist across renders
                storeEditObjectUrl(item._editId, objectUrl);
            }
            attachHtml = `<span class="kna-thumb-wrap" data-new-file="true" data-edit-id="${item._editId}">
                <img class="kna-thumb" src="${objectUrl}" alt="${escapeHtml(name)}" loading="lazy">
                <span class="kna-thumb-label">${escapeHtml(name)}</span>
                <button type="button" class="kna-thumb-remove" data-edit-action="removeNewAttachment" data-edit-id="${item._editId}" data-file-index="0" title="Remove">&#x2715;</button>
            </span>`;
            hasAttachment = true;
        } 
        // Otherwise show existing attachment (if not removed)
        else if (existingAttachments.length > 0) {
            const name = existingAttachments[0];
            const isRemoved = removedAttachments.includes(name);
            attachHtml = renderEditAttachment(name, item, isRemoved);
            hasAttachment = !isRemoved;
        }
        
        if (!attachHtml) {
            attachHtml = '<span class="text-muted" style="font-size:11px;">—</span>';
        }

        const rejectionRibbon = isRejected && approval.rejections.length
            ? buildRejectionRibbon(approval.rejections)
            : '';

        const attachBtnLabel = hasAttachment ? 'Replace' : 'Attach';

        const ocrLoadingIcon = isOcrLoading ? ' <i class="fas fa-spinner fa-spin" title="OCR in progress"></i>' : '';
        const compressedIcon = hasCompressed ? ' <i class="fas fa-compress-alt" title="Compressed"></i>' : '';

        desktopRowsHtml += `
            <div class="kna-item-table kna-item-table-row ${rowClass}" data-edit-item-id="${item._editId}">
                <div><input type="date" class="kna-edit-input" data-edit-field="documentDate" data-edit-id="${item._editId}" value="${escapeHtml(docDate)}" ${disabledAttr}></div>
                <div>
                    ${lockIcon}
                    <select class="kna-edit-select" data-edit-field="expenseCategory" data-edit-id="${item._editId}" ${disabledAttr}>
                        ${editExpenseTypeOptionsMarkup(category)}
                    </select>
                </div>
                <div><input type="text" class="kna-edit-input" data-edit-field="reference" data-edit-id="${item._editId}" value="${escapeHtml(reference)}" placeholder="Invoice / OR no." ${disabledAttr}></div>
                <div><input type="number" min="0" step="0.01" class="kna-edit-input kna-edit-number" data-edit-field="amount" data-edit-id="${item._editId}" value="${escapeHtml(amount)}" placeholder="0.00" ${disabledAttr}></div>
                <div class="text-center"><label class="kna-vat-wrap"><input type="checkbox" class="kna-edit-checkbox" data-edit-field="isVattable" data-edit-id="${item._editId}" ${isVattable ? 'checked' : ''} ${disabledAttr}></label></div>
                <div>
                    <div class="kna-attachment-cell">${attachHtml}${ocrLoadingIcon}${compressedIcon}</div>
                    ${!isLocked ? `<button type="button" class="btn btn-outline-primary btn-sm kna-small" data-edit-action="attach" data-edit-id="${item._editId}">${attachBtnLabel}</button>` : ''}
                    <input type="file" class="d-none" data-edit-file="upload" data-edit-id="${item._editId}" accept="image/*">
                    <input type="file" class="d-none" data-edit-file="camera" data-edit-id="${item._editId}" accept="image/*" capture="environment">
                </div>
                <div>
                    <input type="text" class="kna-edit-input" data-edit-field="description" data-edit-id="${item._editId}" value="${escapeHtml(description)}" placeholder="Remarks" ${disabledAttr}>
                    ${rejectionRibbon}
                </div>
                <div class="text-center">
                    ${!isLocked ? `<button type="button" class="kna-remove-btn" data-edit-action="remove" data-edit-id="${item._editId}" title="Remove item"><i class="fas fa-trash"></i></button>` : '<span class="kna-lock-icon"><i class="fas fa-lock"></i></span>'}
                </div>
            </div>
        `;
    });

    // Mobile cards
    const mobileCardsHtml = editExpenseItems
        .map((item, i) => {
            const approval = getItemApprovalStatus(item);
            const isLocked = !approval.canEdit;
            const isRejected = approval.status === 'rejected';
            const disabledAttr = isLocked ? 'disabled' : '';
            const lockIcon = isLocked ? '<i class="fas fa-lock kna-lock-icon" title="Approved — cannot edit"></i> ' : '';

            const docDate = normalizeDate(item.document_date || '').slice(0, 10);
            const category = normalizeDate(item.expense_category || item.expense_category_id || '');
            const reference = normalizeDate(item.invoice_receipt_no || '') || '—';
            const amount = Number(item.actual_amount || 0);
            const isVattable = Boolean(Number(item.is_vatable || 0));
            const description = normalizeDate(item.description || '') || '—';

            const selectedExpenseType = getEditExpenseTypeById(category);
            const selectedExpenseDescription = normalizeDate((selectedExpenseType || {}).description);

            const existingAttachments = item.existingAttachments || [];
            const removedAttachments = item.removedAttachments || [];
            const newAttachments = item.newAttachments || [];

            const isOcrLoading = editReceiptOcr ? editReceiptOcr.isItemOcrLoading(item._editId) : false;
            const hasCompressed = newAttachments.some((f) => f._wasCompressed);

            let attachHtml = '';
            let hasAttachment = false;
            
            if (newAttachments.length > 0) {
                const file = newAttachments[0];
                const name = file.name || file.fileName || 'New file';
                let objectUrl = file._objectUrl;
                if (!objectUrl) {
                    objectUrl = URL.createObjectURL(file);
                    file._objectUrl = objectUrl;
                    storeEditObjectUrl(item._editId, objectUrl);
                }
                attachHtml = `<span class="kna-thumb-wrap" data-new-file="true" data-edit-id="${item._editId}">
                    <img class="kna-thumb" src="${objectUrl}" alt="${escapeHtml(name)}" loading="lazy">
                    <span class="kna-thumb-label">${escapeHtml(name)}</span>
                    <button type="button" class="kna-thumb-remove" data-edit-action="removeNewAttachment" data-edit-id="${item._editId}" data-file-index="0" title="Remove">&#x2715;</button>
                </span>`;
                hasAttachment = true;
            } else if (existingAttachments.length > 0) {
                const name = existingAttachments[0];
                const isRemoved = removedAttachments.includes(name);
                attachHtml = renderEditAttachment(name, item, isRemoved);
                hasAttachment = !isRemoved;
            }
            
            if (!attachHtml) {
                attachHtml = '<span class="text-muted">—</span>';
            }

            const rejectionBlock = isRejected && approval.rejections.length
                ? `<div class="kna-rejection-box-mobile">
                    ${approval.rejections.map((rej) => {
                        const approver = normalizeDate(rej.approver_name || rej.approver || 'Approver');
                        const reason = normalizeDate(rej.remarks || rej.rejection_reason || 'No reason provided');
                        return `<div class="kna-rejection-item"><i class="fas fa-times-circle"></i> <strong>${escapeHtml(approver)}:</strong> "${escapeHtml(reason)}"</div>`;
                    }).join('')}
                </div>`
                : '';

            const cardClass = isRejected ? 'kna-exp-card kna-exp-card-rejected' : 'kna-exp-card';
            const cardLockedClass = isLocked ? ' kna-row-locked' : '';
            const cardStatus = isRejected ? 'rejected' : (isLocked ? 'approved' : 'pending');

            const attachmentButtonLabel = hasAttachment ? 'Replace' : 'Attach';

            const ocrLoadingIcon = isOcrLoading ? ' <i class="fas fa-spinner fa-spin" title="OCR in progress"></i>' : '';
            const compressedIcon = hasCompressed ? ' <i class="fas fa-compress-alt" title="Compressed"></i>' : '';

            return `
                <div class="${cardClass}${cardLockedClass}" data-edit-item-id="${item._editId}" data-status="${cardStatus}">
                    <div class="kna-exp-card-head">
                        <div>
                            <div class="kna-exp-card-title">${lockIcon}${escapeHtml(selectedExpenseType?.categoryName || 'Expense Item')} <span class="kna-exp-card-sub">#${i + 1}</span></div>
                            <div class="kna-exp-card-meta">${escapeHtml(docDate)} • ${escapeHtml(reference)}</div>
                            ${rejectionBlock}
                        </div>
                        <div class="kna-exp-card-actions">
                            ${!isLocked ? `<button type="button" class="btn btn-outline-primary btn-sm kna-small" data-edit-action="attach" data-edit-id="${item._editId}">${attachmentButtonLabel}</button>` : ''}
                            ${!isLocked ? `<button type="button" class="btn btn-outline-danger btn-sm kna-small" data-edit-action="remove" data-edit-id="${item._editId}" title="Remove item"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </div>

                    <div class="kna-exp-card-grid">
                        <div class="kna-exp-card-field">
                            <span class="kna-exp-card-label">Document Date</span>
                            <input type="date" class="kna-edit-input" data-edit-field="documentDate" data-edit-id="${item._editId}" value="${escapeHtml(docDate)}" ${disabledAttr}>
                        </div>
                        <div class="kna-exp-card-field">
                            <span class="kna-exp-card-label">Expense Type</span>
                            <select class="kna-edit-select" data-edit-field="expenseCategory" data-edit-id="${item._editId}" ${disabledAttr}>${editExpenseTypeOptionsMarkup(category)}</select>
                        </div>
                        <div class="kna-exp-card-field">
                            <span class="kna-exp-card-label">Reference</span>
                            <input type="text" class="kna-edit-input" data-edit-field="reference" data-edit-id="${item._editId}" value="${escapeHtml(reference)}" placeholder="Invoice / OR no." ${disabledAttr}>
                        </div>
                        <div class="kna-exp-card-field">
                            <span class="kna-exp-card-label">Amount</span>
                            <input type="number" min="0" step="0.01" class="kna-edit-input kna-edit-number" data-edit-field="amount" data-edit-id="${item._editId}" value="${escapeHtml(amount)}" placeholder="0.00" ${disabledAttr}>
                        </div>
                        <div class="kna-exp-card-field">
                            <span class="kna-exp-card-label">VAT</span>
                            <label class="kna-vat-wrap">
                                <input type="checkbox" class="kna-edit-checkbox" data-edit-field="isVattable" data-edit-id="${item._editId}" ${isVattable ? 'checked' : ''} ${disabledAttr}>
                                ${isVattable ? 'Vattable' : 'Non-vattable'}
                            </label>
                        </div>
                        <div class="kna-exp-card-field kna-exp-card-field-full">
                            <span class="kna-exp-card-label">Attachment</span>
                            <span class="kna-exp-card-value kna-exp-card-attach">
                                ${attachHtml}${ocrLoadingIcon}${compressedIcon}
                            </span>
                            <input type="file" class="d-none" data-edit-file="upload" data-edit-id="${item._editId}" accept="image/*">
                            <input type="file" class="d-none" data-edit-file="camera" data-edit-id="${item._editId}" accept="image/*" capture="environment">
                        </div>
                        <div class="kna-exp-card-field kna-exp-card-field-full">
                            <span class="kna-exp-card-label">Remarks</span>
                            <input type="text" class="kna-edit-input" data-edit-field="description" data-edit-id="${item._editId}" value="${escapeHtml(description)}" placeholder="Remarks" ${disabledAttr}>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');

    const total = editExpenseItems.reduce((sum, e) => sum + Number(e.actual_amount || e.amount || 0), 0);
    const totalNet = editExpenseItems.reduce((sum, e) => sum + Number(e.net_amount || 0), 0);
    const totalVat = editExpenseItems.reduce((sum, e) => sum + Number(e.vat_amount || 0), 0);

    container.innerHTML = `
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
            <div class="kna-mobile-summary">
                <div class="kna-fin-label">Total</div>
                <div class="kna-fin-value">${formatPHP(total)}</div>
                <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Net ${formatPHP(totalNet)} • VAT ${formatPHP(totalVat)}</div>
            </div>
        </div>
    `;

    if (domEdit.rejectedBanner && domEdit.rejectedCount) {
        if (rejectedCount > 0) {
            domEdit.rejectedBanner.classList.remove('d-none');
            domEdit.rejectedCount.textContent = rejectedCount;
        } else {
            domEdit.rejectedBanner.classList.add('d-none');
        }
    }

    if (domEdit.editItemCount) {
        domEdit.editItemCount.textContent = `${editExpenseItems.length} item(s)`;
    }

    if (domEdit.editLiquidatedAmount) {
        domEdit.editLiquidatedAmount.textContent = formatPHP(total);
    }
    updateEditVariance();
};

const updateEditVariance = () => {
    if (!domEdit.editVariance || !domEdit.editCaAmount) {
        return;
    }

    const caAmount = Number(domEdit.editCaAmount.textContent.replace(/[^0-9.]/g, '') || 0);
    const total = editExpenseItems.reduce((sum, e) => sum + Number(e.actual_amount || e.amount || 0), 0);
    const refund = caAmount > total ? caAmount - total : 0;
    const reimburse = total > caAmount ? total - caAmount : 0;

    let badgeHtml = '<span class="kna-var-badge kna-var-balanced">0.00</span>';
    if (refund > 0) {
        badgeHtml = `<span class="kna-var-badge kna-var-return">${formatPHP(refund)} to return</span>`;
    } else if (reimburse > 0) {
        badgeHtml = `<span class="kna-var-badge kna-var-reimburse">${formatPHP(reimburse)} to reimburse</span>`;
    }

    domEdit.editVariance.innerHTML = badgeHtml;
};

const createNewEditItem = () => ({
    _editId: ++editExpenseItemCounter,
    id: null,
    document_date: '',
    expense_category: '',
    invoice_receipt_no: '',
    actual_amount: '',
    is_vatable: false,
    attachment: '',
    existingAttachments: [],
    newAttachments: [],
    removedAttachments: [],
    description: '',
    net_amount: 0,
    vat_amount: 0,
    approvals: [],
    isNew: true,
});

const findEditItem = (editId) => editExpenseItems.find((item) => item._editId === editId);

const loadEditExpenseTypes = () => {
    const request = $.ajax({
        url: base_url + 'transactions/liquidation/api/get/expense_types',
        type: 'POST',
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer 12345678'
        }
    });

    request.done((response) => {
        const res = (typeof response === 'string') ? $.parseJSON(response) : response;
        if (res.status !== 'success') {
            editExpenseTypeOptions = [];
            renderEditExpenseItems();
            return;
        }
        const options = (res.data || []).map((item) => ({
            id: Number(item.id || 0),
            categoryName: normalizeDate(item.category_name),
            description: normalizeDate(item.description),
        })).filter((item) => item.id && item.categoryName);
        editExpenseTypeOptions = options;
        renderEditExpenseItems();
    }).fail(() => {
        editExpenseTypeOptions = [];
        renderEditExpenseItems();
    });
    return request;
};

const loadEditData = () => {
    const ref = normalizeDate(domEdit.liquidationRef ? domEdit.liquidationRef.value : '');
    if (!ref) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No liquidation reference provided.',
        }).then(() => {
            goToPath('transactions/liquidation');
        });
        return;
    }

    ajax_loader('transactions/liquidation/api/get/header', { Take: 100 }).done((response) => {
        const res = (typeof response === 'string') ? $.parseJSON(response) : response;
        if (res.status !== 'success') {
            return;
        }

        const record = (res.data || []).find((r) => normalizeDate(r.liquidation_id) === ref);
        if (!record) {
            Swal.fire({
                icon: 'error',
                title: 'Not Found',
                text: 'Liquidation record not found.',
            }).then(() => {
                goToPath('transactions/liquidation');
            });
            return;
        }

        editLiquidationData = record;

        const currentUserId = Number(window.currentUserId || 0);
        const createdById = Number(record.created_by_id || record.created_by || 0);
        const statusCode = normalizeDate(record.status_code || '');

        if (createdById !== currentUserId) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You can only edit your own liquidations.',
            }).then(() => {
                goToPath('transactions/liquidation');
            });
            return;
        }

        if (statusCode !== 'LQ_SUBMITTED') {
            Swal.fire({
                icon: 'warning',
                title: 'Cannot Edit',
                text: 'Only submitted liquidations can be edited.',
            }).then(() => {
                goToPath('transactions/liquidation');
            });
            return;
        }

        if (domEdit.editLiquidationNo) domEdit.editLiquidationNo.textContent = normalizeDate(record.liquidation_id);
        if (domEdit.editCaRef) domEdit.editCaRef.textContent = normalizeDate(record.cash_advance_id);
        if (domEdit.editCaAmount) domEdit.editCaAmount.textContent = formatPHP(Number(record.ca_amount || 0));
        if (domEdit.editCaDate) domEdit.editCaDate.textContent = normalizeDate(record.submitted_date || '').slice(0, 10);
        if (domEdit.editStatus) domEdit.editStatus.innerHTML = getStatusBadge(normalizeDate(record.status_name));
        if (domEdit.editSubmittedDate) domEdit.editSubmittedDate.textContent = normalizeDate(record.submitted_date || '').slice(0, 10);
        if (domEdit.editPurpose) domEdit.editPurpose.textContent = normalizeDate(record.description || '') || '-';
        if (domEdit.cashAdvanceId) domEdit.cashAdvanceId.value = normalizeDate(record.cash_advance_id);

        const refund = Number(record.refund_amount || 0);
        const reimburse = Number(record.reimburse_amount || 0);
        if (domEdit.editVariance) {
            let badgeHtml = '<span class="kna-var-badge kna-var-balanced">0.00</span>';
            if (refund > 0) badgeHtml = `<span class="kna-var-badge kna-var-return">${formatPHP(refund)} to return</span>`;
            else if (reimburse > 0) badgeHtml = `<span class="kna-var-badge kna-var-reimburse">${formatPHP(reimburse)} to reimburse</span>`;
            domEdit.editVariance.innerHTML = badgeHtml;
        }
    });

    ajax_loader('transactions/liquidation/api/get/for_edit', { LiquidationId: ref }).done((response) => {
        const res = (typeof response === 'string') ? $.parseJSON(response) : response;
        if (res.status !== 'success') {
            if (domEdit.editExpenseItems) {
                domEdit.editExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
            }
            return;
        }

        const details = res.data && res.data.details ? res.data.details : [];

        editExpenseItems = details.map((item) => {
            const existingAttachments = normalizeDate(item.attachment || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            return {
                ...item,
                _editId: ++editExpenseItemCounter,
                isNew: false,
                existingAttachments: existingAttachments,
                newAttachments: [],
                removedAttachments: [],
            };
        });

        renderEditExpenseItems();

        if (domEdit.editExpenseDate && editExpenseItems.length) {
            const dates = editExpenseItems
                .map((e) => normalizeDate(e.document_date || '').slice(0, 10))
                .filter(Boolean)
                .sort();
            const first = dates[0] || '-';
            const last = dates[dates.length - 1] || '-';
            domEdit.editExpenseDate.textContent = first === last ? first : `${first} – ${last}`;
        }
    }).fail(() => {
        if (domEdit.editExpenseItems) {
            domEdit.editExpenseItems.innerHTML = '<div class="text-muted kna-small py-2">Could not load expense items.</div>';
        }
    });
};

const getEditFormPayload = () => {
    const caRef = normalizeDate(domEdit.editCaRef ? domEdit.editCaRef.textContent : '');
    const totalAmount = editExpenseItems.reduce((sum, item) => sum + Number(item.actual_amount || item.amount || 0), 0);
    const caAmount = Number(domEdit.editCaAmount ? domEdit.editCaAmount.textContent.replace(/[^0-9.]/g, '') : 0);
    const refundAmount = caAmount > totalAmount ? caAmount - totalAmount : 0;
    const reimburseAmount = totalAmount > caAmount ? totalAmount - caAmount : 0;

    const validDates = editExpenseItems
        .map((item) => normalizeDate(item.document_date || '').slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();

    const dateFrom = validDates[0] || '';
    const dateTo = validDates[validDates.length - 1] || '';
    const purpose = normalizeDate(domEdit.editPurpose ? domEdit.editPurpose.textContent : '');

    return {
        caRef,
        totalAmount,
        caAmount,
        refundAmount,
        reimburseAmount,
        dateFrom,
        dateTo,
        purpose,
    };
};

const validateEditBeforeSave = () => {
    const state = getEditFormPayload();

    const editableItems = editExpenseItems.filter((item) => {
        const approval = getItemApprovalStatus(item);
        return approval.canEdit;
    });

    if (!editableItems.length) {
        Swal.fire({
            icon: 'warning',
            title: 'Nothing to edit',
            text: 'All items are approved and locked. No changes can be made.',
        });
        return null;
    }

    const itemWithMissingFields = editableItems.find(
        (item) => !item.document_date || !item.expense_category || !item.invoice_receipt_no || Number(item.actual_amount || 0) <= 0 || !item.description,
    );

    if (itemWithMissingFields) {
        Swal.fire({
            icon: 'warning',
            title: 'Incomplete item',
            text: 'Each editable item requires document date, expense type, reference, amount, and remarks.',
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

    return state;
};

const sendEditUpdate = (statusCode) => {
    const state = validateEditBeforeSave();
    if (!state) {
        return;
    }

    const ref = normalizeDate(domEdit.liquidationRef ? domEdit.liquidationRef.value : '');
    const caId = normalizeDate(domEdit.cashAdvanceId ? domEdit.cashAdvanceId.value : '');

    // === ADDED: Confirmation dialogs before saving ===
    const doSave = () => {
        const expensePayload = editExpenseItems.map((item) => ({
            Id: item.isNew ? null : item.id,
            DocumentDate: item.document_date,
            ExpenseCategory: Number(item.expense_category || 0),
            InvoiceReceiptNo: item.invoice_receipt_no,
            ActualAmount: Number(item.actual_amount || 0),
            IsVatable: Boolean(Number(item.is_vatable || 0)),
            Description: item.description,
            Attachment: getEditItemAttachmentNamesCsv(item),
            IsNew: item.isNew || false,
        }));

        const formData = new FormData();
        formData.append('LiquidationId', ref);
        formData.append('CashAdvanceId', caId);
        formData.append('CashAdvanceAmount', state.caAmount.toFixed(2));
        formData.append('TotalAmountSpent', state.totalAmount.toFixed(2));
        formData.append('RefundAmount', state.refundAmount.toFixed(2));
        formData.append('ReimburseAmount', state.reimburseAmount.toFixed(2));
        formData.append('StatusCode', statusCode);
        formData.append('Description', state.purpose);
        formData.append('ExpenseRangeFrom', state.dateFrom);
        formData.append('ExpenseRangeTo', state.dateTo);
        formData.append('Expenses', JSON.stringify(expensePayload));

        editExpenseItems.forEach((item, index) => {
            if (item.newAttachments && item.newAttachments.length > 0) {
                formData.append(`attachments[${index}][]`, item.newAttachments[0]);
            }
        });

        ajax_loader_formdata_loading('transactions/liquidation/api/update', formData).done((response) => {
            const res = (typeof response === 'string') ? $.parseJSON(response) : response;
            if (res.status !== 'success') {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: res.response || 'Failed to update liquidation.',
                });
                return;
            }

            const message = statusCode === 'LQ_DRAFT' ? 'Liquidation saved as draft successfully.' : 'Liquidation updated and resubmitted for approval.';
            const title = statusCode === 'LQ_DRAFT' ? 'Draft Saved' : 'Resubmitted';

            Swal.fire({
                icon: 'success',
                title: title,
                text: message,
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

    // === ADDED: Confirmation before save ===
    if (statusCode === 'LQ_DRAFT') {
        Swal.fire({
            icon: 'question',
            title: 'Save as Draft?',
            text: 'This will save your changes as a draft. You can edit it later.',
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            confirmButtonColor: '#f59e0b',
        }).then((result) => {
            if (result.isConfirmed) {
                doSave();
            }
        });
        return;
    }

    // LQ_SUBMITTED
    Swal.fire({
        icon: 'question',
        title: 'Resubmit for Approval?',
        text: 'Are you sure you want to resubmit this liquidation for approval?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        confirmButtonColor: '#6366f1',
    }).then((result) => {
        if (result.isConfirmed) {
            doSave();
        }
    });
};

// ===== ATTACHMENT SOURCE PROMPT =====
const promptEditAttachmentSource = (editId) => {
    if (!editReceiptOcr) return;

    editReceiptOcr.promptAttachmentSource(editId, {
        onGallery: (targetId) => {
            const uploadInput = domEdit.editExpenseItems.querySelector(
                `[data-edit-file="upload"][data-edit-id="${targetId}"]`
            );
            if (uploadInput) uploadInput.click();
        },
        onCamera: async (targetId) => {
            const cameraInput = domEdit.editExpenseItems.querySelector(
                `[data-edit-file="camera"][data-edit-id="${targetId}"]`
            );
            if (cameraInput) {
                const allowed = await editReceiptOcr.ensureCameraPermission();
                if (allowed) cameraInput.click();
            }
        },
    });
};

const cacheEditDom = () => {
    domEdit.liquidationRef = document.getElementById('liquidationRef');
    domEdit.cashAdvanceId = document.getElementById('cashAdvanceId');
    domEdit.editLiquidationNo = document.getElementById('editLiquidationNo');
    domEdit.editCaRef = document.getElementById('editCaRef');
    domEdit.editCaAmount = document.getElementById('editCaAmount');
    domEdit.editCaDate = document.getElementById('editCaDate');
    domEdit.editExpenseDate = document.getElementById('editExpenseDate');
    domEdit.editLiquidatedAmount = document.getElementById('editLiquidatedAmount');
    domEdit.editVariance = document.getElementById('editVariance');
    domEdit.editPurpose = document.getElementById('editPurpose');
    domEdit.editStatus = document.getElementById('editStatus');
    domEdit.editSubmittedDate = document.getElementById('editSubmittedDate');
    domEdit.editExpenseItems = document.getElementById('editExpenseItems');
    domEdit.editItemCount = document.getElementById('editItemCount');
    domEdit.rejectedBanner = document.getElementById('rejectedBanner');
    domEdit.rejectedCount = document.getElementById('rejectedCount');
    domEdit.btnAddNewItem = document.getElementById('btnAddNewItem');
    domEdit.btnSaveEdit = document.getElementById('btnSaveEdit');
    domEdit.btnSaveAsDraft = document.getElementById('btnSaveAsDraft');

    const lbEl = document.getElementById('knaLightbox');
    if (lbEl) {
        lbEl.addEventListener('click', (e) => {
            if (e.target === lbEl || e.target.id === 'knaLightboxClose') {
                lbEl.classList.add('d-none');
                document.getElementById('knaLightboxImg').src = '';
            }
        });
    }

    if (domEdit.editExpenseItems) {
        domEdit.editExpenseItems.addEventListener('click', (e) => {
            const wrap = e.target.closest('[data-lightbox]');
            if (wrap) {
                openEditLightbox(wrap.getAttribute('data-lightbox'));
            }
        });
    }
};

const initEditPage = () => {
    cacheEditDom();

    // === CHANGED: Initialize SharedReceiptOcr with direct item accessor ===
    // We don't use a proxy because Array.push() bypasses setters.
    // Instead, we let the OCR module push to item.attachments, then we manually
    // enforce single-attachment by moving the result to item.newAttachments.
    editReceiptOcr = window.SharedReceiptOcr.create({
        maxAttachmentBytes: MAX_ATTACHMENT_BYTES,
        getExpenseItem: (itemId) => {
            const item = findEditItem(itemId);
            if (!item) return null;
            // The OCR module will push to item.attachments
            // We handle the transfer in the change event handler
            if (!item.attachments) {
                item.attachments = [];
            }
            return item;
        },
        getExpenseTypeOptions: () => editExpenseTypeOptions,
        renderItems: renderEditExpenseItems,
        normalizeDate,
        escapeHtml,
        swal: Swal,
        ajaxLoaderFormDataLoading: ajax_loader_formdata_loading,
        ocrEndpoint: 'transactions/liquidation/api/ocr',
    });

    loadEditExpenseTypes();
    loadEditData();

    if (domEdit.btnAddNewItem) {
        domEdit.btnAddNewItem.addEventListener('click', () => {
            editExpenseItems.push(createNewEditItem());
            renderEditExpenseItems();
        });
    }

    if (domEdit.btnSaveEdit) {
        domEdit.btnSaveEdit.addEventListener('click', () => sendEditUpdate('LQ_SUBMITTED'));
    }
    if (domEdit.btnSaveAsDraft) {
        domEdit.btnSaveAsDraft.addEventListener('click', () => sendEditUpdate('LQ_DRAFT'));
    }

    if (domEdit.editExpenseItems) {
        // Input events for text/number/select fields
        domEdit.editExpenseItems.addEventListener('input', (event) => {
            const target = event.target;
            const editId = Number(target.getAttribute('data-edit-id'));
            const field = target.getAttribute('data-edit-field');
            if (!editId || !field) return;

            const item = findEditItem(editId);
            if (!item) return;

            if (field === 'isVattable') {
                item.is_vatable = target.checked ? 1 : 0;
                return;
            }

            const fieldMap = {
                documentDate: 'document_date',
                expenseCategory: 'expense_category',
                reference: 'invoice_receipt_no',
                amount: 'actual_amount',
                description: 'description',
            };

            const dataField = fieldMap[field] || field;
            item[dataField] = target.value;

            if (field === 'amount') {
                updateEditVariance();
            }
        });

        // === CHANGED: File upload handler - properly handle single attachment replacement ===
        domEdit.editExpenseItems.addEventListener('change', async (event) => {
            const target = event.target;
            const editId = Number(target.getAttribute('data-edit-id'));
            const fileMode = target.getAttribute('data-edit-file');
            if (!editId || !fileMode) return;

            const item = findEditItem(editId);
            if (!item) return;

            const files = Array.from(target.files || []);
            if (!files.length) return;

            // Mark ALL existing attachments as removed (new replaces old)
            if (item.existingAttachments && item.existingAttachments.length > 0) {
                if (!item.removedAttachments) {
                    item.removedAttachments = [];
                }
                item.existingAttachments.forEach((name) => {
                    if (!item.removedAttachments.includes(name)) {
                        item.removedAttachments.push(name);
                    }
                });
            }

            // Clear previous new attachments and object URLs
            if (item.newAttachments && item.newAttachments.length > 0) {
                item.newAttachments.forEach((f) => {
                    if (f._objectUrl) {
                        try { URL.revokeObjectURL(f._objectUrl); } catch (e) { /* ignore */ }
                    }
                });
            }
            item.newAttachments = [];
            // Also clear the temporary attachments array the OCR module uses
            item.attachments = [];

            // Let OCR module handle compression and validation
            // It pushes accepted files to item.attachments
            const acceptedFiles = await editReceiptOcr.addItemAttachments(editId, files);

            // === CRITICAL: Move files from item.attachments to item.newAttachments ===
            // The OCR module pushed to item.attachments, but we need them in item.newAttachments
            if (item.attachments && item.attachments.length > 0) {
                // Take only the last one (single attachment policy) and move to newAttachments
                const lastFile = item.attachments[item.attachments.length - 1];
                item.newAttachments = [lastFile];
                // Clear the temporary array
                item.attachments = [];
            }

            // Run OCR autofill on the accepted file
            if (item.newAttachments.length > 0) {
                await editReceiptOcr.runOcrAutofillForItem(editId, item.newAttachments[0]);
            }

            target.value = '';
            renderEditExpenseItems();
        });

        // Click events for actions
        domEdit.editExpenseItems.addEventListener('click', (event) => {
            const actionBtn = event.target.closest('[data-edit-action]');
            if (!actionBtn) return;

            const editId = Number(actionBtn.getAttribute('data-edit-id'));
            const action = actionBtn.getAttribute('data-edit-action');
            if (!editId || !action) return;

            const item = findEditItem(editId);
            if (!item) return;

            if (action === 'remove') {
                if (item && !item.isNew) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Remove Item?',
                        text: 'This item will be removed from the liquidation.',
                        showCancelButton: true,
                        confirmButtonText: 'Remove',
                        cancelButtonText: 'Cancel',
                        reverseButtons: true,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            editExpenseItems = editExpenseItems.filter((i) => i._editId !== editId);
                            renderEditExpenseItems();
                        }
                    });
                } else {
                    editExpenseItems = editExpenseItems.filter((i) => i._editId !== editId);
                    renderEditExpenseItems();
                }
                return;
            }

            if (action === 'attach') {
                promptEditAttachmentSource(editId);
                return;
            }

            if (action === 'removeAttachment') {
                const filename = actionBtn.getAttribute('data-filename');
                if (!filename) return;
                if (!item.removedAttachments) {
                    item.removedAttachments = [];
                }
                if (!item.removedAttachments.includes(filename)) {
                    item.removedAttachments.push(filename);
                }
                renderEditExpenseItems();
                return;
            }

            if (action === 'undoRemoveAttachment') {
                const filename = actionBtn.getAttribute('data-filename');
                if (!filename) return;
                if (item.removedAttachments) {
                    item.removedAttachments = item.removedAttachments.filter((f) => f !== filename);
                }
                renderEditExpenseItems();
                return;
            }

            if (action === 'removeNewAttachment') {
                // Clear the new attachment and revoke its object URL
                if (item.newAttachments && item.newAttachments.length > 0) {
                    item.newAttachments.forEach((f) => {
                        if (f._objectUrl) {
                            try { URL.revokeObjectURL(f._objectUrl); } catch (e) { /* ignore */ }
                        }
                    });
                }
                item.newAttachments = [];
                renderEditExpenseItems();
                return;
            }
        });
    }
};

initEditPage();