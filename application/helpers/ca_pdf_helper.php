<?php
defined('BASEPATH') or exit('No direct script access allowed');

require_once APPPATH . '../vendor/setasign/fpdf/fpdf.php';
require_once APPPATH . '../vendor/setasign/fpdi/src/autoload.php';

use setasign\Fpdi\Fpdi;

function generate_ca_pdf($data, $templatePath, $outputPath)
{
    // Hardcode exact US Letter dimensions in mm
    define('LETTER_W_MM', 215.9);
    define('LETTER_H_MM', 355.6);
    
    $pdf = new Fpdi('P', 'mm', array(LETTER_W_MM, LETTER_H_MM));
    
    $pdf->setSourceFile($templatePath);
    $tplId = $pdf->importPage(1);
    
    $pdf->AddPage('P', array(215.9, 355.6)); // US Letter size in mm
    
    // Use template with explicit mm dimensions - forces exact scale
    $pdf->useTemplate($tplId, 0, 0, 215.9, 355.6);
    
    $pdf->SetAutoPageBreak(false);
    $pdf->SetFont('Arial', '', 10);

    // Coordinates in mm - adjust these to match your printed output
    $pdf->SetXY(25, 32);  $pdf->Cell(0, 5, $data['Date'] ?? '');
    $pdf->SetXY(32, 37);  $pdf->Cell(0, 5, $data['PayableTo'] ?? '');
    $pdf->SetXY(32, 42);  $pdf->Cell(0, 5, $data['AddressLine1'] ?? '');
    $pdf->SetXY(32, 47);  $pdf->Cell(0, 5, $data['AddressLine2'] ?? '');
    $pdf->SetXY(62, 51);  $pdf->Cell(0, 5, number_format((float)($data['Amount'] ?? 0), 2));
    $pdf->SetXY(76, 56);  $pdf->Cell(0, 5, $data['AmountInWords'] ?? '');
    $pdf->SetXY(20, 67);  $pdf->Cell(0, 5, $data['Description'] ?? '');
    $pdf->SetXY(57, 78);  $pdf->Cell(0, 5, $data['CostCenterName'] ?? '');
    $pdf->SetXY(38, 83);  $pdf->Cell(0, 5, $data['NeededDate'] ?? '');
    $pdf->SetXY(40, 100); $pdf->Cell(0, 5, $data['RequestedBy'] ?? '');
    $pdf->SetXY(80, 100); $pdf->Cell(0, 5, $data['Date'] ?? '');

    $pdf->Output('F', $outputPath);
    return $outputPath;
}