const domDetail = {
	cashAdvanceRef: null,
	viewRefNo: null,
	viewAmount: null,
	viewRequestedDate: null,
	viewNeededDate: null,
	viewStatus: null,
	viewPurpose: null,
	viewTimeline: null,
	viewPdfSection: null,
	viewPdfState: null,
	viewPdfIframe: null,
	viewPdfEmpty: null,
	viewPdfOpenNewTab: null,
	viewWorkflowSection: null,
	viewWorkflowIframe: null,
	viewWorkflowOpenNewTab: null,
	serverKflowUrl: null,
};

let forcedKflowEmbedUrl = '';
const KFLOW_URL_STORAGE_PREFIX = 'knet_ca_kflow_url_';
const KFLOW_PUBLISHED_STORAGE_PREFIX = 'knet_ca_kflow_published_';

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

const getKflowStorageKey = (caRef) => `${KFLOW_URL_STORAGE_PREFIX}${normalizeDate(caRef)}`;

const saveKflowUrlToStorage = (caRef, url) => {
	if (!caRef || !url) {
		return;
	}
	try {
		window.localStorage.setItem(getKflowStorageKey(caRef), url);
	} catch (error) {
		// Ignore storage issues and continue normally.
	}
};

const readKflowUrlFromStorage = (caRef) => {
	if (!caRef) {
		return '';
	}
	try {
		return normalizeDate(window.localStorage.getItem(getKflowStorageKey(caRef)) || '');
	} catch (error) {
		return '';
	}
};

const clearKflowUrlFromStorage = (caRef) => {
	if (!caRef) {
		return;
	}
	try {
		window.localStorage.removeItem(getKflowStorageKey(caRef));
	} catch (error) {
		// Ignore storage issues and continue normally.
	}
};

const getKflowPublishedStorageKey = (caRef) => `${KFLOW_PUBLISHED_STORAGE_PREFIX}${normalizeDate(caRef)}`;

const markKflowPublished = (caRef) => {
	if (!caRef) {
		return;
	}
	try {
		window.localStorage.setItem(getKflowPublishedStorageKey(caRef), '1');
	} catch (error) {
		// Ignore storage issues and continue normally.
	}
};

const isKflowPublished = (caRef) => {
	if (!caRef) {
		return false;
	}
	try {
		return window.localStorage.getItem(getKflowPublishedStorageKey(caRef)) === '1';
	} catch (error) {
		return false;
	}
};

const clearKflowPublished = (caRef) => {
	if (!caRef) {
		return;
	}
	try {
		window.localStorage.removeItem(getKflowPublishedStorageKey(caRef));
	} catch (error) {
		// Ignore storage issues and continue normally.
	}
};

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

const renderDocumentPanels = (record) => {
	if (!record) {
		return;
	}

	const activePdfUrl = normalizeDate(record.active_pdf_url || '');
	const unsignedPdfUrl = normalizeDate(record.unsigned_pdf_url || '');
	const signedPdfUrl = normalizeDate(record.signed_pdf_url || '');
	const apiKflowEmbedUrl = normalizeDate(record.kflow_embed_url || '');
	const kflowEmbedUrl = forcedKflowEmbedUrl || apiKflowEmbedUrl;
	const finalApproved = Number(record.is_final_approved || 0) === 1;
	const kflowDocStatus = Number(record.kflow_doc_status || 0);
	const isRejected = kflowDocStatus === 3;
	const caRef = normalizeDate(record.cash_advance_id || (domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : ''));
	const workflowPublished = isKflowPublished(caRef);
	const showWorkflow = !isRejected && Boolean(kflowEmbedUrl) && !workflowPublished;

	let stateText = 'Unsigned PDF (Pending Final Approval)';
	if (finalApproved && signedPdfUrl) {
		stateText = 'Signed PDF (KFlow Approved)';
	} else if (!unsignedPdfUrl && !activePdfUrl) {
		stateText = 'Document Preview Not Available';
	}

	if (isRejected) {
		stateText = 'Document Hidden (Rejected in K-flow)';
	}

	if (domDetail.viewPdfState) {
		domDetail.viewPdfState.textContent = stateText;
	}

	if (activePdfUrl) {
		if (domDetail.viewPdfIframe) {
			domDetail.viewPdfIframe.src = activePdfUrl;
			domDetail.viewPdfIframe.classList.remove('d-none');
		}
		if (domDetail.viewPdfEmpty) {
			domDetail.viewPdfEmpty.classList.add('d-none');
		}
		if (domDetail.viewPdfOpenNewTab) {
			domDetail.viewPdfOpenNewTab.href = activePdfUrl;
			domDetail.viewPdfOpenNewTab.classList.remove('d-none');
		}
	} else {
		if (domDetail.viewPdfIframe) {
			domDetail.viewPdfIframe.src = 'about:blank';
			domDetail.viewPdfIframe.classList.add('d-none');
		}
		if (domDetail.viewPdfEmpty) {
			domDetail.viewPdfEmpty.classList.remove('d-none');
		}
		if (domDetail.viewPdfOpenNewTab) {
			domDetail.viewPdfOpenNewTab.removeAttribute('href');
			domDetail.viewPdfOpenNewTab.classList.add('d-none');
		}
	}

	if (domDetail.viewPdfSection) {
		domDetail.viewPdfSection.classList.toggle('d-none', showWorkflow || isRejected);
	}

	if (showWorkflow) {
		forcedKflowEmbedUrl = kflowEmbedUrl;
		saveKflowUrlToStorage(caRef, kflowEmbedUrl);

		if (domDetail.viewWorkflowSection) {
			domDetail.viewWorkflowSection.classList.remove('d-none');
		}
		if (domDetail.viewWorkflowIframe) {
			const currentSrc = domDetail.viewWorkflowIframe.getAttribute('src') || '';
			if (currentSrc !== kflowEmbedUrl) {
				domDetail.viewWorkflowIframe.src = kflowEmbedUrl;
			}
		}
		if (domDetail.viewWorkflowOpenNewTab) {
			domDetail.viewWorkflowOpenNewTab.href = kflowEmbedUrl;
			domDetail.viewWorkflowOpenNewTab.classList.remove('d-none');
		}
	} else {
		if (domDetail.viewWorkflowSection) {
			domDetail.viewWorkflowSection.classList.add('d-none');
		}
		if (domDetail.viewWorkflowIframe) {
			domDetail.viewWorkflowIframe.src = 'about:blank';
		}
		if (domDetail.viewWorkflowOpenNewTab) {
			domDetail.viewWorkflowOpenNewTab.removeAttribute('href');
			domDetail.viewWorkflowOpenNewTab.classList.add('d-none');
		}
		if (finalApproved || isRejected) {
			clearKflowUrlFromStorage(caRef);
			clearKflowPublished(caRef);
			forcedKflowEmbedUrl = '';
		}
	}
};

const bindEmbeddedWorkflowEvents = () => {
	window.addEventListener('message', (event) => {
		const payload = event && event.data ? event.data : null;
		if (!payload || payload.type !== 'kflow-document-published') {
			return;
		}

		const caRef = normalizeDate(domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '');
		if (!caRef) {
			return;
		}

		markKflowPublished(caRef);
		loadDetailData(false);
	});
};

const applyEmbeddedKflowChrome = () => {
	if (!domDetail.viewWorkflowIframe) {
		return;
	}

	const iframe = domDetail.viewWorkflowIframe;
	iframe.addEventListener('load', () => {
		try {
			const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
			if (!iframeDoc) {
				return;
			}

			const header = iframeDoc.querySelector('.main-header');
			if (header) {
				header.style.display = 'none';
			}

			const styleId = 'knet-embed-kflow-style';
			if (!iframeDoc.getElementById(styleId)) {
				const styleTag = iframeDoc.createElement('style');
				styleTag.id = styleId;
				styleTag.textContent = `
					.main-header { display: none !important; height: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; }
					.main-panel { padding-top: 0 !important; margin-top: 0 !important; }
					.content { margin-top: 0 !important; padding-top: 0 !important; }
					.page-inner { margin-top: 0 !important; padding-top: 0 !important; }
					.wrapper { padding-top: 0 !important; margin-top: 0 !important; }
					.container { margin-top: 0 !important; padding-top: 0 !important; }
				`;
				(iframeDoc.head || iframeDoc.documentElement).appendChild(styleTag);
			}

			const pageInner = iframeDoc.querySelector('.page-inner');
			if (pageInner) {
				pageInner.style.marginTop = '0';
				pageInner.style.paddingTop = '0';
			}

			const mainPanel = iframeDoc.querySelector('.main-panel');
			if (mainPanel) {
				mainPanel.style.marginTop = '0';
				mainPanel.style.paddingTop = '0';
			}

			const content = iframeDoc.querySelector('.content');
			if (content) {
				content.style.marginTop = '0';
				content.style.paddingTop = '0';
			}

			iframeDoc.querySelectorAll('.container').forEach((containerEl) => {
				containerEl.style.marginTop = '0';
				containerEl.style.paddingTop = '0';
			});
		} catch (error) {
			// If cross-origin constraints appear in future env changes, fail gracefully.
		}
	});
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
	domDetail.viewPdfSection = document.getElementById('viewPdfSection');
	domDetail.viewPdfState = document.getElementById('viewPdfState');
	domDetail.viewPdfIframe = document.getElementById('viewPdfIframe');
	domDetail.viewPdfEmpty = document.getElementById('viewPdfEmpty');
	domDetail.viewPdfOpenNewTab = document.getElementById('viewPdfOpenNewTab');
	domDetail.viewWorkflowSection = document.getElementById('viewWorkflowSection');
	domDetail.viewWorkflowIframe = document.getElementById('viewWorkflowIframe');
	domDetail.viewWorkflowOpenNewTab = document.getElementById('viewWorkflowOpenNewTab');
	domDetail.serverKflowUrl = document.getElementById('serverKflowUrl');

	applyEmbeddedKflowChrome();
	bindEmbeddedWorkflowEvents();
};

const loadDetailData = (loadTimeline = true) => {
	const ref = normalizeDate(domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '');
	if (!ref) {
		return;
	}

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

		renderDocumentPanels(record);

		if (loadTimeline) {
			loadAuditTrail();
		}
	}).fail(() => {
		if (domDetail.viewRefNo) {
			domDetail.viewRefNo.textContent = 'Could not load record.';
		}
	});
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

	const searchParams = new URLSearchParams(window.location.search);
	const storedKflowUrl = readKflowUrlFromStorage(ref);
	const serverKflowUrl = normalizeDate(domDetail.serverKflowUrl ? domDetail.serverKflowUrl.value : '');
	const queryKflowUrl = normalizeDate(searchParams.get('kflow_url') || '');

	forcedKflowEmbedUrl = serverKflowUrl || queryKflowUrl || storedKflowUrl;

	// If a new batch/token URL is provided, clear stale "published" state for this CA.
	if (forcedKflowEmbedUrl && storedKflowUrl && forcedKflowEmbedUrl !== storedKflowUrl) {
		clearKflowPublished(ref);
	}

	if (forcedKflowEmbedUrl) {
		saveKflowUrlToStorage(ref, forcedKflowEmbedUrl);
	}

	loadDetailData(true);

	if (searchParams.get('open_workflow') === '1' && domDetail.viewWorkflowSection) {
		setTimeout(() => {
			domDetail.viewWorkflowSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 500);
	}
};

// Router check
if (document.getElementById('cashAdvanceRef')) {
	initDetailPage();
}