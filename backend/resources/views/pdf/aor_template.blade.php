<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>After Operation Report</title>
    <style>
        @page {
            margin: 1cm 1cm;
            size: legal;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.2;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
        }

        .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            width: 100%;
            gap: 20px;
            padding: 0 20px;
            min-height: 100px;
            position: relative;
        }

        .header-logos img {
            width: 80px !important;
            height: 80px !important;
            flex-shrink: 0;
            object-fit: contain;
            display: block;
            max-width: 80px !important;
            max-height: 80px !important;
            min-width: 80px !important;
            min-height: 80px !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-sizing: border-box !important;
            position: absolute;
            top: 15px;
            transform: translateY(0);
            vertical-align: top !important;
            line-height: 1 !important;
            font-size: 0 !important;
        }

        .header-logos img:first-child {
            left: 20px;
        }

        .header-logos img:last-child {
            right: 20px;
        }

        .header-text {
            text-align: center;
            flex: 1;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            max-width: 60%;
            position: relative;
            z-index: 1;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
        }

        .header-text h1 {
            font-size: 16px;
            margin: 2px 0;
            color: #2c3e50;
            font-weight: bold;
        }

        .header-text h2 {
            font-size: 14px;
            margin: 2px 0;
            color: #2c3e50;
            font-weight: bold;
        }

        .header-text h3 {
            font-size: 12px;
            margin: 2px 0;
            color: #2c3e50;
            font-weight: bold;
        }

        .header-text p {
            font-size: 10px;
            margin: 1px 0;
            color: #6c757d;
        }

        .report-header {
            margin-bottom: 10px;
        }

        .report-header table {
            width: 100%;
            border: none;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .report-header td {
            padding: 3px 0;
            border: none;
            vertical-align: top;
        }

        .report-header .label {
            font-weight: bold;
            width: 60px;
            vertical-align: top;
        }

        .title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .two-column {
            display: flex;
            gap: 12px;
            margin: 12px 0;
        }

        .left-column {
            flex: 1;
        }

        .right-column {
            flex: 1;
        }

        .section {
            margin: 8px 0;
            page-break-inside: avoid;
        }

        .section-title {
            font-weight: bold;
            margin-bottom: 6px;
            font-size: 13px;
            color: #2c3e50;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 2px;
        }

        .content {
            margin-left: 15px;
            font-size: 11px;
            text-align: justify;
        }

        .content p {
            margin: 5px 0;
        }

        .content strong {
            font-weight: bold;
        }

        .personnel-list {
            margin: 8px 0;
        }

        .personnel-list p {
            margin: 3px 0;
            padding-left: 10px;
        }

        .activities-list {
            margin: 8px 0;
        }

        .activity-item {
            margin: 8px 0;
            padding-left: 10px;
        }

        .activity-title {
            font-weight: bold;
            text-decoration: underline;
        }

        .recommendations-list {
            margin: 8px 0;
        }

        .recommendation-item {
            margin: 5px 0;
            padding-left: 10px;
        }

        .photo-section {
            margin: 15px 0;
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
            border: 1px solid #e9ecef;
            padding: 3px;
        }

        .photo-caption {
            font-size: 9px;
            color: #6c757d;
            margin-top: 3px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 9px;
            text-align: center;
            color: #6c757d;
            padding: 8px 0;
            border-top: 1px solid #e9ecef;
        }

        .page-break {
            page-break-before: always;
        }

        .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="header-logos">
            @php
            $pcgLogoPath = public_path('Assets/PCG.png');
            $pcgaLogoPath = public_path('Assets/PCGA 107th.png');
            $pcgExists = file_exists($pcgLogoPath);
            $pcgaExists = file_exists($pcgaLogoPath);

            $pcgBase64 = $pcgExists ? 'data:image/png;base64,' . base64_encode(file_get_contents($pcgLogoPath)) : '';
            $pcgaBase64 = $pcgaExists ? 'data:image/png;base64,' . base64_encode(file_get_contents($pcgaLogoPath)) : '';

            // Debug info
            Log::info('Logo loading debug', [
            'pcg_path' => $pcgLogoPath,
            'pcg_exists' => $pcgExists,
            'pcga_path' => $pcgaLogoPath,
            'pcga_exists' => $pcgaExists,
            'pcg_size' => $pcgExists ? filesize($pcgLogoPath) : 0,
            'pcga_size' => $pcgaExists ? filesize($pcgaLogoPath) : 0,
            'pcg_base64_length' => strlen($pcgBase64),
            'pcga_base64_length' => strlen($pcgaBase64),
            'pcg_dimensions' => $pcgExists ? getimagesize($pcgLogoPath) : null,
            'pcga_dimensions' => $pcgaExists ? getimagesize($pcgaLogoPath) : null,
            'pcg_base64_preview' => substr($pcgBase64, 0, 50),
            'pcga_base64_preview' => substr($pcgaBase64, 0, 50)
            ]);
            @endphp
            @if($pcgExists)
            <img src="{{ $pcgBase64 }}" alt="PCG Logo" class="header-logo">
            @else
            <div style="width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px;">
                PCG Logo not found: {{ $pcgLogoPath }}
            </div>
            @endif
            <div class="header-text">
                <h1>HEADQUARTERS</h1>
                <h2>Philippine Coast Guard</h2>
                <h3>PHILIPPINE COAST GUARD AUXILIARY</h3>
                <h3>107th AUXILIARY SQUADRON, CGAD NCRC-CL</h3>
                <p>Blk 63 Lot 21 Aventine Hills BF Resort Village, Las Pinas City</p>
            </div>
            @if($pcgaExists)
            <img src="{{ $pcgaBase64 }}" alt="PCGA 107th Logo" class="header-logo">
            @else
            <div style="width: 80px; height: 80px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px;">
                PCGA Logo not found: {{ $pcgaLogoPath }}
            </div>
            @endif
        </div>
    </div>

    <div class="report-header">
        <table>
            <tr>
                <td class="label"><strong>FOR:</strong></td>
                <td>{{ $report->data['for'] ?? '' }}</td>
            </tr>
            @if(isset($report->data['forPosition']) && is_array($report->data['forPosition']))
            @foreach($report->data['forPosition'] as $position)
            @if(!empty($position))
            <tr>
                <td></td>
                <td>{{ $position }}</td>
            </tr>
            @endif
            @endforeach
            @else
            <tr>
                <td></td>
                <td>{{ $report->data['forPosition'] ?? 'District Auxiliary Director' }}</td>
            </tr>
            <tr>
                <td></td>
                <td>CGAD NCR-CL</td>
            </tr>
            @endif
            <tr>
                <td class="label"><strong>DATE:</strong></td>
                <td>{{ date('d F Y', strtotime($report->data['date'])) }}</td>
            </tr>
            <tr>
                <td class="label"><strong>SUBJECT:</strong></td>
                <td>{{ $report->data['subject'] ?? $report->title }}</td>
            </tr>
        </table>
    </div>

    <div class="two-column">
        <div class="left-column">
    <div class="section">
                <div class="section-title"><strong>I. AUTHORITY</strong></div>
        <div class="content">
            @if(isset($report->data['authority']) && is_array($report->data['authority']))
                    @foreach($report->data['authority'] as $index => $authority)
                    <p>{{ $index + 1 }}. {{ $authority }}</p>
            @endforeach
            @endif
        </div>
    </div>

    <div class="section">
                <div class="section-title"><strong>II. DATE, TIME, AND PLACE OF ACTIVITY</strong></div>
        <div class="content">
            <p><strong>Date and Time:</strong> {{ $report->data['dateTime'] ?? '' }}</p>
            <p><strong>Type of Activity:</strong> {{ $report->data['activityType'] ?? '' }}</p>
            <p><strong>Location:</strong> {{ $report->data['location'] ?? '' }}</p>
        </div>
    </div>

    <div class="section">
                <div class="section-title"><strong>III. PERSONNEL INVOLVED</strong></div>
        <div class="content">
            @if(isset($report->data['auxiliaryPersonnel']) && !empty($report->data['auxiliaryPersonnel']))
            <p><strong>Auxiliary Personnel:</strong></p>
                    <div class="personnel-list">
                    @foreach($report->data['auxiliaryPersonnel'] as $person)
                        <p>{{ $person }}</p>
                    @endforeach
                    </div>
            @endif

            @if(isset($report->data['pcgPersonnel']) && !empty($report->data['pcgPersonnel']))
            <p><strong>PCG Personnel:</strong></p>
                    <div class="personnel-list">
                    @foreach($report->data['pcgPersonnel'] as $person)
                        <p>{{ $person }}</p>
                    @endforeach
                    </div>
            @endif
        </div>
    </div>

    <div class="section">
                <div class="section-title"><strong>IV. NARRATION OF EVENTS</strong></div>
        <div class="content">
            <p><strong>Objective:</strong></p>
            <p>{{ $report->data['objective'] ?? '' }}</p>

            <p><strong>Summary:</strong></p>
            <p>{{ $report->data['summary'] ?? '' }}</p>

            @if(isset($report->data['activities']) && !empty($report->data['activities']))
            <p><strong>Activities:</strong></p>
                    <div class="activities-list">
            @foreach($report->data['activities'] as $activity)
                        <div class="activity-item">
                            <p class="activity-title">{{ $activity['title'] }}</p>
            <p>{{ $activity['description'] }}</p>
                        </div>
            @endforeach
                    </div>
            @endif

            <p><strong>Conclusion:</strong></p>
            <p>{{ $report->data['conclusion'] ?? '' }}</p>
                </div>
        </div>
    </div>

        <div class="right-column">
    <div class="section">
                <div class="section-title"><strong>V. RECOMMENDATIONS</strong></div>
        <div class="content">
            @if(isset($report->data['recommendations']) && is_array($report->data['recommendations']))
                    <div class="recommendations-list">
            @foreach($report->data['recommendations'] as $recommendation)
                        <div class="recommendation-item">
            <p>{{ $recommendation }}</p>
                        </div>
            @endforeach
                    </div>
            @endif
        </div>
    </div>

    @if(isset($report->data['photos']) && !empty($report->data['photos']))
    <div class="section">
                <div class="section-title"><strong>VI. ATTACHMENTS</strong></div>
        <div class="photo-section">
            <div class="photo-grid">
                @foreach($report->data['photos'] as $index => $photo)
                <div class="photo-item">
                            @php
                            $photoPath = realpath(base_path('storage/app/public/' . $photo));
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
                            <img src="{{ $photoBase64 }}" alt="Operation Photo {{ $index + 1 }}">
                            @else
                            <div style="border: 1px solid #ccc; padding: 20px; text-align: center; color: #666;">
                                Photo {{ $index + 1 }} not found<br>
                                Expected path: {{ $photoPath }}<br>
                                Photo data: {{ $photo }}
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
                <div class="section-title"><strong>VI. ATTACHMENTS</strong></div>
                <div class="content">
                    <p>No photos uploaded for this report.</p>
                </div>
            </div>
            @endif
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <p><strong>Prepared by:</strong></p>
            <p>Task Force Commander</p>
            <p>AUX CAPT GERALD GALZA PCGA</p>
            <div class="signature-line"></div>
        </div>
        <div class="signature-box">
            <p><strong>Approved by:</strong></p>
            @php
            $signaturePath = public_path('Assets/Signature.png');
            $signatureExists = file_exists($signaturePath);
            $signatureBase64 = $signatureExists ? 'data:image/png;base64,' . base64_encode(file_get_contents($signaturePath)) : '';
            @endphp
            @if($signatureExists)
            <div style="text-align: center; margin: 5px 0; position: relative;">
                <p style="position: relative; z-index: 2; margin: 0; font-weight: bold; color: #2c3e50;">AUX CAPT GERALD GALZA PCGA</p>
                <img src="{{ $signatureBase64 }}" alt="Signature" style="max-width: 120px; height: auto; opacity: 0.4; position: absolute; top: -25px; left: 50%; transform: translateX(-50%); z-index: 1;">
            </div>
            @else
            <p>AUX CAPT GERALD GALZA PCGA</p>
    @endif
            <p>Director 107TH Auxiliary Squadron</p>
            <div class="signature-line"></div>
        </div>
    </div>

    <div class="footer">
        Generated on {{ date('d F Y') }} | Philippine Coast Guard Auxiliary
    </div>
</body>

</html>