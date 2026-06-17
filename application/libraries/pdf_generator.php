<?php


defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . '../vendor/autoload.php';

use Mpdf\Mpdf;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

class Pdf_generator {
    private $mpdf;
    private $config;

    public function __construct() {
        // Default configuration for mPDF
        $this->config = [
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 10,
            'default_font' => 'dejavusans',
            'margin_left' => 19, // ~0.75 inch
            'margin_right' => 19,
            'margin_top' => 19,
            'margin_bottom' => 19,
            'margin_header' => 9,
            'margin_footer' => 9,
            'orientation' => 'P', // Portrait
            'tempDir' => FCPATH . 'tmp',
            'fontDir' => array_merge((new ConfigVariables())->getDefaults()['fontDir'], [
                FCPATH . 'assets/fonts' // Custom fonts directory if needed
            ]),
            'fontdata' => (new FontVariables())->getDefaults()['fontdata'] + [
                'bootstrap' => [
                    'R' => 'DejaVuSans.ttf',
                    'B' => 'DejaVuSans-Bold.ttf',
                ]
            ],
            'curlAllowUnsafeSslRequests' => true, // For loading external resources
        ];

        // Ensure temp directory exists
        $tmpDir = FCPATH . 'tmp';
        if (!is_dir($tmpDir)) {
            @mkdir($tmpDir, 0777, true);
        }

        try {
            $this->mpdf = new Mpdf($this->config);
            
            // Enable Bootstrap support
            $this->mpdf->WriteHTML($this->getBootstrapCSS(), \Mpdf\HTMLParserMode::HEADER_CSS);
            
        } catch (Exception $e) {
            throw new Exception('Failed to initialize mPDF: ' . $e->getMessage());
        }
    }

    public function generate($html, $output_path, $options = []) {
        try {
            // Apply any custom options
            if (!empty($options)) {
                $this->applyOptions($options);
            }

            // Normalize path
            $relative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $output_path);
            $absolute_path = FCPATH . ltrim($relative, DIRECTORY_SEPARATOR);

            // Ensure output directory exists
            $dir = dirname($absolute_path);
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }

            // Validate HTML content
            if (empty($html)) {
                throw new Exception('HTML content is empty');
            }

            // Process HTML for better mPDF compatibility
            $processed_html = $this->processHTML($html);

            // Write HTML to PDF
            $this->mpdf->WriteHTML($processed_html);
            
            // Output to file
            $this->mpdf->Output($absolute_path, \Mpdf\Output\Destination::FILE);
            
            // Verify the PDF was created
            if (!file_exists($absolute_path)) {
                throw new Exception('PDF file was not created at: ' . $absolute_path);
            }

            return true;

        } catch (\Throwable $e) {
            $error_message = 'mPDF Generation Error: ' . $e->getMessage();
            log_message('error', $error_message);
            throw new Exception($error_message);
        }
    }

    public function generateInline($html, $options = []) {
        try {
            // Apply any custom options
            if (!empty($options)) {
                $this->applyOptions($options);
            }

            // Process HTML for better mPDF compatibility
            $processed_html = $this->processHTML($html);

            // Write HTML to PDF
            $this->mpdf->WriteHTML($processed_html);
            
            // Return PDF content as string
            return $this->mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);

        } catch (\Throwable $e) {
            log_message('error', 'mPDF Generation Error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function applyOptions($options) {
        // Handle common options
        if (isset($options['orientation'])) {
            $this->mpdf->AddPage($options['orientation']);
        }
        
        if (isset($options['margin-top'])) {
            $this->mpdf->AddPage('', '', '', '', '', 
                $this->inchToMm($options['margin-left'] ?? '0.75in'),
                $this->inchToMm($options['margin-right'] ?? '0.75in'),
                $this->inchToMm($options['margin-top']),
                $this->inchToMm($options['margin-bottom'] ?? '0.75in')
            );
        }
    }

    private function inchToMm($inch_value) {
        $value = floatval(str_replace('in', '', $inch_value));
        return $value * 25.4; // Convert inches to mm
    }

    private function processHTML($html) {
        // Add Bootstrap CSS if not already included
        if (strpos($html, 'bootstrap') === false) {
            $bootstrap_css = $this->getBootstrapCSS();
            $html = str_replace('<head>', '<head><style>' . $bootstrap_css . '</style>', $html);
        }

        // Fix some common HTML issues for mPDF
        $html = str_replace('display: table', 'display: block', $html);
        $html = str_replace('display: table-cell', 'display: inline-block', $html);
        
        // Ensure proper encoding
        if (strpos($html, '<meta charset') === false) {
            $html = str_replace('<head>', '<head><meta charset="UTF-8">', $html);
        }

        return $html;
    }

    private function getBootstrapCSS() {
        // Essential Bootstrap CSS classes for PDF generation
        return '
        .container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 15px; }
        .row { margin-left: -15px; margin-right: -15px; }
        .col-1, .col-2, .col-3, .col-4, .col-5, .col-6, .col-7, .col-8, .col-9, .col-10, .col-11, .col-12 { 
            float: left; padding-left: 15px; padding-right: 15px; 
        }
        .col-1 { width: 8.33333%; }
        .col-2 { width: 16.66667%; }
        .col-3 { width: 25%; }
        .col-4 { width: 33.33333%; }
        .col-5 { width: 41.66667%; }
        .col-6 { width: 50%; }
        .col-7 { width: 58.33333%; }
        .col-8 { width: 66.66667%; }
        .col-9 { width: 75%; }
        .col-10 { width: 83.33333%; }
        .col-11 { width: 91.66667%; }
        .col-12 { width: 100%; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-bold, .font-weight-bold { font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .table th, .table td { padding: 0.5rem; border: 1px solid #dee2e6; }
        .table thead th { border-bottom: 2px solid #dee2e6; }
        .border { border: 1px solid #dee2e6; }
        .border-top { border-top: 1px solid #dee2e6; }
        .border-bottom { border-bottom: 1px solid #dee2e6; }
        .border-left { border-left: 1px solid #dee2e6; }
        .border-right { border-right: 1px solid #dee2e6; }
        .p-1 { padding: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 1rem; }
        .p-4 { padding: 1.5rem; }
        .p-5 { padding: 3rem; }
        .m-1 { margin: 0.25rem; }
        .m-2 { margin: 0.5rem; }
        .m-3 { margin: 1rem; }
        .m-4 { margin: 1.5rem; }
        .m-5 { margin: 3rem; }
        .mb-0 { margin-bottom: 0; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 3rem; }
        .mt-0 { margin-top: 0; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        .mt-5 { margin-top: 3rem; }
        .clearfix::after { content: ""; display: table; clear: both; }
        .small { font-size: 0.875em; }
        .lead { font-size: 1.25rem; font-weight: 300; }
        h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5rem; font-weight: 500; }
        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.75rem; }
        h4 { font-size: 1.5rem; }
        h5 { font-size: 1.25rem; }
        h6 { font-size: 1rem; }
        ';
    }

    public static function checkInstallation() {
        try {
            // Check if mPDF vendor directory exists
            $vendor_path = APPPATH . '../vendor/mpdf/mpdf';
            $autoload_path = APPPATH . '../vendor/autoload.php';
            
            if (!file_exists($autoload_path)) {
                return [
                    'found' => false,
                    'library' => 'mPDF',
                    'error' => 'Composer autoload.php not found',
                    'suggestion' => 'Run: composer install'
                ];
            }
            
            if (!is_dir($vendor_path)) {
                return [
                    'found' => false,
                    'library' => 'mPDF',
                    'error' => 'mPDF directory not found in vendor folder',
                    'suggestion' => 'Run: composer require mpdf/mpdf'
                ];
            }
            
            // Check if mPDF class is available
            if (!class_exists('Mpdf\Mpdf')) {
                return [
                    'found' => false,
                    'library' => 'mPDF',
                    'error' => 'mPDF class not found after autoload',
                    'suggestion' => 'Check composer autoload or run: composer dump-autoload'
                ];
            }
            
            // Try to create a test instance
            $tmpDir = FCPATH . 'tmp';
            if (!is_dir($tmpDir)) {
                @mkdir($tmpDir, 0777, true);
            }
            
            $test_mpdf = new Mpdf(['tempDir' => $tmpDir]);
            
            return [
                'found' => true,
                'library' => 'mPDF',
                'version' => 'Available and working',
                'features' => ['Bootstrap CSS support', 'No external dependencies', 'Better HTML/CSS support'],
                'temp_dir' => $tmpDir,
                'vendor_path' => $vendor_path
            ];
            
        } catch (Exception $e) {
            return [
                'found' => false,
                'library' => 'mPDF',
                'error' => $e->getMessage(),
                'suggestion' => 'Check mPDF installation: composer require mpdf/mpdf'
            ];
        }
    }
}