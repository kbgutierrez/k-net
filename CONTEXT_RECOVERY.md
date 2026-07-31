# Context Recovery — BizLink/BPI Payroll Text File Task

Recovered from session `50dcbd60-d2be-409d-80b0-43fcb956efa0` (couldn't be resumed in the sidebar directly — extension limitation). Paste/@-mention this into a new conversation to continue.

## Current task
Implementing `download_bizlink_export_batch()` in `application/modules/approvals/controllers/Approvals.php` — generates a fixed-width BPI batch payment text file (Header/Detail/Trailer records, 128 chars wide) for payroll/liquidation disbursement, based on `assets/templates/bizlink-format.png` (spec) and `assets/templates/raw-textfile.txt` (sample).

**Status:** BLOCKED on Accounting confirming a few details. Currently returns a placeholder message: `"Text file generation is not yet available -- the exact BPI file format is still being verified."`

## Questions for Accounting (already drafted in Tagalog, not yet sent as of last session)

**Kailangan muna masagot (blocking — file won't be byte-correct without these):**
1. **Formula ng Horizontal Hash** — 12-digit field sa Detail record. Verified: exact integer multiple ng transaction amount sa lahat ng 121 sample records, pero iba-iba yung multiplier at walang correlation sa account number. Kailangan ng Excel formula/macro o BPI reference doc.
2. **Ceiling Amount** — sa Header, "Ceiling Amount/Highest Net Pay" = `7,855,000`. Fixed limit ba mula sa BPI, o kailangan i-recompute bawat batch (e.g. pinakamalaking amount sa batch)?
3. **18-character segment sa Trailer record** (sa pagitan ng company account number at total debit amount) — hindi na-match sa kahit ano sa Header. Fixed/reserved value ba, o batch-specific?

**Kailangan para tama yung export step:**
4. **Payroll Date** — disbursement/release date, date ng paggawa ng batch, o bank value-date?
5. **Batch Number** — sunod-sunod ba per araw (01, 02...), nag-rereset ba araw-araw? Ano gagawin kung 2 batches sa isang araw?
6. **Laman ng isang batch** — lahat ng "Payment Advised" na naghihintay ng release, o hand-pick mula sa Approvals? Sabay ba lahat ng transaction type (CA/Liquidation/Reimbursement) o hiwalay-hiwalay?

**Hindi masyadong urgent:**
7. Non-BPI employees — paano sila binabayaran (format is BPI-only by construction)?
8. Delivery ng `.txt` file — manual upload, email, SFTP? May filename convention ba?
9. May BPI test/sandbox channel ba to validate the file before a real payroll run?

## Design decision already made
Payroll Date and Batch Number are **per-batch** fields, NOT settings — they'll be asked in a small export dialog at generation time:
```
Generate BizLink Text File
───────────────────────────
 Payroll Date:  [07/23/2026]   (defaults to today, editable)
 Batch Number:  [01]           (auto-suggested, editable)
                        [Generate]
```
Everything else (Company Code, Company Account Number, Presenting Office Code, Ceiling Amount) is pulled automatically from the new Company/BizLink Settings tab (already built).

## What's already built
- **`tbl_bizlink_company_settings`** (DB table, single-row): company_code, company_account_number (encrypted), presenting_office_code, ceiling_amount, bpi_payroll_identifier (default '1').
- **`sp_fetch_bizlink_company_settings`** / **`sp_save_bizlink_company_settings`** stored procs.
- **Bank Account Masterlist module** (`application/modules/bank-account-masterlist/`) — new "Company / BizLink Settings" tab alongside existing "Employee Accounts" tab: view (masked account, reveal-with-audit) + edit form. Reveal/hide toggle, save with SweetAlert confirm.
- `bank_code` column on `tbl_bank_account_masterlist` was tried then **reverted** — confirmed not needed, format is implicitly BPI-only.
- BizLink format fully reverse-engineered byte-for-byte from the sample file (Header/Detail/Trailer field widths, positions) — only the Horizontal Hash algorithm is unknown.

## Known bug pattern to avoid
`build_sp($name, 0)` still emits one `?` placeholder even for zero-param procs (initializes `$qstn = ' ?'` before the loop). For zero-param stored procs, call `'EXEC sp_name'` as a raw string instead (see `sp_fetch_dashboard_aging_buckets` for existing precedent).

## Environment notes
- DB: SQL Server 2014, `192.168.1.229`, database `BigEKnet` (not `.2.229` — that was a typo in an earlier message).
- CodeIgniter 3 HMVC app; business logic lives in stored procedures, PHP controllers are thin.
- No code comments, ever (user preference).

## Immediate next step
Nothing to code until Accounting answers questions 1–3 above. If the user has answers now, resume by asking for them, then implement `download_bizlink_export_batch()` with the confirmed Horizontal Hash formula, plus the Payroll Date/Batch Number export dialog.

## Also pending/reported, not yet confirmed fixed
User reported "employee accounts data are now gone" after the Company tab was added to Bank Account Masterlist — worth verifying the Employee Accounts tab still loads correctly before continuing.
