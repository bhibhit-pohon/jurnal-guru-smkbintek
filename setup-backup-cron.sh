#!/bin/bash
# Script untuk memasang otomatis Cron Job Backup Jurnal Guru di Ubuntu

echo "Menyiapkan Cron Job Otomatis untuk Backup..."

# Endpoint API lokal (karena berjalan di server yang sama dengan Docker Nginx)
API_URL="http://localhost:3000/api/cron/backup?token=backup-rahasia-123"

# Perintah cron (berjalan setiap hari jam 00:00)
CRON_CMD="0 0 * * * curl -s \"$API_URL\" > /dev/null 2>&1"

# Cek apakah cron sudah ada
(crontab -l 2>/dev/null | grep -F "$API_URL") > /dev/null
if [ $? -eq 0 ]; then
    echo "Cron Job sudah terpasang sebelumnya."
else
    # Tambahkan cron job baru
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo "✅ Cron Job berhasil dipasang! Backup akan berjalan setiap jam 12 malam."
    echo "Data backup akan tersimpan di folder: app-next/backups/"
fi

echo "Pastikan Anda sudah menaruh file 'serviceAccountKey.json' di dalam folder 'app-next' agar Firebase Admin bisa melakukan backup."
