# DPAR Platform Database Backup Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing and managing database backups for the DPAR Platform Management System deployed on Hostinger.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Backup Strategy](#backup-strategy)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Hostinger-Specific Setup](#hostinger-specific-setup)
6. [Disaster Recovery](#disaster-recovery)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Create Your First Backup

```bash
# Navigate to backend directory
cd backend

# Create a backup
php artisan db:backup --compress

# List all backups
php artisan db:backups --stats
```

---

## Backup Strategy

### 3-2-1 Rule Implementation

Your backup strategy follows the industry-standard **3-2-1 rule**:

- **3 copies** of data:

  - Production database (live)
  - Daily automated backups (Hostinger server)
  - Weekly manual downloads (local/cloud storage)

- **2 different media**:

  - Hostinger server storage
  - External storage (Google Drive, Dropbox, local drive)

- **1 copy offsite**:
  - Cloud storage or remote server

### Backup Schedule

| Frequency      | Retention | Method           | Purpose              |
| -------------- | --------- | ---------------- | -------------------- |
| Daily          | 30 days   | Automated (cron) | Regular protection   |
| Weekly         | 90 days   | Manual download  | Long-term archive    |
| Pre-deployment | Permanent | Manual           | Before major changes |
| Monthly        | 1 year    | Manual archive   | Compliance/audit     |

---

## Installation

### Step 1: Register Laravel Commands

The backup commands have been created. Now you need to ensure Laravel recognizes them.

**File: `backend/app/Console/Kernel.php`**

Add to the `$commands` array if it exists, or the commands will be auto-discovered in Laravel 11+.

### Step 2: Create Backup Directory

```bash
cd backend
mkdir -p storage/app/backups
chmod 755 storage/app/backups
```

### Step 3: Configure .gitignore

Add to `backend/.gitignore`:

```
# Backup files
storage/app/backups/*.sql
storage/app/backups/*.sql.gz
storage/app/backups/backup_log.txt
```

### Step 4: Make Scripts Executable

```bash
chmod +x backup-scripts/automated-backup.sh
chmod +x backup-scripts/manual-backup.sh
```

---

## Usage

### Manual Backups

#### Basic Backup

```bash
php artisan db:backup
```

#### Compressed Backup (Recommended)

```bash
php artisan db:backup --compress
```

#### Custom Retention Period

```bash
php artisan db:backup --compress --keep-days=60
```

### List Backups

```bash
# Simple list
php artisan db:backups

# With statistics
php artisan db:backups --stats
```

### Restore from Backup

```bash
# List available backups first
php artisan db:backups

# Restore (will prompt for confirmation)
php artisan db:restore backup_dpar_2025-10-09_14-30-00.sql.gz

# Force restore without confirmation (use with caution)
php artisan db:restore backup_dpar_2025-10-09_14-30-00.sql.gz --force
```

### Using Shell Scripts

#### Automated Backup (with remote upload)

```bash
./backup-scripts/automated-backup.sh
```

#### Manual Backup with Description

```bash
./backup-scripts/manual-backup.sh "before_update_v2.0"
```

---

## Hostinger-Specific Setup

### Setting Up Cron Jobs on Hostinger

1. **Log in to Hostinger hPanel**

   - Navigate to your hosting control panel

2. **Access Cron Jobs**

   - Go to: **Advanced** → **Cron Jobs**

3. **Add Daily Backup Cron Job**

   - **Schedule**: Daily at 2:00 AM
   - **Command**:
     ```bash
     cd /home/YOUR_USERNAME/domains/YOUR_DOMAIN.com/public_html/backend && /usr/bin/php artisan db:backup --compress --keep-days=30
     ```
   - **Cron Expression**: `0 2 * * *`
   - **Email notifications**: Enable (to get notified of failures)

4. **Add Weekly Full Backup (Optional)**

   - **Schedule**: Every Sunday at 3:00 AM
   - **Command**:
     ```bash
     cd /home/YOUR_USERNAME/domains/YOUR_DOMAIN.com/public_html/backend && /usr/bin/php artisan db:backup --compress --keep-days=90
     ```
   - **Cron Expression**: `0 3 * * 0`

### Accessing Backups on Hostinger

#### Method 1: File Manager

1. Log in to hPanel
2. Go to **Files** → **File Manager**
3. Navigate to: `domains/YOUR_DOMAIN.com/public_html/backend/storage/app/backups/`
4. Download backup files

#### Method 2: SSH (if available)

```bash
ssh username@yourdomain.com
cd domains/yourdomain.com/public_html/backend/storage/app/backups
ls -lh
# Download using scp from your local machine
scp username@yourdomain.com:~/domains/yourdomain.com/public_html/backend/storage/app/backups/backup_*.sql.gz ./local-backups/
```

#### Method 3: FTP/SFTP

1. Use FileZilla or similar FTP client
2. Connect to your Hostinger account
3. Navigate to the backups directory
4. Download files

### phpMyAdmin Backups (Alternative)

1. Log in to Hostinger hPanel
2. Go to **Databases** → **phpMyAdmin**
3. Select your database
4. Click **Export**
5. Choose options:
   - **Export method**: Custom
   - **Format**: SQL
   - **Compression**: gzipped
6. Click **Go**

---

## Disaster Recovery

### Scenario 1: Database Corruption

```bash
# Step 1: Stop application access (maintenance mode)
php artisan down

# Step 2: List available backups
php artisan db:backups

# Step 3: Restore from most recent clean backup
php artisan db:restore backup_dpar_2025-10-09_02-00-00.sql.gz

# Step 4: Clear cache
php artisan cache:clear
php artisan config:clear

# Step 5: Verify data integrity
php artisan migrate:status

# Step 6: Bring application back online
php artisan up
```

### Scenario 2: Hacked/Compromised System

```bash
# CRITICAL: Follow this order exactly

# 1. IMMEDIATELY take site offline
php artisan down

# 2. Create backup of compromised state (for forensics)
php artisan db:backup --compress
mv storage/app/backups/backup_*.sql.gz storage/app/backups/COMPROMISED_backup_$(date +%Y%m%d).sql.gz

# 3. Identify last known clean backup
php artisan db:backups

# 4. Restore clean backup
php artisan db:restore [clean_backup_filename]

# 5. Change ALL credentials
# - Database passwords
# - Application keys
# - API keys
# - User passwords (force password reset)

# 6. Update .env file
nano .env
# Change: DB_PASSWORD, APP_KEY, etc.

# 7. Clear all caches and sessions
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
rm -rf storage/framework/sessions/*

# 8. Investigate breach
# - Check logs: storage/logs/
# - Review Activity Logs table
# - Check file modifications: find . -type f -mtime -7

# 9. Update all dependencies
composer update
npm update

# 10. Security hardening
# - Update Laravel
# - Review file permissions
# - Enable 2FA for all admin accounts

# 11. Bring site back online
php artisan up

# 12. Monitor closely for next 48 hours
tail -f storage/logs/laravel.log
```

### Scenario 3: Accidental Data Deletion

```bash
# If deletion just happened (minutes ago)

# 1. Immediately stop all operations
php artisan down

# 2. Restore from most recent backup
php artisan db:restore [latest_backup]

# 3. If data between backup and deletion is critical:
#    - Review activity_logs table for changes
#    - Manually re-enter critical data

# 4. Resume operations
php artisan up
```

### Recovery Time Objectives (RTO)

| Scenario               | Target Recovery Time |
| ---------------------- | -------------------- |
| Database corruption    | 15-30 minutes        |
| Accidental deletion    | 15 minutes           |
| Full system compromise | 1-2 hours            |
| Hardware failure       | 2-4 hours            |

---

## Offsite Backup Configuration

### Option 1: Google Drive (using rclone)

```bash
# Install rclone (if available on Hostinger)
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive
rclone config

# Modify automated-backup.sh to upload
# Uncomment the Google Drive section
```

### Option 2: Dropbox

```bash
# Configure Dropbox with rclone
rclone config

# Update automated-backup.sh
```

### Option 3: Email Backups (Small databases only)

For databases under 10MB:

```bash
# Add to cron job
php artisan db:backup --compress && \
gzip -cd storage/app/backups/backup_*.sql.gz | \
mail -s "DPAR Backup $(date)" -a storage/app/backups/backup_*.sql.gz admin@yourdomain.com
```

### Option 4: Manual Download to Local Storage

**Weekly routine**:

1. Access Hostinger File Manager
2. Download latest backups
3. Store on external hard drive
4. Keep for 6-12 months

---

## Security Considerations

### Protecting Backup Files

1. **Encryption** (for highly sensitive data):

   ```bash
   # Encrypt backup
   gpg -c storage/app/backups/backup_file.sql.gz

   # Decrypt when needed
   gpg backup_file.sql.gz.gpg
   ```

2. **File Permissions**:

   ```bash
   chmod 600 storage/app/backups/*.sql.gz
   ```

3. **Access Control**:
   - Limit SSH/FTP access
   - Use strong passwords
   - Enable 2FA on Hostinger account

### What NOT to Store in Backups

- API keys (use environment variables)
- Third-party credentials
- Temporary/session data

---

## Monitoring and Alerts

### Check Backup Health

Create a monitoring script:

```bash
# File: check-backup-health.sh
#!/bin/bash

BACKUP_DIR="/home/username/domains/domain.com/public_html/backend/storage/app/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql.gz 2>/dev/null | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "ERROR: No backups found!" | mail -s "Backup Alert" admin@domain.com
    exit 1
fi

# Check if backup is recent (within 25 hours)
BACKUP_AGE=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP")) / 3600 ))

if [ $BACKUP_AGE -gt 25 ]; then
    echo "WARNING: Latest backup is $BACKUP_AGE hours old" | mail -s "Backup Alert" admin@domain.com
fi
```

---

## Troubleshooting

### Common Issues

#### Issue: "mysqldump: command not found"

**Solution**: Specify full path in Hostinger

```bash
/usr/bin/mysqldump --user=...
```

#### Issue: "Permission denied"

**Solution**:

```bash
chmod 755 storage/app/backups
chown www-data:www-data storage/app/backups
```

#### Issue: Backup file is 0 bytes

**Solution**: Check database credentials in `.env`

```bash
grep DB_ .env
php artisan config:clear
```

#### Issue: Restore fails with "Access denied"

**Solution**: Verify database user has IMPORT privileges

#### Issue: Out of disk space

**Solution**:

```bash
# Clean old backups manually
php artisan db:backup --keep-days=7

# Or delete old files
find storage/app/backups -name "backup_*.sql.gz" -mtime +30 -delete
```

### Getting Help

1. Check Laravel logs: `storage/logs/laravel.log`
2. Check backup log: `storage/app/backups/backup_log.txt`
3. Test database connection: `php artisan tinker` then `DB::connection()->getPdo()`

---

## Testing Your Backup System

### Monthly Backup Test Procedure

```bash
# 1. Create test backup
php artisan db:backup --compress

# 2. Create test database
mysql -u root -p -e "CREATE DATABASE dpar_test;"

# 3. Modify artisan restore command to use test database (temporarily)
# Or restore to test database manually:

DB_NAME="dpar_test"
BACKUP_FILE="storage/app/backups/backup_dpar_2025-10-09_02-00-00.sql.gz"

gunzip -c $BACKUP_FILE | mysql -u username -p $DB_NAME

# 4. Verify data in test database
mysql -u username -p dpar_test -e "SHOW TABLES; SELECT COUNT(*) FROM users;"

# 5. Drop test database
mysql -u root -p -e "DROP DATABASE dpar_test;"
```

---

## Compliance and Documentation

### Backup Log Review

Monthly review checklist:

- [ ] All scheduled backups completed successfully
- [ ] Backup files are not corrupted
- [ ] Offsite copies are up to date
- [ ] Restoration procedure tested
- [ ] Team members trained on recovery process
- [ ] Documentation updated with any changes

### Audit Trail

All backups are logged in:

- `storage/app/backups/backup_log.txt`
- Hostinger cron job email notifications
- Application activity logs

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly**:

- Verify latest backup exists
- Download backup to local storage

**Monthly**:

- Test backup restoration
- Review backup logs
- Clean old backups if needed

**Quarterly**:

- Update backup procedures
- Train team on recovery process
- Review and update documentation

---

## Emergency Contacts

**System Administrator**: [Your Name/Contact]  
**Hosting Provider**: Hostinger Support  
**Database Admin**: [DB Admin Contact]  
**IT Security**: [Security Contact]

---

## Appendix

### Useful Commands Reference

```bash
# Backup
php artisan db:backup
php artisan db:backup --compress
php artisan db:backup --compress --keep-days=60

# List
php artisan db:backups
php artisan db:backups --stats

# Restore
php artisan db:restore filename.sql.gz
php artisan db:restore filename.sql.gz --force

# Maintenance
php artisan down
php artisan up
php artisan cache:clear
php artisan config:clear
```

### File Locations

```
backend/
├── app/Console/Commands/
│   ├── DatabaseBackup.php      # Backup command
│   ├── DatabaseRestore.php     # Restore command
│   └── ListBackups.php         # List command
├── storage/app/backups/        # Backup storage
│   ├── backup_*.sql.gz         # Compressed backups
│   └── backup_log.txt          # Backup log
└── .env                        # Database credentials

backup-scripts/
├── automated-backup.sh         # Automated backup script
├── manual-backup.sh           # Manual backup script
└── hostinger-cron-setup.txt   # Cron job instructions
```

---

**Document Version**: 1.0  
**Last Updated**: October 9, 2025  
**Author**: DPAR Platform Development Team
