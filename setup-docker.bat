@echo off
echo 🚀 Setting up DPAR Platform with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker is installed!

REM Create necessary directories
echo 📁 Creating directories...
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "backend\database\init" mkdir backend\database\init

REM Copy environment file if it doesn't exist
echo ⚙️ Setting up environment...
if not exist "backend\.env" (
    echo Creating backend\.env file for Docker...
    echo APP_NAME="DPAR Platform" > backend\.env
    echo APP_ENV=local >> backend\.env
    echo APP_KEY= >> backend\.env
    echo APP_DEBUG=true >> backend\.env
    echo APP_URL=http://localhost:8000 >> backend\.env
    echo. >> backend\.env
    echo APP_LOCALE=en >> backend\.env
    echo APP_FALLBACK_LOCALE=en >> backend\.env
    echo APP_FAKER_LOCALE=en_US >> backend\.env
    echo. >> backend\.env
    echo APP_MAINTENANCE_DRIVER=file >> backend\.env
    echo PHP_CLI_SERVER_WORKERS=4 >> backend\.env
    echo BCRYPT_ROUNDS=12 >> backend\.env
    echo. >> backend\.env
    echo LOG_CHANNEL=stack >> backend\.env
    echo LOG_STACK=single >> backend\.env
    echo LOG_DEPRECATIONS_CHANNEL=null >> backend\.env
    echo LOG_LEVEL=debug >> backend\.env
    echo. >> backend\.env
    echo DB_CONNECTION=mysql >> backend\.env
    echo DB_HOST=mysql >> backend\.env
    echo DB_PORT=3306 >> backend\.env
    echo DB_DATABASE=dpar_platform >> backend\.env
    echo DB_USERNAME=dpar_user >> backend\.env
    echo DB_PASSWORD=dpar_password >> backend\.env
    echo. >> backend\.env
    echo SESSION_DRIVER=redis >> backend\.env
    echo SESSION_LIFETIME=120 >> backend\.env
    echo SESSION_ENCRYPT=false >> backend\.env
    echo SESSION_PATH=/ >> backend\.env
    echo SESSION_DOMAIN=null >> backend\.env
    echo. >> backend\.env
    echo BROADCAST_CONNECTION=log >> backend\.env
    echo FILESYSTEM_DISK=local >> backend\.env
    echo QUEUE_CONNECTION=redis >> backend\.env
    echo. >> backend\.env
    echo CACHE_STORE=redis >> backend\.env
    echo. >> backend\.env
    echo MEMCACHED_HOST=127.0.0.1 >> backend\.env
    echo. >> backend\.env
    echo REDIS_CLIENT=phpredis >> backend\.env
    echo REDIS_HOST=redis >> backend\.env
    echo REDIS_PASSWORD=null >> backend\.env
    echo REDIS_PORT=6379 >> backend\.env
    echo. >> backend\.env
    echo MAIL_MAILER=log >> backend\.env
    echo MAIL_FROM_ADDRESS=dparvc1@gmail.com >> backend\.env
    echo MAIL_FROM_NAME="DPAR Platform" >> backend\.env
    echo. >> backend\.env
    echo AWS_ACCESS_KEY_ID= >> backend\.env
    echo AWS_SECRET_ACCESS_KEY= >> backend\.env
    echo AWS_DEFAULT_REGION=us-east-1 >> backend\.env
    echo AWS_BUCKET= >> backend\.env
    echo AWS_USE_PATH_STYLE_ENDPOINT=false >> backend\.env
    echo. >> backend\.env
    echo VITE_APP_NAME="${APP_NAME}" >> backend\.env
    echo 📝 Created backend\.env file for Docker
    echo ⚠️  This is configured for Docker containers
) else (
    echo ✅ backend\.env already exists
    echo ⚠️  Make sure your backend\.env is configured for Docker:
    echo    - DB_HOST=mysql
    echo    - REDIS_HOST=redis
    echo    - APP_URL=http://localhost:8000
)

REM Build and start containers
echo 🏗️ Building and starting containers...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Run Laravel setup commands
echo 🔧 Setting up Laravel...
docker-compose exec backend php artisan key:generate --no-interaction
docker-compose exec backend php artisan migrate --force
docker-compose exec backend php artisan db:seed --force

REM Set permissions
echo 🔐 Setting permissions...
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chown -R www-data:www-data /var/www/html/bootstrap/cache
docker-compose exec backend chmod -R 755 /var/www/html/storage
docker-compose exec backend chmod -R 755 /var/www/html/bootstrap/cache

REM Clear caches
echo 🧹 Clearing caches...
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan route:clear
docker-compose exec backend php artisan view:clear

REM Show status
echo 📊 Container status:
docker-compose ps

echo.
echo ✅ DPAR Platform is now running!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 🗄️ Database: localhost:3306
echo.
echo 📋 Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo.
pause
