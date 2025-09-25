<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $organizationName;
    public $otpCode;
    public $directorName;

    /**
     * Create a new message instance.
     */
    public function __construct($organizationName, $otpCode, $directorName)
    {
        $this->organizationName = $organizationName;
        $this->otpCode = $otpCode;
        $this->directorName = $directorName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Organization Application Has Been Approved - DPAR Platform',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.application-approved',
        );
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->view('emails.application-approved')
            ->with([
                'organizationName' => $this->organizationName,
                'otpCode' => $this->otpCode,
                'directorName' => $this->directorName
            ]);
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
