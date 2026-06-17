<style>
	.kna-page {
		padding: 12px 14px;
	}

	.kna-card {
		border: 1px solid #d9e0e7 !important;
		border-radius: 6px;
		background: #ffffff;
		box-shadow: 0 1px 2px rgba(20, 30, 50, .05);
	}

	.kna-card .card-body {
		padding: .85rem;
	}

	.kna-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
	}

	.kna-small {
		font-size: 12px !important;
		line-height: 1.35;
	}

	.kna-kpi {
		font-size: 19px;
		line-height: 1.15;
		font-weight: 600;
		margin: 0;
		color: #1d2a3a;
	}

	.kna-kpi-caption {
		font-size: 11px;
		color: #6c757d;
		margin: 0;
	}

	.kna-form-label {
		margin-bottom: .3rem;
		font-weight: 600;
	}

	.kna-table td,
	.kna-table th {
		font-size: 12px !important;
		padding: .5rem .45rem;
		vertical-align: middle;
		white-space: nowrap;
	}

	.kna-actions .btn {
		padding: .3rem .55rem;
		font-size: 12px;
	}

	.kna-badge {
		padding: .2rem .4rem;
		border-radius: 3px;
		font-size: 11px;
		font-weight: 600;
		display: inline-block;
	}

	.kna-badge-active {
		background: #e8f7ee;
		color: #17663a;
	}

	.kna-badge-inactive {
		background: #eef2f7;
		color: #495869;
	}

	.kna-mobile-list .kna-item {
		border: 1px solid #dde3eb;
		border-radius: 6px;
		padding: .65rem;
		margin-bottom: .5rem;
		background: #fff;
	}

	.kna-mobile-list .kna-item:last-child {
		margin-bottom: 0;
	}

	.kna-mobile-list .kna-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: .45rem;
		margin-bottom: .25rem;
	}

	.kna-mobile-list .kna-row:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 991.98px) {
		.kna-page {
			padding: 10px;
		}

		.kna-title {
			font-size: 17px;
		}

		.kna-card .card-body {
			padding: .7rem;
		}

		.kna-stack-mobile {
			flex-direction: column;
			align-items: stretch !important;
			gap: .5rem;
		}

		.kna-mobile-cta {
			width: 100%;
		}
	}

	@media (max-width: 575.98px) {
		.kna-small {
			font-size: 11px !important;
		}
	}
</style>

<div class="page-inner kna-page">
	<div class="d-flex align-items-center justify-content-between mb-2 kna-stack-mobile">
		<div>
			<div class="kna-title">Expense Types</div>
		</div>
		<button type="button" class="btn btn-primary btn-sm kna-small kna-mobile-cta" id="btnOpenNewExpenseType">
			New Expense Type
		</button>
	</div>

	<div class="row mb-2">
		<div class="col-md-4 col-6 pr-md-2 mb-2 mb-md-0">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Total Categories</p>
					<p class="kna-kpi" id="sumTotal">0</p>
				</div>
			</div>
		</div>
		<div class="col-md-4 col-6 px-md-2 mb-2 mb-md-0">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Active</p>
					<p class="kna-kpi" id="sumActive">0</p>
				</div>
			</div>
		</div>
		<div class="col-md-4 col-12 pl-md-2">
			<div class="card kna-card h-100">
				<div class="card-body">
					<p class="kna-kpi-caption">Inactive</p>
					<p class="kna-kpi" id="sumInactive">0</p>
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card mb-2">
		<div class="card-body py-2">
			<div class="d-flex flex-wrap align-items-end" style="gap:.5rem;">
				<div>
					<label class="kna-small kna-form-label mb-1">Search</label>
					<input type="text" class="form-control form-control-sm kna-small" id="filterKeyword" placeholder="Category or description" style="width:220px;">
				</div>
				<div>
					<label class="kna-small kna-form-label mb-1">Status</label>
					<select class="form-control form-control-sm kna-small" id="filterStatus" style="width:160px;">
						<option value="">All Status</option>
						<option value="CAT_ACTIVE">Active</option>
						<option value="CAT_INACTIVE">Inactive</option>
					</select>
				</div>
				<div>
					<button type="button" class="btn btn-outline-secondary btn-sm" id="btnReset" title="Clear filters" style="height:31px;width:31px;padding:0;">
						<i class="fas fa-sync-alt"></i>
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="card kna-card d-none d-md-block">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Expense Type List</div>
				<div class="kna-small text-muted" id="resultCount">0 record(s)</div>
			</div>
			<div class="table-responsive">
				<table class="table table-sm kna-table" id="expenseTypesTable" style="width:100%">
					<thead>
						<tr>
							<th style="width:200px;">Category Name</th>
							<th>Description</th>
							<th style="width:110px;">Status</th>
							  <th style="width:140px;">Created By</th>
							<th style="width:120px;">Created Date</th>
							  <th style="width:120px;">Updated By</th>
							<th style="width:120px;">Updated Date</th>
							<th style="width:150px;" class="text-center">Actions</th>
						</tr>
					</thead>
					<tbody id="expenseTypesTbody"></tbody>
				</table>
			</div>
			<div class="d-flex justify-content-end mt-2">
				<nav aria-label="Expense types desktop pagination">
					<ul class="pagination pagination-sm mb-0" id="desktopPagination"></ul>
				</nav>
			</div>
		</div>
	</div>

	<div class="card kna-card d-md-none">
		<div class="card-body">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div class="kna-small text-muted">Expense Type List</div>
				<div class="kna-small text-muted" id="resultCountMobile">0 record(s)</div>
			</div>
			<div class="kna-mobile-list" id="expenseTypesMobileList"></div>
			<div class="text-center mt-2">
				<button type="button" class="btn btn-outline-primary btn-sm kna-small" id="btnLoadMoreMobile" style="display:none;">
					Load More
				</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="modalExpenseType" tabindex="-1" role="dialog" aria-labelledby="modalExpenseTypeLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
		<div class="modal-content">
			<div class="modal-header py-2">
				<h5 class="modal-title kna-small" id="modalExpenseTypeLabel">Expense Type</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>

			<div class="modal-body">
				<form id="formExpenseType">
					<input type="hidden" id="expenseTypeMode" value="create">
					<input type="hidden" id="expenseTypeId" value="">
					<div class="form-group">
						<label class="kna-small kna-form-label">Category Name <span class="text-danger">*</span></label>
						<input type="text" class="form-control form-control-sm" id="expenseTypeCategoryName" maxlength="120" required>
					</div>
					<div class="form-group">
						<label class="kna-small kna-form-label">Description</label>
						<textarea class="form-control form-control-sm" id="expenseTypeDescription" rows="4" maxlength="500"></textarea>
					</div>
					<div class="form-group mb-0">
						<label class="kna-small kna-form-label">Status</label>
						<select class="form-control form-control-sm" id="expenseTypeStatus">
							<option value="CAT_ACTIVE">Active</option>
							<option value="CAT_INACTIVE">Inactive</option>
						</select>
					</div>
				</form>
			</div>

			<div class="modal-footer py-2">
				<button type="button" class="btn btn-outline-secondary btn-sm kna-small" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary btn-sm kna-small" id="btnSaveExpenseType">Save</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="modalViewExpenseType" tabindex="-1" role="dialog" aria-labelledby="modalViewExpenseTypeLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
		<div class="modal-content">
			<div class="modal-header py-2">
				<h5 class="modal-title kna-small" id="modalViewExpenseTypeLabel">Expense Type Details</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>

			<div class="modal-body">
				<div class="row">
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">ID</div>
						<div class="font-weight-bold" id="viewExpenseTypeId">-</div>
					</div>
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">Status</div>
						<div id="viewExpenseTypeStatus">-</div>
					</div>
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">Created By</div>
						<div id="viewExpenseTypeCreatedBy">-</div>
					</div>
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">Created Date</div>
						<div id="viewExpenseTypeCreatedDate">-</div>
					</div>
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">Updated By</div>
						<div id="viewExpenseTypeUpdatedBy">-</div>
					</div>
					<div class="col-md-6 mb-2">
						<div class="kna-small text-muted">Updated Date</div>
						<div id="viewExpenseTypeUpdatedDate">-</div>
					</div>
					<div class="col-md-12 mb-2">
						<div class="kna-small text-muted">Category Name</div>
						<div class="font-weight-bold" id="viewExpenseTypeCategoryName">-</div>
					</div>
					<div class="col-md-12 mb-2">
						<div class="kna-small text-muted">Description</div>
						<div id="viewExpenseTypeDescription">-</div>
					</div>
				</div>
			</div>

			<div class="modal-footer py-2">
				<button type="button" class="btn btn-outline-secondary btn-sm kna-small" data-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>