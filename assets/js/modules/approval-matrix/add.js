let addApproverOptions = [];
let addDepartmentOptions = [];

let isRefreshingOptions = false;

const addDom = {
    matrixName: null,
    transactionType: null,
    departmentId: null,
    minAmount: null,
    maxAmount: null,
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
        addApproverOptions.map((a) => {
            const val = escapeHtml(String(a.id));
            const label = escapeHtml(`${normalizeText(a.firstname)} ${normalizeText(a.lastname)} - ${normalizeText(a.designation)} (${normalizeText(a.department)})`);
            const sel = String(a.id) === String(selectedId) ? 'selected' : '';
            return `<option value="${val}" ${sel}>${label}</option>`;
        })
    );
    return opts.join('');
};

const addApproverRowMarkup = (detail = {}) => {
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

const renderAddApproverRows = (details) => {
    if (!addDom.approverRows) return;
    const source = Array.isArray(details) && details.length ? details : [{}];
    addDom.approverRows.innerHTML = source.map((d) => addApproverRowMarkup(d)).join('');
    Array.from(addDom.approverRows.querySelectorAll('[data-approver-row]')).forEach((row) => {
        initApproverRowSelect2(row);
    });
    renumberApproverOrders();
    refreshApproverOptions();
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

const populateDepartmentSelect = () => {
    if (!addDom.departmentId) return;
    addDom.departmentId.innerHTML = ['<option value="">Select department</option>'].concat(
        addDepartmentOptions.map((d) => `<option value="${escapeHtml(String(d.department_id))}">${escapeHtml(d.department)}</option>`),
    ).join('');
    $(addDom.departmentId).select2({ width: '100%', placeholder: 'Select department' });
};

const loadApprovers = () => {
    ajax_loader('maintenance/approval-matrix/api/get/approvers', {})
        .done((response) => {
            const res = typeof response === 'string' ? $.parseJSON(response) : response;
            if (res.status !== 'success') return;
            addApproverOptions = res.data || [];
            renderAddApproverRows([]);
        })
        .fail(() => {
            if (addDom.departmentId) {
                addDom.departmentId.innerHTML = '<option value="">No departments available</option>';
            }
            renderAddApproverRows([]);
        });
};

const loadDepartments = () => {
    ajax_loader('maintenance/approval-matrix/api/get/departments', {})
        .done((response) => {
            const res = typeof response === 'string' ? $.parseJSON(response) : response;
            if (res.status !== 'success') return;
            addDepartmentOptions = res.data || [];
            populateDepartmentSelect();
        })
        .fail(() => {
            if (addDom.departmentId) {
                addDom.departmentId.innerHTML = '<option value="">No departments available</option>';
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

const validateAddForm = (payload) => {
    if (!payload.matrix_name) return 'Matrix name is required.';
    if (!payload.transaction_type) return 'Transaction type is required.';
    if (!payload.department_id) return 'Department is required.';
    if (Number(payload.min_amount) > Number(payload.max_amount)) return 'Min amount must be less than or equal to max amount.';
    if (!payload.details.length) return 'At least one approver is required.';
    return '';
};

const saveMatrix = () => {
    renumberApproverOrders();

    const payload = {
        matrix_name: normalizeText(addDom.matrixName.value),
        transaction_type: String(addDom.transactionType.value || ''),
        department_id: String(addDom.departmentId.value || ''),
        min_amount: Number(addDom.minAmount.value || 0),
        max_amount: Number(addDom.maxAmount.value || 0),
        is_active: 1,
        details: collectApprovers(),
    };

    const error = validateAddForm(payload);
    if (error) {
        Swal.fire({ icon: 'warning', title: 'Validation', text: error });
        return;
    }

    Swal.fire({
        icon: 'question',
        title: 'Confirm Save',
        text: 'Are you sure you want to save this approval matrix?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        reverseButtons: true,
    }).then((result) => {
        if (result.isConfirmed) {
            ajax_loader('maintenance/approval-matrix/api/save', payload)
                .done((response) => {
                    const res = typeof response === 'string' ? $.parseJSON(response) : response;
                    if (res.status === 'success') {
                        Swal.fire({ icon: 'success', title: 'Saved', text: 'Approval matrix created successfully.' })
                            .then(() => {
                                window.location.href = `${base_url}maintenance/approval-matrix`;
                            });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: res.response || 'Failed to save.' });
                    }
                })
                .fail(() => {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to save. Please try again.' });
                });
        }
    });
};

const cacheAddDom = () => {
    addDom.matrixName = document.getElementById('matrixName');
    addDom.transactionType = document.getElementById('transactionType');
    addDom.departmentId = document.getElementById('departmentId');
    addDom.minAmount = document.getElementById('minAmount');
    addDom.maxAmount = document.getElementById('maxAmount');
    addDom.approverRows = document.getElementById('approverRows');
    addDom.btnAddApprover = document.getElementById('btnAddApprover');
    addDom.btnSaveMatrix = document.getElementById('btnSaveMatrix');
};

const bindAddEvents = () => {
    if (addDom.btnAddApprover) {
        addDom.btnAddApprover.addEventListener('click', () => {
            if (!addDom.approverRows) return;

            addDom.approverRows.insertAdjacentHTML('beforeend', addApproverRowMarkup());
            const lastRow = addDom.approverRows.querySelector('[data-approver-row]:last-child');
            if (lastRow) {
                initApproverRowSelect2(lastRow);
                lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            renumberApproverOrders();
            refreshApproverOptions();
        });
    }

    if (addDom.btnSaveMatrix) {
        addDom.btnSaveMatrix.addEventListener('click', saveMatrix);
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || target.getAttribute('data-remove-approver') === null) return;

        const rows = document.querySelectorAll('[data-approver-row]');
        if (rows.length <= 1) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'At least one approver row is required.' });
            return;
        }
        const row = target.closest('[data-approver-row]');
        if (row) {
            // FIXED: Explicitly unbind Select2 and nullify value BEFORE dropping the row from DOM
            const $approverSelect = $(row).find('.js-approver-id');
            const $typeSelect = $(row).find('.js-approver-type');
            
            if ($approverSelect.data('select2')) {
                $approverSelect.val(null).trigger('change.select2'); // Wipe chosen ID from Select2 memory
                $approverSelect.select2('destroy');                  // Sever Select2 bindings
            }
            if ($typeSelect.data('select2')) {
                $typeSelect.select2('destroy');
            }

            // Remove completely from DOM
            row.remove();
            
            // Recalculate everything now that memory and DOM are clean
            renumberApproverOrders();
            refreshApproverOptions();
        }
    });

    if (addDom.approverRows) {
        $(addDom.approverRows).on('change select2:select select2:clear', '.js-approver-type', () => {
            renumberApproverOrders();
        });

        $(addDom.approverRows).on('select2:select select2:clear', '.js-approver-id', function () {
            refreshApproverOptions();
            renumberApproverOrders();
        });
    }
};

$(document).ready(() => {
    cacheAddDom();
    $(addDom.transactionType).select2({ width: '100%', minimumResultsForSearch: Infinity });
    bindAddEvents();
    loadApprovers();
    loadDepartments();
});