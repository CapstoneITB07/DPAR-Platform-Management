<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;
use App\Models\Report;
use Illuminate\Support\Facades\Log;

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
        $options->set('defaultPaperSize', 'legal'); // Changed from A4 to legal
        $options->set('defaultPaperOrientation', 'portrait');
        $options->set('isRemoteEnabled', true);
        $options->set('chroot', base_path());

        // Create Dompdf instance
        $dompdf = new Dompdf($options);

        // Ensure report data is properly formatted
        $reportData = $report->data ?? [];
        if (!is_array($reportData)) {
            $reportData = json_decode($reportData, true) ?? [];
        }

        // Log the report data for debugging
        Log::info('PDF Generation - Report Data', [
            'report_id' => $report->id,
            'has_photos' => isset($reportData['photos']),
            'photo_count' => isset($reportData['photos']) ? count($reportData['photos']) : 0,
            'photos' => $reportData['photos'] ?? []
        ]);

        // Ensure the report object has the data property set
        $report->data = $reportData;

        // Render the template
        $html = view('pdf.aor_template', ['report' => $report])->render();

        // Load HTML into Dompdf
        $dompdf->loadHtml($html);

        // Set paper size and orientation to legal
        $dompdf->setPaper('legal', 'portrait');

        // Render the PDF
        $dompdf->render();

        // Return the generated PDF
        return $dompdf->output();
    }
}
