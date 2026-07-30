const bamDom = {
	filterKeyword: null,
	btnResetFilters: null,
	btnOpenNewRecord: null,
	btnOpenMassUpload: null,
	table: null,
	tbody: null,
	mobileList: null,
	resultCount: null,
	resultCountMobile: null,
	desktopPagination: null,
	mobilePagination: null,
	modalRecord: null,
	modalRecordTitle: null,
	employeeSelect: null,
	bankName: null,
	accountNumber: null,
	statusSection: null,
	status: null,
	btnSaveRecord: null,
	modalMassUpload: null,
	massUploadFile: null,
	massUploadSummary: null,
	massUploadSummaryHeadline: null,
	massUploadSkippedList: null,
	btnSubmitMassUpload: null,
	tabCompanyLink: null,
	companyCode: null,
	companyAccountMasked: null,
	companyAccountNumber: null,
	presentingOfficeCode: null,
	ceilingAmount: null,
	btnRevealCompanyAccount: null,
	btnSaveCompanySettings: null,
	viewCompanyCode: null,
	viewPresentingOfficeCode: null,
	viewCeilingAmount: null,
	companySettingsUpdatedLabel: null,
};

let bamCompanySettingsLoaded = false;
let bamCompanyAccountRevealed = false;
let bamCompanyAccountMaskedValue = '';

const bamState = {
	keyword: '',
	pageSize: 20,
	page: 1,
	pages: [null], // cached cursor to use for each page index (page 1 = null)
	totalPages: 1,
	rows: [],
	editingId: null,
};

const escapeHtml = (value = '') =>
	String(value === null || value === undefined ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const bamRowHtml = (row) => `
	<tr data-id="${row.id}">
		<td>${escapeHtml(row.empcode)}</td>
		<td>${escapeHtml(row.fullname || '-')}</td>
		<td>${escapeHtml(row.bank_account)}</td>
		<td>
			<span class="kna-acct-masked" data-acct-cell="${row.id}">${escapeHtml(row.account_number_masked)}
				<button type="button" class="kna-btn-reveal" data-reveal-id="${row.id}" title="Reveal"><i class="fas fa-eye"></i></button>
			</span>
		</td>
		<td>
			${row.is_active
				? '<span class="kna-badge kna-badge-active">Active</span>'
				: '<span class="kna-badge kna-badge-inactive">Inactive</span>'}
		</td>
		<td class="text-center kna-actions">
			<button type="button" class="btn btn-outline-secondary btn-sm" data-edit-id="${row.id}" title="Edit"><i class="fas fa-pen"></i></button>
		</td>
	</tr>
`;

const bamMobileItemHtml = (row) => `
	<div class="kna-item" data-id="${row.id}">
		<div class="kna-row"><strong>${escapeHtml(row.fullname || row.empcode)}</strong> ${row.is_active
			? '<span class="kna-badge kna-badge-active">Active</span>'
			: '<span class="kna-badge kna-badge-inactive">Inactive</span>'}</div>
		<div class="kna-row"><span class="text-muted">Employee Code</span><span>${escapeHtml(row.empcode)}</span></div>
		<div class="kna-row"><span class="text-muted">Bank</span><span>${escapeHtml(row.bank_account)}</span></div>
		<div class="kna-row"><span class="text-muted">Account No.</span>
			<span class="kna-acct-masked" data-acct-cell="${row.id}">${escapeHtml(row.account_number_masked)}
				<button type="button" class="kna-btn-reveal" data-reveal-id="${row.id}" title="Reveal"><i class="fas fa-eye"></i></button>
			</span>
		</div>
		<div class="kna-row">
			<button type="button" class="btn btn-outline-secondary btn-sm" data-edit-id="${row.id}"><i class="fas fa-pen mr-1"></i>Edit</button>
		</div>
	</div>
`;

// Builds a windowed page list (first, last, and a run around the
// current page, with gaps collapsed to "…") so the full page count is
// visible up front instead of only ever showing the current page.
const bamBuildPageWindow = (current, total) => {
	const pages = new Set([1, total, current, current - 1, current + 1]);
	const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

	const withGaps = [];
	sorted.forEach((p, i) => {
		if (i > 0 && p - sorted[i - 1] > 1) withGaps.push('…');
		withGaps.push(p);
	});
	return withGaps;
};

const bamRenderPaginationNav = (navEl) => {
	if (!navEl) return;

	const page = bamState.page;
	const total = Math.max(1, bamState.totalPages);

	const makeItem = (label, disabled, active, action, page2) => `
		<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
			<a class="page-link" href="#" data-action="${action}" ${page2 ? `data-page="${page2}"` : ''}>${label}</a>
		</li>
	`;

	const middle = bamBuildPageWindow(page, total).map((p) => {
		if (p === '…') return `<li class="page-item disabled"><span class="page-link">&hellip;</span></li>`;
		return makeItem(String(p), false, p === page, 'goto', p);
	}).join('');

	navEl.innerHTML = [
		makeItem('&lsaquo;', page <= 1, false, 'prev'),
		middle,
		makeItem('&rsaquo;', page >= total, false, 'next'),
	].join('');
};

const bamRenderPagination = () => {
	bamRenderPaginationNav(bamDom.desktopPagination);
	bamRenderPaginationNav(bamDom.mobilePagination);
};

const bamGoToPage = (page) => {
	if (page < 1 || page > bamState.totalPages) return;
	bamState.page = page;
	bamLoadList();
};

const bamBindPaginationNav = (navEl) => {
	if (!navEl) return;
	navEl.addEventListener('click', (e) => {
		const link = e.target.closest('a.page-link');
		if (!link) return;
		e.preventDefault();
		if (link.parentElement.classList.contains('disabled')) return;

		if (link.dataset.action === 'prev') bamGoToPage(bamState.page - 1);
		else if (link.dataset.action === 'next') bamGoToPage(bamState.page + 1);
		else if (link.dataset.action === 'goto') bamGoToPage(Number(link.dataset.page));
	});
};

// Hybrid pagination: if a cursor is already cached for this page (from
// having visited it via Next/Prev before), use the cheap keyset fetch;
// otherwise (a direct jump to an unvisited page, or page 1) the backend
// falls back to OFFSET for that one request. Either way only
// bamState.pageSize rows of actual data ever come back — the full page
// count comes from a single lightweight COUNT the backend runs
// alongside the fetch.
const bamLoadList = () => {
	const payload = {
		Keyword: bamState.keyword,
		CursorId: bamState.pages[bamState.page - 1] || null,
		Page: bamState.page,
		PageSize: bamState.pageSize,
	};

	ajax_loader('maintenance/bank-account-masterlist/api/get', payload).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') return;

		const rows = Array.isArray(res.data) ? res.data : [];
		bamState.rows = rows;
		const pagination = res.pagination || {};

		if (bamDom.tbody) {
			bamDom.tbody.innerHTML = rows.length
				? rows.map(bamRowHtml).join('')
				: '<tr><td colspan="6" class="text-center text-muted py-3">No records found.</td></tr>';
		}
		if (bamDom.mobileList) {
			bamDom.mobileList.innerHTML = rows.length
				? rows.map(bamMobileItemHtml).join('')
				: '<div class="text-center text-muted kna-small py-3">No records found.</div>';
		}

		bamState.totalPages = Math.max(1, Number(pagination.totalPages) || 1);
		const countLabel = `${pagination.totalCount || 0} record(s) — page ${bamState.page} of ${bamState.totalPages}`;
		if (bamDom.resultCount) bamDom.resultCount.textContent = countLabel;
		if (bamDom.resultCountMobile) bamDom.resultCountMobile.textContent = countLabel;

		if (pagination.nextCursorId) {
			bamState.pages[bamState.page] = pagination.nextCursorId;
		}
		bamRenderPagination();
	});
};

const bamResetAndReload = () => {
	bamState.page = 1;
	bamState.pages = [null];
	bamLoadList();
};

const bamLoadEmployeeSelect2 = () => {
	if (!bamDom.employeeSelect || typeof $ === 'undefined' || !$.fn.select2) return;

	if ($(bamDom.employeeSelect).hasClass('select2-hidden-accessible')) {
		$(bamDom.employeeSelect).select2('destroy');
	}

	$(bamDom.employeeSelect).select2({
		placeholder: 'Search employee name or code',
		allowClear: true,
		width: '100%',
		dropdownParent: $('#modalBankAccount'),
		minimumInputLength: 1,
		ajax: {
			url: `${base_url}maintenance/bank-account-masterlist/api/employee-options`,
			type: 'POST',
			dataType: 'json',
			delay: 300,
			data: (params) => ({ Keyword: params.term }),
			processResults: (response) => {
				const rows = (response && response.status === 'success' && Array.isArray(response.data)) ? response.data : [];
				return {
					results: rows.map((r) => ({
						id: r.empcode,
						text: `${r.fullname} (${r.empcode})${r.designation ? ' — ' + r.designation : ''}`,
						lsbiz_id: r.lsbiz_id,
					})),
				};
			},
		},
	});
};

const bamOpenAddModal = () => {
	bamState.editingId = null;
	if (bamDom.modalRecordTitle) bamDom.modalRecordTitle.textContent = 'Add Bank Account';
	if (bamDom.bankName) bamDom.bankName.value = '';
	if (bamDom.accountNumber) bamDom.accountNumber.value = '';
	if (bamDom.statusSection) bamDom.statusSection.classList.add('d-none');
	if (bamDom.status) bamDom.status.value = '1';
	bamLoadEmployeeSelect2();
	if ($.fn.select2) $(bamDom.employeeSelect).val(null).trigger('change');
	$(bamDom.employeeSelect).prop('disabled', false);
	$('#modalBankAccount').modal('show');
};

const bamOpenEditModal = (row) => {
	bamState.editingId = row.id;
	if (bamDom.modalRecordTitle) bamDom.modalRecordTitle.textContent = 'Edit Bank Account';
	if (bamDom.bankName) bamDom.bankName.value = row.bank_account || '';
	if (bamDom.accountNumber) bamDom.accountNumber.value = '';
	if (bamDom.statusSection) bamDom.statusSection.classList.remove('d-none');
	if (bamDom.status) bamDom.status.value = row.is_active ? '1' : '0';
	bamLoadEmployeeSelect2();

	const option = new Option(`${row.fullname} (${row.empcode})`, row.empcode, true, true);
	$(bamDom.employeeSelect).append(option).trigger('change');
	$(bamDom.employeeSelect).prop('disabled', true);

	$('#modalBankAccount').modal('show');
};

const bamSubmitSave = () => {
	const empcode = bamDom.employeeSelect ? bamDom.employeeSelect.value : '';
	const bankAccount = bamDom.bankName ? bamDom.bankName.value.trim() : '';
	const accountNumber = bamDom.accountNumber ? bamDom.accountNumber.value.trim() : '';
	const isActive = bamDom.status ? bamDom.status.value === '1' : true;

	ajax_loader('maintenance/bank-account-masterlist/api/save', {
		Id: bamState.editingId || '',
		Empcode: empcode,
		BankAccount: bankAccount,
		AccountNumber: accountNumber,
		IsActive: isActive ? 1 : 0,
	}).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Failed', text: (res && res.response) || 'Failed to save the bank account.' });
			return;
		}
		$('#modalBankAccount').modal('hide');
		Swal.fire({ icon: 'success', title: 'Saved', text: res.response, timer: 1500, showConfirmButton: false });
		bamResetAndReload();
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while saving.' });
	});
};

const bamSaveRecord = () => {
	const empcode = bamDom.employeeSelect ? bamDom.employeeSelect.value : '';
	const bankAccount = bamDom.bankName ? bamDom.bankName.value.trim() : '';
	const accountNumber = bamDom.accountNumber ? bamDom.accountNumber.value.trim() : '';

	if (!empcode || !bankAccount || !accountNumber) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please complete all required fields before saving.' });
		return;
	}

	Swal.fire({
		icon: 'question',
		title: 'Save this bank account?',
		text: 'Please confirm the details are correct before saving.',
		showCancelButton: true,
		confirmButtonText: 'Yes, save',
	}).then((result) => {
		if (result.isConfirmed) bamSubmitSave();
	});
};

const bamRevealAccountNumber = (id, cellEl) => {
	ajax_loader('maintenance/bank-account-masterlist/api/reveal', { Id: id }).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Failed', text: (res && res.response) || 'Unable to reveal account number.' });
			return;
		}

		const fullNumber = escapeHtml((res.data && res.data.account_number) || '');
		cellEl.innerHTML = `${fullNumber} <button type="button" class="kna-btn-reveal" data-hide-id="${id}" title="Hide"><i class="fas fa-eye-slash"></i></button>`;
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while revealing the account number.' });
	});
};

const bamBindTableEvents = (container) => {
	if (!container) return;
	container.addEventListener('click', (e) => {
		const revealBtn = e.target.closest('[data-reveal-id]');
		if (revealBtn) {
			const id = revealBtn.getAttribute('data-reveal-id');
			const cell = container.querySelector(`[data-acct-cell="${id}"]`);
			if (cell) bamRevealAccountNumber(id, cell);
			return;
		}

		const hideBtn = e.target.closest('[data-hide-id]');
		if (hideBtn) {
			const id = hideBtn.getAttribute('data-hide-id');
			const row = bamState.rows.find((r) => String(r.id) === String(id));
			const cell = container.querySelector(`[data-acct-cell="${id}"]`);
			if (cell && row) {
				cell.innerHTML = `${escapeHtml(row.account_number_masked)} <button type="button" class="kna-btn-reveal" data-reveal-id="${id}" title="Reveal"><i class="fas fa-eye"></i></button>`;
			}
			return;
		}

		const editBtn = e.target.closest('[data-edit-id]');
		if (editBtn) {
			const id = editBtn.getAttribute('data-edit-id');
			const row = bamState.rows.find((r) => String(r.id) === String(id));
			if (row) bamOpenEditModal(row);
		}
	});
};

const bamRenderMassUploadSummary = (data) => {
	if (!bamDom.massUploadSummary) return;
	bamDom.massUploadSummary.classList.remove('d-none');

	if (bamDom.massUploadSummaryHeadline) {
		bamDom.massUploadSummaryHeadline.textContent =
			`${data.inserted} added, ${data.updated} updated, ${data.skipped_count} skipped.`;
	}
	if (bamDom.massUploadSkippedList) {
		bamDom.massUploadSkippedList.innerHTML = (data.skipped || [])
			.map((line) => `<div class="skip-item">${escapeHtml(line)}</div>`)
			.join('');
	}
};

const bamSubmitMassUpload = () => {
	const fileInput = bamDom.massUploadFile;
	if (!fileInput || !fileInput.files || !fileInput.files.length) {
		Swal.fire({ icon: 'warning', title: 'No file selected', text: 'Please choose a file to upload.' });
		return;
	}

	const formData = new FormData();
	formData.append('file', fileInput.files[0]);

	ajax_loader_formdata_loading('maintenance/bank-account-masterlist/api/mass-upload', formData).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Failed', text: (res && res.response) || 'Mass upload failed.' });
			return;
		}
		bamRenderMassUploadSummary(res.data || {});
		bamResetAndReload();
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Error', text: 'Server error during mass upload.' });
	});
};

const bamLoadCompanySettings = () => {
	ajax_loader('maintenance/bank-account-masterlist/api/company-settings/get', {}).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') return;

		const data = res.data || {};
		bamCompanyAccountRevealed = false;
		bamCompanyAccountMaskedValue = data.account_number_masked || 'Not set';
		if (bamDom.companyCode) bamDom.companyCode.value = data.company_code || '';
		if (bamDom.presentingOfficeCode) bamDom.presentingOfficeCode.value = data.presenting_office_code || '';
		if (bamDom.ceilingAmount) bamDom.ceilingAmount.value = data.ceiling_amount !== null && data.ceiling_amount !== undefined ? data.ceiling_amount : '';
		if (bamDom.companyAccountMasked) bamDom.companyAccountMasked.textContent = bamCompanyAccountMaskedValue;
		if (bamDom.companyAccountNumber) bamDom.companyAccountNumber.value = '';
		if (bamDom.btnRevealCompanyAccount) bamDom.btnRevealCompanyAccount.innerHTML = '<i class="fas fa-eye"></i>';

		if (bamDom.viewCompanyCode) bamDom.viewCompanyCode.textContent = data.company_code || '—';
		if (bamDom.viewPresentingOfficeCode) bamDom.viewPresentingOfficeCode.textContent = data.presenting_office_code || '—';
		if (bamDom.viewCeilingAmount) {
			bamDom.viewCeilingAmount.textContent = (data.ceiling_amount !== null && data.ceiling_amount !== undefined)
				? Number(data.ceiling_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
				: '—';
		}
		if (bamDom.companySettingsUpdatedLabel) {
			bamDom.companySettingsUpdatedLabel.textContent = data.updated_date ? `Last updated: ${data.updated_date}` : '';
		}
	});
};

const bamToggleCompanyAccount = () => {
	if (bamCompanyAccountRevealed) {
		bamCompanyAccountRevealed = false;
		if (bamDom.companyAccountMasked) bamDom.companyAccountMasked.textContent = bamCompanyAccountMaskedValue;
		if (bamDom.btnRevealCompanyAccount) bamDom.btnRevealCompanyAccount.innerHTML = '<i class="fas fa-eye"></i>';
		return;
	}

	ajax_loader('maintenance/bank-account-masterlist/api/company-settings/reveal', {}).done((response) => {
		const res = (typeof response === 'string') ? JSON.parse(response) : response;
		if (!res || res.status !== 'success') {
			Swal.fire({ icon: 'error', title: 'Failed', text: (res && res.response) || 'Unable to reveal the account number.' });
			return;
		}
		bamCompanyAccountRevealed = true;
		if (bamDom.companyAccountMasked) bamDom.companyAccountMasked.textContent = (res.data && res.data.account_number) || '';
		if (bamDom.btnRevealCompanyAccount) bamDom.btnRevealCompanyAccount.innerHTML = '<i class="fas fa-eye-slash"></i>';
	}).fail(() => {
		Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while revealing the account number.' });
	});
};

const bamSaveCompanySettings = () => {
	const companyCode = bamDom.companyCode ? bamDom.companyCode.value.trim() : '';
	const accountNumber = bamDom.companyAccountNumber ? bamDom.companyAccountNumber.value.trim() : '';
	const presentingOfficeCode = bamDom.presentingOfficeCode ? bamDom.presentingOfficeCode.value.trim() : '';
	const ceilingAmount = bamDom.ceilingAmount ? bamDom.ceilingAmount.value : '';

	if (!companyCode || !presentingOfficeCode || !ceilingAmount) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please complete all required fields before saving.' });
		return;
	}

	Swal.fire({
		icon: 'question',
		title: 'Save these BizLink settings?',
		text: 'These details are used to build the company\'s bank disbursement file. Please confirm they are correct.',
		showCancelButton: true,
		confirmButtonText: 'Yes, save',
	}).then((result) => {
		if (!result.isConfirmed) return;

		ajax_loader('maintenance/bank-account-masterlist/api/company-settings/save', {
			CompanyCode: companyCode,
			CompanyAccountNumber: accountNumber,
			PresentingOfficeCode: presentingOfficeCode,
			CeilingAmount: ceilingAmount,
		}).done((response) => {
			const res = (typeof response === 'string') ? JSON.parse(response) : response;
			if (!res || res.status !== 'success') {
				Swal.fire({ icon: 'error', title: 'Failed', text: (res && res.response) || 'Failed to save.' });
				return;
			}
			Swal.fire({ icon: 'success', title: 'Saved', text: res.response, timer: 1500, showConfirmButton: false });
			bamLoadCompanySettings();
		}).fail(() => {
			Swal.fire({ icon: 'error', title: 'Error', text: 'Server error while saving.' });
		});
	});
};

const bamCacheDom = () => {
	bamDom.filterKeyword = document.getElementById('filterKeyword');
	bamDom.btnResetFilters = document.getElementById('btnResetFilters');
	bamDom.btnOpenNewRecord = document.getElementById('btnOpenNewRecord');
	bamDom.btnOpenMassUpload = document.getElementById('btnOpenMassUpload');
	bamDom.table = document.getElementById('bankAccountTable');
	bamDom.tbody = document.getElementById('bankAccountTbody');
	bamDom.mobileList = document.getElementById('bankAccountMobileList');
	bamDom.resultCount = document.getElementById('resultCount');
	bamDom.resultCountMobile = document.getElementById('resultCountMobile');
	bamDom.desktopPagination = document.getElementById('desktopPagination');
	bamDom.mobilePagination = document.getElementById('mobilePagination');
	bamDom.modalRecordTitle = document.getElementById('modalBankAccountTitleText');
	bamDom.employeeSelect = document.getElementById('bankAccountEmployeeSelect');
	bamDom.bankName = document.getElementById('bankAccountBankName');
	bamDom.accountNumber = document.getElementById('bankAccountNumber');
	bamDom.statusSection = document.getElementById('bankAccountStatusSection');
	bamDom.status = document.getElementById('bankAccountStatus');
	bamDom.btnSaveRecord = document.getElementById('btnSaveBankAccount');
	bamDom.massUploadFile = document.getElementById('massUploadFile');
	bamDom.massUploadSummary = document.getElementById('massUploadSummary');
	bamDom.massUploadSummaryHeadline = document.getElementById('massUploadSummaryHeadline');
	bamDom.massUploadSkippedList = document.getElementById('massUploadSkippedList');
	bamDom.btnSubmitMassUpload = document.getElementById('btnSubmitMassUpload');
	bamDom.tabCompanyLink = document.getElementById('bamTabCompanyLink');
	bamDom.companyCode = document.getElementById('companyCode');
	bamDom.companyAccountMasked = document.getElementById('companyAccountMasked');
	bamDom.companyAccountNumber = document.getElementById('companyAccountNumber');
	bamDom.presentingOfficeCode = document.getElementById('presentingOfficeCode');
	bamDom.ceilingAmount = document.getElementById('ceilingAmount');
	bamDom.btnRevealCompanyAccount = document.getElementById('btnRevealCompanyAccount');
	bamDom.btnSaveCompanySettings = document.getElementById('btnSaveCompanySettings');
	bamDom.viewCompanyCode = document.getElementById('viewCompanyCode');
	bamDom.viewPresentingOfficeCode = document.getElementById('viewPresentingOfficeCode');
	bamDom.viewCeilingAmount = document.getElementById('viewCeilingAmount');
	bamDom.companySettingsUpdatedLabel = document.getElementById('companySettingsUpdatedLabel');
};

const bamBindEvents = () => {
	let keywordTimer = null;
	if (bamDom.filterKeyword) {
		bamDom.filterKeyword.addEventListener('input', () => {
			clearTimeout(keywordTimer);
			keywordTimer = setTimeout(() => {
				bamState.keyword = bamDom.filterKeyword.value.trim();
				bamResetAndReload();
			}, 300);
		});
	}
	if (bamDom.btnResetFilters) {
		bamDom.btnResetFilters.addEventListener('click', () => {
			bamState.keyword = '';
			if (bamDom.filterKeyword) bamDom.filterKeyword.value = '';
			bamResetAndReload();
		});
	}
	if (bamDom.btnOpenNewRecord) {
		bamDom.btnOpenNewRecord.addEventListener('click', bamOpenAddModal);
	}
	if (bamDom.btnSaveRecord) {
		bamDom.btnSaveRecord.addEventListener('click', bamSaveRecord);
	}
	if (bamDom.btnOpenMassUpload) {
		bamDom.btnOpenMassUpload.addEventListener('click', () => {
			if (bamDom.massUploadSummary) bamDom.massUploadSummary.classList.add('d-none');
			if (bamDom.massUploadFile) bamDom.massUploadFile.value = '';
			$('#modalMassUpload').modal('show');
		});
	}
	if (bamDom.btnSubmitMassUpload) {
		bamDom.btnSubmitMassUpload.addEventListener('click', bamSubmitMassUpload);
	}
	bamBindPaginationNav(bamDom.desktopPagination);
	bamBindPaginationNav(bamDom.mobilePagination);

	bamBindTableEvents(bamDom.tbody);
	bamBindTableEvents(bamDom.mobileList);

	if (bamDom.tabCompanyLink && typeof $ !== 'undefined') {
		$(bamDom.tabCompanyLink).on('shown.bs.tab', () => {
			if (!bamCompanySettingsLoaded) {
				bamCompanySettingsLoaded = true;
				bamLoadCompanySettings();
			}
		});
	}
	if (bamDom.btnRevealCompanyAccount) {
		bamDom.btnRevealCompanyAccount.addEventListener('click', bamToggleCompanyAccount);
	}
	if (bamDom.btnSaveCompanySettings) {
		bamDom.btnSaveCompanySettings.addEventListener('click', bamSaveCompanySettings);
	}
};

const initBankAccountMasterlist = () => {
	bamCacheDom();
	bamBindEvents();
	bamLoadList();
};

$(document).ready(() => {
	initBankAccountMasterlist();
});
