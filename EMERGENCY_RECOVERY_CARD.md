# 🚨 EMERGENCY RECOVERY QUICK REFERENCE

**Print this page and keep it accessible!**

---

## ⚡ IMMEDIATE ACTIONS - Database Compromised/Hacked

### 1. Take Site Offline (30 seconds)

```bash
cd backend
php artisan down
```

### 2. List Available Backups (10 seconds)

```bash
php artisan db:backups
```

### 3. Restore Clean Backup (2-5 minutes)

```bash
# Use the most recent backup BEFORE the incident
php artisan db:restore backup_dpar_YYYY-MM-DD_HH-MM-SS.sql.gz
```

### 4. Change ALL Credentials (5 minutes)

```bash
# Edit .env file
nano .env

# Change:
# - DB_PASSWORD
# - APP_KEY (run: php artisan key:generate)
# - All API keys
```

### 5. Clear Everything (30 seconds)

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 6. Bring Site Back Online (10 seconds)

```bash
php artisan up
```

---

## 🔧 QUICK BACKUP - Before Any Update

```bash
cd backend
php artisan db:backup --compress
```

**Wait 30 seconds, verify backup created:**

```bash
php artisan db:backups
```

---

## 📞 EMERGENCY CONTACTS

| Role              | Contact    | Phone       | Email                 |
| ----------------- | ---------- | ----------- | --------------------- |
| System Admin      | ****\_**** | ****\_****  | ****\_****            |
| Database Admin    | ****\_**** | ****\_****  | ****\_****            |
| Hostinger Support | Hostinger  | +370 **\_** | support@hostinger.com |
| IT Security       | ****\_**** | ****\_****  | ****\_****            |

---

## 🏥 COMMON DISASTERS & SOLUTIONS

### Scenario A: Accidental Data Deletion (Just Happened)

```bash
# 1. Immediate
php artisan down

# 2. Restore (last backup is probably 1-2 hours old)
php artisan db:restore [latest_backup_filename]

# 3. Resume
php artisan cache:clear && php artisan up
```

**Recovery Time: 5-10 minutes**

---

### Scenario B: Database Corruption

```bash
# 1. Offline
php artisan down

# 2. Backup corrupted state (forensics)
php artisan db:backup --compress
mv storage/app/backups/backup_*.sql.gz storage/app/backups/CORRUPTED_backup.sql.gz

# 3. Restore clean backup
php artisan db:restore [clean_backup_filename]

# 4. Clear & resume
php artisan cache:clear && php artisan config:clear && php artisan up
```

**Recovery Time: 10-15 minutes**

---

### Scenario C: System Hacked

```bash
# 1. IMMEDIATE OFFLINE
php artisan down

# 2. Preserve compromised state
php artisan db:backup --compress
mv storage/app/backups/backup_*.sql.gz storage/app/backups/HACKED_backup.sql.gz

# 3. Restore clean backup (at least 24-48 hours before incident)
php artisan db:backups
php artisan db:restore [clean_backup_filename]

# 4. Change ALL passwords and keys
nano .env
# Update: DB_PASSWORD, APP_KEY, all API keys

php artisan key:generate

# 5. Force all users to reset passwords via database
# (Contact developer for SQL script)

# 6. Clear everything
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
rm -rf storage/framework/sessions/*

# 7. Check for malicious code
find . -type f -mtime -7  # Files modified in last 7 days

# 8. Update everything
composer update
npm update

# 9. Resume with monitoring
php artisan up
tail -f storage/logs/laravel.log
```

**Recovery Time: 1-2 hours + investigation**

---

### Scenario D: Hosting Provider Issues

```bash
# If Hostinger is down or database corrupted:

# 1. Download latest backup from Hostinger File Manager
# - Navigate to: storage/app/backups/
# - Download most recent .sql.gz file

# 2. If moving to new server:
# - Upload Laravel files
# - Import database from backup
# - Update .env with new credentials
# - Run: php artisan migrate (to verify)
# - Test thoroughly before going live
```

**Recovery Time: 2-4 hours**

---

## 📍 CRITICAL FILE LOCATIONS

| File/Directory  | Location                                     | Purpose               |
| --------------- | -------------------------------------------- | --------------------- |
| Backups         | `backend/storage/app/backups/`               | All backup files      |
| Backup Log      | `backend/storage/app/backups/backup_log.txt` | Backup history        |
| Error Logs      | `backend/storage/logs/laravel.log`           | Application errors    |
| Environment     | `backend/.env`                               | Database & app config |
| Database Config | `backend/config/database.php`                | DB settings           |

---

## 🔐 HOSTINGER ACCESS

### Via hPanel

1. Login: https://hpanel.hostinger.com
2. Username: ********\_********
3. Password: (Use password manager)

### Via phpMyAdmin

1. hPanel → Databases → phpMyAdmin
2. Emergency restore: Import → Choose .sql file

### Via File Manager

1. hPanel → Files → File Manager
2. Navigate to: `domains/yourdomain.com/public_html/`

### Via SSH (if enabled)

```bash
ssh username@yourdomain.com
cd domains/yourdomain.com/public_html/backend
```

---

## ✅ POST-RECOVERY CHECKLIST

After any recovery:

- [ ] Database restored successfully
- [ ] Application online and accessible
- [ ] Login functionality works
- [ ] Critical features tested
- [ ] All passwords changed
- [ ] Cache cleared
- [ ] Logs checked for errors
- [ ] Users notified (if necessary)
- [ ] Incident documented
- [ ] Root cause identified
- [ ] Prevention measures implemented

---

## 🧪 MONTHLY TEST

**Do this every month to ensure recovery works:**

```bash
# 1. Create test backup
php artisan db:backup --compress

# 2. Verify it exists
php artisan db:backups

# Expected: See new backup in list

# 3. (OPTIONAL) Test restore on staging/test database
# DO NOT test on production!
```

---

## 📊 BACKUP STATUS CHECK

### Quick Health Check

```bash
php artisan db:backups --stats
```

**Should show:**

- ✅ Multiple backups (at least 7-10)
- ✅ Most recent backup within 24 hours
- ✅ Total size reasonable (growing over time)

### Full System Check

```bash
# Backups exist
ls -lh storage/app/backups/

# Disk space available
df -h

# Cron jobs running (Hostinger)
# Check: hPanel → Advanced → Cron Jobs

# Application healthy
php artisan about
```

---

## ⚠️ PREVENTION - Before You Need Recovery

### Daily (Automated)

- ✅ Automated backup via cron job
- ✅ Backup retention cleanup

### Weekly (Manual)

- ✅ Download backup to local storage
- ✅ Verify backups exist
- ✅ Check backup log for failures

### Before EVERY Update

```bash
# Always run this first!
php artisan db:backup --compress
```

### Monthly

- ✅ Test restoration process
- ✅ Review backup logs
- ✅ Update documentation

---

## 🆘 IF ALL ELSE FAILS

1. **Find any backup** - Even old is better than none

   - Check: Hostinger File Manager
   - Check: Local downloads
   - Check: Email backups (if configured)
   - Check: Team members' local copies

2. **Manual Database Export**

   - phpMyAdmin → Export
   - Save as .sql.gz

3. **Contact Hostinger Support**

   - They may have server-level backups
   - Available 24/7

4. **Hostinger Backup Restore**
   - hPanel → Backups
   - Some plans include daily backups

---

## 💡 GOLDEN RULES

1. **NEVER panic** - You have backups!
2. **ALWAYS test** backups monthly
3. **BACKUP before updates** - Every single time
4. **KEEP multiple copies** - Server + Local + Cloud
5. **DOCUMENT everything** - What happened, what you did
6. **LEARN from incidents** - Update procedures

---

## 📱 KEEP THIS INFORMATION HANDY

- [ ] Print this document
- [ ] Save digital copy offline
- [ ] Share with team members
- [ ] Update contact information
- [ ] Review quarterly

---

**Last Updated:** October 9, 2025  
**Version:** 1.0  
**System:** DPAR Platform Management

**THIS IS A CRITICAL DOCUMENT - KEEP ACCESSIBLE AT ALL TIMES**
