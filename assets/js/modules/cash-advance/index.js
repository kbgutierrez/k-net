	let cashAdvances = [];
		let nextCursorId = null;
		let hasMoreRows = false;
		let isLoadingRows = false;
		let desktopPage = 1;
		const PAGE_SIZE = 10;

	const dom = {
		filterDateRange: null,
		filterDateRangePicker: null,
		filterStatus: null,
		filterAmountRange: null,
		sumTotalGranted: null,
		sumPending: null,
		sumForLiquidation: null,
		sumApproved: null,
		cashAdvanceTbody: null,
		cashAdvanceMobileList: null,
		resultCount: null,
		resultCountMobile: null,
		viewRefNo: null,
		viewAmount: null,
		viewRequestedDate: null,
		viewNeededDate: null,
		viewStatus: null,
		viewPurpose: null,
		newAmount: null,
		newNeededDate: null,
		newPurpose: null,
		btnSearch: null,
		btnReset: null,
		btnOpenNew: null,
		btnSaveNewCashAdvance: null,
		desktopPagination: null,
		btnLoadMoreMobile: null,
		cashAdvanceTable: null,
		btnPrintView: null,
	};

	const formatPHP = (amount) => {
		const value = Number(amount || 0);
		return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
	};

	const normalizeDate = (value) => (value ? String(value) : '');

	const escapeHtml = (value = '') =>
		String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

	const getStatusBadge = (status) => {
		if (status === 'Pending Approval') {
			return '<span class="kna-badge kna-badge-pending">Pending Approval</span>';
		}
		if (status === 'For Liquidation') {
			return '<span class="kna-badge kna-badge-liquidation">For Liquidation</span>';
		}
		if (status === 'Approved') {
			return '<span class="kna-badge kna-badge-approved">Approved</span>';
		}
		if (status === 'Rejected') {
			return '<span class="kna-badge kna-badge-rejected">Rejected</span>';
		}
		return `<span class="kna-badge kna-badge-pending">${escapeHtml(status || 'Pending')}</span>`;
	};

	const normalizeApiRows = (rows) =>
		(rows || []).map((row) => ({
			id: Number(row.id),
			refNo: row.cash_advance_id,
			amount: Number(row.amount || 0),
			requestedDate: String(row.created_date || '').slice(0, 10),
			neededDate: row.needed_date,
			status: row.status_name,
			purpose: row.description,
		}));

	const updateLoadMoreButtons = () => {
		const show = hasMoreRows && !isLoadingRows;
		if (dom.btnLoadMoreMobile) {
			dom.btnLoadMoreMobile.style.display = show ? 'inline-block' : 'none';
			dom.btnLoadMoreMobile.disabled = isLoadingRows;
		}
	};

	const loadCashAdvances = (reset = false) => {
		if (isLoadingRows) {
			return null;
		}

		if (reset) {
			desktopPage = 1;
			nextCursorId = null;
			hasMoreRows = false;
			cashAdvances = [];
			refreshUI();
		}

		isLoadingRows = true;
		updateLoadMoreButtons();

		const postData = {
			Take: PAGE_SIZE,
		};

		if (nextCursorId !== null) {
			postData.CursorId = nextCursorId;
		}

		const request = ajax_loader('transactions/cash-advance/api/get', postData);

		request.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				return;
			}

			const rows = normalizeApiRows(res.data);
			cashAdvances = reset ? rows : cashAdvances.concat(rows);

			const pagination = res.pagination || {};
			hasMoreRows = Boolean(pagination.hasMore);
			nextCursorId = (pagination.nextCursorId !== undefined && pagination.nextCursorId !== null)
				? Number(pagination.nextCursorId)
				: (rows.length ? rows[rows.length - 1].id : nextCursorId);

			refreshUI();
		}).fail(() => {
			if (reset) {
				cashAdvances = [];
				refreshUI();
			}
			Swal.fire({
				icon: 'error',
				title: 'Load Failed',
				text: 'Could not load cash advance records.',
			});
		}).always(() => {
			isLoadingRows = false;
			updateLoadMoreButtons();
		});

			return request;
	};

		const renderDesktopPagination = (rows) => {
			if (!dom.desktopPagination) {
				return;
			}

			const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
			if (desktopPage > totalPages) {
				desktopPage = totalPages;
			}

			const canPrev = desktopPage > 1;
			const canNext = desktopPage < totalPages || hasMoreRows;

			let pageLinks = '';
			for (let page = 1; page <= totalPages; page += 1) {
				pageLinks += `
					<li class="page-item ${page === desktopPage ? 'active' : ''}">
						<a class="page-link" href="#" data-page="${page}">${page}</a>
					</li>
				`;
			}

			dom.desktopPagination.innerHTML = `
				<li class="page-item ${canPrev ? '' : 'disabled'}">
					<a class="page-link" href="#" data-action="prev">&lsaquo;</a>
				</li>
				${pageLinks}
				<li class="page-item ${canNext ? '' : 'disabled'}">
					<a class="page-link" href="#" data-action="next">&rsaquo;</a>
				</li>
			`;
		};

		const goToDesktopPage = (targetPage) => {
			if (targetPage < 1) {
				return;
			}

			const loadedRows = getFilteredRows();
			const loadedPages = Math.max(1, Math.ceil(loadedRows.length / PAGE_SIZE));

			if (targetPage <= loadedPages) {
				desktopPage = targetPage;
				refreshUI();
				return;
			}

			if (targetPage === loadedPages + 1 && hasMoreRows) {
				const request = loadCashAdvances(false);
				if (request) {
					request.done(() => {
						desktopPage = targetPage;
						refreshUI();
					});
				}
			}
		};

	const inAmountRange = (amount, range) => {
		if (!range) {
			return true;
		}

		const [min, max] = range.split('-').map(Number);
		return Number(amount) >= min && Number(amount) <= max;
	};

	const matchesFilters = (row) => {
		const status = dom.filterStatus.value;
		const amountRange = dom.filterAmountRange.value;

		if (status && row.status !== status) {
			return false;
		}

		if (dom.filterDateRangePicker) {
			const selected = dom.filterDateRangePicker.selectedDates;
			if (selected.length === 2) {
				const from = selected[0].toISOString().slice(0, 10);
				const to = selected[1].toISOString().slice(0, 10);
				if (row.requestedDate < from || row.requestedDate > to) {
					return false;
				}
			}
		}

		if (!inAmountRange(row.amount, amountRange)) {
			return false;
		}

		return true;
	};

	const renderDesktopTable = (rows) => {
		dom.cashAdvanceTbody.innerHTML = '';

		if (!rows.length) {
			dom.cashAdvanceTbody.innerHTML =
				'<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>';
			return;
		}

		rows.forEach((row) => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td class="text-nowrap" style="max-width:170px;">${escapeHtml(row.refNo)}</td>
				<td class="text-right">${formatPHP(row.amount)}</td>
				<td class="text-truncate" style="max-width:360px;" title="${escapeHtml(row.purpose)}">${escapeHtml(row.purpose)}</td>
				<td>${escapeHtml(row.neededDate)}</td>
				<td>${escapeHtml(row.requestedDate)}</td>
				<td>${getStatusBadge(row.status)}</td>
				<td class="text-center kna-actions">
					<button type="button" class="btn btn-sm btn-outline-primary" data-action="view" data-ref="${escapeHtml(row.refNo)}">
						View
					</button>
				</td>
			`;
			dom.cashAdvanceTbody.appendChild(tr);
		});
	};

	const renderMobileCards = (rows) => {
		dom.cashAdvanceMobileList.innerHTML = '';

		if (!rows.length) {
			dom.cashAdvanceMobileList.innerHTML =
				'<div class="kna-small text-center text-muted py-2">No records found</div>';
			return;
		}

		rows.forEach((row) => {
			const item = document.createElement('div');
			item.className = 'kna-item';
			item.innerHTML = `
				<div class="kna-row">
					<div class="kna-small font-weight-bold">Cash Advance No: ${escapeHtml(row.refNo)}</div>
					<div>${getStatusBadge(row.status)}</div>
				</div>
				<div class="kna-row">
					<div class="kna-small text-muted">Amount</div>
					<div class="kna-small font-weight-bold">${formatPHP(row.amount)}</div>
				</div>
				<div class="kna-row">
					<div class="kna-small text-muted">Needed</div>
					<div class="kna-small">${escapeHtml(row.neededDate)}</div>
				</div>
				<!-- Repayment row removed as per requirements -->
				<div class="kna-small text-muted mt-1 mb-1 text-truncate">${escapeHtml(row.purpose)}</div>
				<button type="button" class="btn btn-outline-primary btn-sm kna-small w-100" data-action="view" data-ref="${escapeHtml(row.refNo)}">
					View Details
				</button>
			`;
			dom.cashAdvanceMobileList.appendChild(item);
		});
	};

	const renderSummary = (rows) => {
		const totalRequested = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
		const pending = rows
			.filter((row) => row.status === 'Pending')
			.reduce((sum, row) => sum + Number(row.amount || 0), 0);
		const forLiquidation = rows
			.filter((row) => row.status === 'For Liquidation')
			.reduce((sum, row) => sum + Number(row.amount || 0), 0);
		const approved = rows
			.filter((row) => row.status === 'Approved')
			.reduce((sum, row) => sum + Number(row.amount || 0), 0);

		dom.sumTotalGranted.textContent = formatPHP(totalRequested);
		dom.sumPending.textContent = formatPHP(pending);
		dom.sumForLiquidation.textContent = formatPHP(forLiquidation);
		dom.sumApproved.textContent = formatPHP(approved);
	};

	const getFilteredRows = () => cashAdvances.filter(matchesFilters);

	const openViewModal = (refNo) => {
		const row = cashAdvances.find((item) => item.refNo === refNo);
		if (!row) {
			return;
		}

		dom.viewRefNo.textContent = row.refNo;
		dom.viewAmount.textContent = formatPHP(row.amount);
		dom.viewRequestedDate.textContent = row.requestedDate;
		dom.viewNeededDate.textContent = row.neededDate;
		dom.viewStatus.innerHTML = getStatusBadge(row.status);
		dom.viewPurpose.textContent = row.purpose;

		$('#modalViewCashAdvance').modal('show');
	};

	const refreshUI = () => {
		const rows = getFilteredRows();
		const startIndex = (desktopPage - 1) * PAGE_SIZE;
		const desktopRows = rows.slice(startIndex, startIndex + PAGE_SIZE);
		renderSummary(rows);
		renderDesktopTable(desktopRows);
		renderMobileCards(rows);
		renderDesktopPagination(rows);
		dom.resultCount.textContent = `${rows.length} record(s)`;
		dom.resultCountMobile.textContent = `${rows.length} record(s)`;
		updateLoadMoreButtons();
	};

	const resetFilters = () => {
		desktopPage = 1;
		if (dom.filterDateRangePicker) {
			dom.filterDateRangePicker.clear();
		}
		dom.filterStatus.value = '';
		dom.filterAmountRange.value = '';
		refreshUI();
	};

	const setDefaultNeededDate = () => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		dom.newNeededDate.value = `${yyyy}-${mm}-${dd}`;
	};

	const handleSave = () => {
		const amount = dom.newAmount.value;
		const neededDate = dom.newNeededDate.value;
		const purpose = dom.newPurpose.value;

		if (!amount || !neededDate || !purpose) {
			Swal.fire({
				icon: 'warning',
				title: 'Missing fields',
				text: 'Please complete the required fields before submitting.',
			});
			return;
		}

		Swal.fire({
			icon: 'question',
			title: 'Confirm Submission',
			text: 'Are you sure you want to proceed?',
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No',
			reverseButtons: true,
		}).then((result) => {
			if (!result.isConfirmed) {
				return;
			}

			const formData = new FormData();
			formData.append('Amount', amount);
			formData.append('Description', purpose);
			formData.append('NeededDate', neededDate);

			ajax_loader_formdata_loading('transactions/cash-advance/api/save', formData).done((response) => {
				const res = (typeof response === 'string') ? $.parseJSON(response) : response;

				if (res.status === 'success') {
					dom.newAmount.value = '';
					dom.newPurpose.value = '';
					setDefaultNeededDate();
					$('#modalNewCashAdvance').one('hidden.bs.modal', () => {
						const caNo = res.data && res.data.id && res.data.id.GeneratedCashAdvanceID;
						Swal.fire({
							icon: 'success',
							title: 'Submitted',
							html: `${res.response}<br><strong>${caNo || ''}</strong>`,
						});
						loadCashAdvances(true);
					});
					$('#modalNewCashAdvance').modal('hide');
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Failed',
						text: res.response || 'An error occurred.',
					});
				}
			}).fail(() => {
				Swal.fire({
					icon: 'error',
					title: 'Request Failed',
					text: 'Could not connect to the server.',
				});
			});
		});
	};

	const cacheDom = () => {
		dom.filterDateRange = document.getElementById('filterDateRange');
		dom.filterStatus = document.getElementById('filterStatus');
		dom.filterAmountRange = document.getElementById('filterAmountRange');
		dom.sumTotalGranted = document.getElementById('sumTotalGranted');
		dom.sumPending = document.getElementById('sumPending');
		dom.sumForLiquidation = document.getElementById('sumForLiquidation');
		dom.sumApproved = document.getElementById('sumApproved');
		dom.cashAdvanceTbody = document.getElementById('cashAdvanceTbody');
		dom.cashAdvanceMobileList = document.getElementById('cashAdvanceMobileList');
		dom.resultCount = document.getElementById('resultCount');
		dom.resultCountMobile = document.getElementById('resultCountMobile');
		dom.viewRefNo = document.getElementById('viewRefNo');
		dom.viewAmount = document.getElementById('viewAmount');
		dom.viewRequestedDate = document.getElementById('viewRequestedDate');
		dom.viewNeededDate = document.getElementById('viewNeededDate');
		dom.viewStatus = document.getElementById('viewStatus');
		dom.viewPurpose = document.getElementById('viewPurpose');
		dom.newAmount = document.getElementById('newAmount');
		dom.newNeededDate = document.getElementById('newNeededDate');
		dom.newPurpose = document.getElementById('newPurpose');
		dom.btnReset = document.getElementById('btnReset');
		dom.btnOpenNew = document.getElementById('btnOpenNew');
		dom.btnSaveNewCashAdvance = document.getElementById('btnSaveNewCashAdvance');
		dom.desktopPagination = document.getElementById('desktopPagination');
		dom.btnLoadMoreMobile = document.getElementById('btnLoadMoreMobile');
		dom.cashAdvanceTable = document.getElementById('cashAdvanceTable');
		dom.btnPrintView = document.getElementById('btnPrintView');
	};

	const applyFilters = () => {
		desktopPage = 1;
		refreshUI();
	};

	const bindEvents = () => {
		dom.filterStatus.addEventListener('change', applyFilters);
		dom.filterAmountRange.addEventListener('change', applyFilters);
		dom.btnReset.addEventListener('click', resetFilters);
		dom.btnOpenNew.addEventListener('click', () => {
			$('#modalNewCashAdvance').modal('show');
		});
		dom.btnSaveNewCashAdvance.addEventListener('click', handleSave);
		if (dom.desktopPagination) {
			dom.desktopPagination.addEventListener('click', (event) => {
				const target = event.target.closest('a.page-link');
				if (!target) {
					return;
				}
				event.preventDefault();

				if (target.dataset.page) {
					goToDesktopPage(Number(target.dataset.page));
					return;
				}

				if (target.dataset.action === 'prev') {
					goToDesktopPage(desktopPage - 1);
					return;
				}

				if (target.dataset.action === 'next') {
					goToDesktopPage(desktopPage + 1);
				}
			});
		}
		if (dom.btnLoadMoreMobile) {
			dom.btnLoadMoreMobile.addEventListener('click', () => loadCashAdvances(false));
		}

		dom.cashAdvanceTable.addEventListener('click', (event) => {
			const btn = event.target.closest('button[data-action="view"]');
			if (!btn) {
				return;
			}
			openViewModal(btn.getAttribute('data-ref'));
		});

		dom.cashAdvanceMobileList.addEventListener('click', (event) => {
			const btn = event.target.closest('button[data-action="view"]');
			if (!btn) {
				return;
			}
			openViewModal(btn.getAttribute('data-ref'));
		});

		dom.btnPrintView.addEventListener('click', () => {
			Swal.fire({
				icon: 'info',
				title: 'Print (Mock)',
				text: 'Print functionality is mock-only in this design.',
			});
		});
	};

	const init = () => {
		cacheDom();
		setDefaultNeededDate();
		if (dom.filterDateRange) {
			dom.filterDateRangePicker = flatpickr(dom.filterDateRange, {
				mode: 'range',
				dateFormat: 'Y-m-d',
				allowInput: false,
				onChange: (selectedDates) => {
					if (selectedDates.length === 0 || selectedDates.length === 2) {
						applyFilters();
					}
				},
			});
		}
		bindEvents();
		loadCashAdvances(true);
	};

	$(document).ready(() => {
		init();
	});
