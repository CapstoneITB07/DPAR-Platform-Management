# DPAR Platform - Database Backup System

## Quick Overview

This system now includes a comprehensive database backup solution designed specifically for disaster recovery scenarios (hacks, data corruption, hardware failures, etc.).

## 🚀 Quick Start

### Create a Backup

```bash
cd backend
php artisan db:backup --compress
```

### List Backups

```bash
php artisan db:backups --stats
```

### Restore from Backup

```bash
php artisan db:restore backup_filename.sql.gz
```

## 📁 What's Been Added

### Laravel Artisan Commands

1. **`DatabaseBackup.php`** - Create database backups
   - Location: `backend/app/Console/Commands/DatabaseBackup.php`
   - Features: Compression, automatic cleanup, logging
2. **`DatabaseRestore.php`** - Restore from backups

   - Location: `backend/app/Console/Commands/DatabaseRestore.php`
   - Features: Safety confirmations, decompression, verification

3. **`ListBackups.php`** - View all backups
   - Location: `backend/app/Console/Commands/ListBackups.php`
   - Features: Statistics, file sizes, dates

### Shell Scripts (Optional)

1. **`automated-backup.sh`** - For scheduled backups

   - Location: `backup-scripts/automated-backup.sh`
   - Use with: Cron jobs, scheduled tasks

2. **`manual-backup.sh`** - For quick manual backups
   - Location: `backup-scripts/manual-backup.sh`
   - Usage: `./manual-backup.sh "description"`

### Documentation

1. **`BACKUP_IMPLEMENTATION_GUIDE.md`** - Complete implementation guide

   - Detailed instructions for all backup operations
   - Disaster recovery procedures
   - Best practices

2. **`HOSTINGER_DEPLOYMENT_TROUBLESHOOTING.md`** - Login issues guide

   - Solves your Hostinger login problems
   - Complete deployment checklist
   - Common issues and solutions

3. **`backup-scripts/hostinger-cron-setup.txt`** - Cron job setup
   - Instructions for automated backups on Hostinger
   - Multiple backup strategies
   - Monitoring and alerts

## 🔧 For Your Hostinger Deployment

### Setting Up Automated Backups

1. **Login to Hostinger hPanel**

2. **Go to Advanced → Cron Jobs**

3. **Add Daily Backup:**

   ```
   Schedule: 0 2 * * *
   Command: cd /home/YOUR_USERNAME/domains/YOUR_DOMAIN/public_html/backend && /usr/bin/php artisan db:backup --compress --keep-days=30
   ```

4. **Enable email notifications** to get alerts if backups fail

### Quick Manual Backup (Before Updates)

```bash
# SSH into Hostinger
cd domains/YOUR_DOMAIN/public_html/backend
php artisan db:backup --compress
```

## 🆘 Emergency Recovery

### If Your Database Gets Hacked or Corrupted

```bash
# 1. Put site in maintenance mode
php artisan down

# 2. List available backups
php artisan db:backups

# 3. Restore from clean backup
php artisan db:restore backup_dpar_2025-10-09_02-00-00.sql.gz

# 4. Clear caches
php artisan cache:clear
php artisan config:clear

# 5. Bring site back online
php artisan up
```

**Complete disaster recovery procedures are in `BACKUP_IMPLEMENTATION_GUIDE.md`**

## 📊 Backup Strategy (3-2-1 Rule)

- **3 copies**: Production DB + Daily backups + Weekly downloads
- **2 media**: Hostinger server + External storage (Google Drive/Dropbox)
- **1 offsite**: Cloud storage or local backup

### Retention Policy

| Type            | Frequency | Retention | Purpose            |
| --------------- | --------- | --------- | ------------------ |
| Automated       | Daily     | 30 days   | Regular protection |
| Weekly download | Weekly    | 90 days   | Long-term archive  |
| Pre-deployment  | Manual    | Permanent | Before changes     |
| Monthly         | Monthly   | 1 year    | Compliance         |

## 🔐 Security Features

- ✅ Automatic cleanup of old backups
- ✅ Compressed storage (saves space)
- ✅ Detailed logging
- ✅ Backup verification
- ✅ Safe restoration with confirmations
- ✅ File permissions protection

## 📍 Backup Locations

**On Hostinger:**

- Directory: `backend/storage/app/backups/`
- Access: Via File Manager or SSH
- Format: `backup_databasename_YYYY-MM-DD_HH-MM-SS.sql.gz`

**Backup Log:**

- Location: `backend/storage/app/backups/backup_log.txt`
- Contains: Timestamps, file sizes, backup history

## 🔍 Monitoring Your Backups

### Check Backup Health

```bash
php artisan db:backups --stats
```

### View Backup Log

```bash
cat storage/app/backups/backup_log.txt
```

### Check Disk Space

```bash
du -sh storage/app/backups/
```

## ❗ Hostinger Login Issues

If you can't login after deploying to Hostinger, check **`HOSTINGER_DEPLOYMENT_TROUBLESHOOTING.md`** for solutions to:

- CORS configuration issues
- Environment variables (.env) problems
- Sanctum/session authentication
- Database connection errors
- File permissions
- And more...

## 📚 Full Documentation

For complete details, see:

- **`BACKUP_IMPLEMENTATION_GUIDE.md`** - Complete backup system guide
- **`HOSTINGER_DEPLOYMENT_TROUBLESHOOTING.md`** - Deployment issues
- **`backup-scripts/hostinger-cron-setup.txt`** - Cron job instructions

## 🧪 Testing Your Backup System

```bash
# 1. Create test backup
php artisan db:backup --compress

# 2. Verify it exists
php artisan db:backups

# 3. Test restoration (use staging environment!)
php artisan db:restore [backup-filename]
```

## ⚠️ Important Notes

1. **Never delete backup files manually** - Use the automated cleanup
2. **Test restoration regularly** - At least monthly
3. **Download backups locally** - Weekly recommended
4. **Keep pre-deployment backups** - Before any major update
5. **Monitor backup logs** - Check for failures

## 🛠️ Troubleshooting

### "mysqldump: command not found"

Use full path: `/usr/bin/mysqldump`

### "Permission denied"

```bash
chmod 755 storage/app/backups
```

### Backup file is empty (0 bytes)

Check database credentials in `.env`

### Out of disk space

Reduce retention period:

```bash
php artisan db:backup --keep-days=7
```

## 📞 Support

For backup-related issues:

1. Check `storage/logs/laravel.log`
2. Check `storage/app/backups/backup_log.txt`
3. Review `BACKUP_IMPLEMENTATION_GUIDE.md`

For deployment issues:

1. Review `HOSTINGER_DEPLOYMENT_TROUBLESHOOTING.md`
2. Check Hostinger error logs
3. Contact Hostinger support

## 🎯 Best Practices

✅ **DO:**

- Run backups daily (automated via cron)
- Download backups weekly to local storage
- Create manual backup before any update
- Test restoration process monthly
- Keep backups in multiple locations
- Monitor backup logs regularly

❌ **DON'T:**

- Don't rely on a single backup
- Don't skip testing restorations
- Don't ignore backup failures
- Don't store backups only on the same server
- Don't share backup files publicly

## 🔄 Maintenance Schedule

**Daily:**

- Automated backup runs (via cron)

**Weekly:**

- Download latest backup to local storage
- Verify backup files exist

**Monthly:**

- Test backup restoration
- Review backup logs
- Archive important backups

**Quarterly:**

- Update backup procedures
- Train team on recovery
- Review documentation

---

## Next Steps

1. ✅ Read `BACKUP_IMPLEMENTATION_GUIDE.md`
2. ✅ Set up cron job on Hostinger (see `backup-scripts/hostinger-cron-setup.txt`)
3. ✅ Create your first backup: `php artisan db:backup --compress`
4. ✅ Test restoration in staging/test environment
5. ✅ Download backup to local storage
6. ✅ If you have login issues, check `HOSTINGER_DEPLOYMENT_TROUBLESHOOTING.md`

---

**System Status:** ✅ Backup System Ready  
**Last Updated:** October 9, 2025  
**Version:** 1.0
