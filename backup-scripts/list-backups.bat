@echo off
REM ============================================================================
REM DPAR Platform List Backups Script for Windows
REM 
REM Use this script to view all available backups
REM ============================================================================

echo ========================================
echo DPAR Platform Database Backups
echo ========================================
echo.

REM Navigate to backend directory
cd /d "%~dp0\..\backend"

REM List backups with statistics
php artisan db:backups --stats

echo.
echo Backup directory: %cd%\storage\app\backups
echo.
pause

