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

    public function sendEmail($toEmail, $subject, $htmlContent, $textContent = null)
    {
        try {
            $sendSmtpEmail = new SendSmtpEmail([
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
            ]);

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
}
