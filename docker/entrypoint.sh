#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Create .env file if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env file..."
    cp /var/www/html/.env.example /var/www/html/.env
    # Force SQLite connection
    sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/g' /var/www/html/.env
    sed -i 's/DB_DATABASE=sip_fas/DB_DATABASE=\/var\/www\/html\/database\/database.sqlite/g' /var/www/html/.env
    
    echo "Generating Application Key..."
    php artisan key:generate --force
fi

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
