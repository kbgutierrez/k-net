const reportConfigRows = [
	{ key: 'default_date_range_days', value: '30', description: 'Default report date range in days' },
	{ key: 'default_export_format', value: 'XLSX', description: 'Default export format for reports' },
	{ key: 'allow_scheduled_reports', value: 'ON', description: 'Enable scheduled report jobs' },
	{ key: 'max_rows_per_export', value: '50000', description: 'Export row limit before split' },
];

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const renderRows = () => {
	const tbody = document.getElementById('reportConfigTbody');
	if (!tbody) {
		return;
	}

	tbody.innerHTML = reportConfigRows.map((row) => `<tr><td>${escapeHtml(row.key)}</td><td>${escapeHtml(row.value)}</td><td>${escapeHtml(row.description)}</td></tr>`).join('');
};

$(document).ready(() => {
	renderRows();
	const btn = document.getElementById('btnSaveReportingConfig');
	if (btn) {
		btn.addEventListener('click', () => Swal.fire({ icon: 'success', title: 'Mock Save', text: 'Reporting configuration save is mocked.' }));
	}
});
