<?php

namespace App\Services;

use App\Models\Volunteer;
use App\Models\AssociateGroup;
use App\Models\ActivityLog;
use App\Models\DirectorHistory;
use Illuminate\Support\Facades\Auth;
use App\Exports\VolunteerTemplateExport;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class VolunteerImportService
{
    public function importFromExcel($file, $userId)
    {
        $associateGroup = AssociateGroup::where('user_id', $userId)->first();
        if (!$associateGroup) {
            throw new \Exception('Associate group not found');
        }

        $results = [
            'success' => 0,
            'errors' => [],
            'duplicates' => 0,
            'total_processed' => 0
        ];

        try {
            // Parse CSV file using native PHP
            $filePath = $file->getRealPath();
            $fileHandle = fopen($filePath, 'r');
            
            if (!$fileHandle) {
                throw new \Exception('Unable to open file');
            }
            
            // Read header row
            $headers = fgetcsv($fileHandle);
            if (!$headers) {
                throw new \Exception('File is empty or invalid');
            }
            
            // Convert headers to lowercase for matching
            $headers = array_map('strtolower', $headers);
            
            DB::beginTransaction();
            
            $rowIndex = 0;
            while (($rowData = fgetcsv($fileHandle)) !== false) {
                // Skip empty rows
                if (count(array_filter($rowData)) === 0) {
                    continue;
                }
                
                $results['total_processed']++;
                $actualRowNumber = $rowIndex + 2; // +2 because we skipped header and array is 0-indexed
                
                try {
                    // Normalize array lengths - pad with empty strings if needed
                    $headerCount = count($headers);
                    $dataCount = count($rowData);
                    
                    if ($dataCount < $headerCount) {
                        // Pad data array with empty strings
                        $rowData = array_pad($rowData, $headerCount, '');
                    } elseif ($dataCount > $headerCount) {
                        // Trim data array to match headers
                        $rowData = array_slice($rowData, 0, $headerCount);
                    }
                    
                    // Combine headers with data to create associative array
                    $row = array_combine($headers, $rowData);
                    
                    // Extract data from row
                    $volunteerData = $this->extractVolunteerDataFromAssociativeArray($row, $actualRowNumber);
                    
                    $rowIndex++;
                    
                    if (!$volunteerData) {
                        continue; // Skip empty rows
                    }

                    // Validate the data
                    $validation = $this->validateVolunteerData($volunteerData);
                    if ($validation->fails()) {
                        $results['errors'][] = [
                            'row' => $actualRowNumber,
                            'errors' => $validation->errors()->toArray(),
                            'data' => $volunteerData
                        ];
                        continue;
                    }

                    // Check for duplicates
                    $existingVolunteer = $associateGroup->volunteers()
                        ->where('name', $volunteerData['name'])
                        ->first();

                    if ($existingVolunteer) {
                        $results['duplicates']++;
                        $results['errors'][] = [
                            'row' => $actualRowNumber,
                            'errors' => ['duplicate' => 'A volunteer with this name already exists'],
                            'data' => $volunteerData
                        ];
                        continue;
                    }

                    // Create the volunteer
                    $volunteer = $associateGroup->volunteers()->create($volunteerData);

                    // Log activity for volunteer recruitment
                    $directorHistoryId = DirectorHistory::getCurrentDirectorHistoryId($userId);
                    ActivityLog::logActivity(
                        $userId,
                        'volunteer_recruited',
                        'Recruited a new volunteer via Excel import: ' . $volunteer->name,
                        [
                            'volunteer_id' => $volunteer->id,
                            'volunteer_name' => $volunteer->name,
                            'volunteer_gender' => $volunteer->gender,
                            'volunteer_expertise' => $volunteer->expertise,
                            'import_method' => 'excel'
                        ],
                        $directorHistoryId
                    );

                    $results['success']++;

                } catch (\Exception $e) {
                    $results['errors'][] = [
                        'row' => $actualRowNumber,
                        'errors' => ['general' => $e->getMessage()],
                        'data' => $row
                    ];
                }
            }

            // Update current director's volunteer count
            if ($results['success'] > 0) {
                DirectorHistory::where('associate_group_id', $associateGroup->id)
                    ->where('is_current', true)
                    ->increment('volunteers_recruited', $results['success']);
            }

            fclose($fileHandle);
            DB::commit();

        } catch (\Exception $e) {
            if (isset($fileHandle) && $fileHandle) {
                fclose($fileHandle);
            }
            DB::rollBack();
            throw new \Exception('Failed to process file: ' . $e->getMessage());
        }

        return $results;
    }

    private function extractVolunteerDataFromAssociativeArray($row, $rowNumber)
    {
        // Extract data from associative array (headers are already lowercase)
        // Handle various possible column name variations
        $name = trim($row['name'] ?? '');
        $gender = trim($row['gender'] ?? '');
        $contactInfo = trim($row['contact_info'] ?? $row['contact info'] ?? $row['contactinfo'] ?? '');
        $address = trim($row['address'] ?? '');
        $expertise = trim($row['expertise'] ?? '');

        // Skip empty rows
        if (empty($name) && empty($gender) && empty($contactInfo) && empty($address)) {
            return null;
        }

        // Clean contact info (remove non-numeric characters and limit to 11 digits)
        $contactInfo = preg_replace('/\D/', '', $contactInfo);
        $contactInfo = substr($contactInfo, 0, 11);

        // Normalize gender
        $gender = $this->normalizeGender($gender);

        // Ensure address is properly formatted (trim and clean)
        $address = trim($address);

        return [
            'name' => $name,
            'gender' => $gender,
            'contact_info' => $contactInfo,
            'address' => $address,
            'expertise' => $expertise ?: null
        ];
    }

    private function extractVolunteerData($row, $rowNumber)
    {
        // Expected columns: Name, Gender, Contact Info, Address, Expertise
        // Handle different possible column orders and formats
        
        $data = [];
        
        // Clean and extract data from each column
        $name = trim($row[0] ?? '');
        $gender = trim($row[1] ?? '');
        $contactInfo = trim($row[2] ?? '');
        $address = trim($row[3] ?? '');
        $expertise = trim($row[4] ?? '');

        // Skip empty rows
        if (empty($name) && empty($gender) && empty($contactInfo) && empty($address)) {
            return null;
        }

        // Clean contact info (remove non-numeric characters and limit to 11 digits)
        $contactInfo = preg_replace('/\D/', '', $contactInfo);
        $contactInfo = substr($contactInfo, 0, 11);

        // Normalize gender
        $gender = $this->normalizeGender($gender);

        return [
            'name' => $name,
            'gender' => $gender,
            'contact_info' => $contactInfo,
            'address' => $address,
            'expertise' => $expertise ?: null
        ];
    }

    private function normalizeGender($gender)
    {
        $gender = strtolower(trim($gender));
        
        if (in_array($gender, ['male', 'm', 'man', 'masculine'])) {
            return 'Male';
        } elseif (in_array($gender, ['female', 'f', 'woman', 'feminine'])) {
            return 'Female';
        }
        
        return $gender; // Return as-is if not recognized
    }

    private function validateVolunteerData($data)
    {
        return Validator::make($data, [
            'name' => 'required|string|max:255',
            'gender' => 'required|in:Male,Female',
            'address' => 'required|string|max:255',
            'contact_info' => 'required|string|max:11|min:10',
            'expertise' => 'nullable|string|max:255'
        ]);
    }

    public function generateTemplate()
    {
        // Return the Excel export class for proper Excel template generation
        return new VolunteerTemplateExport();
    }
}
