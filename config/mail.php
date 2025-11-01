<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | Default mailer yang digunakan untuk mengirim email. Kita pakai "smtp"
    | agar bisa mengirim lewat Gmail (atau mail server lain sesuai ENV).
    |
    */

    'default' => env('MAIL_MAILER', 'smtp'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Konfigurasi semua mailer di aplikasi kamu. Kita cukup aktifkan "smtp"
    | karena akan dipakai untuk kirim email (forgot password, dsb).
    |
    */

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env(
                'MAIL_EHLO_DOMAIN',
                parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)
            ),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | Semua email akan dikirim dari alamat dan nama ini secara default.
    | Pastikan sesuai dengan email kamu.
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'youremail@gmail.com'),
        'name' => env('MAIL_FROM_NAME', env('APP_NAME', 'Laravel App')),
    ],

];
