<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\DashboardAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class DashboardAnalysisController extends Controller
{
    protected $dashboardAnalysisService;

    public function __construct(DashboardAnalysisService $dashboardAnalysisService)
    {
        $this->dashboardAnalysisService = $dashboardAnalysisService;
    }

    public function generatePerformanceAnalysisPDF(Request $request)
    {
        try {
            Log::info('Generating performance analysis PDF');

            $pdfContent = $this->dashboardAnalysisService->generatePerformanceAnalysisPDF();

            $filename = 'DPAR_Performance_Analysis_' . date('Y-m-d_H-i-s') . '.pdf';

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Content-Length', strlen($pdfContent));
        } catch (\Exception $e) {
            Log::error('Error generating performance analysis PDF: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to generate performance analysis PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
