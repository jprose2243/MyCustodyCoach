#!/bin/bash

DATE=$(date +"%Y-%m-%d-%H%M")
TARGET="/Volumes/TOSHIBA EXT/MyCustodyCoach-Backups"
ZIP_NAME="mycustodycoach-backup-$DATE.zip"

mkdir -p "$TARGET"

zip -r "$TARGET/$ZIP_NAME" . \
  -x ".git/*" "node_modules/*" ".next/*" "*.zip" "backup-to-toshiba.sh"

echo "✅ Backup saved to: $TARGET/$ZIP_NAME"
