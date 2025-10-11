#!/bin/bash

##############################################################################
# DPAR Platform Database Backup Script for Hostinger
# 
# This script creates automated backups and uploads them to remote storage
# 
# Usage: ./automated-backup.sh
##############################################################################

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$BACKEND_DIR/storage/app/backups"
REMOTE_BACKUP_DIR="/path/to/remote/backup" # Update this for your Hostinger setup

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Navigate to backend directory
cd "$BACKEND_DIR" || exit 1

log "Starting automated backup process..."

# Run Laravel backup command with compression
php artisan db:backup --compress --keep-days=30

if [ $? -eq 0 ]; then
    log "Database backup completed successfully"
else
    error "Database backup failed!"
    exit 1
fi

# Get the latest backup file
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    error "No backup file found!"
    exit 1
fi

log "Latest backup: $(basename "$LATEST_BACKUP")"

# Optional: Upload to remote storage (configure based on your setup)
# Uncomment and configure one of the following methods:

# Method 1: Upload to Google Drive (requires rclone)
# if command -v rclone &> /dev/null; then
#     log "Uploading to Google Drive..."
#     rclone copy "$LATEST_BACKUP" "gdrive:DPAR-Backups/"
# fi

# Method 2: Upload to Dropbox (requires rclone)
# if command -v rclone &> /dev/null; then
#     log "Uploading to Dropbox..."
#     rclone copy "$LATEST_BACKUP" "dropbox:DPAR-Backups/"
# fi

# Method 3: Upload via SFTP to another server
# if command -v scp &> /dev/null; then
#     log "Uploading to remote server..."
#     scp "$LATEST_BACKUP" user@remote-server:/path/to/backups/
# fi

# Method 4: Email backup (for small databases only)
# BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP" 2>/dev/null)
# MAX_EMAIL_SIZE=$((10 * 1024 * 1024)) # 10MB limit
# if [ $BACKUP_SIZE -lt $MAX_EMAIL_SIZE ]; then
#     log "Emailing backup..."
#     echo "Database backup attached" | mail -s "DPAR Database Backup $(date +'%Y-%m-%d')" -a "$LATEST_BACKUP" your-email@example.com
# fi

log "Backup process completed!"

# Display backup statistics
php artisan db:backups --stats

exit 0

