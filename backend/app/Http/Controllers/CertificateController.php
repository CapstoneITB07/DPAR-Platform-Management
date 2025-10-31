<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{

    public function store(Request $request)
    {
        set_time_limit(300); // Extend execution time

        try {
            $validated = $request->validate([
                'name' => 'nullable|string',
                'associate' => 'nullable|string',
                'signatories' => 'required|array|min:1|max:5',
                'signatories.*.name' => 'required|string',
                'signatories.*.title' => 'required|string',
                'message' => 'required|string',
                'format' => 'required|in:pdf',
                'logoUrl' => 'nullable|string',
            ]);

            $baseUrl = env('APP_URL', 'http://127.0.0.1:8000');
            $logoUrl = $validated['logoUrl'] ?? $baseUrl . '/Assets/disaster_logo.png';
            $logoUrl = str_replace('localhost', '127.0.0.1', $logoUrl);

            $data = [
                'name' => $validated['name'] ?? null,
                'associate' => $validated['associate'] ?? $validated['name'] ?? 'Certificate Recipient',
                'signatories' => $validated['signatories'],
                'message' => $validated['message'],
                'logoUrl' => $logoUrl,
                'baseUrl' => $baseUrl,
            ];

            $filename = 'certificate_' . Str::random(8);

            Log::info('Generating certificate for: ' . $data['associate']);

            $nodeScript = base_path('generate-certificate.cjs');
            $process = proc_open(
                'node ' . escapeshellarg($nodeScript),
                [
                    0 => ['pipe', 'r'],
                    1 => ['pipe', 'w'],
                    2 => ['pipe', 'w'],
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

                if ($returnCode !== 0 || empty($pdf)) {
                    Log::error('PDF generation error: ' . $stderr);
                    return response()->json(['error' => 'PDF generation failed', 'details' => $stderr], 500);
                }

                Log::info('PDF generation successful: ' . $filename);

                return response($pdf, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '.pdf"',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                ]);
            } else {
                Log::error('Could not start PDF generation process');
                return response()->json(['error' => 'PDF generation process could not be started'], 500);
            }
        } catch (\Exception $e) {
            Log::error('CertificateController Exception: ' . $e->getMessage());
            return response()->json(['error' => 'Certificate generation failed: ' . $e->getMessage()], 500);
        }
    }

    public function storeBulk(Request $request)
    {
        set_time_limit(600); // Extend execution time for bulk generation

        try {
            $validated = $request->validate([
                'recipients' => 'required|array|min:1',
                'recipients.*.name' => 'required|string',
                'signatories' => 'required|array|min:1|max:5',
                'signatories.*.name' => 'required|string',
                'signatories.*.title' => 'required|string',
                'message' => 'required|string',
                'format' => 'required|in:pdf',
                'logoUrl' => 'nullable|string',
            ]);

            $baseUrl = env('APP_URL', 'http://127.0.0.1:8000');
            $logoUrl = $validated['logoUrl'] ?? $baseUrl . '/Assets/disaster_logo.png';
            $logoUrl = str_replace('localhost', '127.0.0.1', $logoUrl);

            $data = [
                'recipients' => array_map(function ($recipient) {
                    return [
                        'name' => $recipient['name']
                    ];
                }, $validated['recipients']),
                'signatories' => $validated['signatories'],
                'message' => $validated['message'],
                'logoUrl' => $logoUrl,
                'baseUrl' => $baseUrl,
            ];

            $filename = 'bulk_certificates_' . Str::random(8);

            Log::info('Generating bulk certificates for ' . count($validated['recipients']) . ' recipients');

            $nodeScript = base_path('generate-bulk-certificates.cjs');
            $process = proc_open(
                'node ' . escapeshellarg($nodeScript),
                [
                    0 => ['pipe', 'r'],
                    1 => ['pipe', 'w'],
                    2 => ['pipe', 'w'],
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

                if ($returnCode !== 0 || empty($pdf)) {
                    Log::error('Bulk PDF generation error: ' . $stderr);
                    return response()->json(['error' => 'Bulk PDF generation failed', 'details' => $stderr], 500);
                }

                Log::info('Bulk PDF generation successful: ' . $filename);

                return response($pdf, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '.pdf"',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                ]);
            } else {
                Log::error('Could not start bulk PDF generation process');
                return response()->json(['error' => 'Bulk PDF generation process could not be started'], 500);
            }
        } catch (\Exception $e) {
            Log::error('CertificateController Bulk Exception: ' . $e->getMessage());
            return response()->json(['error' => 'Bulk certificate generation failed: ' . $e->getMessage()], 500);
        }
    }
}
