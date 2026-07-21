<?php

defined('BASEPATH') or exit('No direct script access allowed');

function generate_petty_cash_pdf($fields, $templatePath, $outputPath)
{
    return generate_petty_cash_pdf_batch(array($fields), $templatePath, $outputPath);
}

function petty_cash_pdf_default_quadrant_offsets($fullSize)
{
    return array(
        array(0, 0),
        array(133.7, 0),
        array(-1, 101.45),
        array(134.2, 101.95),
    );
}

function generate_petty_cash_pdf_batch(array $itemsFieldSets, $templatePath, $outputPath, $quadrantOffsets = null)
{
    $pdf = new \setasign\Fpdi\Fpdi();

    $pdf->setSourceFile($templatePath);
    $tplId = $pdf->importPage(1);
    $fullSize = $pdf->getTemplateSize($tplId);
    $slipWidth = $fullSize['width'] / 2;
    $slipHeight = $fullSize['height'] / 2;

    $pdf->SetAutoPageBreak(false);
    $pdf->SetFont('Arial', '', 9);
    $pdf->SetTextColor(0, 0, 0);

    if ($quadrantOffsets === null) {
        $quadrantOffsets = petty_cash_pdf_default_quadrant_offsets($fullSize);
    }

    if (count($itemsFieldSets) === 1) {
        $pdf->AddPage($fullSize['orientation'], array($slipWidth, $slipHeight));
        $pdf->useTemplate($tplId, 0, 0, $fullSize['width'], $fullSize['height']);
        petty_cash_pdf_draw_fields($pdf, $itemsFieldSets[0], 0, 0);
        $pdf->Output('F', $outputPath);
        return $outputPath;
    }

    foreach (array_chunk($itemsFieldSets, 4) as $chunk) {
        $pdf->AddPage($fullSize['orientation'], array($fullSize['width'], $fullSize['height']));
        $pdf->useTemplate($tplId, 0, 0, $fullSize['width'], $fullSize['height']);

        foreach ($chunk as $i => $fieldsSet) {
            list($offsetX, $offsetY) = $quadrantOffsets[$i];
            petty_cash_pdf_draw_fields($pdf, $fieldsSet, $offsetX, $offsetY);
        }
    }

    $pdf->Output('F', $outputPath);
    return $outputPath;
}

function petty_cash_pdf_draw_fields($pdf, $fields, $offsetX, $offsetY)
{
    foreach ($fields as $f) {
        $pdf->SetXY($f['x'] + $offsetX, $f['y'] + $offsetY);
        if (!empty($f['multiline'])) {
            $pdf->MultiCell($f['w'] ?? 60, 4, $f['text']);
        } else {
            $pdf->Cell($f['w'] ?? 0, 5, $f['text']);
        }
    }
}

function petty_cash_pdf_default_fields()
{
    return array(
        'RequestedBy'  => array('x' => 33, 'y' => 33.5, 'text' => ''),
        'RequestDate'  => array('x' => 98, 'y' => 33.5, 'text' => ''),
        'Department'   => array('x' => 30, 'y' => 41, 'text' => ''),
        'Amount'       => array('x' => 103, 'y' => 41, 'text' => ''),
        'Purpose'      => array('x' => 10, 'y' => 54, 'w' => 125, 'multiline' => true, 'text' => ''),
    );
}

function petty_cash_pdf_fields_from_slip_data($slipData)
{
    $fields = petty_cash_pdf_default_fields();
    $fields['RequestedBy']['text'] = (string) ($slipData['requester_name'] ?? '');
    $fields['RequestDate']['text'] = !empty($slipData['created_date']) ? date('M d, Y', strtotime($slipData['created_date'])) : '';
    $fields['Department']['text'] = (string) ($slipData['department_name'] ?? '');
    $fields['Amount']['text'] = number_format((float) ($slipData['total_amount'] ?? 0), 2);
    $fields['Purpose']['text'] = (string) ($slipData['purpose'] ?? '');
    return $fields;
}
