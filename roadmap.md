# K-Net Financial Workflow Roadmap

Date: 2026-06-02
Scope: Cash Advance, Liquidation, Reimbursement, Approval Matrix, Revolving Funds, Reports, Maintenance Modules

## 1. Executive Summary

This roadmap finishes the current foundation into a full finance workflow system that is complex in capability but simple in day-to-day use.

Primary goals:
- Implement a configurable approval matrix for Cash Advance, Liquidation, and Reimbursement.
- Enforce controls so employees cannot create a new cash advance when they still have unresolved liquidation obligations.
- Add revolving fund support and integrate it into transaction lifecycle and balances.
- Build reports and maintenance modules needed for operations, auditability, and decision making.

Guiding principle:
- Keep business rules centralized in backend/database services, while UI stays simple and role-aware.

---

## 2. Current State (What We Have)

### 2.1 Modules and Routing in Place
- Cash Advance module exists:
  - Route: `transactions/cash-advance`
  - APIs: save, get
- Liquidation module exists:
  - Routes: `transactions/liquidation`, `transactions/liquidation/add`, `transactions/liquidation/view/{id}`
  - APIs: pending CA list, CA details, expense types, draft, OCR, save, header, details
- Expense Types maintenance exists:
  - Route: `maintenance/expense-types`
  - APIs: get, save, update
- Dashboard exists (currently mock data patterns present).

### 2.2 Functional Behavior Already Implemented
- Cash advance request creation and listing with pagination.
- Liquidation creation with:
  - Draft mode and editable draft window.
  - Receipt attachments.
  - OCR extraction endpoint and client integration.
  - Liquidation detail and list views.
- Basic status usage is present (example: Pending Approval, For Liquidation, Draft, Submitted, Approved, Rejected).

### 2.3 Gaps Observed
- No dedicated Reimbursement module (currently treated conceptually inside liquidation/dashboard labels).
- No approval matrix engine (rules are not centrally configurable by amount/role/module).
- No strict backend gate for "no new CA if pending liquidation exists".
- No revolving fund data model or transaction flow.
- No report center and no maintenance modules for approvals/revolving funds/statuses.
- Dashboard still uses mock-oriented structure and should shift to live aggregates.

---

## 3. Target End-State (What We Need)

### 3.1 Business Workflow End-State
- End-to-end lifecycle:
  1. Cash Advance Request
  2. Cash Advance Approval
  3. Release/Disbursement
  4. Liquidation Submission
  5. Liquidation Approval
  6. Reimbursement (if overage) OR Return settlement (if unused amount)
  7. Closing and audit trail
- Revolving-fund users can draw and settle against their assigned fund with automatic balance movement.

### 3.2 Control Rules End-State
- Employee cannot submit new Cash Advance if any prior Cash Advance is in unresolved liquidation state.
- Approval requirements vary by:
  - Module (CA, Liquidation, Reimbursement)
  - Amount brackets
  - Department/cost center
  - Requester role level
- All approvals/rejections are logged with actor, timestamp, and reason.

### 3.3 Technical End-State
- Centralized workflow state machine.
- Approval matrix tables + engine.
- Revolving fund ledger and balance computation.
- Unified transaction IDs and cross-module references.
- Report-ready schema and query layer.
- Approval matrix integrated with existing portal users (no local user master creation).

---

## 4. Current vs Needed Matrix

| Area | Current | Needed |
|---|---|---|
| Cash Advance | Request + list exist | Approval levels, release step, hard gating rules, audit trail |
| Liquidation | Draft/submit/list/details exist | Approval matrix integration, reimbursement generation, settlement posting |
| Reimbursement | No dedicated module | Full module (request, approve, release, history, links to liquidation) |
| Approvals | Status labels only | Configurable approval matrix + assignment + action endpoints |
| Revolving Funds | None | User assignment, fund balances, fund ledger, controls |
| Dashboard | Mostly mock-ready logic | Live KPIs and role-specific widgets |
| Reports | No complete finance report suite | Operational, management, reconciliation, aging, audit reports |
| Maintenance | Expense type only | Approval matrix, status workflow, fund setup, role mapping, SLA |

---

## 4.1 Module Inventory (Current and Planned)

### Current modules
- Dashboard (`dashboard`)
- Cash Advance (`cash-advance`)
- Liquidation (`liquidation`)
- Expense Types Maintenance (`expense-types`)

### Planned/new modules
- Reimbursement (`reimbursement`)
- Finance Reports Center (`reports`)

### Planned/new maintenance modules
- Approval Matrix and Approver Mapping (combined module)
- Workflow Status and Transition Rules
- Revolving Fund Management (tabbed module: Setup + User Assignment + Top-up/Adjustments)
- Policy and Threshold Settings
- Notification Template Maintenance
- Reporting Configuration

---

## 5. Functional Design Blueprint

## 5.1 Approval Matrix Design

### Design Principle (Dynamic but Simple)
- Keep configuration simple like the current client sheet format:
  - `Request Type` + ordered `Approver Columns`.
- Keep behavior dynamic by allowing each approver step to be:
  - sequential, or
  - parallel group.
- Use existing portal user identities only (provided by you), no new user creation in K-Net.

### Matrix Dimensions
- Module: `CA`, `LQ`, `RB`
- Amount range: min/max threshold
- Optional qualifiers: company, department, section, location, requester role
- Approval levels: ordered steps (`L1`, `L2`, `L3`, ...)
- Approver source:
  - specific user
  - role-based pool
  - requester-manager chain

### Approval Actions
- Approve
- Reject (reason required)
- Return for Revision (optional)
- Escalate/Delegate (optional future)

### Process Rules
- Transaction can move to next status only if current approval step is completed.
- Full timeline/event log written for every action.
- SLA timestamps and overdue flags tracked for reporting.

### Client Sheet Mapping (Practical Model)
- Source format example:
  - `Request`, `Approver 1`, `Approver 2`, `Approver 3` ...
- Recommended internal model:
  - `matrix_header`: module + request category + qualifiers
  - `matrix_steps`: step_no, step_group_no, execution_mode (`SEQUENTIAL` or `PARALLEL`), approver_user_id
- Example mixed flow:
  - Step Group 1: Approver 1 (sequential)
  - Step Group 2: Approver 2 (sequential)
  - Step Group 3: Approver 3-5 (parallel; all required or quorum by policy)
- Portal user integration:
  - store external user key/employee id/portal user id as approver reference
  - validate approver existence via sync/import/reference lookup, not local account creation

## 5.2 Cash Advance Controls

### Required Gate
- Before `api_save` for cash advance:
  - Check unresolved obligations for user (statuses like `For Liquidation`, overdue, draft beyond grace, submitted pending action depending policy).
  - If found, block request with clear error and actionable list.

### Additional Controls
- Per-user and per-period request limits.
- Amount ceilings by employee grade/role.
- Optional duplicate-purpose/date detection warning.

## 5.3 Reimbursement Workflow

### When Reimbursement Happens
- On approved liquidation where `LiquidatedAmount > CashAdvanceAmount`.

### Proposed Flow
- User explicitly creates reimbursement request from liquidation result.
- Route to reimbursement approval matrix.
- Upon approval, post disbursement and close transaction chain.

### Needed Module
- New module `reimbursement` with:
  - List page
  - Detail page
  - Approval action page/modal
  - APIs for get/save/approve/reject/posting

## 5.4 Revolving Funds Design

### Core Concepts
- Fund Owner/User
- Opening Balance
- Current Available Balance
- Fund Ledger Entries:
  - top-up
  - cash advance release from fund
  - return settlement
  - reimbursement payout
  - manual adjustment

### Effects on Transactions
- If user is tagged as revolving-fund user:
  - CA release reduces fund available balance.
  - Return amount increases fund available balance.
  - Reimbursement payout reduces central cash or assigned reimbursement source per policy.
- Every movement writes ledger entry linked to transaction reference (CA/LQ/RB).

### Control Rules
- Disallow release if fund balance insufficient.
- Allow configurable negative-balance policy (default: not allowed).
- Fund lock/freeze option for compliance or audit hold.

---

## 6. Data Model Roadmap (DB/SP Layer)

Create or extend tables/SPs for:

1. Workflow and Status
- `wf_status_master`
- `wf_transition_rules`
- `wf_transaction_timeline`

2. Approval Matrix
- `approval_matrix_header`
- `approval_matrix_steps`
- `approval_assignments` (resolved approvers per transaction)
- `approval_actions_log`
- `approval_step_groups` (optional if using grouped parallel steps)

3. Reimbursement
- `rb_header`
- `rb_approvals`
- `rb_disbursement`

4. Revolving Funds
- `rf_accounts`
- `rf_user_assignment`
- `rf_ledger`
- `rf_adjustments`

5. Reporting Support
- denormalized reporting views/materialized summary SPs for fast dashboard and exports

SP strategy:
- Keep validation gates in SP/business layer so rules are not bypassable from UI.

---

## 7. Application Implementation Plan

## Phase 0: Foundation Hardening (Week 1)
- Normalize status codes and naming across CA/LQ.
- Create shared workflow constants (backend + JS mapping).
- Remove hard-coded secrets from source and move to environment config.
- Add central response/error format helper usage across modules.

Deliverable:
- Stable baseline ready for workflow expansion.

## Phase 1: Approval Matrix Engine (Weeks 2-3)
- Build maintenance screens:
  - Approval Matrix and Approver Mapping
  - Workflow Status/Transition Setup
- Implement approval resolution service:
  - derive approvers by module/amount/org context
- Add matrix onboarding utility:
  - encode/import sheet-style approval definitions (`Request`, `Approver 1..N`) using existing portal user identifiers
- Add approval actions API endpoints and timeline logging.

Deliverable:
- Configurable approvals working for one pilot flow (Cash Advance).

## Phase 2: Cash Advance Rule Controls (Week 4)
- Enforce unresolved-liquidation gate in CA save endpoint.
- Add UI pre-check and user-friendly guidance when blocked.
- Add policy parameters (grace period, what counts as unresolved).

Deliverable:
- No user can create non-compliant new CA.

## Phase 3: Liquidation Approval + Reimbursement Module (Weeks 5-6)
- Integrate liquidation into approval matrix.
- Implement reimbursement module (new routes/controller/views/js).
- Provide user action to create reimbursement from approved liquidation overage.
- Complete approval and posting actions for reimbursement.

Deliverable:
- Full CA -> LQ -> RB transaction chain.

## Phase 4: Revolving Funds (Weeks 7-8)
- Build maintenance module (single tabbed module):
  - Revolving Fund Accounts tab
  - User Assignment tab
  - Top-up and Adjustment tab
- Implement ledger posting hooks in CA/LQ/RB events.
- Add fund balance checks and lock policies.

Deliverable:
- Revolving fund operations fully integrated and auditable.

## Phase 5: Reports and Dashboard Live Data (Weeks 9-10)
- Build report APIs and export support.
- Replace dashboard mock aggregates with live queries.
- Add role-specific dashboard widgets.

Deliverable:
- Management-ready insights and reconciliation visibility.

## Phase 6: UAT, Security, Go-Live (Weeks 11-12)
- UAT scripts for all workflow branches.
- Role/permission audit.
- Performance checks on list/report endpoints.
- Release plan + backout plan + data migration scripts.

Deliverable:
- Production-ready release.

---

## 8. Reports Needed

## 8.1 Operational Reports
- Cash Advance Register (by status/date/user/department)
- Liquidation Register (draft/submitted/approved/rejected)
- Reimbursement Register (pending/approved/released)
- Pending Approvals Inbox by approver
- Aging of For-Liquidation Transactions

## 8.2 Financial and Reconciliation Reports
- CA vs Liquidation Variance Summary
- Return vs Reimbursement Summary
- Revolving Fund Balance and Movement Ledger
- Revolving Fund Replenishment Report
- Unsettled Advances and Exposure Report

## 8.3 Compliance and Audit Reports
- Approval Trail Report (who approved/rejected and when)
- Policy Violation/Blocked Requests Report
- Manual Adjustments Report (fund and transaction adjustments)
- OCR Attachment Completeness Report

## 8.4 Management Reports
- Monthly KPI Summary (requested, approved, liquidated, reimbursed)
- Department/Section Spend Analysis
- Approver SLA and bottleneck report

---

## 9. Maintenance Modules Needed

1. Approval Matrix and Approver Mapping
- by module, amount range, org scope, and levels
- role/user to approval step mapping
- approver reference uses existing portal user info (no local user creation)
- supports sheet-like setup per request category and approver columns

2. Workflow Status and Transition Rules
- allowed status paths and action labels

3. Revolving Fund Management (single module with tabs)
- Setup tab: fund accounts, ownership, limits, lock state
- User Assignment tab: assign user to fund, effective dates
- Top-up and Adjustment tab: replenishment and manual adjustments

4. Policy and Threshold Settings
- unresolved-liquidation definitions, grace periods, amount caps

5. Notification Template Maintenance
- email/in-app templates for approve/reject/reminder/escalation

6. Reporting Configuration
- parameter defaults, export templates, scheduling (optional future)

7. Existing Expense Types (already present)
- keep and extend with active/inactive and category hierarchy if needed

---

## 10. Engineering Work Breakdown (Backend, Frontend, Data)

## Backend (PHP/Controller + SPModel)
- Add workflow service layer used by CA/LQ/RB controllers.
- Add approval endpoints (`submit`, `approve`, `reject`, `return`).
- Add business gates for policy checks and fund balance checks.
- Keep all critical validations server-side.

## Frontend (JS/Views)
- Keep current simple UX pattern:
  - list, detail, action modal
- Add role-based action buttons.
- Add timeline panel on detail pages.
- Add clear warning/blocked-state messages for policy failures.

## Data/SP
- Add new SPs for workflow transitions, approval assignment, fund ledger posting.
- Add reporting SPs optimized for dashboard and exports.

---

## 11. Quality, Security, and Observability

### Quality Gates
- Unit and integration tests for:
  - approval routing
  - unresolved-liquidation gate
  - fund ledger posting consistency
- End-to-end scripts:
  - normal flow
  - reject/return flow
  - reimbursement path
  - insufficient fund scenarios

### Security
- Remove hard-coded API secrets from constants to secure env management.
- Ensure authorization checks on all approve/reject APIs.
- Add immutable audit logs for financial actions.

### Observability
- Structured logs for transitions and exceptions.
- Daily reconciliation job for transaction and fund ledger mismatch detection.

---

## 12. Recommended Next Implementation Order (Immediate)

1. Finalize workflow statuses and transition map.
2. Implement approval matrix tables and maintenance UI.
3. Enforce CA unresolved-liquidation gate.
4. Build reimbursement module.
5. Implement revolving fund setup and ledger integration.
6. Deliver report suite and switch dashboard to live data.

---

## 13. Finalized Policy Decisions

1. Approval matrix behavior
- Approval flow must be fully configurable per matrix category.
- Mixed mode is supported in the same workflow:
  - example: Level 1 -> Level 2 (sequential), then Levels 3 to 5 (parallel).
- Data model update:
  - add step group and execution mode fields so each step can be sequential or parallel.
- Approver identity source:
  - use existing portal users only; K-Net does not create approver user accounts.

2. Unresolved liquidation gate for creating new cash advance
- New cash advance is blocked while the employee has liquidation records not yet in final allowed statuses.
- Allowed final statuses for unblock are configurable in maintenance.
- Initial default policy:
  - unblock on `LQ_APPROVED`.
  - `LQ_REJECTED` handling is configurable by policy switch (`block_on_rejected_liquidation`), default `ON`.
  - rationale: rejected liquidation usually means the original cash advance is still unresolved unless policy explicitly allows re-request.

3. Reimbursement creation policy
- Reimbursement must be created only by explicit user action.
- No automatic reimbursement record creation after liquidation approval.

4. Revolving fund user policy
- Add `has_revolving_fund` flag in user info profile.
- Provide a dedicated maintenance module to configure:
  - which users are revolving-fund users,
  - fund-related limits and required details,
  - applicable revolving-fund policies.

5. Threshold policy
- Amount brackets per module and per role/department must be configurable through maintenance.

6. SLA and escalation policy
- Approval reminder and escalation days must be configurable through maintenance.

## 13.1 Maintenance Additions Required by Policy Decisions

1. Approval matrix and approver mapping maintenance
- Configure sequential/parallel mix per step group.
- Configure role/user mapping per approval step.

2. Liquidation blocking policy maintenance
- Configure which liquidation statuses block new CA.
- Configure `block_on_rejected_liquidation` behavior.

3. Revolving Fund Management maintenance (tabbed)
- Manage `has_revolving_fund`, fund setup details, assignment, and related policy toggles.
- Keep setup and user assignment in one module for simpler UX.

4. Threshold maintenance
- Configure module and role/department amount brackets.

5. SLA and escalation maintenance
- Configure reminder and escalation timing.

---

## 14. Definition of Done (Project Completion)

Project is complete when:
- CA, Liquidation, and Reimbursement all run through configurable approval matrix.
- CA creation is blocked for users with unresolved liquidation obligations according to approved policy.
- Revolving fund users transact with accurate real-time fund balances and complete ledger audit trail.
- Required operational, financial, audit, and management reports are available and exportable.
- Dashboard reads live data and aligns with report totals.
- UAT passes for all primary and exception workflows.
