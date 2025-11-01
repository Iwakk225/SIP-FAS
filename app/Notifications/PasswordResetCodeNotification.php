<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCodeNotification extends Notification
{
    use Queueable;

    public $code;

    public function __construct($code)
    {
        $this->code = $code;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode Reset Password - SIP-FAS')
            ->greeting('Halo, ' . $notifiable->name . '!')
            ->line('Kode verifikasi Anda adalah: **' . $this->code . '**')
            ->line('Kode ini berlaku selama 5 menit.')
            ->line('Jika Anda tidak meminta ini, abaikan email ini.')
            ->line('')
            ->line('Salam,')
            ->line('Tim SIP-FAS');
    }

    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}