<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\PushNotificationService;

class ReportController extends Controller
{
    // List all reports for the authenticated user
    public function index()
    {
        $user = Auth::user();

        // Admin can view all reports (excluding soft-deleted), regular users can only view their own
        if (in_array($user->role, ['admin', 'head_admin', 'super_admin'])) {
            // Admin sees all non-deleted reports
            $reports = Report::with('user')->orderBy('created_at', 'desc')->get();
        } else {
            // Regular users see only their own non-deleted reports
            $reports = Report::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        }

        // Add photo URLs to each report
        $reports->each(function ($report) {
            $reportData = $report->data;
            if (isset($reportData['photos']) && !empty($reportData['photos'])) {
                $report->photo_urls = array_map(function ($path) {
                    return asset('storage/' . $path);
                }, $reportData['photos']);
            }
        });

        return response()->json($reports);
    }

    // Store a new report
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:draft,sent',
                'data' => 'required',
                'photo.*' => 'nullable|file|image|max:5120',
                'photo[0]' => 'nullable|file|image|max:5120',
                'photo[1]' => 'nullable|file|image|max:5120',
                'photo[2]' => 'nullable|file|image|max:5120',
                'photo[3]' => 'nullable|file|image|max:5120',
                'photo[4]' => 'nullable|file|image|max:5120',
                'associateLogo' => 'nullable|file|image|max:2048',
                'preparedBySignature' => 'nullable' // Remove file validation to allow existing signature data
            ]);

            // Parse the data if it's a string
            $reportData = is_string($request->input('data'))
                ? json_decode($request->input('data'), true)
                : $request->input('data');

            if (!$reportData) {
                return response()->json([
                    'message' => 'Invalid report data format',
                    'errors' => [
                        'data' => ['The report data must be a valid JSON object']
                    ]
                ], 422);
            }

            // Add user's organization to the data
            $reportData['organization'] = $user->organization;

            // Log the report data for debugging
            Log::info('Processing report creation', [
                'user_id' => $user->id,
                'user_organization' => $user->organization,
                'report_data_keys' => array_keys($reportData),
                'report_data_sample' => array_slice($reportData, 0, 5), // Log first 5 items
                'data_size' => strlen(json_encode($reportData))
            ]);

            // Validate that required fields exist in the report data (only for non-draft saves)
            $isDraftSave = $validatedData['status'] === 'draft';

            if (!$isDraftSave) {
                $requiredFields = ['institutionName', 'address', 'for', 'subject'];
                $missingFields = [];

                foreach ($requiredFields as $field) {
                    if (empty($reportData[$field])) {
                        $missingFields[] = $field;
                    }
                }

                // Check for place field
                if (empty($reportData['place'])) {
                    $missingFields[] = 'Place of Activity';
                }

                if (!empty($missingFields)) {
                    return response()->json([
                        'message' => 'Missing required fields in report data',
                        'errors' => [
                            'data' => ['The following fields are required: ' . implode(', ', $missingFields)]
                        ]
                    ], 422);
                }
            }

            // Handle multiple photo uploads
            $photoPaths = [];

            // Check for array-style photo uploads (photo[0], photo[1], etc.)
            $allFiles = $request->allFiles();
            $photos = [];

            // Look for photo files in array format
            foreach ($allFiles as $key => $files) {
                if (preg_match('/^photo\[\d+\]$/', $key)) {
                    if (is_array($files)) {
                        $photos = array_merge($photos, $files);
                    } else {
                        $photos[] = $files;
                    }
                }
            }

            // If no array-style photos found, try the regular photo field
            if (empty($photos) && $request->hasFile('photo')) {
                $photos = $request->file('photo');
                if (!is_array($photos)) {
                    $photos = [$photos];
                }
            }

            Log::info('Processing photo uploads', [
                'photo_count' => count($photos),
                'photo_names' => array_map(function ($photo) {
                    return $photo->getClientOriginalName();
                }, $photos),
                'request_files' => array_keys($request->allFiles()),
                'all_request_data' => array_keys($request->all()),
                'photo_input_type' => gettype($photos),
                'photo_input_count' => is_array($photos) ? count($photos) : 'not array'
            ]);

            // Alternative approach: get all files from request
            Log::info('All files in request', [
                'all_files_keys' => array_keys($allFiles),
                'photo_files_count' => isset($allFiles['photo']) ? count($allFiles['photo']) : 0
            ]);

            // Use the files from allFiles if available
            if (isset($allFiles['photo']) && is_array($allFiles['photo'])) {
                $photos = $allFiles['photo'];
                Log::info('Using files from allFiles', [
                    'count' => count($photos),
                    'names' => array_map(function ($photo) {
                        return $photo->getClientOriginalName();
                    }, $photos)
                ]);
            }

            // If we still only have one file, try a different approach
            if (count($photos) === 1) {
                // Try to get all files from the request
                $allUploadedFiles = $request->allFiles();
                if (isset($allUploadedFiles['photo'])) {
                    $photos = $allUploadedFiles['photo'];
                    Log::info('Retrieved multiple files from allFiles', [
                        'count' => count($photos),
                        'names' => array_map(function ($photo) {
                            return $photo->getClientOriginalName();
                        }, $photos)
                    ]);
                }
            }

            foreach ($photos as $index => $photo) {
                Log::info("Processing photo {$index}", [
                    'original_name' => $photo->getClientOriginalName(),
                    'size' => $photo->getSize(),
                    'mime_type' => $photo->getMimeType(),
                    'is_valid' => $photo->isValid()
                ]);

                $path = $photo->store('reports', 'public');
                $photoPaths[] = $path;
                Log::info('Photo stored', [
                    'original_name' => $photo->getClientOriginalName(),
                    'path' => $path,
                    'size' => $photo->getSize(),
                    'mime_type' => $photo->getMimeType()
                ]);
            }

            if (empty($photos)) {
                Log::info('No photos uploaded', [
                    'request_has_files' => $request->hasFile('photo'),
                    'all_files' => array_keys($request->allFiles()),
                    'request_data_keys' => array_keys($request->all()),
                    'photo_input_exists' => $request->has('photo'),
                    'files_input_exists' => $request->hasFile('photo')
                ]);
            }
            $reportData['photos'] = $photoPaths;

            // Handle logo and signature uploads
            if ($request->hasFile('associateLogo')) {
                $associateLogoPath = $request->file('associateLogo')->store('reports/logos', 'public');
                $reportData['associateLogo'] = $associateLogoPath;
            }



            if ($request->hasFile('preparedBySignature')) {
                $preparedBySignaturePath = $request->file('preparedBySignature')->store('reports/signatures', 'public');
                $reportData['preparedBySignature'] = $preparedBySignaturePath;
            }



            Log::info('Final report data', [
                'has_photos' => isset($reportData['photos']),
                'photo_count' => count($reportData['photos']),
                'photos' => $reportData['photos'],
                'has_associate_logo' => isset($reportData['associateLogo']),
                'has_prepared_signature' => isset($reportData['preparedBySignature'])
            ]);

            // Create the report data
            $reportDataToStore = [
                'user_id' => $user->id,
                'title' => $validatedData['title'],
                'description' => $validatedData['description'],
                'status' => $validatedData['status'],
                'data' => $reportData
            ];

            // Create the report
            $report = Report::create($reportDataToStore);

            // Send push notification to admin when report is submitted (not draft)
            if ($validatedData['status'] === 'sent') {
                try {
                    PushNotificationService::notifyAdminNewReport($report);
                } catch (\Exception $e) {
                    Log::error('Failed to send report submission push notification: ' . $e->getMessage());
                }
            }

            // Log activity for associates when submitting reports
            if ($user->role === 'associate_group_leader' && $validatedData['status'] === 'sent') {
                $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                ActivityLog::logActivity(
                    $user->id,
                    'report_submitted',
                    'Submitted a new report',
                    [
                        'report_id' => $report->id,
                        'report_title' => $report->title,
                        'has_photos' => !empty($photoPaths),
                        'photo_count' => count($photoPaths)
                    ],
                    $directorHistoryId
                );
            }

            // Add photo URLs to response
            if (!empty($photoPaths)) {
                $report->photo_urls = array_map(function ($path) {
                    return asset('storage/' . $path);
                }, $photoPaths);
            }

            return response()->json($report, 201);
        } catch (\Exception $e) {
            Log::error('Report creation failed: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'report_data' => $reportData ?? 'No report data',
                'user_id' => $user->id ?? 'No user'
            ]);
            return response()->json([
                'message' => 'Failed to create report',
                'error' => $e->getMessage(),
                'details' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 422);
        }
    }

    // Show a single report
    public function show(string $id)
    {
        $user = Auth::user();

        Log::info('Report show request', [
            'report_id' => $id,
            'user_id' => $user->id,
            'user_role' => $user->role,
            'request_url' => request()->url()
        ]);

        // Check if report exists first
        $reportExists = Report::find($id);
        if (!$reportExists) {
            Log::error('Report not found', ['report_id' => $id]);
            return response()->json(['message' => 'Report not found'], 404);
        }

        Log::info('Report found', [
            'report_id' => $reportExists->id,
            'report_user_id' => $reportExists->user_id,
            'current_user_id' => $user->id,
            'current_user_role' => $user->role
        ]);

        // Admin can view any report, regular users can only view their own
        if (in_array($user->role, ['admin', 'head_admin', 'super_admin'])) {
            $report = Report::with('user')->findOrFail($id);
        } else {
            $report = Report::with('user')->where('user_id', $user->id)->findOrFail($id);
        }

        // Add photo URLs to response
        $reportData = $report->data;
        if (isset($reportData['photos']) && !empty($reportData['photos'])) {
            $report->photo_urls = array_map(function ($path) {
                return asset('storage/' . $path);
            }, $reportData['photos']);
        }

        Log::info('Report show response', [
            'report_id' => $report->id,
            'report_title' => $report->title,
            'has_photos' => isset($reportData['photos']),
            'photo_count' => isset($reportData['photos']) ? count($reportData['photos']) : 0
        ]);

        return response()->json($report);
    }

    // Update a report (handles both PUT and POST with _method=PUT)
    public function update(Request $request, string $id)
    {
        try {
            $user = Auth::user();
            $report = Report::with('user')->where('user_id', $user->id)->findOrFail($id);

            Log::info('Updating report', [
                'report_id' => $id,
                'user_id' => $user->id,
                'request_method' => $request->method(),
                'request_is_method_override' => $request->isMethod('PUT'),
                'request_data' => $request->all(),
                'request_has_title' => $request->has('title'),
                'request_has_description' => $request->has('description'),
                'request_has_status' => $request->has('status'),
                'request_has_data' => $request->has('data'),
                'request_files' => array_keys($request->allFiles()),
                'request_input_keys' => array_keys($request->input()),
                'request_content_type' => $request->header('Content-Type'),
                'request_has_method_override' => $request->has('_method')
            ]);

            // If only status is being updated (submitting a draft)
            if ($request->has('status') && count($request->all()) === 1) {
                $oldStatus = $report->status;
                $report->status = $request->status;
                $report->save();

                // Log activity for associates when submitting draft reports
                if ($user->role === 'associate_group_leader' && $oldStatus === 'draft' && $request->status === 'sent') {
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($user->id);
                    ActivityLog::logActivity(
                        $user->id,
                        'report_submitted',
                        'Submitted a draft report',
                        [
                            'report_id' => $report->id,
                            'report_title' => $report->title,
                            'was_draft' => true
                        ],
                        $directorHistoryId
                    );
                }

                Log::info('Report status updated', [
                    'report_id' => $id,
                    'new_status' => $request->status,
                    'user_id' => $user->id
                ]);

                return response()->json($report);
            }

            // For draft saves, don't require all validation fields
            $isDraftSave = $request->input('status') === 'draft';

            // Handle FormData properly for multipart requests
            if ($request->header('Content-Type') && str_contains($request->header('Content-Type'), 'multipart/form-data')) {
                Log::info('Processing multipart/form-data request', [
                    'request_all' => $request->all(),
                    'request_input_keys' => array_keys($request->input()),
                    'request_files' => array_keys($request->allFiles()),
                    'is_draft_save' => $isDraftSave,
                    'prepared_by_signature_exists' => $request->has('preparedBySignature'),
                    'prepared_by_signature_is_file' => $request->hasFile('preparedBySignature'),
                    'associate_logo_exists' => $request->has('associateLogo'),
                    'associate_logo_is_file' => $request->hasFile('associateLogo')
                ]);
            }

            // For full updates, validate all fields
            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:draft,sent',
                'data' => 'required',
                'photo.*' => 'nullable|file|image|max:5120',
                'photo[0]' => 'nullable|file|image|max:5120',
                'photo[1]' => 'nullable|file|image|max:5120',
                'photo[2]' => 'nullable|file|image|max:5120',
                'photo[3]' => 'nullable|file|image|max:5120',
                'photo[4]' => 'nullable|file|image|max:5120',
                'associateLogo' => 'nullable|file|image|max:2048',
                'preparedBySignature' => 'nullable' // Remove file validation to allow existing signature data
            ]);

            // Parse the data if it's a string
            $reportData = is_string($request->input('data'))
                ? json_decode($request->input('data'), true)
                : $request->input('data');

            if (!$reportData) {
                return response()->json([
                    'message' => 'Invalid report data format',
                    'errors' => [
                        'data' => ['The report data must be a valid JSON object']
                    ]
                ], 422);
            }

            // Add user's organization to the data
            $reportData['organization'] = $user->organization;

            // Log the parsed report data for debugging
            Log::info('Parsed report data for update', [
                'report_data_keys' => array_keys($reportData),
                'place' => $reportData['place'] ?? 'NOT_SET',
                'for' => $reportData['for'] ?? 'NOT_SET',
                'subject' => $reportData['subject'] ?? 'NOT_SET',
                'eventName' => $reportData['eventName'] ?? 'NOT_SET',
                'eventDate' => $reportData['eventDate'] ?? 'NOT_SET',
                'startTime' => $reportData['startTime'] ?? 'NOT_SET',
                'endTime' => $reportData['endTime'] ?? 'NOT_SET',
                'eventOverview' => $reportData['eventOverview'] ?? 'NOT_SET',
                'conclusion' => $reportData['conclusion'] ?? 'NOT_SET',
                'preparedBy' => $reportData['preparedBy'] ?? 'NOT_SET',
                'preparedByPosition' => $reportData['preparedByPosition'] ?? 'NOT_SET',
                'photos_count' => isset($reportData['photos']) ? count($reportData['photos']) : 0
            ]);

            // Validate report data structure for submission (only for non-draft saves)
            if ($request->input('status') === 'sent' && !$isDraftSave) {
                $validationErrors = [];

                // Check for required fields - use the exact field names from the frontend
                if (empty($reportData['place'])) {
                    $validationErrors[] = 'Place of Activity is required for submission';
                }

                if (empty($reportData['for'])) {
                    $validationErrors[] = 'Recipient name is required for submission';
                }

                if (empty($reportData['subject'])) {
                    $validationErrors[] = 'Subject is required for submission';
                }

                if (empty($reportData['eventName'])) {
                    $validationErrors[] = 'Event name is required for submission';
                }

                if (empty($reportData['eventDate'])) {
                    $validationErrors[] = 'Event date is required for submission';
                }

                if (empty($reportData['startTime'])) {
                    $validationErrors[] = 'Start time is required for submission';
                }

                if (empty($reportData['endTime'])) {
                    $validationErrors[] = 'End time is required for submission';
                }

                if (empty($reportData['eventOverview'])) {
                    $validationErrors[] = 'Event overview is required for submission';
                }

                if (empty($reportData['conclusion'])) {
                    $validationErrors[] = 'Conclusion is required for submission';
                }

                if (empty($reportData['preparedBy'])) {
                    $validationErrors[] = 'Prepared by name is required for submission';
                }

                if (empty($reportData['preparedByPosition'])) {
                    $validationErrors[] = 'Prepared by position is required for submission';
                }

                // Check for photo requirement
                $existingPhotos = $reportData['photos'] ?? [];
                if (empty($existingPhotos) && !$request->hasFile('photo')) {
                    $validationErrors[] = 'At least one photo is required for submission';
                }

                if (!empty($validationErrors)) {
                    return response()->json([
                        'message' => 'Missing required fields for submission',
                        'errors' => [
                            'data' => $validationErrors
                        ]
                    ], 422);
                }
            }

            // Handle multiple photo uploads
            $photoPaths = $reportData['photos'] ?? [];
            if ($request->hasFile('photo')) {
                $photos = $request->file('photo');

                // Convert single file to array for consistent handling
                if (!is_array($photos)) {
                    $photos = [$photos];
                }

                Log::info('Processing new photo uploads', [
                    'photo_count' => count($photos),
                    'photo_names' => array_map(function ($photo) {
                        return $photo->getClientOriginalName();
                    }, $photos),
                    'request_files' => array_keys($request->allFiles()),
                    'existing_photos_before' => $photoPaths
                ]);

                // Store new photos and add them to existing ones
                $newPhotoPaths = [];
                foreach ($photos as $photo) {
                    $path = $photo->store('reports', 'public');
                    $newPhotoPaths[] = $path;
                    Log::info('Photo stored', [
                        'original_name' => $photo->getClientOriginalName(),
                        'path' => $path,
                        'size' => $photo->getSize(),
                        'mime_type' => $photo->getMimeType()
                    ]);
                }

                // Merge existing photos with new ones, filtering out placeholder entries
                $existingPhotos = array_filter($photoPaths, function ($path) {
                    return !str_starts_with($path, 'new_photo_');
                });
                $photoPaths = array_merge($existingPhotos, $newPhotoPaths);

                Log::info('Photo paths after merging', [
                    'existing_photos_filtered' => $existingPhotos,
                    'new_photos' => $newPhotoPaths,
                    'final_merged_photos' => $photoPaths
                ]);
            } else {
                Log::info('No new photos uploaded for update', [
                    'existing_photos' => $photoPaths,
                    'request_has_files' => $request->hasFile('photo'),
                    'all_files' => array_keys($request->allFiles())
                ]);
            }
            $reportData['photos'] = $photoPaths;

            // Handle logo and signature uploads for updates
            if ($request->hasFile('associateLogo')) {
                // Delete old logo if it exists
                if (isset($reportData['associateLogo']) && Storage::disk('public')->exists($reportData['associateLogo'])) {
                    Storage::disk('public')->delete($reportData['associateLogo']);
                }
                $associateLogoPath = $request->file('associateLogo')->store('reports/logos', 'public');
                $reportData['associateLogo'] = $associateLogoPath;
            }



            if ($request->hasFile('preparedBySignature')) {
                // Delete old signature if it exists
                if (isset($reportData['preparedBySignature']) && Storage::disk('public')->exists($reportData['preparedBySignature'])) {
                    Storage::disk('public')->delete($reportData['preparedBySignature']);
                }
                $preparedBySignaturePath = $request->file('preparedBySignature')->store('reports/signatures', 'public');
                $reportData['preparedBySignature'] = $preparedBySignaturePath;
            }



            Log::info('Final report data for update', [
                'has_photos' => isset($reportData['photos']),
                'photo_count' => count($reportData['photos']),
                'photos' => $reportData['photos'],
                'has_associate_logo' => isset($reportData['associateLogo']),
                'has_prepared_signature' => isset($reportData['preparedBySignature'])
            ]);

            // Update the report data
            $updateData = [
                'title' => $request->input('title', $report->title),
                'description' => $request->input('description', $report->description),
                'status' => $request->input('status'),
                'data' => $reportData
            ];

            Log::info('Updating report with data', ['update_data' => $updateData]);

            $report->update($updateData);

            // Add photo URLs to response
            if (!empty($photoPaths)) {
                $report->photo_urls = array_map(function ($path) {
                    return asset('storage/' . $path);
                }, $photoPaths);
            }

            return response()->json($report);
        } catch (\Exception $e) {
            Log::error('Report update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update report: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 422);
        }
    }

    // Delete a report
    public function destroy(string $id)
    {
        $user = Auth::user();
        
        // Admin can delete any report (permanently), regular users can only delete their own
        if (in_array($user->role, ['admin', 'head_admin', 'super_admin'])) {
            $report = Report::withTrashed()->with('user')->findOrFail($id);
            
            // Prevent deletion of approved reports even for admin
            if ($report->status === 'approved') {
                return response()->json([
                    'message' => 'Approved reports cannot be deleted.'
                ], 403);
            }
            
            // Admin can permanently delete (force delete) non-approved reports
            $reportData = $report->data;
            if (isset($reportData['photos']) && !empty($reportData['photos'])) {
                foreach ($reportData['photos'] as $photoPath) {
                    if (Storage::disk('public')->exists($photoPath)) {
                        Storage::disk('public')->delete($photoPath);
                    }
                }
            }
            
            // Permanently delete (force delete) - removes from database completely
            $report->forceDelete();
            return response()->json(['message' => 'Report permanently deleted.']);
        } else {
            // Regular users can only delete their own reports
            $report = Report::with('user')->where('user_id', $user->id)->findOrFail($id);
            
            // Prevent deletion of approved and submitted reports
            if ($report->status === 'approved') {
                return response()->json([
                    'message' => 'Approved reports cannot be deleted.'
                ], 403);
            }
            
            if ($report->status === 'sent') {
                return response()->json([
                    'message' => 'Submitted reports cannot be deleted. Please wait for admin approval or rejection.'
                ], 403);
            }
            
            // Only allow deletion of draft and rejected reports
            if (!in_array($report->status, ['draft', 'rejected'])) {
                return response()->json([
                    'message' => 'This report cannot be deleted.'
                ], 403);
            }

            // Delete photos if they exist
            $reportData = $report->data;
            if (isset($reportData['photos']) && !empty($reportData['photos'])) {
                foreach ($reportData['photos'] as $photoPath) {
                    if (Storage::disk('public')->exists($photoPath)) {
                        Storage::disk('public')->delete($photoPath);
                    }
                }
            }

            // Soft delete for regular users
            $report->delete();
            return response()->json(['message' => 'Report deleted.']);
        }
    }

    public function download(string $id)
    {
        $report = Report::with('user')->findOrFail($id);

        // Only allow download for approved reports
        if ($report->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved reports can be downloaded.'
            ], 403);
        }

        $pdfGenerator = new \App\Services\PDFGeneratorService();
        $pdf = $pdfGenerator->generateAORPDF($report);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="AOR_Report_' . $id . '.pdf"');
    }

    public function getSubmittedReports()
    {
        try {
            $reports = Report::where('status', 'sent')
                ->with(['user' => function ($query) {
                    $query->select('id', 'name', 'organization');
                }])
                ->orderBy('created_at', 'desc')
                ->get();

            // Add photo URLs and format the response
            $reports->each(function ($report) {
                // Add photo URLs if they exist
                $reportData = $report->data;
                if (isset($reportData['photos']) && !empty($reportData['photos'])) {
                    $report->photo_urls = array_map(function ($path) {
                        return asset('storage/' . $path);
                    }, $reportData['photos']);
                }
            });

            return response()->json($reports);
        } catch (\Exception $e) {
            Log::error('Failed to fetch submitted reports: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch submitted reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Approve a report
    public function approve(string $id)
    {
        try {
            $user = Auth::user();

            // Only head_admin can approve reports
            if ($user->role !== 'head_admin') {
                return response()->json(['message' => 'Unauthorized. Only head admin can approve reports.'], 403);
            }

            $report = Report::with('user')->findOrFail($id);

            if ($report->status !== 'sent') {
                return response()->json(['message' => 'Only sent reports can be approved.'], 400);
            }

            $report->status = 'approved';
            $report->approved_at = now();
            $report->approved_by = $user->id;
            $report->save();

            // Send push notification to associate about approval
            try {
                PushNotificationService::notifyAssociateReportApproved($report);
            } catch (\Exception $e) {
                Log::error('Failed to send report approval push notification: ' . $e->getMessage());
            }

            Log::info('Report approved', [
                'report_id' => $id,
                'approved_by' => $user->id,
                'approved_at' => now()
            ]);

            return response()->json([
                'message' => 'Report approved successfully',
                'report' => $report
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve report: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to approve report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Reject a report
    public function reject(Request $request, string $id)
    {
        try {
            $user = Auth::user();

            // Only head_admin can reject reports
            if ($user->role !== 'head_admin') {
                return response()->json(['message' => 'Unauthorized. Only head admin can reject reports.'], 403);
            }

            // Validate rejection reason
            $validated = $request->validate([
                'rejection_reason' => 'required|string|min:10|max:1000'
            ]);

            $report = Report::with('user')->findOrFail($id);

            if ($report->status !== 'sent') {
                return response()->json(['message' => 'Only sent reports can be rejected.'], 400);
            }

            $report->status = 'rejected';
            $report->rejected_at = now();
            $report->rejected_by = $user->id;
            $report->rejection_reason = $validated['rejection_reason'];
            $report->save();

            // Send push notification to associate about rejection
            try {
                PushNotificationService::notifyAssociateReportRejected($report);
            } catch (\Exception $e) {
                Log::error('Failed to send report rejection push notification: ' . $e->getMessage());
            }

            Log::info('Report rejected', [
                'report_id' => $id,
                'rejected_by' => $user->id,
                'rejected_at' => now(),
                'rejection_reason' => $validated['rejection_reason']
            ]);

            return response()->json([
                'message' => 'Report rejected successfully',
                'report' => $report
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Report rejection validation failed', [
                'errors' => $e->errors(),
                'report_id' => $id
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to reject report: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to reject report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
