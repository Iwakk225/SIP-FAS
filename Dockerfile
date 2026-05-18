# Stage 1: Build Frontend (React / Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build Application
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk update && apk add --no-cache \
    nginx \
    zip \
    libzip-dev \
    libpng-dev \
    curl \
    git \
    sqlite \
    sqlite-dev \
    oniguruma-dev \
    libxml2-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite zip gd bcmath mbstring xml

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Copy compiled assets from frontend-builder
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Setup directory permissions for Laravel
RUN mkdir -p /var/www/html/storage/framework/cache/data \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Setup Entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 8080 (Cloud Run default port)
EXPOSE 8080

# Environment variables for Production
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV DB_CONNECTION=sqlite
ENV DB_DATABASE=/var/www/html/database/database.sqlite
ENV LOG_CHANNEL=stderr

# Run entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
