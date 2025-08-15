<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>After Operation Report</title>
    <style>
        @page {
            margin: 1cm 1.5cm;
            size: legal;
            /* Legal paper size (8.5" x 14") */
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
            font-size: 13px;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            width: 100%;
            min-height: 80px;
            position: relative;
        }

        .header-logos img {
            width: 80px !important;
            height: 80px !important;
            object-fit: contain;
            flex-shrink: 0;
        }

        .header-logos img:first-child {
            position: absolute;
            left: 0;
            top: 0;
        }

        .header-logos img:last-child {
            position: absolute;
            right: 0;
            top: 0;
        }

        .header-text {
            text-align: center;
            flex: 1;
            margin: 0 auto;
            max-width: 500px;
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 100%;
        }

        .header-text h1 {
            font-size: 16px;
            margin: 2px 0;
            font-weight: bold;
            text-transform: uppercase;
            /* Make text size adjustable based on length */
            word-wrap: break-word;
            max-width: 500px;
            line-height: 1.2;
        }

        .header-text h2 {
            font-size: 14px;
            margin: 2px 0;
            font-weight: bold;
            text-transform: uppercase;
            /* Make text size adjustable based on length */
            word-wrap: break-word;
            max-width: 500px;
            line-height: 1.2;
        }

        /* Dynamic font sizing for institution name */
        .header-text h1.long-name {
            font-size: 14px;
        }

        .header-text h1.very-long-name {
            font-size: 13px;
        }

        .header-text h1.extremely-long-name {
            font-size: 12px;
        }

        /* Dynamic font sizing for associate names */
        .header-text h2.long-name {
            font-size: 12px;
        }

        .header-text h2.very-long-name {
            font-size: 11px;
        }

        .header-text h2.extremely-long-name {
            font-size: 10px;
        }

        .header-text h3 {
            font-size: 13px;
            margin: 2px 0;
            font-weight: bold;
            text-transform: uppercase;
        }

        .header-text p {
            font-size: 11px;
            margin: 1px 0;
            color: #333;
        }

        .report-header {
            margin-bottom: 15px;
            font-size: 13px;
        }

        .report-header table {
            width: 100%;
            border: none;
            margin-bottom: 10px;
        }

        .report-header td {
            padding: 2px 0;
            border: none;
            vertical-align: top;
        }

        .report-header .label {
            font-weight: bold;
            width: 80px;
            vertical-align: top;
        }

        .section {
            margin: 15px 0;
            page-break-inside: avoid;
        }

        .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
            color: #000;
            text-transform: uppercase;
        }

        .section p {
            text-align: justify;
            line-height: 1.4;
            margin: 4px 0;
            text-indent: 0;
        }

        .content {
            margin-left: 20px;
            font-size: 13px;
            text-align: justify;
        }

        .content p {
            margin: 4px 0;
            text-indent: 0;
            text-align: justify;
            line-height: 1.4;
            margin-left: 15px;
        }

        .content strong {
            font-weight: bold;
        }

        .date-time-highlight {
            font-weight: bold;
            color: #000;
            font-size: 14px;
            background-color: #f8f9fa;
            padding: 3px 6px;
            border-radius: 3px;
            border-left: 3px solid #007bff;
        }

        .numbered-list {
            margin: 8px 0;
            padding-left: 0;
        }

        .numbered-list p {
            margin: 3px 0;
            text-indent: 20px;
        }

        .sub-content {
            margin-left: 15px;
            margin-top: 5px;
        }

        .sub-content p {
            margin: 3px 0;
            text-align: justify;
            line-height: 1.4;
            text-indent: 0;
            margin-left: 15px;
        }

        .photo-section {
            margin: 20px 0;
            text-align: center;
            page-break-inside: avoid;
        }

        .photo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 10px;
        }

        .photo-item {
            text-align: center;
        }

        .photo-item img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
            padding: 3px;
        }

        .photo-caption {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }

        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-line {
            border-top: none;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 13px;
        }

        .footer {
            position: fixed;
            bottom: 15px;
            left: 0;
            right: 0;
            font-size: 11px;
            text-align: center;
            color: #666;
            padding: 8px 0;
            border-top: 1px solid #ccc;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="header-logos">
            @php
            use Illuminate\Support\Facades\Log;

            $dparLogoPath = public_path('Assets/disaster_logo.png');
            $dparExists = file_exists($dparLogoPath);
            $dparBase64 = $dparExists ? 'data:image/png;base64,' . base64_encode(file_get_contents($dparLogoPath)) : '';

            // Automatically determine associate logo based on user's organization
            $associateName = $report->user->organization ?? $report->data['associateName'] ?? '';

            // Clean and normalize the associate name for better matching
            $cleanAssociateName = trim(strtoupper($associateName));

            // Debug: Show the actual paths being checked
            Log::info('Logo Path Debug', [
            'public_path' => public_path(),
            'frontend_assets_path' => base_path('../frontend/public/Assets'),
            'frontend_assets_exists' => is_dir(base_path('../frontend/public/Assets')),
            'aklmv_path' => base_path('../frontend/public/Assets/AKLMV.png'),
            'aklmv_exists' => file_exists(base_path('../frontend/public/Assets/AKLMV.png')),
            'pcga_path' => base_path('../frontend/public/Assets/PCGA 107th.png'),
            'pcga_exists' => file_exists(base_path('../frontend/public/Assets/PCGA 107th.png'))
            ]);

            $associateLogoBase64 = '';
            $associateLogoPath = '';

            // Map associate names to their logo files and full names
            $associateLogoMap = [
            'AKLMV' => ['logo' => 'AKLMV.png', 'fullName' => 'Angat Kabataan Laguna Medical Volunteers'],
            'ALERT' => ['logo' => 'ALERT.png', 'fullName' => 'Aksyong Leif - Emergency Response Team'],
            'CCVOL' => ['logo' => 'CCVOL.png', 'fullName' => 'Cabuyao Civilian Volunteers'],
            'CCRG' => ['logo' => 'CRRG.png', 'fullName' => 'Cabuyao Radio and Response Group, Inc.'],
            'DRRM' => ['logo' => 'DRRM - Y.png', 'fullName' => 'Disaster Risk Reduction and Management for Youth'],
            'FRONTLINER' => ['logo' => 'FRONTLINER.png', 'fullName' => 'The Frontliners'],
            'JKM' => ['logo' => 'JKM.png', 'fullName' => 'Juan Kabuyaw Movement'],
            'KAIC' => ['logo' => 'KAIC.png', 'fullName' => 'King\'s Ambassador International Church'],
            'MRAP' => ['logo' => 'MRAP.png', 'fullName' => 'Muslim Reverts Association of the Philippines Inc.'],
            'MSG' => ['logo' => 'MSG - ERU.png', 'fullName' => 'Marshall Support Group'],
            'PCG' => ['logo' => 'PCG.png', 'fullName' => 'Philippine Coast Guard'],
            'PCG 107th' => ['logo' => 'PCGA 107th.png', 'fullName' => '107th Squadron PCGA'],
            'RMFB' => ['logo' => 'RMFB.png', 'fullName' => 'RMFB4A'],
            'SPAG' => ['logo' => 'SPAG.png', 'fullName' => 'Salaam Police Advocacy Group'],
            'SRG' => ['logo' => 'SRG.png', 'fullName' => 'Sole Riders Group'],
            'TF' => ['logo' => 'TF.png', 'fullName' => 'Tooth Family Civic Action']
            ];

            // Debug: Show the mapping being used
            Log::info('Logo Mapping Debug', [
            'associate_name_received' => $associateName,
            'clean_associate_name' => $cleanAssociateName,
            'available_keys' => array_keys($associateLogoMap),
            'exact_match_found' => isset($associateLogoMap[$cleanAssociateName]),
            'matching_key' => isset($associateLogoMap[$cleanAssociateName]) ? $cleanAssociateName : 'No exact match'
            ]);

            // Debug logging
            Log::info('PDF Generation Debug', [
            'user_id' => $report->user->id ?? 'No user',
            'user_name' => $report->user->name ?? 'No name',
            'user_email' => $report->user->email ?? 'No email',
            'user_organization' => $report->user->organization ?? 'No organization',
            'report_data_associate' => $report->data['associateName'] ?? 'No associate in data',
            'final_associate_name' => $associateName,
            'report_id' => $report->id ?? 'No report ID',
            'report_title' => $report->title ?? 'No title',
            'all_user_data' => $report->user ? $report->user->toArray() : 'No user data',
            'user_organization_type' => gettype($report->user->organization ?? 'null'),
            'user_organization_length' => strlen($report->user->organization ?? ''),
            'user_organization_trimmed' => trim($report->user->organization ?? ''),
            'user_organization_upper' => strtoupper(trim($report->user->organization ?? ''))
            ]);

            // Find the matching logo and full name
            $selectedLogo = null;
            $selectedFullName = '';

            // Try exact match first
            if (isset($associateLogoMap[$cleanAssociateName])) {
            $selectedLogo = $associateLogoMap[$cleanAssociateName]['logo'];
            $selectedFullName = $associateLogoMap[$cleanAssociateName]['fullName'];
            Log::info('Exact match found', [
            'clean_associate_name' => $cleanAssociateName,
            'selected_logo' => $selectedLogo,
            'selected_full_name' => $selectedFullName
            ]);
            } else {
            // Try partial match with better logic
            foreach ($associateLogoMap as $name => $info) {
            $cleanName = trim(strtoupper($name));

            // Check if the associate name contains the key name or vice versa
            if (strpos($cleanAssociateName, $cleanName) !== false ||
            strpos($cleanName, $cleanAssociateName) !== false ||
            $cleanAssociateName === $cleanName) {
            $selectedLogo = $info['logo'];
            $selectedFullName = $info['fullName'];
            Log::info('Partial match found', [
            'clean_associate_name' => $cleanAssociateName,
            'matched_name' => $name,
            'selected_logo' => $selectedLogo,
            'selected_full_name' => $selectedFullName
            ]);
            break;
            }
            }
            }

            // Debug logging for logo selection
            Log::info('Logo Selection Debug', [
            'original_associate_name' => $associateName,
            'clean_associate_name' => $cleanAssociateName,
            'selected_logo' => $selectedLogo,
            'selected_full_name' => $selectedFullName,
            'logo_exists' => $selectedLogo ? file_exists(base_path('../frontend/public/Assets/' . $selectedLogo)) : false,
            'logo_path' => $selectedLogo ? base_path('../frontend/public/Assets/' . $selectedLogo) : 'No logo',
            'aklmv_exists' => file_exists(base_path('../frontend/public/Assets/AKLMV.png')),
            'aklmv_path' => base_path('../frontend/public/Assets/AKLMV.png')
            ]);

            // If no specific logo found, use PCGA 107th as default
            if (empty($selectedLogo) || !file_exists(base_path('../frontend/public/Assets/' . $selectedLogo))) {
            Log::info('Logo file not found, using default', [
            'selected_logo' => $selectedLogo,
            'file_exists' => $selectedLogo ? file_exists(base_path('../frontend/public/Assets/' . $selectedLogo)) : false,
            'falling_back_to_default' => true
            ]);

            $selectedLogo = 'PCGA 107th.png';
            $selectedFullName = '107th Squadron PCGA';
            }

            $associateLogoPath = base_path('../frontend/public/Assets/' . $selectedLogo);
            $associateLogoExists = file_exists($associateLogoPath);
            $associateLogoBase64 = $associateLogoExists ? 'data:image/png;base64,' . base64_encode(file_get_contents($associateLogoPath)) : '';

            // Use the full name for display
            $displayAssociateName = $selectedFullName ?: $associateName;

            // Determine text size class based on associate name length
            $nameLength = strlen($displayAssociateName);
            $textSizeClass = '';
            if ($nameLength > 50) {
            $textSizeClass = 'extremely-long-name';
            } elseif ($nameLength > 35) {
            $textSizeClass = 'very-long-name';
            } elseif ($nameLength > 25) {
            $textSizeClass = 'long-name';
            }

            // Determine institution name size class
            $institutionName = 'Disaster Preparedness And Response Volunteers Coalition of Laguna';
            $institutionLength = strlen($institutionName);
            $institutionSizeClass = '';
            if ($institutionLength > 50) {
            $institutionSizeClass = 'extremely-long-name';
            } elseif ($institutionLength > 35) {
            $institutionSizeClass = 'very-long-name';
            } elseif ($institutionLength > 25) {
            $institutionSizeClass = 'long-name';
            }
            @endphp

            <!-- Left Logo - DPAR Logo -->
            @if($dparExists)
            <img src="{{ $dparBase64 }}" alt="DPAR Logo">
            @endif

            <div class="header-text">
                <h1 class="{{ $institutionSizeClass }}">{{ $report->data['institutionName'] ?? 'Disaster Preparedness And Response Volunteers Coalition of Laguna' }}</h1>
                <h2 class="{{ $textSizeClass }}">{{ $displayAssociateName }}</h2>
                <p>{{ $report->data['address'] ?? 'Blk 63 Lot 21 Aventine Hills BF Resort Village, Las Pinas City' }}</p>
            </div>

            <!-- Right Logo - Automatically determined Associate Logo -->
            @if($associateLogoExists)
            <img src="{{ $associateLogoBase64 }}" alt="Associate Logo">
            @endif
        </div>
    </div>

    <div class="report-header">
        <table>
            <tr>
                <td class="label"><strong>FOR:</strong></td>
                <td>{{ $report->data['for'] ?? 'AUX RADM FREDERICK GOMEZ PCGA' }}</td>
            </tr>
            <tr>
                <td></td>
                <td>{{ $report->data['forPosition'] ?? 'District Auxiliary Director' }}</td>
            </tr>
            <tr>
                <td class="label"><strong>DATE:</strong></td>
                <td>{{ isset($report->data['date']) ? date('d F Y', strtotime($report->data['date'])) : date('d F Y') }}</td>
            </tr>
            <tr>
                <td class="label"><strong>SUBJECT:</strong></td>
                <td>{{ $report->data['subject'] ?? $report->title }}</td>
            </tr>
        </table>
    </div>

    <!-- Single Column Layout -->
    <div class="section">
        <div class="section-title">I. AUTHORITY</div>
        <div class="content">
            @if(isset($report->data['authority']) && is_array($report->data['authority']) && count($report->data['authority']) > 0)
            @foreach($report->data['authority'] as $authority)
            @if(!empty(trim($authority)))
            <p>{{ $authority }}</p>
            @endif
            @endforeach
            @else
            <p>Philippine Coast Guard</p>
            <p>CGADNCR-CL</p>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">II. DATE, TIME, AND PLACE OF ACTIVITY</div>
        <div class="content">
            @if(!empty($report->data['dateTime']))
            <p><strong>Date and Time:</strong>
                @php
                $dateTime = $report->data['dateTime'];
                if (strpos($dateTime, 'T') !== false) {
                // Convert ISO format (2025-08-08T01:12) to readable format
                $date = \DateTime::createFromFormat('Y-m-d\TH:i', $dateTime);
                if ($date) {
                echo '<span class="date-time-highlight">' . $date->format('d F Y \a\t g:i A') . '</span>'; // e.g., "08 August 2025 at 1:12 AM"
                } else {
                echo '<span class="date-time-highlight">' . $dateTime . '</span>'; // Fallback to original if parsing fails
                }
                } else {
                // If it's already in a readable format, just display it
                echo '<span class="date-time-highlight">' . $dateTime . '</span>';
                }
                @endphp
            </p>
            @else
            <p><strong>Date and Time:</strong> <span class="date-time-highlight">Not specified</span></p>
            @endif

            @if(!empty($report->data['location']))
            <p><strong>Place:</strong> {{ $report->data['location'] }}</p>
            @else
            <p><strong>Place:</strong> Not specified</p>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">III. PERSONNEL INVOLVED</div>
        <div class="content">
            @if(isset($report->data['auxiliaryPersonnel']) && is_array($report->data['auxiliaryPersonnel']) && count($report->data['auxiliaryPersonnel']) > 0)
            @foreach($report->data['auxiliaryPersonnel'] as $person)
            @if(!empty(trim($person)))
            <p>{{ $person }}</p>
            @endif
            @endforeach
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">IV. NARRATION OF EVENTS</div>
        <div class="content">
            <!-- First Part: Event Details (from form inputs) -->
            @if(!empty($report->data['eventName']) || !empty($report->data['activityType']))
            <p><strong>{{ $report->data['eventName'] ?? $report->data['activityType'] ?? 'Event Name' }}</strong></p>
            <p style="margin-top: 15px;"></p>
            @endif

            @if(!empty($report->data['eventDate']) || !empty($report->data['startTime']) || !empty($report->data['endTime']))
            <p><strong>Date and Time:</strong>
                @if(!empty($report->data['eventDate']))
                @php
                $eventDate = $report->data['eventDate'];
                if (strpos($eventDate, 'T') !== false) {
                // Convert ISO format to readable format
                $date = \DateTime::createFromFormat('Y-m-d\TH:i', $eventDate);
                if ($date) {
                echo '<span class="date-time-highlight">' . $date->format('d F Y') . '</span>';
                } else {
                echo '<span class="date-time-highlight">' . $eventDate . '</span>';
                }
                } else {
                echo '<span class="date-time-highlight">' . $eventDate . '</span>';
                }
                @endphp
                @endif
                @if(!empty($report->data['startTime']) || !empty($report->data['endTime']))
                @if(!empty($report->data['eventDate']))
                <span> | </span>
                @endif
                <span class="date-time-highlight">
                    @if(!empty($report->data['startTime']))
                    {{ $report->data['startTime'] }}
                    @endif
                    @if(!empty($report->data['startTime']) && !empty($report->data['endTime']))
                    -
                    @endif
                    @if(!empty($report->data['endTime']))
                    {{ $report->data['endTime'] }}
                    @endif
                </span>
                @endif
            </p>
            @endif

            @if(!empty($report->data['eventLocation']))
            <p><strong>Location:</strong> {{ $report->data['eventLocation'] }}</p>
            @endif

            @if(isset($report->data['organizers']) && is_array($report->data['organizers']) && count($report->data['organizers']) > 0)
            <p><strong>Organizers:</strong> {{ implode(', ', array_filter(array_map('trim', $report->data['organizers']))) }}</p>
            @endif

            <!-- Second Part: Event Details -->
            @if(!empty($report->data['summary']) || !empty($report->data['eventOverview']))
            <p><strong>Event Overview:</strong></p>
            <div class="sub-content">
                <p>{{ $report->data['summary'] ?? $report->data['eventOverview'] ?? 'Not provided' }}</p>
            </div>
            @endif

            @if(!empty($report->data['objective']) || !empty($report->data['trainingAgenda']))
            <p><strong>Training Agenda:</strong></p>
            <div class="sub-content">
                <p>{{ $report->data['objective'] ?? $report->data['trainingAgenda'] ?? 'Not provided' }}</p>
            </div>
            @endif

            @if(isset($report->data['participants']) && is_array($report->data['participants']) && count($report->data['participants']) > 0)
            <p><strong>Participants:</strong></p>
            <div class="sub-content">
                @foreach($report->data['participants'] as $participant)
                @if(is_array($participant) && !empty($participant['name']))
                <p>{{ $participant['name'] }}{{ !empty($participant['position']) ? ' - ' . $participant['position'] : '' }}</p>
                @elseif(is_string($participant) && !empty(trim($participant)))
                <p>{{ $participant }}</p>
                @endif
                @endforeach
            </div>
            @endif

            @if(isset($report->data['keyOutcomes']) && is_array($report->data['keyOutcomes']) && count($report->data['keyOutcomes']) > 0)
            <p><strong>Key Outcomes:</strong></p>
            <div class="sub-content">
                @foreach($report->data['keyOutcomes'] as $outcome)
                @if(!empty(trim($outcome)))
                <p>{{ $outcome }}</p>
                @endif
                @endforeach
            </div>
            @endif

            @if(isset($report->data['challenges']) && is_array($report->data['challenges']) && count($report->data['challenges']) > 0)
            <p><strong>Challenges:</strong></p>
            <div class="sub-content">
                @foreach($report->data['challenges'] as $challenge)
                @if(!empty(trim($challenge)))
                <p>{{ $challenge }}</p>
                @endif
                @endforeach
            </div>
            @endif

            @if(!empty($report->data['conclusion']))
            <p><strong>Conclusion:</strong></p>
            <div class="sub-content">
                <p>{{ $report->data['conclusion'] }}</p>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">V. RECOMMENDATIONS</div>
        <div class="content">
            @if(isset($report->data['recommendations']) && is_array($report->data['recommendations']) && count($report->data['recommendations']) > 0)
            @foreach($report->data['recommendations'] as $recommendation)
            @if(!empty(trim($recommendation)))
            <p>{{ $recommendation }}</p>
            @endif
            @endforeach
            @else
            <p>Continue with similar training activities</p>
            <p>Improve coordination with partner agencies</p>
            @endif
        </div>
    </div>

    @if(isset($report->data['photos']) && !empty($report->data['photos']))
    <div class="section">
        <div class="section-title">VI. ATTACHMENTS</div>
        <div class="photo-section">
            <div class="photo-grid">
                @foreach($report->data['photos'] as $index => $photo)
                <div class="photo-item">
                    @php
                    $photoPath = storage_path('app/public/' . $photo);
                    $photoExists = file_exists($photoPath);
                    $photoBase64 = '';
                    if ($photoExists) {
                    $photoContent = file_get_contents($photoPath);
                    $photoInfo = getimagesizefromstring($photoContent);
                    $mimeType = $photoInfo ? $photoInfo['mime'] : 'image/jpeg';
                    $photoBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($photoContent);
                    }
                    @endphp
                    @if($photoExists)
                    <img src="{{ $photoBase64 }}" alt="Activity Photo {{ $index + 1 }}">
                    @else
                    <div style="border: 1px solid #ccc; padding: 20px; text-align: center; color: #666;">
                        Photo {{ $index + 1 }} not found
                    </div>
                    @endif
                    <div class="photo-caption">Photo {{ $index + 1 }}</div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    @else
    <div class="section">
        <div class="section-title">VI. ATTACHMENTS</div>
        <div class="content">
            <p>1. Activity Photos</p>
        </div>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <p><strong>Prepared by:</strong></p>
            @if(!empty($report->data['preparedBy']))
            <div style="text-align: center; margin: 5px 0; position: relative;">
                @if(!empty($report->data['preparedBySignature']))
                @php
                $preparedSignaturePath = storage_path('app/public/' . $report->data['preparedBySignature']);
                $preparedSignatureExists = file_exists($preparedSignaturePath);
                $preparedSignatureBase64 = '';
                if ($preparedSignatureExists) {
                $preparedSignatureContent = file_get_contents($preparedSignaturePath);
                $preparedSignatureInfo = getimagesizefromstring($preparedSignatureContent);
                $mimeType = $preparedSignatureInfo ? $preparedSignatureInfo['mime'] : 'image/png';
                $preparedSignatureBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($preparedSignatureContent);
                }
                @endphp
                @if($preparedSignatureExists)
                <div style="text-align: center; margin: 15px 0 5px 0; position: relative;">
                    <img src="{{ $preparedSignatureBase64 }}" alt="Prepared By Signature" style="max-width: 120px; height: auto; opacity: 0.8; border-bottom: 1px solid #000;">
                </div>
                @endif
                @endif
                <p style="position: relative; z-index: 2; margin: 0; font-weight: bold;">{{ $report->data['preparedBy'] }}</p>
            </div>
            <p>{{ $report->data['preparedByPosition'] ?? 'Task Force Commander' }}</p>
            @else
            <p>Task Force Commander</p>
            <p>AUX LT MICHAEL G CAPARAS</p>
            @endif
            <div class="signature-line"></div>
        </div>
        <div class="signature-box">
            <p><strong>Approved by:</strong></p>
            <p>{{ $report->data['approvedBy'] ?? 'AUX CAPT GERALD GALZA PCGA' }}</p>
            <p>{{ $report->data['approvedByPosition'] ?? 'Director 107TH Auxiliary Squadron' }}</p>
            <div class="signature-line"></div>
        </div>
    </div>
</body>

</html>