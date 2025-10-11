# Database Backup System - Visual Workflow

## 🔄 Automated Backup Flow (Daily)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTOMATED DAILY BACKUP                          │
└─────────────────────────────────────────────────────────────────────────┘

        2:00 AM (Hostinger Cron Job)
                    │
                    ▼
        ┌───────────────────────┐
        │  Cron Job Triggers    │
        │  php artisan db:backup│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Connect to Database   │
        │ (MySQL via mysqldump) │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Create .sql file     │
        │  backup_db_TIMESTAMP  │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Compress to .gz      │
        │  (Saves 60-80% space) │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Save to storage/app/  │
        │       backups/        │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Log to backup_log.txt│
        │  (timestamp, size)    │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Delete old backups    │
        │ (older than 30 days)  │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Send email result    │
        │  (success or failure) │
        └───────────────────────┘
```

---

## 📥 Manual Backup Flow (Before Updates)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MANUAL BACKUP WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

    Developer decides to update system
                    │
                    ▼
        ┌───────────────────────┐
        │ Run command:          │
        │ php artisan db:backup │
        │       --compress      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Backup created with  │
        │  current timestamp    │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Verify backup exists │
        │ php artisan db:backups│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Proceed with update  │
        │  (safe, backup exists)│
        └───────────────────────┘
```

---

## 🔄 Disaster Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

        ⚠️ DISASTER OCCURS ⚠️
        (Hack / Corruption / Deletion)
                    │
                    ▼
        ┌───────────────────────┐
        │  IMMEDIATE:           │
        │  php artisan down     │
        │  (Take site offline)  │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  List backups:        │
        │ php artisan db:backups│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Identify clean       │
        │  backup (before       │
        │  disaster)            │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Restore:             │
        │ php artisan db:restore│
        │    backup_file.gz     │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Confirm restoration? │
        │  YES/NO               │
        └────┬──────────────┬───┘
             │ NO           │ YES
             │              │
             ▼              ▼
        ┌────────┐    ┌─────────────────┐
        │ Cancel │    │ Restore database│
        └────────┘    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Database restored  │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Clear caches:      │
                    │  config, route, etc │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Change passwords   │
                    │  & API keys         │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Test system        │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  php artisan up     │
                    │  (Bring back online)│
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Monitor for 24-48h │
                    └─────────────────────┘
```

---

## 💾 3-2-1 Backup Storage Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      3-2-1 BACKUP STRATEGY                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────┐
    │                    3 COPIES OF DATA                        │
    └────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   COPY 1     │ │   COPY 2     │ │   COPY 3     │
        │              │ │              │ │              │
        │ Production   │ │  Automated   │ │   Weekly     │
        │  Database    │ │   Backups    │ │  Download    │
        │   (LIVE)     │ │ (Hostinger)  │ │  (Local PC)  │
        └──────────────┘ └──────────────┘ └──────────────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
    ┌────────────────────────────────────────────────────────────┐
    │                   2 DIFFERENT MEDIA                        │
    └────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        ┌──────────────┐                ┌──────────────┐
        │   MEDIUM 1   │                │   MEDIUM 2   │
        │              │                │              │
        │  Hostinger   │                │External Drive│
        │   Server     │                │   OR         │
        │   Storage    │                │Cloud Storage │
        └──────────────┘                └──────────────┘
                │                               │
                └───────────────┬───────────────┘
                                │
    ┌────────────────────────────────────────────────────────────┐
    │                      1 OFFSITE                             │
    └────────────────────────────────────────────────────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │   OFFSITE    │
                        │              │
                        │ Google Drive │
                        │   Dropbox    │
                        │ Local backup │
                        │Different Loc │
                        └──────────────┘
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKUP SECURITY MEASURES                           │
└─────────────────────────────────────────────────────────────────────────┘

    Database Backup Created
            │
            ▼
    ┌───────────────────┐
    │ File Permissions  │──► chmod 600 (owner only)
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │  Compression      │──► Reduces size by 60-80%
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │ Excluded from Git │──► .gitignore prevents commits
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │ Stored in private │──► Not web-accessible
    │ storage directory │
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │ Logged activity   │──► Audit trail maintained
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │ Auto-cleanup old  │──► Prevents disk overflow
    │ backups (30 days) │
    └───────────────────┘
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKUP SYSTEM ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐
│    USER INTERFACES     │
└────────────────────────┘
            │
    ┌───────┼───────┬─────────────────┐
    │       │       │                 │
    ▼       ▼       ▼                 ▼
┌───────┐ ┌────┐ ┌──────┐    ┌──────────────┐
│Windows│ │SSH │ │Artisan│    │Hostinger Cron│
│ .bat  │ │CLI │ │Command│    │     Job      │
└───┬───┘ └─┬──┘ └───┬──┘    └──────┬───────┘
    │       │        │               │
    └───────┼────────┴───────────────┘
            │
            ▼
┌────────────────────────┐
│  LARAVEL COMMANDS      │
│  - DatabaseBackup.php  │
│  - DatabaseRestore.php │
│  - ListBackups.php     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   DATABASE LAYER       │
│   - MySQL Connection   │
│   - mysqldump utility  │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   FILE STORAGE         │
│ storage/app/backups/   │
│  - *.sql.gz files      │
│  - backup_log.txt      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  EXTERNAL STORAGE      │
│  - Local Download      │
│  - Cloud Storage       │
│  - Email (optional)    │
└────────────────────────┘
```

---

## 📅 Timeline Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TYPICAL WEEK TIMELINE                                │
└─────────────────────────────────────────────────────────────────────────┘

MONDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-09_02-00-00.sql.gz
09:00     Developer checks backup log ✓

TUESDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-10_02-00-00.sql.gz
          Old backups > 30 days deleted

WEDNESDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-11_02-00-00.sql.gz
14:30     [MANUAL] Before update ──► backup_2025-10-11_14-30-00.sql.gz
          Update deployed successfully

THURSDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-12_02-00-00.sql.gz

FRIDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-13_02-00-00.sql.gz
10:00     [WEEKLY] Download latest backup to local storage ✓
          Archive to external drive ✓

SATURDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-14_02-00-00.sql.gz

SUNDAY
02:00 ──► [AUTO] Daily backup runs ──► backup_2025-10-15_02-00-00.sql.gz
          [WEEKLY] Backup with 90-day retention
```

---

## 🎯 Decision Tree: Which Backup to Restore?

```
                    Need to Restore Database?
                            │
                            │
            ┌───────────────┴────────────────┐
            │                                │
            ▼                                ▼
    Data deleted/corrupted          System was hacked
         today?                             │
            │                               │
            ▼                               ▼
    Use YESTERDAY's              Use backup from BEFORE
    backup (02:00)               suspicious activity
            │                    (at least 24-48h old)
            │                               │
            ▼                               ▼
    ┌──────────────────┐        ┌──────────────────────┐
    │ Recent backup    │        │ Clean backup         │
    │ (minimal data    │        │ (verified safe)      │
    │  loss: ~24h)     │        │ (data loss: 1-2 days)│
    └──────────────────┘        └──────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
                Run: php artisan db:restore
                     [chosen_backup.sql.gz]


            Accidental table drop?
                    │
                    ▼
            Use MOST RECENT backup
            (probably today's 02:00)
                    │
                    ▼
            Manual data re-entry for
            changes since backup


            Testing a new feature?
                    │
                    ▼
            Create backup FIRST
                    │
                    ▼
            Test feature
                    │
            ┌───────┴────────┐
            │                │
            ▼                ▼
        Success          Failed
            │                │
            │                ▼
            │          Restore backup
            │          (undo changes)
            │                │
            └────────┬───────┘
                     ▼
              Continue development
```

---

## 🔄 Weekly Maintenance Routine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEEKLY MAINTENANCE CHECKLIST                         │
└─────────────────────────────────────────────────────────────────────────┘

        Every Friday (or your chosen day)
                    │
                    ▼
        ┌───────────────────────┐
        │ 1. Check backup status│
        │ php artisan db:backups│
        │       --stats         │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 2. Verify recent      │
        │    backup exists      │
        │    (within 24h)       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 3. Download latest    │
        │    backup to local    │
        │    storage            │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 4. Copy to external   │
        │    drive or cloud     │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 5. Check backup log   │
        │    for errors         │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 6. Verify disk space  │
        │    sufficient         │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 7. Update documentation│
        │    if needed          │
        └───────────────────────┘
```

---

## 📈 Monitoring Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKUP SYSTEM STATUS                               │
└─────────────────────────────────────────────────────────────────────────┘

    LAST BACKUP:           2025-10-09 02:00:00  ✓
    STATUS:                SUCCESS              ✓
    SIZE:                  12.5 MB (compressed)
    TOTAL BACKUPS:         28 files
    DISK USAGE:            350 MB / 1 GB        ███░░░░░░░ 35%
    OLDEST BACKUP:         2025-09-10 (29 days old)

    RETENTION POLICY:      30 days              ✓
    AUTO-CLEANUP:          ENABLED              ✓
    CRON JOB:              ACTIVE               ✓

    OFFSITE BACKUP:        Last downloaded 2 days ago  ⚠️
    RECOMMENDED:           Download weekly

    RECENT ACTIVITY:
    ┌────────────────────────────────────────────────────┐
    │ 2025-10-09 02:00 │ Backup  │ SUCCESS │ 12.5 MB   │
    │ 2025-10-08 02:00 │ Backup  │ SUCCESS │ 12.3 MB   │
    │ 2025-10-07 14:30 │ Restore │ SUCCESS │ manual    │
    │ 2025-10-07 02:00 │ Backup  │ SUCCESS │ 12.1 MB   │
    │ 2025-10-06 02:00 │ Backup  │ SUCCESS │ 11.9 MB   │
    └────────────────────────────────────────────────────┘

    ALERTS:
    ✓ No critical alerts
    ⚠️ Reminder: Download weekly backup
    ℹ️ 2 backups will be auto-deleted tomorrow (>30 days)
```

---

## 🎓 Learning Path Flowchart

```
                        START HERE
                            │
                            ▼
                ┌───────────────────────┐
                │ Read README_BACKUP    │
                │    _SYSTEM.md         │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Create first backup   │
                │ (local test)          │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Understand basic      │
                │ commands?             │
                └─────┬─────────────┬───┘
                  YES │             │ NO
                      │             │
                      │             └─────────┐
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Read HOSTINGER_         │           │
        │ DEPLOYMENT_             │           │
        │ TROUBLESHOOTING.md      │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Fix login issue on      │           │
        │ Hostinger               │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Set up automated        │           │
        │ backups (cron)          │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Read BACKUP_            │           │
        │ IMPLEMENTATION_GUIDE    │           │
        │ (full guide)            │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Test restoration on     │           │
        │ staging environment     │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Read EMERGENCY_         │           │
        │ RECOVERY_CARD.md        │           │
        └─────────────┬───────────┘           │
                      │                       │
                      ▼                       │
        ┌─────────────────────────┐           │
        │ Setup complete!         │           │
        │ You're protected! ✓     │           │
        └─────────────────────────┘           │
                                              │
                  ┌───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │ Re-read relevant        │
        │ sections                │
        └─────────────┬───────────┘
                      │
                      └──────────► (loop back)
```

---

**Use these visual diagrams alongside the detailed documentation to understand and implement your backup system!**
