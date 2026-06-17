(function (window) {
	const defaultMaxBytes = 2 * 1024 * 1024;

	const normalizeDate = (value) => (value ? String(value) : '');

	const escapeHtml = (value = '') =>
		String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

	const formatPHP = (amount) => {
		const value = Number(amount || 0);
		return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
	};

	const makeFileKey = (file) => `${file.name}|${file.size}|${file.lastModified}`;

	const toTokenId = (text) => {
		let hash = 0;
		for (let i = 0; i < text.length; i += 1) {
			hash = ((hash << 5) - hash) + text.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash) % 50000;
	};

	const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(new Error('Failed to read file.'));
		reader.readAsDataURL(file);
	});

	const loadImageElement = (src) => new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load image.'));
		img.src = src;
	});

	const canvasToBlob = (canvas, mimeType, quality) =>
		new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), mimeType, quality));

	const normalizeCategoryName = (value) =>
		normalizeDate(value)
			.toLowerCase()
			.replace(/[^a-z0-9 ]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const mapOcrCategoryToExpenseTypeId = (categoryName, expenseTypeOptions) => {
		const incoming = normalizeCategoryName(categoryName);
		if (!incoming) {
			return '';
		}

		const exact = expenseTypeOptions.find((opt) => normalizeCategoryName(opt.categoryName) === incoming);
		if (exact) {
			return String(exact.id);
		}

		const partial = expenseTypeOptions.find((opt) => {
			const local = normalizeCategoryName(opt.categoryName);
			return local.includes(incoming) || incoming.includes(local);
		});

		return partial ? String(partial.id) : '';
	};

	const normalizeOcrDateToYmd = (value) => {
		const raw = normalizeDate(value);
		if (!raw) {
			return '';
		}

		if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
			return raw;
		}

		const parsed = new Date(raw);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toISOString().slice(0, 10);
		}

		const mdY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
		if (mdY) {
			const month = Number(mdY[1]);
			const day = Number(mdY[2]);
			let year = Number(mdY[3]);
			if (year < 100) {
				year += 2000;
			}
			if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
				const yyyy = String(year);
				const mm = String(month).padStart(2, '0');
				const dd = String(day).padStart(2, '0');
				return `${yyyy}-${mm}-${dd}`;
			}
		}

		return '';
	};

	const create = (options = {}) => {
		const state = {
			loadingByItem: {},
		};

		const swal = options.swal || window.Swal;
		const ajaxLoaderFormDataLoading = options.ajaxLoaderFormDataLoading || window.ajax_loader_formdata_loading;
		const renderItems = typeof options.renderItems === 'function' ? options.renderItems : () => {};
		const getExpenseItem = typeof options.getExpenseItem === 'function' ? options.getExpenseItem : () => null;
		const getExpenseTypeOptions = typeof options.getExpenseTypeOptions === 'function' ? options.getExpenseTypeOptions : () => [];
		const maxAttachmentBytes = Number(options.maxAttachmentBytes || defaultMaxBytes);
		const ocrEndpoint = options.ocrEndpoint || 'transactions/liquidation/api/ocr';
		const normalizeDateFn = typeof options.normalizeDate === 'function' ? options.normalizeDate : normalizeDate;
		const escapeHtmlFn = typeof options.escapeHtml === 'function' ? options.escapeHtml : escapeHtml;

		const setLoading = (itemId, isLoading) => {
			if (!itemId) {
				return;
			}
			if (isLoading) {
				state.loadingByItem[itemId] = true;
			} else {
				delete state.loadingByItem[itemId];
			}
		};

		const isItemOcrLoading = (itemId) => Boolean(state.loadingByItem[itemId]);

		const attachmentsLabel = (attachments, isOcrLoading = false) => {
			if (!attachments.length) {
				return isOcrLoading
					? '<span class="text-muted">No file</span> <i class="fas fa-spinner fa-spin" title="OCR in progress"></i>'
					: '<span class="text-muted">No file</span>';
			}
			const compressedIcon = attachments.some((file) => Boolean(file && file._wasCompressed))
				? ' <i class="fas fa-compress-alt" title="Compressed"></i>'
				: '';
			const ocrLoadingIcon = isOcrLoading ? ' <i class="fas fa-spinner fa-spin" title="OCR in progress"></i>' : '';
			if (attachments.length === 1) {
				return `${escapeHtmlFn(attachments[0].name)}${compressedIcon}${ocrLoadingIcon}`;
			}
			return `${attachments.length} files attached${compressedIcon}${ocrLoadingIcon}`;
		};

		const compressImageToLimit = async (file) => {
			if (!file || !file.type || !file.type.startsWith('image/')) {
				return null;
			}

			if (file.size <= maxAttachmentBytes) {
				return file;
			}

			const dataUrl = await readFileAsDataUrl(file);
			const image = await loadImageElement(dataUrl);
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				return null;
			}

			let width = image.naturalWidth || image.width;
			let height = image.naturalHeight || image.height;
			let quality = 0.9;
			let scale = 1;
			let bestBlob = null;

			for (let attempt = 0; attempt < 8; attempt += 1) {
				canvas.width = Math.max(1, Math.floor(width * scale));
				canvas.height = Math.max(1, Math.floor(height * scale));
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

				const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
				if (!blob) {
					break;
				}

				bestBlob = blob;
				if (blob.size <= maxAttachmentBytes) {
					break;
				}

				quality = Math.max(0.4, quality - 0.12);
				scale = Math.max(0.45, scale - 0.08);
			}

			if (!bestBlob || bestBlob.size > maxAttachmentBytes) {
				return null;
			}

			const baseName = (file.name || 'attachment').replace(/\.[^.]+$/, '');
			return new File([bestBlob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
		};

		const normalizeIncomingAttachments = async (files) => {
			const acceptedFiles = [];
			const rejectedFiles = [];

			for (const file of files) {
				if (!file || !file.type || !file.type.startsWith('image/')) {
					rejectedFiles.push(`${file ? file.name : 'Unknown file'} (only images allowed)`);
					continue;
				}

				if (file.size <= maxAttachmentBytes) {
					file._wasCompressed = false;
					acceptedFiles.push(file);
					continue;
				}

				const compressed = await compressImageToLimit(file);
				if (compressed) {
					compressed._wasCompressed = true;
					acceptedFiles.push(compressed);
				} else {
					rejectedFiles.push(`${file.name} (cannot compress to 2MB)`);
				}
			}

			return { acceptedFiles, rejectedFiles };
		};

		const addItemAttachments = async (itemId, incomingFiles) => {
			const item = getExpenseItem(itemId);
			if (!item) {
				return [];
			}

			const normalized = await normalizeIncomingAttachments(incomingFiles);
			if (normalized.rejectedFiles.length) {
				swal.fire({
					icon: 'warning',
					title: 'Some files were skipped',
					text: normalized.rejectedFiles.join(', '),
				});
			}

			if (!normalized.acceptedFiles.length) {
				return [];
			}

			const existing = new Set((item.attachments || []).map((file) => makeFileKey(file)));
			normalized.acceptedFiles.forEach((file) => {
				const key = makeFileKey(file);
				if (!existing.has(key)) {
					existing.add(key);
					item.attachments.push(file);
				}
			});

			return normalized.acceptedFiles;
		};

		const ensureCameraPermission = async () => {
			if (!window.isSecureContext) {
				swal.fire({
					icon: 'warning',
					title: 'Camera unavailable',
					text: 'Camera access requires HTTPS (or localhost). Please use a secure connection.',
				});
				return false;
			}

			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				swal.fire({
					icon: 'warning',
					title: 'Camera not supported',
					text: 'This browser does not support direct camera access. Try Gallery upload instead.',
				});
				return false;
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
				stream.getTracks().forEach((track) => track.stop());
				return true;
			} catch (error) {
				let message = 'Please allow camera permission in browser settings and try again.';
				if (error && error.name === 'NotFoundError') {
					message = 'No camera was found on this device.';
				} else if (error && error.name === 'NotReadableError') {
					message = 'Camera is currently being used by another app.';
				}

				swal.fire({
					icon: 'warning',
					title: 'Camera permission needed',
					text: message,
				});
				return false;
			}
		};

		const promptAttachmentSource = (itemId, callbacks = {}) => {
			swal.fire({
				title: 'Choose attachment source',
				text: 'Select where to get the receipt image/file.',
				icon: 'question',
				showCancelButton: true,
				confirmButtonText: 'Gallery',
				confirmButtonColor: '#2563eb',
				showDenyButton: true,
				denyButtonText: 'Camera',
				denyButtonColor: '#16a34a',
				cancelButtonText: 'Cancel',
			}).then((result) => {
				if (result.isConfirmed && typeof callbacks.onGallery === 'function') {
					callbacks.onGallery(itemId);
					return;
				}

				if (result.isDenied && typeof callbacks.onCamera === 'function') {
					callbacks.onCamera(itemId);
				}
			});
		};

		const runOcrAutofillForItem = async (itemId, file) => {
			if (!file || !file.type || !file.type.startsWith('image/')) {
				return;
			}

			const item = getExpenseItem(itemId);
			if (!item) {
				return;
			}

			if (state.loadingByItem[itemId]) {
				return;
			}

			state.loadingByItem[itemId] = true;
			renderItems();
			const formData = new FormData();
			formData.append('image', file);

			try {
				const response = await ajaxLoaderFormDataLoading(ocrEndpoint, formData);
				const res = (typeof response === 'string') ? $.parseJSON(response) : response;
				if (res.status !== 'success' || !res.data) {
					return;
				}

				const ocr = res.data;
				const tokenSource = [
					normalizeDateFn(ocr.document_date),
					normalizeDateFn(ocr.invoice_receipt_no),
					normalizeDateFn(ocr.actual_amount),
					normalizeDateFn(ocr.description),
					normalizeDateFn(ocr.expense_category_name),
					(typeof ocr.is_vatable === 'boolean' ? String(ocr.is_vatable) : ''),
				].filter(Boolean).join(' ');

				const normalizedTokenSource = String(tokenSource || '').replace(/\s+/g, ' ').trim();
				const tokenArray = normalizedTokenSource
					? ((normalizedTokenSource.match(/[\p{L}\p{N}]+(?:[./:-][\p{L}\p{N}]+)*/gu) || []).filter((part) => part !== ''))
					: [];
				const tokenDetails = tokenArray.map((text) => ({
					text,
					token_id: toTokenId(text),
				}));

				console.log('Tokens');
				console.log(tokenArray.length);
				console.log('Total Token Used');
				console.log(tokenArray.length);
				console.log('Why');
				console.log('Total token used is the number of text chunks found after splitting OCR text by spaces and separators. Each row in Token Details is counted as 1 token.');
				console.log('Characters');
				console.log(normalizedTokenSource.length);
				console.log('Token Details');
				console.table(tokenDetails);

				const documentDate = normalizeOcrDateToYmd(ocr.document_date);
				const categoryId = mapOcrCategoryToExpenseTypeId(ocr.expense_category_name, getExpenseTypeOptions());

				if (documentDate) {
					item.documentDate = documentDate;
				}
				if (categoryId) {
					item.expenseType = categoryId;
				}
				if (ocr.invoice_receipt_no) {
					item.reference = normalizeDateFn(ocr.invoice_receipt_no);
				}
				if (Number(ocr.actual_amount) > 0) {
					item.amount = Number(ocr.actual_amount).toFixed(2);
				}
				if (typeof ocr.is_vatable === 'boolean') {
					item.isVattable = ocr.is_vatable;
				}
				if (ocr.description) {
					item.remarks = normalizeDateFn(ocr.description);
				}

				renderItems();
			} catch (error) {
				// Keep manual entry workflow even if OCR fails.
			} finally {
				delete state.loadingByItem[itemId];
				renderItems();
			}
		};

		return {
			attachmentsLabel,
			addItemAttachments,
			ensureCameraPermission,
			isItemOcrLoading,
			promptAttachmentSource,
			runOcrAutofillForItem,
		};
	};

	window.SharedReceiptOcr = {
		create,
	};
})(window);
