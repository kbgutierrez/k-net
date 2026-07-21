<?php

defined('BASEPATH') or exit('No direct script access allowed');

if (!function_exists('build_petty_cash_slip_html')) {
    function build_petty_cash_slip_html($slipData, $approver)
    {
        $esc = function ($value) {
            return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
        };

        $requestedBy = $esc($slipData['requester_name'] ?? '');
        $requestedDate = $esc(!empty($slipData['created_date']) ? date('M d, Y', strtotime($slipData['created_date'])) : '');
        $department = $esc($slipData['department_name'] ?? '');
        $amount = $esc(number_format((float) ($slipData['total_amount'] ?? 0), 2));
        $purpose = nl2br($esc($slipData['purpose'] ?? ''));
        $approvedBy = $esc($approver['name'] ?? '');
        $approvedDate = $esc($approver['date'] ?? date('M d, Y'));
        $refNo = $esc($slipData['reference_no'] ?? $slipData['reimbursement_id'] ?? '');

        return <<<HTML
<html>
<head>
<style>
    body { font-family: dejavusans, sans-serif; font-size: 11px; color: #111; }
    .slip { border: 2px solid #000; padding: 10px 14px; }
    .slip-header { display: table; width: 100%; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .slip-title { font-size: 16px; font-weight: bold; }
    .slip-sub { font-size: 10px; color: #444; }
    .slip-ref { text-align: right; font-size: 10px; color: #444; }
    table.fields { width: 100%; border-collapse: collapse; margin-top: 6px; }
    table.fields td { padding: 6px 2px; vertical-align: bottom; font-size: 11px; }
    .field-label { font-weight: bold; margin-right: 4px; }
    .field-value { border-bottom: 1px solid #000; display: inline-block; min-width: 140px; padding-bottom: 1px; }
    .purpose-box { border: 1px solid #000; min-height: 70px; padding: 6px; margin-top: 4px; }
    .footer-note { font-size: 9px; font-style: italic; color: #555; margin-top: 14px; text-align: center; }
    .doc-code { font-size: 8px; color: #777; margin-top: 4px; }
</style>
</head>
<body>
    <div class="slip">
        <div class="slip-header">
            <div class="slip-title">BIG "E" FOOD CORPORATION</div>
            <div class="slip-sub">PETTY CASH REQUEST FORM &mdash; Finance</div>
            <div class="slip-ref">Ref: {$refNo}</div>
        </div>

        <table class="fields">
            <tr>
                <td width="60%"><span class="field-label">Requested by:</span><span class="field-value">{$requestedBy}</span></td>
                <td width="40%"><span class="field-label">Date:</span><span class="field-value">{$requestedDate}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Department:</span><span class="field-value">{$department}</span></td>
                <td><span class="field-label">Amount:</span><span class="field-value">&#8369; {$amount}</span></td>
            </tr>
        </table>

        <div style="margin-top:8px;"><span class="field-label">Purpose:</span></div>
        <div class="purpose-box">{$purpose}</div>

        <table class="fields" style="margin-top:10px;">
            <tr>
                <td width="60%"><span class="field-label">Approved by:</span><span class="field-value">{$approvedBy}</span></td>
                <td width="40%"><span class="field-label">Date:</span><span class="field-value">{$approvedDate}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Received by:</span><span class="field-value">&nbsp;</span></td>
                <td><span class="field-label">Date:</span><span class="field-value">&nbsp;</span></td>
            </tr>
        </table>

        <div class="footer-note">For salary deduction if not liquidated within 7 days</div>
        <div class="doc-code">QMS-FM-FIN-05-02 Rev.0/February 21, 2022</div>
    </div>
</body>
</html>
HTML;
    }
}
