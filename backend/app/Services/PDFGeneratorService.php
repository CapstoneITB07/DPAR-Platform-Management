<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use App\Models\Report;

class PDFGeneratorService
{
    public function generateAORPDF(Report $report)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);
        $options->set('defaultFont', 'Arial');
        $options->set('isFontSubsettingEnabled', true);
        $options->set('defaultMediaType', 'print');
        $options->set('defaultPaperSize', 'A4');
        $options->set('defaultPaperOrientation', 'portrait');

        // Create Dompdf instance
        $dompdf = new Dompdf($options);

        // Ensure report data is properly formatted
        $reportData = $report->data ?? [];
        if (!is_array($reportData)) {
            $reportData = json_decode($reportData, true) ?? [];
        }

        // Merge report data with report model
        $data = [
            'report' => $report,
            'data' => $reportData
        ];

        // Render the template
        $html = view('pdf.aor_template', $data)->render();

        // Load HTML into Dompdf
        $dompdf->loadHtml($html);

        // Set paper size and orientation
        $dompdf->setPaper('A4', 'portrait');

        // Render the PDF
        $dompdf->render();

        // Return the generated PDF
        return $dompdf->output();
    }
}
