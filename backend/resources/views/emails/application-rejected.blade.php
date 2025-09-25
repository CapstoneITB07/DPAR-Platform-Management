<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Status - DPAR Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }

        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }

        .rejection-box {
            background: #f8d7da;
            border: 2px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .reason-box {
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>📋 Application Status Update</h1>
        <h2>DPAR Platform</h2>
    </div>

    <div class="content">
        <p>Dear {{ $directorName }},</p>

        <p>Thank you for your interest in joining the Disaster Preparedness and Response Volunteer Coalition (DPAR Platform).</p>

        <div class="rejection-box">
            <h3>Application Status: Not Approved</h3>
            <p>We regret to inform you that your application for <strong>{{ $organizationName }}</strong> has not been approved at this time.</p>
        </div>

        <div class="reason-box">
            <h4>Reason for Rejection:</h4>
            <p>{{ $rejectionReason }}</p>
        </div>

        <h3>What's Next?</h3>
        <p>If you believe this decision was made in error or if you have additional information that might change our assessment, you are welcome to:</p>
        <ul>
            <li>Submit a new application with updated information</li>
            <li>Contact our administration team for clarification</li>
            <li>Address any concerns mentioned in the rejection reason above</li>
        </ul>

        <p>We appreciate your understanding and encourage you to reapply in the future if your circumstances change.</p>

        <p>If you have any questions, please don't hesitate to contact our support team.</p>

        <p>Best regards,<br>
            <strong>DPAR Platform Administration Team</strong>
        </p>
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© {{ date('Y') }} Disaster Preparedness and Response Volunteer Coalition</p>
    </div>
</body>

</html>