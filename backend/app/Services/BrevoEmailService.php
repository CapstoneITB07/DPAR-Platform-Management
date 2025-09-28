<?php

namespace App\Services;

use Brevo\Client\Api\TransactionalEmailsApi;
use Brevo\Client\Configuration;
use Brevo\Client\Model\SendSmtpEmail;
use Brevo\Client\Model\SendSmtpEmailTo;
use Brevo\Client\Model\SendSmtpEmailSender;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class BrevoEmailService
{
    protected $apiInstance;
    protected $fromEmail;
    protected $fromName;

    public function __construct()
    {
        $apiKey = env('BREVO_API_KEY');
        if (!$apiKey) {
            throw new \Exception('BREVO_API_KEY is not set in environment variables');
        }

        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
        $this->apiInstance = new TransactionalEmailsApi(new Client(), $config);
        $this->fromEmail = env('MAIL_FROM_ADDRESS', 'dparvc1@gmail.com');
        $this->fromName = env('MAIL_FROM_NAME', 'DPAR Platform');
    }

    public function sendEmail($toEmail, $subject, $htmlContent, $textContent = null, $attachments = [])
    {
        try {
            $emailData = [
                'sender' => new SendSmtpEmailSender([
                    'name' => $this->fromName,
                    'email' => $this->fromEmail
                ]),
                'to' => [
                    new SendSmtpEmailTo([
                        'email' => $toEmail
                    ])
                ],
                'subject' => $subject,
                'htmlContent' => $htmlContent,
                'textContent' => $textContent
            ];

            // Add attachments if provided
            if (!empty($attachments)) {
                $emailData['attachment'] = $attachments;
            }

            $sendSmtpEmail = new SendSmtpEmail($emailData);

            $result = $this->apiInstance->sendTransacEmail($sendSmtpEmail);

            // Log success
            Log::info('Email sent successfully via Brevo API', [
                'to' => $toEmail,
                'messageId' => $result->getMessageId()
            ]);

            return [
                'success' => true,
                'messageId' => $result->getMessageId()
            ];
        } catch (\Exception $e) {
            // Log error
            Log::error('Failed to send email via Brevo API', [
                'to' => $toEmail,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function sendOtpEmail($toEmail, $otpCode, $purpose = 'Verification')
    {
        $subject = "DPAR Platform - {$purpose} Code";

        $htmlContent = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>DPAR Platform - {$purpose} Code</title>
        </head>
        <body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;'>
            <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;'>
                <div style='text-align: center; margin-bottom: 30px;'>
                    <h1 style='color: #A11C22; margin: 0; font-size: 28px;'>DPAR Platform</h1>
                    <p style='color: #666; margin: 5px 0 0 0; font-size: 16px;'>Disaster Preparedness and Response</p>
                </div>
                
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>
                    <h2 style='color: #333; margin: 0 0 15px 0; font-size: 20px;'>{$purpose} Code</h2>
                    <p style='color: #666; margin: 0 0 20px 0; line-height: 1.5;'>
                        Your {$purpose} code is:
                    </p>
                    <div style='background-color: #A11C22; color: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;'>
                        {$otpCode}
                    </div>
                    <p style='color: #666; margin: 20px 0 0 0; font-size: 14px;'>
                        This code will expire in 10 minutes. Please do not share this code with anyone.
                    </p>
                </div>
                
                <div style='text-align: center; color: #666; font-size: 12px; margin-top: 30px;'>
                    <p>If you did not request this code, please ignore this email.</p>
                    <p>© " . date('Y') . " DPAR Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";

        $textContent = "
DPAR Platform - {$purpose} Code

Your {$purpose} code is: {$otpCode}

This code will expire in 10 minutes. Please do not share this code with anyone.

If you did not request this code, please ignore this email.

© " . date('Y') . " DPAR Platform. All rights reserved.
        ";

        return $this->sendEmail($toEmail, $subject, $htmlContent, $textContent);
    }
}
