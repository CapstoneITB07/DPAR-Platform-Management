<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>After Operation Report</title>
    <style>
        @page {
            margin: 2.5cm 2cm;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
        }

        .header img {
            max-width: 100px;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: 20px;
            margin: 5px 0;
            color: #2c3e50;
        }

        .header h2 {
            font-size: 16px;
            margin: 5px 0;
            color: #2c3e50;
        }

        .report-header {
            margin-bottom: 30px;
        }

        .report-header table {
            width: 100%;
            border: none;
            margin-bottom: 20px;
        }

        .report-header td {
            padding: 5px 0;
            border: none;
        }

        .report-header .label {
            font-weight: bold;
            width: 80px;
            vertical-align: top;
        }

        .title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .section {
            margin: 25px 0;
            page-break-inside: avoid;
        }

        .section-title {
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 14px;
            color: #2c3e50;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
        }

        .content {
            margin-left: 20px;
            font-size: 12px;
            text-align: justify;
        }

        .personnel-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
        }

        .personnel-table th,
        .personnel-table td {
            padding: 8px;
            text-align: left;
            border: 1px solid #e9ecef;
        }

        .personnel-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }

        .photo-section {
            margin: 20px 0;
            text-align: center;
            page-break-inside: avoid;
        }

        .photo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 15px;
        }

        .photo-item {
            text-align: center;
        }

        .photo-item img {
            max-width: 100%;
            height: auto;
            border: 1px solid #e9ecef;
            padding: 5px;
        }

        .photo-caption {
            font-size: 10px;
            color: #6c757d;
            margin-top: 5px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 10px;
            text-align: center;
            color: #6c757d;
            padding: 10px 0;
            border-top: 1px solid #e9ecef;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body>
    <div class="header">
        <img src="{{ public_path('Assets/disaster_logo.png') }}" alt="PCG Logo">
        <h1>PHILIPPINE COAST GUARD</h1>
        <h2>PHILIPPINE COAST GUARD AUXILIARY</h2>
    </div>

    <div class="title">AFTER OPERATION REPORT</div>

    <div class="report-header">
        <table>
            <tr>
                <td class="label">FOR:</td>
                <td>{{ $report->data['for'] ?? '' }}</td>
                <td style="width: 100px; text-align: right;">Position:</td>
                <td>{{ $report->data['forPosition'] ?? '' }}</td>
            </tr>
            <tr>
                <td class="label">THRU:</td>
                <td>{{ $report->data['thru'] ?? '' }}</td>
                <td style="width: 100px; text-align: right;">Position:</td>
                <td>{{ $report->data['thruPosition'] ?? '' }}</td>
            </tr>
            <tr>
                <td class="label">FROM:</td>
                <td>{{ $report->data['from'] ?? '' }}</td>
                <td style="width: 100px; text-align: right;">Position:</td>
                <td>{{ $report->data['fromPosition'] ?? '' }}</td>
            </tr>
            <tr>
                <td class="label">DATE:</td>
                <td colspan="3">{{ date('d F Y', strtotime($report->data['date'])) }}</td>
            </tr>
            <tr>
                <td class="label">SUBJECT:</td>
                <td colspan="3">{{ $report->data['subject'] ?? $report->title }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">I. AUTHORITY</div>
        <div class="content">
            @if(isset($report->data['authority']) && is_array($report->data['authority']))
            @foreach($report->data['authority'] as $authority)
            <p>{{ $authority }}</p>
            @endforeach
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">II. DATE, TIME, AND PLACE OF ACTIVITY</div>
        <div class="content">
            <p><strong>Date and Time:</strong> {{ $report->data['dateTime'] ?? '' }}</p>
            <p><strong>Type of Activity:</strong> {{ $report->data['activityType'] ?? '' }}</p>
            <p><strong>Location:</strong> {{ $report->data['location'] ?? '' }}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">III. PERSONNEL INVOLVED</div>
        <div class="content">
            @if(isset($report->data['auxiliaryPersonnel']) && !empty($report->data['auxiliaryPersonnel']))
            <p><strong>Auxiliary Personnel:</strong></p>
            <table class="personnel-table">
                <thead>
                    <tr>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($report->data['auxiliaryPersonnel'] as $person)
                    <tr>
                        <td>{{ $person }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @endif

            @if(isset($report->data['pcgPersonnel']) && !empty($report->data['pcgPersonnel']))
            <p><strong>PCG Personnel:</strong></p>
            <table class="personnel-table">
                <thead>
                    <tr>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($report->data['pcgPersonnel'] as $person)
                    <tr>
                        <td>{{ $person }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">IV. NARRATION OF EVENTS</div>
        <div class="content">
            <p><strong>Objective:</strong></p>
            <p>{{ $report->data['objective'] ?? '' }}</p>

            <p><strong>Summary:</strong></p>
            <p>{{ $report->data['summary'] ?? '' }}</p>

            @if(isset($report->data['activities']) && !empty($report->data['activities']))
            <p><strong>Activities:</strong></p>
            @foreach($report->data['activities'] as $activity)
            <p><u>{{ $activity['title'] }}</u></p>
            <p>{{ $activity['description'] }}</p>
            @endforeach
            @endif

            <p><strong>Conclusion:</strong></p>
            <p>{{ $report->data['conclusion'] ?? '' }}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">V. RECOMMENDATIONS</div>
        <div class="content">
            @if(isset($report->data['recommendations']) && is_array($report->data['recommendations']))
            @foreach($report->data['recommendations'] as $recommendation)
            <p>{{ $recommendation }}</p>
            @endforeach
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
                    <img src="{{ public_path(str_replace('/storage/', 'storage/app/public/', $photo)) }}" alt="Operation Photo {{ $index + 1 }}">
                    <div class="photo-caption">Photo {{ $index + 1 }}</div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    @endif

    <div class="footer">
        Generated on {{ date('d F Y') }} | Philippine Coast Guard Auxiliary
    </div>
</body>

</html>