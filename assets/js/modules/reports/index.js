const reportDom = {
	dateFrom: null,
	dateTo: null,
	btnRefresh: null,
	btnApply: null,
	rangeText: null,
	sumRequests: null,
	sumSuccess: null,
	sumFailed: null,
	sumPromptTokens: null,
	sumCompletionTokens: null,
	sumTotalTokens: null,
	userCount: null,
	userUsageTbody: null,
	recentCount: null,
	recentUsageTbody: null,
};

const formatInt = (value) => Number(value || 0).toLocaleString('en-PH');

const escapeHtml = (value = '') =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const getDefaultDateRange = () => {
	const now = new Date();
	const y = now.getFullYear();
	const m = `${now.getMonth() + 1}`.padStart(2, '0');
	const d = `${now.getDate()}`.padStart(2, '0');
	return {
		from: `${y}-${m}-01`,
		to: `${y}-${m}-${d}`,
	};
};

const renderSummary = (summary) => {
	reportDom.sumRequests.textContent = formatInt(summary.total_requests);
	reportDom.sumSuccess.textContent = formatInt(summary.success_requests);
	reportDom.sumFailed.textContent = formatInt(summary.failed_requests);
	reportDom.sumPromptTokens.textContent = formatInt(summary.prompt_tokens);
	reportDom.sumCompletionTokens.textContent = formatInt(summary.completion_tokens);
	reportDom.sumTotalTokens.textContent = formatInt(summary.total_tokens);
};

const renderUserTable = (rows) => {
	reportDom.userUsageTbody.innerHTML = '';
	reportDom.userCount.textContent = `${rows.length} user(s)`;

	if (!rows.length) {
		reportDom.userUsageTbody.innerHTML = '<tr><td colspan="9" class="kna-empty">No usage records in selected range.</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(row.user_id)}</td>
			<td>${escapeHtml(row.user_display_name || '')}</td>
			<td class="text-right">${formatInt(row.total_requests)}</td>
			<td class="text-right">${formatInt(row.success_requests)}</td>
			<td class="text-right">${formatInt(row.failed_requests)}</td>
			<td class="text-right">${formatInt(row.prompt_tokens)}</td>
			<td class="text-right">${formatInt(row.completion_tokens)}</td>
			<td class="text-right">${formatInt(row.total_tokens)}</td>
			<td>${escapeHtml(row.last_used_at || '')}</td>
		`;
		reportDom.userUsageTbody.appendChild(tr);
	});
};

const renderRecentTable = (rows) => {
	reportDom.recentUsageTbody.innerHTML = '';
	reportDom.recentCount.textContent = `${rows.length} record(s)`;

	if (!rows.length) {
		reportDom.recentUsageTbody.innerHTML = '<tr><td colspan="9" class="kna-empty">No recent usage records.</td></tr>';
		return;
	}

	rows.forEach((row) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(row.created_at || '')}</td>
			<td>${escapeHtml(row.user_id)}</td>
			<td>${escapeHtml(row.user_display_name || '')}</td>
			<td>${escapeHtml(row.request_status || '')}</td>
			<td class="text-right">${formatInt(row.prompt_tokens)}</td>
			<td class="text-right">${formatInt(row.completion_tokens)}</td>
			<td class="text-right">${formatInt(row.total_tokens)}</td>
			<td class="text-right">${formatInt(row.http_status)}</td>
			<td class="text-right">${formatInt(row.latency_ms)}</td>
		`;
		reportDom.recentUsageTbody.appendChild(tr);
	});
};

const loadAiUsageReport = () => {
	const payload = {
		DateFrom: reportDom.dateFrom.value,
		DateTo: reportDom.dateTo.value,
	};

	reportDom.btnRefresh.disabled = true;
	reportDom.btnApply.disabled = true;

	ajax_loader('reports/ai-usage/api/get', payload)
		.done((response) => {
			const res = typeof response === 'string' ? $.parseJSON(response) : response;
			if (!res || res.status !== 'success' || !res.data) {
				Swal.fire({
					icon: 'error',
					title: 'Failed',
					text: (res && res.response) ? res.response : 'Failed to load AI usage report.',
				});
				return;
			}

			const data = res.data;
			reportDom.rangeText.textContent = `${data.dateFrom} to ${data.dateTo}`;
			renderSummary(data.summary || {});
			renderUserTable(data.users || []);
			renderRecentTable(data.recent || []);
		})
		.fail(() => {
			Swal.fire({
				icon: 'error',
				title: 'Failed',
				text: 'Failed to load AI usage report.',
			});
		})
		.always(() => {
			reportDom.btnRefresh.disabled = false;
			reportDom.btnApply.disabled = false;
		});
};

const cacheDom = () => {
	reportDom.dateFrom = document.getElementById('aiUsageDateFrom');
	reportDom.dateTo = document.getElementById('aiUsageDateTo');
	reportDom.btnRefresh = document.getElementById('btnRefreshAiUsage');
	reportDom.btnApply = document.getElementById('btnApplyAiUsageFilter');
	reportDom.rangeText = document.getElementById('aiUsageRangeText');
	reportDom.sumRequests = document.getElementById('sumRequests');
	reportDom.sumSuccess = document.getElementById('sumSuccess');
	reportDom.sumFailed = document.getElementById('sumFailed');
	reportDom.sumPromptTokens = document.getElementById('sumPromptTokens');
	reportDom.sumCompletionTokens = document.getElementById('sumCompletionTokens');
	reportDom.sumTotalTokens = document.getElementById('sumTotalTokens');
	reportDom.userCount = document.getElementById('userCount');
	reportDom.userUsageTbody = document.getElementById('userUsageTbody');
	reportDom.recentCount = document.getElementById('recentCount');
	reportDom.recentUsageTbody = document.getElementById('recentUsageTbody');
};

const bindEvents = () => {
	reportDom.btnRefresh.addEventListener('click', loadAiUsageReport);
	reportDom.btnApply.addEventListener('click', loadAiUsageReport);
};

const init = () => {
	cacheDom();
	const defaults = getDefaultDateRange();
	reportDom.dateFrom.value = defaults.from;
	reportDom.dateTo.value = defaults.to;
	bindEvents();
	loadAiUsageReport();
};

$(document).ready(() => {
	init();
});
