const domAdd = {
	newAmount: null,
	newNeededDate: null,
	newPurpose: null,
	btnSaveNewCashAdvance: null,
};

// const formatPHP = (amount) => {
// 	const value = Number(amount || 0);
// 	return value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
// };

// const normalizeDate = (value) => (value ? String(value) : '');
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


const setDefaultNeededDate = () => {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	domAdd.newNeededDate.value = `${yyyy}-${mm}-${dd}`;
};

const handleSave = () => {
	const amount = domAdd.newAmount.value;
	const neededDate = domAdd.newNeededDate.value;
	const purpose = domAdd.newPurpose.value;

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
				const caNo = res.data && res.data.cash_advance_id ? res.data.cash_advance_id : '';
				Swal.fire({
					icon: 'success',
					title: 'Submitted',
					html: `${res.response}<br><strong>${escapeHtml(caNo)}</strong>`,
				}).then(() => {
					goToPath('transactions/cash-advance');
				});
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

const cacheAddDom = () => {
	domAdd.newAmount = document.getElementById('newAmount');
	domAdd.newNeededDate = document.getElementById('newNeededDate');
	domAdd.newPurpose = document.getElementById('newPurpose');
	domAdd.btnSaveNewCashAdvance = document.getElementById('btnSaveNewCashAdvance');
};

const initAddPage = () => {
	cacheAddDom();
	setDefaultNeededDate();

	if (domAdd.btnSaveNewCashAdvance) {
		domAdd.btnSaveNewCashAdvance.addEventListener('click', handleSave);
	}
};

// Router check
if (document.getElementById('newAmount')) {
	initAddPage();
}