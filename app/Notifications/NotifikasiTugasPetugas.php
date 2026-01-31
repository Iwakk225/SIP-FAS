<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NotifikasiTugasPetugas extends Notification
{
    use Queueable;

    public $laporan;
    public $petugas;

    public function __construct($laporan, $petugas)
    {
        $this->laporan = $laporan;
        $this->petugas = $petugas;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('🔔 SIP-FAS: Anda Ditugaskan Menangani Laporan')
            ->line("Halo, {$this->petugas->nama}!")
            ->line('Anda telah ditugaskan untuk menangani laporan berikut:')
            ->line("### Judul: {$this->laporan->judul}")
            ->line("### Lokasi: {$this->laporan->lokasi}")
            ->line("### Tanggal Lapor: " . \Carbon\Carbon::parse($this->laporan->created_at)->format('d M Y H:i'))
            ->line('')
            ->line('Silakan segera proses laporan ini melalui panel admin SIP-FAS.')
            ->action('Buka Panel Admin', url('/admin'))
            ->line('')
            ->line('Email ini dikirim secara otomatis. Mohon jangan membalas email ini.')
            ->line('')
            ->line('Salam,')
            ->line('Tim SIP-FAS');
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}