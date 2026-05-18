#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Create SQLite database file if it doesn't exist
if [ ! -f /var/www/html/database/database.sqlite ]; then
    echo "Creating SQLite database..."
    touch /var/www/html/database/database.sqlite
    chown -R www-data:www-data /var/www/html/database
fi

# Run migrations (force since it's production)
echo "Running migrations..."
php artisan migrate --force --seed

# Cache configurations for speed
echo "Caching Laravel config, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start PHP-FPM in background
echo "Starting PHP-FPM..."
php-fpm -D

# Start Nginx in foreground
echo "Starting Nginx..."
nginx -g "daemon off;"
