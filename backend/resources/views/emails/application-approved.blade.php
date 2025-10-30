<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Approved - DPAR Platform</title>
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
            background: linear-gradient(135deg, #c0392b, #a93226);
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

        .otp-box {
            background: white;
            border: 2px solid #c0392b;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }

        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #c0392b;
            letter-spacing: 5px;
            margin: 10px 0;
        }

        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
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
        <h1>🎉 Congratulations!</h1>
        <h2>Your Application Has Been Approved</h2>
    </div>

    <div class="content">
        <p>Dear {{ $directorName }},</p>

        <p>We are pleased to inform you that your organization <strong>{{ $organizationName }}</strong> has been approved to join the Disaster Preparedness and Response Volunteer Coalition (DPAR Platform).</p>

        <p>To complete your registration and access the platform, you will need to verify your account using the One-Time Password (OTP) provided below:</p>

        <div class="otp-box">
            <h3>Your Authentication Code</h3>
            <div class="otp-code">{{ $otpCode }}</div>
            <p><strong>This code will expire in 24 hours.</strong></p>
        </div>

        <div class="warning">
            <strong>Important:</strong> This OTP can only be used once. After successful verification, you will be able to log in to the platform using your username and password.
        </div>



        <h3>Next Steps:</h3>
        <ol>
            <li>Go to the DPAR Platform login page</li>
            <li>Enter your username and password</li>
            <li>When prompted, enter the OTP code above</li>
            <li>Complete your first login and start using the platform</li>
        </ol>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

        <p>Welcome to the DPAR Platform!</p>

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