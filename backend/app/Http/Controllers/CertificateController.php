<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{

    public function store(Request $request)
    {
        set_time_limit(300); // Extend execution time

        try {
            // Validate file uploads with detailed error messages
            $request->validate([
                'backgroundImage' => [
                    'nullable',
                    'image',
                    'mimes:jpeg,png,jpg,gif,webp',
                    'max:5120', // 5MB max
                ],
                'designImage' => [
                    'nullable',
                    'image',
                    'mimes:jpeg,png,jpg,gif,webp',
                    'max:5120', // 5MB max, optional
                ],
            ], [
                'backgroundImage.image' => 'The background image must be an image file.',
                'backgroundImage.mimes' => 'The background image must be a file of type: jpeg, png, jpg, gif, or webp.',
                'backgroundImage.max' => 'The background image may not be greater than 5MB.',
                'designImage.image' => 'The design overlay image must be an image file.',
                'designImage.mimes' => 'The design overlay image must be a file of type: jpeg, png, jpg, gif, or webp.',
                'designImage.max' => 'The design overlay image may not be greater than 5MB.',
            ]);

            // Additional validation for file size and MIME type
            if ($request->hasFile('backgroundImage')) {
                $file = $request->file('backgroundImage');

                // Check file size
                if ($file->getSize() > 5242880) { // 5MB in bytes
                    return response()->json([
                        'error' => 'Background image is too large. Maximum file size is 5MB.',
                        'uploaded_size' => round($file->getSize() / 1048576, 2) . 'MB'
                    ], 422);
                }

                // Check MIME type explicitly
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                $mimeType = $file->getMimeType();
                if (!in_array($mimeType, $allowedMimes)) {
                    return response()->json([
                        'error' => 'Background image format not allowed. Allowed formats: JPEG, PNG, GIF, or WebP.',
                        'uploaded_type' => $mimeType
                    ], 422);
                }

                // Check file extension
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $extension = strtolower($file->getClientOriginalExtension());
                if (!in_array($extension, $allowedExtensions)) {
                    return response()->json([
                        'error' => 'Background image file type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp',
                        'uploaded_extension' => $extension
                    ], 422);
                }
            }

            if ($request->hasFile('designImage')) {
                $file = $request->file('designImage');

                // Check file size
                if ($file->getSize() > 5242880) { // 5MB in bytes
                    return response()->json([
                        'error' => 'Design overlay image is too large. Maximum file size is 5MB.',
                        'uploaded_size' => round($file->getSize() / 1048576, 2) . 'MB'
                    ], 422);
                }

                // Check MIME type explicitly
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                $mimeType = $file->getMimeType();
                if (!in_array($mimeType, $allowedMimes)) {
                    return response()->json([
                        'error' => 'Design overlay image format not allowed. Allowed formats: JPEG, PNG, GIF, or WebP.',
                        'uploaded_type' => $mimeType
                    ], 422);
                }

                // Check file extension
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $extension = strtolower($file->getClientOriginalExtension());
                if (!in_array($extension, $allowedExtensions)) {
                    return response()->json([
                        'error' => 'Design overlay image file type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp',
                        'uploaded_extension' => $extension
                    ], 422);
                }
            }

            // Parse certificate data from JSON string
            $certificateData = json_decode($request->input('certificateData'), true);

            if (!$certificateData) {
                return response()->json(['error' => 'Invalid certificate data'], 400);
            }

            // Merge certificate data, preserving all customization options
            $validated = array_merge([
                'name' => $certificateData['name'] ?? null,
                'associate' => $certificateData['associate'] ?? null,
                'signatories' => $certificateData['signatories'] ?? [],
                'message' => $certificateData['message'] ?? '',
                'format' => $certificateData['format'] ?? 'pdf',
                'logoUrl' => $certificateData['logoUrl'] ?? null,
            ], $certificateData); // Put certificateData second so it overwrites defaults

            // Validate required fields
            if (empty($validated['signatories']) || !is_array($validated['signatories'])) {
                return response()->json(['error' => 'At least one signatory is required'], 400);
            }

            foreach ($validated['signatories'] as $signatory) {
                if (empty($signatory['name']) || empty($signatory['title'])) {
                    return response()->json(['error' => 'All signatories must have name and title'], 400);
                }
            }

            if (empty($validated['message'])) {
                return response()->json(['error' => 'Message is required'], 400);
            }

            $baseUrl = env('APP_URL', 'http://127.0.0.1:8000');
            $logoUrl = $validated['logoUrl'] ?? $baseUrl . '/Assets/disaster_logo.png';
            $logoUrl = str_replace('localhost', '127.0.0.1', $logoUrl);

            // Handle image uploads
            $backgroundImageUrl = null;
            $designImageUrl = null;

            if ($request->hasFile('backgroundImage')) {
                $backgroundPath = $request->file('backgroundImage')->store('certificates/backgrounds', 'public');
                $backgroundImageUrl = $baseUrl . '/storage/' . $backgroundPath;
            }

            if ($request->hasFile('designImage')) {
                $designPath = $request->file('designImage')->store('certificates/designs', 'public');
                $designImageUrl = $baseUrl . '/storage/' . $designPath;
            }
            // If no design image, default geometric pattern will be used

            $data = [
                'name' => $validated['name'] ?? null,
                'associate' => $validated['associate'] ?? $validated['name'] ?? 'Certificate Recipient',
                'signatories' => $validated['signatories'],
                'message' => $validated['message'],
                'logoUrl' => $logoUrl,
                'baseUrl' => $baseUrl,
                'backgroundImageUrl' => $backgroundImageUrl,
                'designImageUrl' => $designImageUrl,
                // Customization options
                'backgroundColor' => $validated['backgroundColor'] ?? '#014A9B',
                'accentColor' => $validated['accentColor'] ?? '#F7B737',
                'lightAccentColor' => $validated['lightAccentColor'] ?? '#4AC2E0',
                'borderColor' => $validated['borderColor'] ?? '#2563b6',
                'showTransparentBox' => $validated['showTransparentBox'] ?? true,
                // Per-part font settings
                'titleFontFamily' => $validated['titleFontFamily'] ?? 'Playfair Display',
                'titleFontSize' => $validated['titleFontSize'] ?? 'medium',
                'nameFontFamily' => $validated['nameFontFamily'] ?? 'Playfair Display',
                'nameFontSize' => $validated['nameFontSize'] ?? 'medium',
                'messageFontFamily' => $validated['messageFontFamily'] ?? 'Montserrat',
                'messageFontSize' => $validated['messageFontSize'] ?? 'medium',
                'signatoryFontFamily' => $validated['signatoryFontFamily'] ?? 'Montserrat',
                'signatoryFontSize' => $validated['signatoryFontSize'] ?? 'medium',
            ];

            $filename = 'certificate_' . Str::random(8);

            Log::info('Generating certificate for: ' . $data['associate']);
            Log::info('Certificate customization data:', [
                'backgroundColor' => $data['backgroundColor'],
                'accentColor' => $data['accentColor'],
                'lightAccentColor' => $data['lightAccentColor'],
                'borderColor' => $data['borderColor'],
                'showTransparentBox' => $data['showTransparentBox'],
                'titleFontFamily' => $data['titleFontFamily'],
                'titleFontSize' => $data['titleFontSize'],
                'nameFontFamily' => $data['nameFontFamily'],
                'nameFontSize' => $data['nameFontSize'],
                'messageFontFamily' => $data['messageFontFamily'],
                'messageFontSize' => $data['messageFontSize'],
                'signatoryFontFamily' => $data['signatoryFontFamily'],
                'signatoryFontSize' => $data['signatoryFontSize'],
                'backgroundImageUrl' => $data['backgroundImageUrl'],
                'designImageUrl' => $data['designImageUrl'],
            ]);

            // Log the full data being sent to Node.js (for debugging)
            Log::info('Full data array keys: ' . implode(', ', array_keys($data)));

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

                // Log Node.js output for debugging
                if (!empty($stderr)) {
                    Log::info('Node.js stderr output: ' . $stderr);
                }

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
            // Validate file uploads with detailed error messages
            $request->validate([
                'backgroundImage' => [
                    'nullable',
                    'image',
                    'mimes:jpeg,png,jpg,gif,webp',
                    'max:5120', // 5MB max
                ],
                'designImage' => [
                    'required',
                    'image',
                    'mimes:jpeg,png,jpg,gif,webp',
                    'max:5120', // 5MB max, required
                ],
            ], [
                'backgroundImage.image' => 'The background image must be an image file.',
                'backgroundImage.mimes' => 'The background image must be a file of type: jpeg, png, jpg, gif, or webp.',
                'backgroundImage.max' => 'The background image may not be greater than 5MB.',
                'designImage.required' => 'The design overlay image is required for bulk generation.',
                'designImage.image' => 'The design overlay image must be an image file.',
                'designImage.mimes' => 'The design overlay image must be a file of type: jpeg, png, jpg, gif, or webp.',
                'designImage.max' => 'The design overlay image may not be greater than 5MB.',
            ]);

            // Additional validation for file size and MIME type
            if ($request->hasFile('backgroundImage')) {
                $file = $request->file('backgroundImage');

                // Check file size
                if ($file->getSize() > 5242880) { // 5MB in bytes
                    return response()->json([
                        'error' => 'Background image is too large. Maximum file size is 5MB.',
                        'uploaded_size' => round($file->getSize() / 1048576, 2) . 'MB'
                    ], 422);
                }

                // Check MIME type explicitly
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                $mimeType = $file->getMimeType();
                if (!in_array($mimeType, $allowedMimes)) {
                    return response()->json([
                        'error' => 'Background image format not allowed. Allowed formats: JPEG, PNG, GIF, or WebP.',
                        'uploaded_type' => $mimeType
                    ], 422);
                }

                // Check file extension
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $extension = strtolower($file->getClientOriginalExtension());
                if (!in_array($extension, $allowedExtensions)) {
                    return response()->json([
                        'error' => 'Background image file type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp',
                        'uploaded_extension' => $extension
                    ], 422);
                }
            }

            if ($request->hasFile('designImage')) {
                $file = $request->file('designImage');

                // Check file size
                if ($file->getSize() > 5242880) { // 5MB in bytes
                    return response()->json([
                        'error' => 'Design overlay image is too large. Maximum file size is 5MB.',
                        'uploaded_size' => round($file->getSize() / 1048576, 2) . 'MB'
                    ], 422);
                }

                // Check MIME type explicitly
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                $mimeType = $file->getMimeType();
                if (!in_array($mimeType, $allowedMimes)) {
                    return response()->json([
                        'error' => 'Design overlay image format not allowed. Allowed formats: JPEG, PNG, GIF, or WebP.',
                        'uploaded_type' => $mimeType
                    ], 422);
                }

                // Check file extension
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                $extension = strtolower($file->getClientOriginalExtension());
                if (!in_array($extension, $allowedExtensions)) {
                    return response()->json([
                        'error' => 'Design overlay image file type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp',
                        'uploaded_extension' => $extension
                    ], 422);
                }
            }

            // Parse certificate data and recipients from JSON strings
            $certificateData = json_decode($request->input('certificateData'), true);
            $recipientsData = json_decode($request->input('recipients'), true);

            if (!$certificateData || !$recipientsData) {
                return response()->json(['error' => 'Invalid certificate or recipients data'], 400);
            }

            // Merge certificate data, preserving all customization options
            $validated = array_merge([
                'recipients' => $recipientsData,
                'signatories' => $certificateData['signatories'] ?? [],
                'message' => $certificateData['message'] ?? '',
                'format' => $certificateData['format'] ?? 'pdf',
                'logoUrl' => $certificateData['logoUrl'] ?? null,
            ], $certificateData); // Put certificateData second so it overwrites defaults

            // Validate required fields
            if (empty($validated['recipients']) || !is_array($validated['recipients'])) {
                return response()->json(['error' => 'At least one recipient is required'], 400);
            }

            if (empty($validated['signatories']) || !is_array($validated['signatories'])) {
                return response()->json(['error' => 'At least one signatory is required'], 400);
            }

            foreach ($validated['signatories'] as $signatory) {
                if (empty($signatory['name']) || empty($signatory['title'])) {
                    return response()->json(['error' => 'All signatories must have name and title'], 400);
                }
            }

            if (empty($validated['message'])) {
                return response()->json(['error' => 'Message is required'], 400);
            }

            $baseUrl = env('APP_URL', 'http://127.0.0.1:8000');
            $logoUrl = $validated['logoUrl'] ?? $baseUrl . '/Assets/disaster_logo.png';
            $logoUrl = str_replace('localhost', '127.0.0.1', $logoUrl);

            // Handle image uploads
            $backgroundImageUrl = null;
            $designImageUrl = null;

            if ($request->hasFile('backgroundImage')) {
                $backgroundPath = $request->file('backgroundImage')->store('certificates/backgrounds', 'public');
                $backgroundImageUrl = $baseUrl . '/storage/' . $backgroundPath;
            }

            if ($request->hasFile('designImage')) {
                $designPath = $request->file('designImage')->store('certificates/designs', 'public');
                $designImageUrl = $baseUrl . '/storage/' . $designPath;
            }
            // If no design image, default geometric pattern will be used

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
                'backgroundImageUrl' => $backgroundImageUrl,
                'designImageUrl' => $designImageUrl,
                // Customization options
                'backgroundColor' => $validated['backgroundColor'] ?? '#014A9B',
                'accentColor' => $validated['accentColor'] ?? '#F7B737',
                'lightAccentColor' => $validated['lightAccentColor'] ?? '#4AC2E0',
                'borderColor' => $validated['borderColor'] ?? '#2563b6',
                'showTransparentBox' => $validated['showTransparentBox'] ?? true,
                // Per-part font settings
                'titleFontFamily' => $validated['titleFontFamily'] ?? 'Playfair Display',
                'titleFontSize' => $validated['titleFontSize'] ?? 'medium',
                'nameFontFamily' => $validated['nameFontFamily'] ?? 'Playfair Display',
                'nameFontSize' => $validated['nameFontSize'] ?? 'medium',
                'messageFontFamily' => $validated['messageFontFamily'] ?? 'Montserrat',
                'messageFontSize' => $validated['messageFontSize'] ?? 'medium',
                'signatoryFontFamily' => $validated['signatoryFontFamily'] ?? 'Montserrat',
                'signatoryFontSize' => $validated['signatoryFontSize'] ?? 'medium',
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
