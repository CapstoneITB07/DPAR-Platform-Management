<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    // List all reports for the authenticated user
    public function index()
    {
        $user = Auth::user();
        $reports = Report::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();

        // Add photo URLs to each report
        $reports->each(function ($report) {
            if ($report->photo_path) {
                $report->photo_url = asset('storage/' . $report->photo_path);
            }
        });

        return response()->json($reports);
    }

    // Store a new report
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Validate the request
            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:draft,sent',
                'data' => 'required|json',
                'photo' => 'required_if:status,sent|file|image|max:5120'
            ]);

            // Parse the data
            $reportData = json_decode($validatedData['data'], true);

            // Add user's organization to the data
            $reportData['organization'] = $user->organization;

            // Create the report data
            $reportData = [
                'user_id' => $user->id,
                'title' => $validatedData['title'],
                'description' => $validatedData['description'],
                'status' => $validatedData['status'],
                'data' => $reportData
            ];

            // Handle photo upload if present
            if ($request->hasFile('photo')) {
                $reportData['photo_path'] = $request->file('photo')->store('reports', 'public');
            }

            // Create the report
            $report = Report::create($reportData);

            // Add photo URL to response
            if ($report->photo_path) {
                $report->photo_url = asset('storage/' . $report->photo_path);
            }

            return response()->json($report, 201);
        } catch (\Exception $e) {
            Log::error('Report creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create report',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    // Show a single report
    public function show(string $id)
    {
        $user = Auth::user();
        $report = Report::where('user_id', $user->id)->findOrFail($id);

        // Add photo URL to response
        if ($report->photo_path) {
            $report->photo_url = asset('storage/' . $report->photo_path);
        }

        return response()->json($report);
    }

    // Update a report
    public function update(Request $request, string $id)
    {
        try {
            $user = Auth::user();
            $report = Report::where('user_id', $user->id)->findOrFail($id);

            Log::info('Updating report', [
                'report_id' => $id,
                'user_id' => $user->id,
                'request_data' => $request->all()
            ]);

            // If only status is being updated (submitting a draft)
            if ($request->has('status') && count($request->all()) === 1) {
                $report->status = $request->status;
                $report->save();
                return response()->json($report);
            }

            // For full updates, validate all fields
            $validatedData = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:draft,sent',
                'data' => 'required',
                'photo' => 'nullable|file|image|max:5120',
                'photo_path' => 'nullable|string'
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

            // Validate report data structure for submission
            if ($request->input('status') === 'sent') {
                if (empty($reportData['location']) || empty($reportData['details'])) {
                    return response()->json([
                        'message' => 'Location and details are required for submission',
                        'errors' => [
                            'data' => ['Missing required fields in report data']
                        ]
                    ], 422);
                }

                // Check for photo requirement
                if (!$report->photo_path && !$request->hasFile('photo') && !$request->input('photo_path')) {
                    return response()->json([
                        'message' => 'Photo is required for submission',
                        'errors' => [
                            'photo' => ['Photo is required when submitting a report']
                        ]
                    ], 422);
                }
            }

            // Update the report data
            $updateData = [
                'title' => $request->input('title', $report->title),
                'description' => $request->input('description', $report->description),
                'status' => $request->input('status'),
                'data' => $reportData
            ];

            // Handle photo upload if present
            if ($request->hasFile('photo')) {
                Log::info('Processing new photo upload');
                // Delete old photo if exists
                if ($report->photo_path && Storage::disk('public')->exists($report->photo_path)) {
                    Storage::disk('public')->delete($report->photo_path);
                }
                $updateData['photo_path'] = $request->file('photo')->store('reports', 'public');
            } elseif ($request->input('photo_path')) {
                Log::info('Using existing photo path: ' . $request->input('photo_path'));
                $updateData['photo_path'] = $request->input('photo_path');
            }

            Log::info('Updating report with data', ['update_data' => $updateData]);

            $report->update($updateData);

            // Add photo URL to response
            if ($report->photo_path) {
                $report->photo_url = asset('storage/' . $report->photo_path);
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
        $report = Report::where('user_id', $user->id)->findOrFail($id);

        // Delete photo if exists
        if ($report->photo_path && Storage::disk('public')->exists($report->photo_path)) {
            Storage::disk('public')->delete($report->photo_path);
        }

        $report->delete();
        return response()->json(['message' => 'Report deleted.']);
    }

    public function download(string $id)
    {
        $report = Report::findOrFail($id);
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
                // Add photo URL if exists
                if ($report->photo_path) {
                    $report->photo_url = asset('storage/' . $report->photo_path);
                }

                // Add associate group data to the report data
                if ($report->user) {
                    $associateGroup = \App\Models\AssociateGroup::where('user_id', $report->user->id)->first();
                    if ($associateGroup) {
                        $reportData = $report->data;
                        $reportData['associateGroup'] = $associateGroup;
                        $report->data = $reportData;
                    }
                }
            });

            return response()->json($reports);
        } catch (\Exception $e) {
            Log::error('Failed to fetch submitted reports', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch submitted reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
