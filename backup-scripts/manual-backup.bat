@echo off
REM ============================================================================
REM DPAR Platform Manual Database Backup Script for Windows
REM 
REM Use this script for quick manual backups before major updates
REM 
REM Usage: manual-backup.bat [description]
REM Example: manual-backup.bat before_system_update
REM ============================================================================

setlocal enabledelayedexpansion

REM Get description from argument or use "manual" as default
if "%~1"=="" (
    set DESCRIPTION=manual
) else (
    set DESCRIPTION=%~1
)

REM Colors (limited in Windows CMD)
echo ========================================
echo DPAR Platform Manual Backup
echo ========================================
echo.

REM Navigate to backend directory
cd /d "%~dp0\..\backend"

echo Creating backup with description: %DESCRIPTION%
echo.

REM Run Laravel backup command
php artisan db:backup --compress

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backup failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Backup created successfully!
echo.

REM List all backups
echo All available backups:
php artisan db:backups

echo.
pause

