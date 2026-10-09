# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

K-Net is an internal finance workflow app. It handles cash advance, liquidation, reimbursement, replenishment, revolving fund, approvals, payment advisory/release and BPI BizLink export. It is built on CodeIgniter 3 with HMVC (`application/third_party/MX`), runs on PHP 7.4 and uses SQL Server through the `sqlsrv` driver. It is served from `z:\htdocs\k-net` under Apache.

There is no build step, linter or test suite. `composer.json` still has CodeIgniter's stock `test:coverage` script, but there is no `tests/` directory. To verify a change, load the page in the browser or query the DB.

## Business logic lives in SQL Server stored procedures

PHP controllers are thin. Almost every read and write goes through a stored procedure in the `BigEKnet` database, and the stored procedure source is **not in the repo**. To see or change one, query the live DB:

```
sqlcmd -S <host> -U <user> -P <pass> -d BigEKnet -y 0 -Q "SET NOCOUNT ON; SELECT OBJECT_DEFINITION(OBJECT_ID('sp_name'))"
```

The host and credentials are in `application/config/database.php` (the `$testserver` host, `BigEKnet`). `-W` and `-y` can't be used together. SQL Server is 2014, so `STRING_AGG`, `TRIM` and `CREATE OR ALTER` are not available.

Save any DDL you write (ALTER PROCEDURE/VIEW, CREATE TABLE) as a script in `tmp/`, named like `alter_<object>_<change>.sql`, so the change can be reviewed and applied to other environments.

The procedures join across sibling databases: `BigEUsers.dbo.users`, `BigEHRIS.dbo.department` and `BigEMasterData.dbo.tbl_SOffc` / `tbl_SDst`.

### Calling a procedure from PHP

```php
$this->load->model('SPModel', 'sp');
$this->sp->setDatabase('dbknet');
$params = array('UserId' => $userId, 'CursorId' => $cursorId, 'Take' => $take);
$rows = $this->sp->readData(build_sp('sp_fetch_x', count($params)), $params, 'result');
```

- `build_sp()` (`application/helpers/sp_helper.php`) adds `?` placeholders. Parameters bind **by position**, so the array order must match the procedure's parameter order. The keys are only labels.
- `build_sp($name, 0)` still emits one `?`. For a procedure with no parameters, pass the raw string `'EXEC sp_name'` instead.
- `SPModel` also has `createData` and `createReturnId`. It turns SQL errors raised with `THROW` into exceptions or error results, so validation messages that show up in the UI usually come from a `THROW` inside the procedure.

## Request / module structure

- Each feature is a module in `application/modules/<module>/` with `controllers/`, `views/` and `config/routes.php`. Controllers extend `MY_Controller` (`application/core/MY_Controller.php`).
- **Routing:** URLs are prefixed, for example `maintenance/approval-matrix/...`. `MY_Router::locate()` resolves `<prefix>/<module>/...` using the target module's own `config/routes.php`. Add new endpoints there, not in `application/config/routes.php`.
- **Page render:** every page loads the single layout `application/views/main.php` and passes `main_view => '../modules/<module>/views/<view>'`, `module_group`, `module` (the sidebar data, which `MY_Controller` loads from `sp_fetch_module_group` / `sp_fetch_module`) and `scripts => ['index.js']`.
- **Per-page JS:** `main.php` loads each entry in `scripts` from `assets/js/modules/<router module name>/<script>`, with a `?v=` cache-buster based on file time. Shared JS helpers are in `assets/js/helpers/`: `ajax_loader` (jQuery POST to `base_url + url`), swal, select2, datatable, export and transaction viewer.
- **API endpoints** are controller methods named `api_*`. They return JSON through `respondSuccess($msg, $data)` / `respondError($msg)` using the shape `{status, response, data}`. Some list endpoints return `{status, data, pagination}` instead.
- **Cursor pagination:** use `resolvePaginationTake()` together with `buildPaginationResult()`. The procedure receives `@CursorId` and `@Take` and must return `Take + 1` rows, ordered by `id DESC`, so the helper can work out `hasMore`.
- **Audit trail:** `logAuditTrail()` calls `sp_insert_audit_trail`.
- **Auth:** there is no login page in this app. The session (`user_id`, `user_info` with `department_id`, `company` and so on) is set by the external portal (`lsbizportal.lemonsquare.com.ph/testportal`). `MainController` redirects there when there is no session.
- Autoloaded helpers: `sp_helper`, `misc_helper`, `tableau_helper`, `notification_helper`, `groq_ocr_helper` (receipt OCR) and `encryption_helper` (used for bank account numbers). PDFs are generated with mPDF, TCPDF, FPDF/FPDI or wkhtmltopdf via knp-snappy (see `application/helpers/*_pdf_helper.php`), and Excel files with PhpSpreadsheet or Spout.

## Approval domain model

- `tbl_approval_matrix_header` defines a rule by `transaction_type` (`CASH_ADVANCE`, `LIQUIDATION`, `REIMBURSEMENT`, `REPLENISHMENT`), `department_id`, optional `sales_office_code` / `sales_district_code`, a `min_amount`–`max_amount` bracket and `is_active`. `tbl_approval_matrix_details` (FK `matrix_header_id`) lists the approvers in order, with approval type and flags: `is_payment_advisory`, `is_payment_release`, `is_petty_cash_slip`, `is_bizlink_export`.
- When a transaction is submitted (for example `sp_insert_ca_v2`), the procedure picks the active matrix whose bracket contains the amount for that type and department. It then creates `tbl_approval_header` (`reference_id`, `approval_matrix_id`) and `tbl_approval_details`. If no bracket matches, it throws `No approval matrix found.`
- Transaction reference prefixes are `CA`, `LQ`, `RMB` and `RPL`. Status codes follow `<PREFIX>_APPROVED`, `<PREFIX>_FOR_RELEASE` and so on. Payment and BizLink capabilities are read from the matrix details saved on the transaction's approval header, not from the rules that are active now.
- `vw_approvals_header` drives the approvals lists and turnaround calculations.

## Conventions

- **Do not write code comments**: no docblocks and no inline explanations in PHP or JS. This is the owner's standing preference.
- Match the existing style: `array()` syntax in PHP, `try/catch` around each API method, and snake_case names for procedures and tables (`sp_fetch_*`, `sp_insert_*`, `sp_update_*`, `tbl_*`, `vw_*`).
- `.env` exists and is loaded through phpdotenv. Never commit credentials.
