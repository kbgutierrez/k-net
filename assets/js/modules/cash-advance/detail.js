const domDetail = {
	cashAdvanceRef: null,
	viewRefNo: null,
	viewAmount: null,
	viewApprovedAmount: null,
	viewRequestedDate: null,
	viewNeededDate: null,
	viewStatus: null,
	viewPurpose: null,
	viewCostCenter: null,
	viewIONumber: null,
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
let kflowPollTimer = null;
let lastKnownKflowDocStatus = null;
const KFLOW_POLL_INTERVAL_MS = 6000;
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

const AUDIT_FIELD_LABELS = {
	description: 'Description', amount: 'Amount', approved_amount: 'Approved Amount',
	cost_center_id: 'Cost Center', payable_to: 'Payable To', address: 'Address', io: 'IO Number',
};
const AUDIT_CURRENCY_FIELDS = new Set(['amount', 'approved_amount']);

const formatAuditFieldLabel = (field) => AUDIT_FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatAuditValue = (field, value) => {
	const raw = normalizeDate(value);
	if (raw === '') return '<span class="text-muted">—</span>';
	if (AUDIT_CURRENCY_FIELDS.has(field)) {
		const num = Number(raw);
		return Number.isFinite(num) ? escapeHtml(formatPHP(num)) : escapeHtml(raw);
	}
	return escapeHtml(raw);
};

const AUDIT_ACTION_VERBS = {
	SUBMITTED: 'submitted', SAVED_DRAFT: 'saved a draft of', CREATED: 'created', APPROVED: 'approved',
	REJECTED: 'rejected', UPDATED: 'updated', RESUBMITTED: 'resubmitted', UPDATED_ITEM: 'edited',
	// Advise/Release log the raw new status code as the action (see
	// Approvals::runAdvisePayment/runReleasePayment) — map those
	// specifically instead of falling through to the raw-code fallback,
	// which produced "ca for release the cash advance" / "ca completed
	// the cash advance".
	CA_FOR_RELEASE: 'advised payment for', CA_COMPLETED: 'released payment for',
};
const auditActionVerb = (action) => AUDIT_ACTION_VERBS[action] || action.toLowerCase().replace(/_/g, ' ');
const joinAuditVerbs = (actions) => {
	const verbs = [...new Set(actions.map(auditActionVerb))];
	if (verbs.length === 1) return verbs[0];
	if (verbs.length === 2) return `${verbs[0]} and ${verbs[1]}`;
	return `${verbs.slice(0, -1).join(', ')}, and ${verbs[verbs.length - 1]}`;
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
		const fieldName = normalizeDate(entry.field_name || '');
		const description = normalizeDate(entry.description || '');
		const remarks = normalizeDate(entry.remarks || '');
		const dateStr = formatTimelineDate(entry.created_date);

		const rawDate = normalizeDate(entry.created_date || '');
		const timeBucket = rawDate.length >= 16 ? rawDate.substring(0, 16) : rawDate;

		const groupKey = `${changedByName}|${transactionId}|${timeBucket}`;

		return {
			...entry,
			_action: action,
			_entityType: entityType,
			_fieldName: fieldName,
			_changedByName: changedByName,
			_dateStr: dateStr,
			_timeBucket: timeBucket,
			_groupKey: groupKey,
			_description: description,
			_remarks: remarks,
			_oldValue: entry.old_value,
			_newValue: entry.new_value,
		};
	});

	const groupMap = new Map();

	entriesWithKey.forEach((entry) => {
		const key = entry._groupKey;

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				dateStr: entry._dateStr,
				changedByName: entry._changedByName,
				transactionType: normalizeDate(entry.transaction_type || ''),
				actions: [],
				headerRemarks: '',
				headerDescription: '',
				headerChanges: [],
				hasHeader: false,
			});
		}

		const group = groupMap.get(key);
		if (!group.actions.includes(entry._action)) group.actions.push(entry._action);

		if (entry._entityType === 'HEADER') {
			group.hasHeader = true;
			if (entry._remarks) group.headerRemarks = entry._remarks;
			if (entry._description) group.headerDescription = entry._description;
			if (entry._fieldName && normalizeDate(entry._oldValue) !== normalizeDate(entry._newValue)) {
				group.headerChanges.push({ field: entry._fieldName, oldValue: entry._oldValue, newValue: entry._newValue });
			}
		} else {
			if (entry._description) group.headerDescription = entry._description;
			if (entry._remarks) group.headerRemarks = entry._remarks;
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
	const changedByName = escapeHtml(group.changedByName);
	const transactionType = group.transactionType.toLowerCase();

	let entityDesc = '';
	if (transactionType === 'cash_advance') {
		entityDesc = 'the cash advance';
	} else {
		entityDesc = 'the request';
	}

	const verbPhrase = joinAuditVerbs(group.actions);

	let text = `<strong>${changedByName}</strong> ${verbPhrase} ${entityDesc}`;
	if (group.headerDescription) text += ` &mdash; ${escapeHtml(group.headerDescription)}`;
	if (group.headerRemarks) text += `: "${escapeHtml(group.headerRemarks)}"`;

	if (group.headerChanges.length > 0) {
		const changeParts = group.headerChanges.map((c) => `${escapeHtml(formatAuditFieldLabel(c.field))}: ${formatAuditValue(c.field, c.oldValue)} &rarr; ${formatAuditValue(c.field, c.newValue)}`).join(', ');
		text += `<br>&nbsp;&nbsp;&bull; ${changeParts}`;
	}

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
	// kflow_doc_status 2 = sent for signature but not yet signed — show
	// the unsigned PDF, not the live K-flow embed. Previously the embed
	// showed for ANY kflowEmbedUrl regardless of status, so it appeared
	// immediately on filing (status 2) instead of the unsigned PDF.
	const isUnsigned = kflowDocStatus === 2;
	lastKnownKflowDocStatus = kflowDocStatus;
	const caRef = normalizeDate(record.cash_advance_id || (domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : ''));
	const workflowPublished = isKflowPublished(caRef);
	// kflow_doc_status 4 = fully signed — always show the signed PDF panel,
	// never the workflow embed, regardless of stale localStorage/postMessage
	// state (that state only tracks whether *this browser tab* saw the
	// signing finish live, which isn't reliable if nobody was watching).
	const showWorkflow = !isRejected && !finalApproved && !isUnsigned && Boolean(kflowEmbedUrl) && !workflowPublished;

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

		// K-flow's own postMessage ('kflow-document-published') is the
		// fast path, but it's an external app we don't control — if it
		// doesn't fire (or fires for a different milestone than we
		// expect), the page would otherwise sit on the stale embed
		// until the user manually refreshes. Poll our own backend as a
		// fallback so kflow_doc_status changes (e.g. moving to
		// "unsigned, pending signature") surface within a few seconds
		// either way. pollKflowStatusOnly() only touches the DOM when
		// the status actually changed, so this never flickers/reloads
		// the embed while the user is still mid-workflow inside it.
		if (!kflowPollTimer) {
			kflowPollTimer = window.setInterval(pollKflowStatusOnly, KFLOW_POLL_INTERVAL_MS);
		}
	} else {
		if (kflowPollTimer) {
			window.clearInterval(kflowPollTimer);
			kflowPollTimer = null;
		}

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

// ─── FETCH AND DISPLAY ATTACHMENTS ───
const getFileIconClass = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const pdfExts = ['pdf'];
    const docExts = ['doc', 'docx', 'txt', 'rtf'];
    const sheetExts = ['xls', 'xlsx', 'csv'];
    const zipExts = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageExts.includes(ext)) return { icon: 'fa-image', css: 'img' };
    if (pdfExts.includes(ext)) return { icon: 'fa-file-pdf', css: 'pdf' };
    if (docExts.includes(ext)) return { icon: 'fa-file-word', css: 'doc' };
    if (sheetExts.includes(ext)) return { icon: 'fa-file-excel', css: 'doc' };
    if (zipExts.includes(ext)) return { icon: 'fa-file-archive', css: 'doc' };
    return { icon: 'fa-file', css: '' };
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return Math.round(kb) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
};

const isImageFile = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
};

const renderAttachments = (attachments) => {
    const container = document.getElementById('viewAttachmentsList');
    if (!container) return;

    if (!attachments || attachments.length === 0) {
        container.innerHTML = '<div class="kna-doc-empty">No attachments uploaded.</div>';
        return;
    }

    const html = attachments.map((att) => {
        const fileName = escapeHtml(att.original_name || att.file_name || 'Unknown');
        const uploadedDate = normalizeDate(att.uploaded_date || '');
        const viewUrl = normalizeDate(att.view_url || '');
        const downloadUrl = normalizeDate(att.download_url || '');
        const { icon, css } = getFileIconClass(fileName);
        const isImage = isImageFile(fileName);

        const downloadBtn = downloadUrl
            ? `<a href="${escapeHtml(downloadUrl)}" class="btn btn-sm btn-outline-secondary" title="Download">
                 <i class="fas fa-download"></i>
               </a>`
            : '';

        // For images, show a clickable thumbnail preview; for others, show the icon
        let preview;
        if (isImage && viewUrl) {
            preview = `<div class="kna-attachment-thumb-wrap" 
                             onclick="openAttachmentPreview('${escapeHtml(viewUrl)}', '${fileName}')"
                             title="Click to preview">
                            <img src="${escapeHtml(viewUrl)}" 
                                 alt="${fileName}" 
                                 class="kna-attachment-thumb-img"
                                 loading="lazy"
                                 onerror="this.parentElement.innerHTML='<div class=\'kna-attachment-icon ${css}\'><i class=\'fas ${icon}\'></i></div>'">
                        </div>`;
        } else {
            preview = `<div class="kna-attachment-icon ${css}">
                         <i class="fas ${icon}"></i>
                       </div>`;
        }

        return `
            <div class="kna-attachment-item">
                ${preview}
                <div class="kna-attachment-info">
                    <div class="kna-attachment-name" title="${fileName}">${fileName}</div>
                    <div class="kna-attachment-meta">
                        ${uploadedDate ? `Uploaded on ${uploadedDate}` : ''}
                    </div>
                </div>
                <div class="kna-attachment-actions">
                    ${downloadBtn}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
};

const openAttachmentPreview = (imgUrl, caption) => {
    const modal = document.getElementById('attachmentPreviewModal');
    const img = document.getElementById('attachmentPreviewImg');
    const cap = document.getElementById('attachmentPreviewCaption');

    if (!modal || !img) return;

    img.src = imgUrl;
    if (cap) cap.textContent = caption || '';
    modal.classList.add('active');
};

const closeAttachmentPreview = () => {
    const modal = document.getElementById('attachmentPreviewModal');
    const img = document.getElementById('attachmentPreviewImg');
    if (modal) modal.classList.remove('active');
    if (img) img.src = '';
};

const bindAttachmentPreviewEvents = () => {
    const modal = document.getElementById('attachmentPreviewModal');
    const closeBtn = document.getElementById('attachmentPreviewClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAttachmentPreview);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAttachmentPreview();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAttachmentPreview();
    });
};

const loadAttachments = () => {
    const ref = domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '';
    if (!ref) return;

    ajax_loader('transactions/cash-advance/api/get/attachments', { CashAdvanceId: ref })
        .done((response) => {
            const res = (typeof response === 'string') ? $.parseJSON(response) : response;
            if (res.status !== 'success') {
                renderAttachments([]);
                return;
            }
            renderAttachments(res.data && res.data.attachments ? res.data.attachments : []);
        })
        .fail(() => {
            renderAttachments([]);
        });
};

/* ─── HISTORY MODAL TOGGLE ─── */
const initHistoryModal = (triggerIds = ['btnShowHistory']) => {
	const overlay = document.getElementById('historyModalOverlay');
	const closeBtn = document.getElementById('btnCloseHistory');
	if (!overlay) return;
	const open = () => overlay.classList.remove('d-none');
	const close = () => overlay.classList.add('d-none');
	triggerIds.forEach((id) => {
		const btn = document.getElementById(id);
		if (btn) btn.addEventListener('click', open);
	});
	if (closeBtn) closeBtn.addEventListener('click', close);
	overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
};

const cacheDetailDom = () => {
	domDetail.cashAdvanceRef = document.getElementById('cashAdvanceRef');
	domDetail.viewRefNo = document.getElementById('viewRefNo');
	domDetail.viewAmount = document.getElementById('viewAmount');
	domDetail.viewApprovedAmount = document.getElementById('viewApprovedAmount');
	domDetail.viewRequestedDate = document.getElementById('viewRequestedDate');
	domDetail.viewNeededDate = document.getElementById('viewNeededDate');
	domDetail.viewStatus = document.getElementById('viewStatus');
	domDetail.viewPurpose = document.getElementById('viewPurpose');
	domDetail.viewCostCenter = document.getElementById('viewCostCenter');
	domDetail.viewIONumber = document.getElementById('viewIONumber');
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
	initHistoryModal();
};

// Fires every KFLOW_POLL_INTERVAL_MS while the workflow embed is showing.
// Fetches fresh data but only triggers a real re-render (loadDetailData)
// when kflow_doc_status actually changed — otherwise this is a silent
// no-op, so the user sees nothing move while they're still mid-signing.
const pollKflowStatusOnly = () => {
	const ref = normalizeDate(domDetail.cashAdvanceRef ? domDetail.cashAdvanceRef.value : '');
	if (!ref) {
		return;
	}

	ajax_loader('transactions/cash-advance/api/get/detail', { CashAdvanceId: ref }).done((response) => {
		const res = (typeof response === 'string') ? $.parseJSON(response) : response;
		if (res.status !== 'success' || !res.data) {
			return;
		}
		const newStatus = Number(res.data.kflow_doc_status || 0);
		if (newStatus === lastKnownKflowDocStatus) {
			return;
		}
		loadDetailData(false);
	});
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
		if (domDetail.viewApprovedAmount) {
			domDetail.viewApprovedAmount.textContent = formatPHP(Number(record.approved_amount || 0));
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
		if (domDetail.viewCostCenter) {
			const ccId = normalizeDate(record.cost_center_id || '');
			const ccName = normalizeDate(record.cost_center_name || '');
			let ccDisplay = '-';
			if (ccId && ccName) {
				ccDisplay = `${ccId} - ${ccName}`;
			} else if (ccName) {
				ccDisplay = ccName;
			} else if (ccId) {
				ccDisplay = ccId;
			}
			domDetail.viewCostCenter.textContent = ccDisplay;
		}
		if (domDetail.viewIONumber) {
			domDetail.viewIONumber.textContent = normalizeDate(record.io_number || '') || '-';
		}

		renderDocumentPanels(record);

		if (loadTimeline) {
			loadAuditTrail();
			loadAttachments();
		}
	}).fail(() => {
		if (domDetail.viewRefNo) {
			domDetail.viewRefNo.textContent = 'Could not load record.';
		}
	});
};

const initDetailPage = () => {
	cacheDetailDom();
	bindAttachmentPreviewEvents();

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