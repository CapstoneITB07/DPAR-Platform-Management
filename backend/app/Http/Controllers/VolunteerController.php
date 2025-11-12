<?php

namespace App\Http\Controllers;

use App\Models\Volunteer;
use App\Models\AssociateGroup;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use App\Services\VolunteerImportService;
use App\Exports\VolunteerTemplateExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VolunteerController extends Controller
{
    public function index()
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        $volunteers = $associateGroup->volunteers;
        return response()->json($volunteers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'gender' => 'required|in:Male,Female',
            'address' => 'required|string',
            'contact_info' => 'required|string|max:11',
            'expertise' => 'nullable|string',
        ]);

        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        // Check for duplicate volunteer by name only
        $existingByName = $associateGroup->volunteers()
            ->where('name', $request->name)
            ->first();

        if ($existingByName) {
            return response()->json([
                'message' => 'A volunteer with this name already exists',
                'errors' => [
                    'duplicate' => 'A volunteer with this name already exists in your group'
                ]
            ], 422);
        }

        $volunteer = $associateGroup->volunteers()->create($request->all());

        // Log activity for volunteer recruitment
        $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId(Auth::id());
        ActivityLog::logActivity(
            Auth::id(),
            'volunteer_recruited',
            'Recruited a new volunteer: ' . $volunteer->name,
            [
                'volunteer_id' => $volunteer->id,
                'volunteer_name' => $volunteer->name,
                'volunteer_gender' => $volunteer->gender,
                'volunteer_expertise' => $volunteer->expertise
            ],
            $directorHistoryId
        );

        // Update current director's volunteer count
        DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->increment('volunteers_recruited');

        return response()->json($volunteer, 201);
    }

    public function update(Request $request, Volunteer $volunteer)
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup || $volunteer->associate_group_id !== $associateGroup->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'gender' => 'required|in:Male,Female',
            'address' => 'required|string',
            'contact_info' => 'required|string|max:11',
            'expertise' => 'nullable|string',
        ]);

        // Check for duplicate volunteer by name only (excluding current volunteer)
        $existingByName = $associateGroup->volunteers()
            ->where('name', $request->name)
            ->where('id', '!=', $volunteer->id)
            ->first();

        if ($existingByName) {
            return response()->json([
                'message' => 'A volunteer with this name already exists',
                'errors' => [
                    'duplicate' => 'A volunteer with this name already exists in your group'
                ]
            ], 422);
        }

        $volunteer->update($request->all());
        
        // Log activity for volunteer update
        try {
            $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId(Auth::id());
            ActivityLog::logActivity(
                Auth::id(),
                'update',
                'Updated volunteer: ' . $volunteer->name,
                [
                    'volunteer_id' => $volunteer->id,
                    'volunteer_name' => $volunteer->name,
                    'volunteer_gender' => $volunteer->gender,
                    'volunteer_expertise' => $volunteer->expertise
                ],
                $directorHistoryId
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log volunteer update activity: ' . $e->getMessage());
        }
        
        return response()->json($volunteer);
    }

    public function destroy(Volunteer $volunteer)
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup || $volunteer->associate_group_id !== $associateGroup->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $volunteerName = $volunteer->name;
        $volunteer->delete();

        // Log activity for volunteer deletion
        try {
            $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId(Auth::id());
            ActivityLog::logActivity(
                Auth::id(),
                'delete',
                'Deleted volunteer: ' . $volunteerName,
                [
                    'volunteer_id' => $volunteer->id,
                    'volunteer_name' => $volunteerName
                ],
                $directorHistoryId
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to log volunteer deletion activity: ' . $e->getMessage());
        }

        // Update current director's volunteer count
        DirectorHistory::where('associate_group_id', $associateGroup->id)
            ->where('is_current', true)
            ->decrement('volunteers_recruited');

        return response()->json(null, 204);
    }

    public function count()
    {
        $associateGroup = AssociateGroup::where('user_id', Auth::id())->first();
        if (!$associateGroup) {
            return response()->json(['message' => 'Associate group not found'], 404);
        }

        $count = $associateGroup->volunteers()->count();
        return response()->json(['count' => $count]);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240', // 10MB max
                function ($attribute, $value, $fail) {
                    $allowedMimes = [
                        'text/csv', // .csv
                        'application/csv', // .csv alternative
                        'text/plain', // .csv sometimes detected as plain text
                        'application/vnd.ms-excel' // Some systems detect CSV as this
                    ];
                    
                    $allowedExtensions = ['csv'];
                    
                    $mimeType = $value->getMimeType();
                    $extension = strtolower($value->getClientOriginalExtension());
                    
                    if (!in_array($mimeType, $allowedMimes) && !in_array($extension, $allowedExtensions)) {
                        $fail('The file must be a CSV file. You can convert Excel files to CSV using "Save As" > "CSV (Comma delimited)".');
                    }
                }
            ]
        ]);

        try {
            $importService = new VolunteerImportService();
            $results = $importService->importFromExcel($request->file('file'), Auth::id());

            return response()->json([
                'message' => 'Import completed',
                'results' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    public function downloadTemplate()
    {
        try {
            $export = new VolunteerTemplateExport();
            $data = $export->get();
            
            // Create CSV content
            $csvContent = '';
            foreach ($data as $row) {
                // Properly escape CSV values
                $escapedRow = array_map(function($value) {
                    if (strpos($value, ',') !== false || strpos($value, '"') !== false) {
                        return '"' . str_replace('"', '""', $value) . '"';
                    }
                    return $value;
                }, $row);
                $csvContent .= implode(',', $escapedRow) . "\n";
            }
            
            // Add instructions
            $csvContent .= "\nInstructions:\n";
            $csvContent .= "1. Fill in volunteer information in the rows below\n";
            $csvContent .= "2. Gender must be 'Male' or 'Female'\n";
            $csvContent .= "3. Contact Info should be 10-11 digits (mobile number)\n";
            $csvContent .= "4. Address should include complete address with city\n";
            $csvContent .= "5. Expertise is optional\n";
            $csvContent .= "6. Remove sample data before importing\n";
            
            $filename = 'volunteer_import_template.csv';
            
            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'max-age=0');

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
