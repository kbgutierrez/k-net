const reportDefs = {
	'ca-vs-liquidation': {
		label: 'CA vs Liquidation',
		headers: ['Select', 'Date', 'Department', 'Cash Advance', 'Liquidated', 'Variance'],
		rows: [
			{ date: '2026-05-24', department: 'Sales Force', cashAdvance: 11800, liquidated: 9800, variance: 2000 },
			{ date: '2026-05-29', department: 'Operations', cashAdvance: 7000, liquidated: 7600, variance: -600 },
		],
	},
	'liquidation-register': {
		label: 'Liquidation Register',
		headers: ['Select', 'Date', 'Liquidation No', 'Cash Advance Ref', 'Amount', 'Status'],
		rows: [
			{ date: '2026-05-28', liquidationNo: 'LIQ-2026-006', cashAdvanceRef: 'CA-2026-014', amount: 9800, status: 'Submitted' },
			{ date: '2026-05-30', liquidationNo: 'LIQ-2026-008', cashAdvanceRef: 'CA-2026-018', amount: 6500, status: 'Approved' },
		],
	},
	'reimbursement-register': {
		label: 'Reimbursement Register',
		headers: ['Select', 'Date', 'Reimbursement No', 'Liquidation Ref', 'Amount', 'Status'],
		rows: [
			{ date: '2026-05-27', reimbursementNo: 'RB-2026-004', liquidationRef: 'LIQ-2026-006', amount: 3250, status: 'Pending' },
			{ date: '2026-05-29', reimbursementNo: 'RB-2026-005', liquidationRef: 'LIQ-2026-008', amount: 1880, status: 'Approved' },
		],
	},
	'revolving-fund-ledger': {
		label: 'Revolving Fund Ledger',
		headers: ['Select', 'Date', 'Fund Code', 'Type', 'Amount', 'Balance'],
		rows: [
			{ date: '2026-05-27', fundCode: 'RF-SF-01', type: 'TOPUP', amount: 10000, balance: 40000 },
			{ date: '2026-05-29', fundCode: 'RF-SF-01', type: 'CA_RELEASE', amount: -1750, balance: 38250 },
		],
	},
	'pending-approvals': {
		label: 'Pending Approvals',
		headers: ['Select', 'Date', 'Module', 'Reference', 'Approver', 'Aging Days'],
		rows: [
			{ date: '2026-05-29', module: 'CA', reference: 'CA-2026-018', approver: 'Manager', agingDays: 3 },
			{ date: '2026-05-30', module: 'RB', reference: 'RB-2026-004', approver: 'Finance Manager', agingDays: 2 },
		],
	},
	'approval-trail': {
		label: 'Approval Trail',
		headers: ['Select', 'Date', 'Reference', 'Action', 'By', 'Remarks'],
		rows: [
			{ date: '2026-05-28', reference: 'LIQ-2026-006', action: 'Submitted', by: 'John Mercado', remarks: 'Initial submit' },
			{ date: '2026-05-29', reference: 'CA-2026-018', action: 'Approved', by: 'Manager', remarks: 'Within threshold' },
		],
	},
	'department-spend': {
		label: 'Department Spend Analysis',
		headers: ['Select', 'Date', 'Department', 'CA Amount', 'Liquidation', 'Reimbursement'],
		rows: [
			{ date: '2026-05-31', department: 'Sales Force', caAmount: 42680, liquidation: 10930, reimbursement: 3250 },
			{ date: '2026-05-31', department: 'Operations', caAmount: 18400, liquidation: 15100, reimbursement: 980 },
		],
	},
};

const reportRoutes = [
	{ key: 'ca-vs-liquidation', label: 'CA vs Liquidation' },
	{ key: 'liquidation-register', label: 'Liquidation Register' },
	{ key: 'reimbursement-register', label: 'Reimbursement Register' },
	{ key: 'revolving-fund-ledger', label: 'Revolving Fund Ledger' },
	{ key: 'pending-approvals', label: 'Pending Approvals' },
	{ key: 'approval-trail', label: 'Approval Trail' },
	{ key: 'department-spend', label: 'Department Spend Analysis' },
];

const formatValue = (value) => {
	if (typeof value === 'number') {
		return value.toLocaleString('en-PH');
	}
	return String(value || '');
};

const toCsv = (headers, rows, keys) => {
	const encoded = [headers.join(',')].concat(
		rows.map((row) => keys
			.map((key) => {
				const value = row[key] !== undefined ? row[key] : '';
				return `"${String(value).replace(/"/g, '""')}"`;
			})
			.join(','))
	);
	return encoded.join('\n');
};

const getMappedRows = (key) => {
	const def = reportDefs[key] || reportDefs['ca-vs-liquidation'];
	return def.rows.map((row, idx) => Object.assign({ __id: `${key}-${idx + 1}` }, row));
};

const applyDateFilter = (rows, fromDate, toDate) => rows.filter((row) => {
	if (!row.date) {
		return true;
	}
	if (fromDate && row.date < fromDate) {
		return false;
	}
	if (toDate && row.date > toDate) {
		return false;
	}
	return true;
});

const downloadCsv = (filename, csvText) => {
	const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

let currentRows = [];

const renderNav = (activeKey) => {
	const nav = document.getElementById('reportNav');
	if (!nav) {
		return;
	}
	nav.innerHTML = reportRoutes.map((item) => {
		const cls = item.key === activeKey ? 'is-active' : '';
		return `<a class="${cls}" href="${base_url}reports/${item.key}">${item.label}</a>`;
	}).join('');
};

const renderTable = (key, rows) => {
	const def = reportDefs[key] || reportDefs['ca-vs-liquidation'];
	const head = document.getElementById('reportHead');
	const body = document.getElementById('reportBody');
	const count = document.getElementById('reportCount');
	if (!head || !body || !count) {
		return;
	}

	head.innerHTML = def.headers.map((h) => `<th>${h}</th>`).join('');
	body.innerHTML = rows.map((row) => {
		const cols = Object.keys(row).filter((k) => k !== '__id');
		return `
			<tr>
				<td><input type="checkbox" class="report-row-check" value="${row.__id}"></td>
				${cols.map((col) => `<td>${formatValue(row[col])}</td>`).join('')}
			</tr>
		`;
	}).join('');

	if (!rows.length) {
		body.innerHTML = `<tr><td colspan="${def.headers.length}" class="text-center text-muted">No rows in selected date range.</td></tr>`;
	}

	count.textContent = `${rows.length} row(s)`;
};

$(document).ready(() => {
	const reportKeyInput = document.getElementById('reportKey');
	const reportKey = reportKeyInput ? reportKeyInput.value : 'ca-vs-liquidation';
	renderNav(reportKey);

	const today = new Date();
	const y = today.getFullYear();
	const m = `${today.getMonth() + 1}`.padStart(2, '0');
	const d = `${today.getDate()}`.padStart(2, '0');
	const from = `${y}-${m}-01`;
	const to = `${y}-${m}-${d}`;

	const fromInput = document.getElementById('reportDateFrom');
	const toInput = document.getElementById('reportDateTo');
	const applyBtn = document.getElementById('btnApplyReportFilter');
	const dlSelectedBtn = document.getElementById('btnDownloadSelected');
	const dlAllBtn = document.getElementById('btnDownloadAll');

	if (fromInput) {
		fromInput.value = from;
	}
	if (toInput) {
		toInput.value = to;
	}

	const refresh = () => {
		const allRows = getMappedRows(reportKey);
		currentRows = applyDateFilter(allRows, fromInput ? fromInput.value : '', toInput ? toInput.value : '');
		renderTable(reportKey, currentRows);
	};

	if (applyBtn) {
		applyBtn.addEventListener('click', refresh);
	}

	if (dlAllBtn) {
		dlAllBtn.addEventListener('click', () => {
			const def = reportDefs[reportKey];
			const headers = def.headers.slice(1);
			if (!currentRows.length) {
				Swal.fire({ icon: 'warning', title: 'No Data', text: 'No rows available to download.' });
				return;
			}
			const keys = Object.keys(currentRows[0]).filter((k) => k !== '__id');
			const csv = toCsv(headers, currentRows.map((r) => {
				const copy = Object.assign({}, r);
				delete copy.__id;
				return copy;
			}), keys);
			downloadCsv(`${reportKey}.csv`, csv);
		});
	}

	if (dlSelectedBtn) {
		dlSelectedBtn.addEventListener('click', () => {
			const checks = Array.from(document.querySelectorAll('.report-row-check:checked')).map((x) => x.value);
			if (!checks.length) {
				Swal.fire({ icon: 'warning', title: 'No Selection', text: 'Select rows first before downloading.' });
				return;
			}
			const selected = currentRows.filter((r) => checks.includes(r.__id));
			const def = reportDefs[reportKey];
			const headers = def.headers.slice(1);
			const keys = selected.length ? Object.keys(selected[0]).filter((k) => k !== '__id') : [];
			const csv = toCsv(headers, selected.map((r) => {
				const copy = Object.assign({}, r);
				delete copy.__id;
				return copy;
			}), keys);
			downloadCsv(`${reportKey}-selected.csv`, csv);
		});
	}

	refresh();
});
