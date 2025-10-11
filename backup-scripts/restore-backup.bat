@echo off
REM ============================================================================
REM DPAR Platform Database Restore Script for Windows
REM 
REM Use this script to restore from a backup
REM 
REM Usage: restore-backup.bat
REM ============================================================================

setlocal enabledelayedexpansion

echo ========================================
echo DPAR Platform Database Restore
echo ========================================
echo.

REM Navigate to backend directory
cd /d "%~dp0\..\backend"

REM List available backups
echo Available backups:
echo.
php artisan db:backups
echo.

REM Prompt for backup filename
set /p BACKUP_FILE="Enter backup filename to restore: "

if "%BACKUP_FILE%"=="" (
    echo [ERROR] No backup file specified!
    pause
    exit /b 1
)

echo.
echo WARNING: This will overwrite the current database!
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring database from: %BACKUP_FILE%
echo.

REM Run restore command
php artisan db:restore %BACKUP_FILE% --force

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Restore failed!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Database restored successfully!
echo.
echo Remember to:
echo - Clear cache: php artisan cache:clear
echo - Restart queue workers if running
echo.
pause

