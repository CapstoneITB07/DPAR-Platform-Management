<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    // Placeholder methods for resource controller
    public function index()
    { /* TODO */
    }
    public function store(Request $request)
    {
        set_time_limit(300); // Allow up to 5 minutes for certificate generation

        try {
            $validated = $request->validate([
                'name' => 'nullable|string',
                'associate' => 'nullable|string',
                'date' => 'required|string',
                'signatories' => 'required|array|min:1|max:5',
                'signatories.*.name' => 'required|string',
                'signatories.*.title' => 'required|string',
                'message' => 'required|string',
                'format' => 'required|in:pdf',
                'logoUrl' => 'nullable|string',
            ]);

            // Use environment variable for base URL to work in both development and production
            $baseUrl = 'http://127.0.0.1:8000';
            $logoUrl = $request->input('logoUrl', $baseUrl . '/Assets/disaster_logo.png');
            // Ensure logoUrl uses 127.0.0.1 instead of localhost
            $logoUrl = str_replace('localhost', '127.0.0.1', $logoUrl);
            $data = array_merge($validated, [
                'associate' => $validated['name'] ?? $validated['associate'] ?? 'Certificate Recipient',
                'logoUrl' => $logoUrl,
                'swirlTopUrl' => $baseUrl . '/Assets/swirl_top_left.png',
                'swirlBottomUrl' => $baseUrl . '/Assets/swirl_bottom_right.png',
                'baseUrl' => $baseUrl,
            ]);
            $filename = 'certificate_' . Str::random(8);

            Log::info('Starting PDF generation for associate: ' . $data['associate']);

            // Call the Node.js Puppeteer script for PDF generation
            $nodeScript = base_path('generate-certificate.cjs');
            $process = proc_open(
                'node ' . escapeshellarg($nodeScript),
                [
                    0 => ['pipe', 'r'], // stdin
                    1 => ['pipe', 'w'], // stdout
                    2 => ['pipe', 'w'], // stderr
                ],
                $pipes
            );

            if (is_resource($process)) {
                fwrite($pipes[0], json_encode($data));
                fclose($pipes[0]);
                $pdf = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[2]);
                $returnCode = proc_close($process);

                if ($returnCode !== 0) {
                    Log::error('Puppeteer error: ' . $stderr);
                    return response()->json(['error' => 'PDF generation failed', 'details' => $stderr], 500);
                }

                if (empty($pdf)) {
                    Log::error('PDF generation returned empty content');
                    return response()->json(['error' => 'PDF generation returned empty content'], 500);
                }

                Log::info('PDF generation successful for associate: ' . $data['associate']);
                return response($pdf, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '.pdf"',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                ]);
            } else {
                Log::error('Could not start PDF generation process');
                return response()->json(['error' => 'Could not start PDF generation process'], 500);
            }
        } catch (\Exception $e) {
            Log::error('Certificate generation error: ' . $e->getMessage());
            return response()->json(['error' => 'Certificate generation failed: ' . $e->getMessage()], 500);
        }
    }
    public function show(string $id)
    { /* TODO */
    }
    public function update(Request $request, string $id)
    { /* TODO */
    }
    public function destroy(string $id)
    { /* TODO */
    }
}
