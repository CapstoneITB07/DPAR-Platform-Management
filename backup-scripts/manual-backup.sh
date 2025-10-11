#!/bin/bash

##############################################################################
# DPAR Platform Manual Database Backup Script
# 
# Use this script for quick manual backups before major updates
# 
# Usage: ./manual-backup.sh [description]
# Example: ./manual-backup.sh "before_system_update"
##############################################################################

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Get description from argument
DESCRIPTION=${1:-"manual"}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DPAR Platform Manual Backup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd "$BACKEND_DIR" || exit 1

# Create backup with description in filename
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
DATABASE=$(grep DB_DATABASE .env | cut -d '=' -f2)
BACKUP_FILENAME="backup_${DATABASE}_${DESCRIPTION}_${TIMESTAMP}.sql"

echo -e "${YELLOW}Creating backup: ${BACKUP_FILENAME}${NC}"
echo ""

# Get database credentials from .env
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2)
DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)

# Create backup directory if it doesn't exist
mkdir -p storage/app/backups

# Run mysqldump
mysqldump --user="$DB_USERNAME" --password="$DB_PASSWORD" --host="$DB_HOST" --port="$DB_PORT" "$DATABASE" > "storage/app/backups/$BACKUP_FILENAME"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "storage/app/backups/$BACKUP_FILENAME"
    BACKUP_SIZE=$(du -h "storage/app/backups/${BACKUP_FILENAME}.gz" | cut -f1)
    
    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo ""
    echo "Filename: ${BACKUP_FILENAME}.gz"
    echo "Size: $BACKUP_SIZE"
    echo "Location: storage/app/backups/${BACKUP_FILENAME}.gz"
    echo ""
    
    # List all backups
    echo "All available backups:"
    ls -lh storage/app/backups/backup_*.sql.gz | awk '{print $9, "(" $5 ")"}'
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

