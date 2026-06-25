const domDetail = {
	cashAdvanceRef: null,
	viewRefNo: null,
	viewAmount: null,
	viewRequestedDate: null,
	viewNeededDate: null,
	viewStatus: null,
	viewPurpose: null,
	viewTimeline: null,
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

const formatTimelineDate = (dateStr) => {
	if (!dateStr) return '';
	const raw = normalizeDate(dateStr);
	if (!raw) return '';

	const date = new Date(raw.replace(' ', 'T'));
	if (Number.isNaN(date.getTime())) return raw;

	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	let hh = date.getHours();
	const ampm = hh >= 12 ? 'PM' : 'AM';
	hh = hh % 12;
	hh = hh ? hh : 12;
	const min = String(date.getMinutes()).padStart(2, '0');

	return `${yyyy}-${mm}-${dd} ${String(hh).padStart(2, '0')}:${min}${ampm}`;
};

// ─── GROUP AUDIT TRAIL BY APPROVER + TIMESTAMP ───
const groupAuditTrail = (auditTrail) => {
	if (!auditTrail || !auditTrail.length) return [];

	const sorted = [...auditTrail].sort((a, b) => {
		const da = new Date((a.created_date || '').replace(' ', 'T'));
		const db = new Date((b.created_date || '').replace(' ', 'T'));
		return da - db;
	});

	const entriesWithKey = sorted.map((entry) => {
		const action = normalizeDate(entry.action || '').toUpperCase();
		const changedByName = normalizeDate(entry.changed_by_name || 'Unknown User');
		const transactionId = normalizeDate(entry.transaction_id || '');
		const entityType = normalizeDate(entry.entity_type || '').toUpperCase();
		const description = normalizeDate(entry.description || '');
		const remarks = normalizeDate(entry.remarks || '');
		const dateStr = formatTimelineDate(entry.created_date);

		const rawDate = normalizeDate(entry.created_date || '');
		const timeBucket = rawDate.length >= 16 ? rawDate.substring(0, 16) : rawDate;

		const groupKey = `${changedByName}|${action}|${transactionId}|${timeBucket}`;

		return {
			...entry,
			_action: action,
			_entityType: entityType,
			_changedByName: changedByName,
			_dateStr: dateStr,
			_timeBucket: timeBucket,
			_groupKey: groupKey,
			_description: description,
			_remarks: remarks,
		};
	});

	const groupMap = new Map();

	entriesWithKey.forEach((entry) => {
		const key = entry._groupKey;

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				dateStr: entry._dateStr,
				changedByName: entry._changedByName,
				action: entry._action,
				transactionType: normalizeDate(entry.transaction_type || ''),
				remarks: '',
				description: '',
				items: [],
				hasHeader: false,
				hasItems: false,
			});
		}

		const group = groupMap.get(key);

		if (entry._entityType === 'HEADER') {
			group.hasHeader = true;
			if (entry._remarks) group.remarks = entry._remarks;
			if (entry._description) group.description = entry._description;
		} else if (entry._entityType === 'ITEM') {
			group.hasItems = true;
			if (entry._description) {
				group.items.push({
					description: entry._description,
					remarks: entry._remarks,
				});
			}
		} else {
			if (entry._description) group.description = entry._description;
			if (entry._remarks) group.remarks = entry._remarks;
		}
	});

	const groups = Array.from(groupMap.values());
	groups.sort((a, b) => {
		const da = new Date((a.dateStr || '').replace(' ', 'T'));
		const db = new Date((b.dateStr || '').replace(' ', 'T'));
		return da - db;
	});

	return groups;
};

// ─── BUILD TIMELINE ENTRY TEXT ───
const buildTimelineText = (group) => {
	const action = group.action;
	const changedByName = group.changedByName;
	const transactionType = group.transactionType.toLowerCase();
	const remarks = group.remarks;

	let actionText = '';
	switch (action) {
		case 'SUBMITTED':
		case 'SAVED_DRAFT':
			actionText = 'files';
			break;
		case 'CREATED':
			actionText = 'creates';
			break;
		case 'APPROVED':
			actionText = 'approves';
			break;
		case 'REJECTED':
			actionText = 'rejects';
			break;
		case 'UPDATED':
		case 'RESUBMITTED':
			actionText = 'updates';
			break;
		default:
			actionText = action.toLowerCase();
	}

	let entityDesc = '';
	if (transactionType === 'cash_advance') {
		entityDesc = 'cash advance';
	} else {
		entityDesc = 'request';
	}

	let text = `${changedByName} ${actionText} ${entityDesc}`;
	if (group.description) text += ` — ${group.description}`;
	if (remarks) text += `: "${remarks}"`;
	return text;
};

// ─── RENDER HISTORY TIMELINE FROM AUDIT TRAIL DATA ───
const renderHistoryTimeline = (auditTrail) => {
	const container = domDetail.viewTimeline;
	if (!container) return;

	if (!auditTrail || !auditTrail.length) {
		container.innerHTML = `
			<li class="kna-timeline-item is-pending">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">No history available</span>
				</div>
				<div class="kna-timeline-item-remarks">This request has no recorded history yet.</div>
			</li>
		`;
		return;
	}

	const groups = groupAuditTrail(auditTrail);

	const html = groups.map((group, index) => {
		const isLast = index === groups.length - 1;
		const statusClass = isLast ? 'is-current' : 'is-done';
		const text = buildTimelineText(group);

		return `
			<li class="kna-timeline-item ${statusClass}">
				<div class="kna-timeline-item-top">
					<span class="kna-timeline-item-name">${escapeHtml(group.dateStr)}</span>
				</div>
				<div class="kna-timeline-item-remarks">${text}</div>
			</li>
		`;
	}).join('');

	container.innerHTML = html;
};

// ─── FETCH AND DISPLAY AUDIT TRAIL ───
const loadAuditTrail = () => {
	const ref = domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '';
	if (!ref) return;

	ajax_loader('transactions/cash-advance/api/get/timeline', { ReferenceNo: ref })
		.done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status !== 'success') {
				renderHistoryTimeline([]);
				return;
			}
			renderHistoryTimeline(res.data && res.data.audit_trail ? res.data.audit_trail : []);
		})
		.fail(() => {
			renderHistoryTimeline([]);
		});
};

const cacheDetailDom = () => {
	domDetail.cashAdvanceRef = document.getElementById('cashAdvanceRef');
	domDetail.viewRefNo = document.getElementById('viewRefNo');
	domDetail.viewAmount = document.getElementById('viewAmount');
	domDetail.viewRequestedDate = document.getElementById('viewRequestedDate');
	domDetail.viewNeededDate = document.getElementById('viewNeededDate');
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewPurpose = document.getElementById('viewPurpose');
	domDetail.viewTimeline = document.getElementById('viewTimeline');
};

const initDetailPage = () => {
	cacheDetailDom();

	const ref = normalizeDate(domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '');

	if (!ref) {
		if (domDetail.viewRefNo) {
			domDetail.viewRefNo.textContent = 'Record not found.';
		}
		return;
	}

	if (domDetail.viewRefNo) {
		domDetail.viewRefNo.textContent = ref;
	}

	// Load detail
	ajax_loader('transactions/cash-advance/api/get/detail', { CashAdvanceId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			if (domDetail.viewRefNo) {
				domDetail.viewRefNo.textContent = 'Could not load record.';
			}
			return;
		}

		const record = res.data;

		if (domDetail.viewRefNo) {
			domDetail.viewRefNo.textContent = normalizeDate(record.cash_advance_id || ref);
		}
		if (domDetail.viewAmount) {
			domDetail.viewAmount.textContent = formatPHP(Number(record.amount || 0));
		}
		if (domDetail.viewRequestedDate) {
			domDetail.viewRequestedDate.textContent = normalizeDate(record.created_date || '').slice(0, 10);
		}
		if (domDetail.viewNeededDate) {
			domDetail.viewNeededDate.textContent = normalizeDate(record.needed_date || '');
		}
		if (domDetail.viewStatus) {
			domDetail.viewStatus.innerHTML = getStatusBadge(normalizeDate(record.status_name || ''));
		}
		if (domDetail.viewPurpose) {
			domDetail.viewPurpose.textContent = normalizeDate(record.description || '') || '-';
		}

		loadAuditTrail();
	}).fail(() => {
		if (domDetail.viewRefNo) {
			domDetail.viewRefNo.textContent = 'Could not load record.';
		}
	});
};

// Router check
if (document.getElementById('cashAdvanceRef')) {
	initDetailPage();
}