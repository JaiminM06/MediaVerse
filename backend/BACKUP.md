# 💾 MediaVerse Backup & Recovery Strategy

This document outlines the backup procedure for a single VPS deployment of MediaVerse.

## 🗄️ MongoDB Backup (mongodump)

The primary data store is MongoDB. It contains user profiles, video metadata, tweets, and comments.

**Create a manual backup:**
```bash
docker exec -t mediaverse-backend-mongo-1 mongodump --archive > db_backup_$(date +%Y-%m-%d).archive
```

**Restore from a backup:**
```bash
cat db_backup_2026-07-07.archive | docker exec -i mediaverse-backend-mongo-1 mongorestore --archive --drop
```

## ⏱️ Daily Cron Backup (S3 Upload)

Automate backups to run nightly at 2:00 AM and push directly to a secure AWS S3 bucket.

1. Create a script `/opt/backup_mediaverse.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/mediaverse_db_$DATE.archive"
S3_BUCKET="s3://your-private-backup-bucket/mediaverse-db/"

# Create dump
docker exec -t mediaverse-backend-mongo-1 mongodump --archive > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE $S3_BUCKET

# Cleanup
rm $BACKUP_FILE
```

2. Make it executable and add to cron:
```bash
chmod +x /opt/backup_mediaverse.sh
crontab -e
# Add: 0 2 * * * /opt/backup_mediaverse.sh
```

## 🧠 Redis Persistence

Redis handles caching, session state, and BullMQ queues. 
**Persistence is enabled via AOF (Append Only File)** in `docker-compose.yml` (`command: ["redis-server", "--appendonly", "yes"]`). Data is persisted to the `redis-data` Docker volume.

If the Redis container crashes or the VPS reboots, Redis will automatically rebuild the state (including BullMQ jobs) from the AOF file on startup.

## 🩺 Recovery Checklist

In the event of a catastrophic failure (VPS dies):
1. Provision a new VPS.
2. Re-deploy the infrastructure via `docker-compose up -d`.
3. Download the latest `.archive` backup from S3.
4. Run the `mongorestore` command above.
5. Search indices will be empty. Run `node scripts/bulkIndexTypesense.js` to re-sync search data.
6. The system is now restored.
