const domAdd = {
	newDate: null,
	newPayableTo: null,
	newAddress: null,
	newAmount: null,
	newAmountWords: null,
	newNeededDate: null,
	newPurpose: null,
	newCostCenter: null,
	newAttachments: null,
	btnSaveNewCashAdvance: null,
};

const goToPath = (path) => {
	window.location.href = `${base_url}${path}`;
};

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');


const amountToWords = (amount) => {
	const num = parseFloat(String(amount).replace(/,/g, ''));

	if (!num || num < 0) return '';

	const ones = [
		'',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine',
		'ten',
		'eleven',
		'twelve',
		'thirteen',
		'fourteen',
		'fifteen',
		'sixteen',
		'seventeen',
		'eighteen',
		'nineteen'
	];

	const tens = [
		'',
		'',
		'twenty',
		'thirty',
		'forty',
		'fifty',
		'sixty',
		'seventy',
		'eighty',
		'ninety'
	];

	const convertLessThanOneThousand = (n) => {
		let result = '';

		if (n >= 100) {
			result += ones[Math.floor(n / 100)] + ' hundred';
			n %= 100;

			if (n > 0) {
				result += ' ';
			}
		}

		if (n < 20) {
			result += ones[n];
		} else {
			result += tens[Math.floor(n / 10)];

			if (n % 10 !== 0) {
				result += '-' + ones[n % 10];
			}
		}

		return result.trim();
	};

	const convert = (n) => {
		if (n === 0) return 'zero';

		let result = '';

		const billion = Math.floor(n / 1000000000);
		const million = Math.floor((n % 1000000000) / 1000000);
		const thousand = Math.floor((n % 1000000) / 1000);
		const remainder = n % 1000;

		if (billion) {
			result += convert(billion) + ' billion ';
		}

		if (million) {
			result += convert(million) + ' million ';
		}

		if (thousand) {
			result += convert(thousand) + ' thousand ';
		}

		if (remainder) {
			result += convertLessThanOneThousand(remainder);
		}

		return result.trim();
	};

	const pesos = Math.floor(num);
	const centavos = Math.round((num - pesos) * 100);

	let words = convert(pesos) + ' pesos';

	if (centavos > 0) {
		words += ' and ' + convert(centavos) + ' centavos';
	}

	words += ' only';

	return words.replace(/\b\w/g, (l) => l.toUpperCase());
};

const setDefaultDates = () => {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const iso = `${yyyy}-${mm}-${dd}`;
	if (domAdd.newDate) domAdd.newDate.value = iso;
	if (domAdd.newNeededDate) domAdd.newNeededDate.value = iso;
};

const handleSave = () => {
	const fields = {
		payableTo: domAdd.newPayableTo.value.trim(),
		address: domAdd.newAddress.value.trim(),
		amount: domAdd.newAmount.value,
		neededDate: domAdd.newNeededDate.value,
		purpose: domAdd.newPurpose.value.trim(),
		costCenter: domAdd.newCostCenter.value,
	};

	if (!fields.payableTo || !fields.address || !fields.amount || !fields.neededDate || !fields.purpose || !fields.costCenter) {
		Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please complete all required fields before submitting.' });
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
		if (!result.isConfirmed) return;

		const formData = new FormData();
		formData.append('Date', domAdd.newDate.value);
		formData.append('PayableTo', fields.payableTo);
		formData.append('Address', fields.address);
		formData.append('Amount', fields.amount);
		formData.append('AmountInWords', domAdd.newAmountWords.value);
		formData.append('Description', fields.purpose);
		formData.append('NeededDate', fields.neededDate);
		formData.append('CostCenterId', fields.costCenter);

		const files = domAdd.newAttachments.files;
		for (let i = 0; i < files.length; i++) {
			formData.append('attachments[]', files[i]);
		}

		ajax_loader_formdata_loading('transactions/cash-advance/api/save', formData).done((response) => {
			const res = (typeof response === 'string') ? $.parseJSON(response) : response;
			if (res.status === 'success') {
				const caNo = res.data && res.data.cash_advance_id ? res.data.cash_advance_id : '';
				Swal.fire({
					icon: 'success',
					title: 'Submitted',
					html: `${res.response}<br><strong>${escapeHtml(caNo)}</strong>`,
				}).then(() => {
					// THE KEY CHANGE: Redirect to K-flow instead of K-net index
					if (res.data && res.data.redirect_url) {
						window.location.href = res.data.redirect_url;
					} else {
						goToPath('transactions/cash-advance');
					}
				});
			} else {
				Swal.fire({ icon: 'error', title: 'Failed', text: res.response || 'An error occurred.' });
			}
		}).fail(() => {
			Swal.fire({ icon: 'error', title: 'Request Failed', text: 'Could not connect to the server.' });
		});
	});
};

const cacheAddDom = () => {
	domAdd.newDate = document.getElementById('newDate');
	domAdd.newPayableTo = document.getElementById('newPayableTo');
	domAdd.newAddress = document.getElementById('newAddress');
	domAdd.newAmount = document.getElementById('newAmount');
	domAdd.newAmountWords = document.getElementById('newAmountWords');
	domAdd.newNeededDate = document.getElementById('newNeededDate');
	domAdd.newPurpose = document.getElementById('newPurpose');
	domAdd.newCostCenter = document.getElementById('newCostCenter');
	domAdd.newAttachments = document.getElementById('newAttachments');
	domAdd.btnSaveNewCashAdvance = document.getElementById('btnSaveNewCashAdvance');
};

const initAddPage = () => {
	cacheAddDom();
	setDefaultDates();
	if (domAdd.newCostCenter) {
		$(domAdd.newCostCenter).select2({
			placeholder: 'Select Cost Center',
			allowClear: true,
			width: '100%'
		});
	}

	// Auto-generate words when amount changes
	if (domAdd.newAmount) {
		domAdd.newAmount.addEventListener('input', () => {
			domAdd.newAmountWords.value = amountToWords(domAdd.newAmount.value);
		});
	}

	if (domAdd.btnSaveNewCashAdvance) {
		domAdd.btnSaveNewCashAdvance.addEventListener('click', handleSave);
	}
};

if (document.getElementById('newAmount')) {
	initAddPage();
}