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
            ->subject('Kode Verifikasi - SIP-FAS')
            ->line('Anda meminta perubahan informasi akun.')
            ->line('Kode verifikasi Anda adalah:')
            ->line("### {$this->code}")
            ->line('Kode ini berlaku selama 5 menit.')
            ->line('Jika Anda tidak meminta perubahan ini, abaikan email ini.')
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