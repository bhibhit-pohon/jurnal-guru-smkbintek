#!/bin/bash
# ===========================================================
# 🚀 Script Deploy Otomatis — Jurnal Guru Online
# Jalankan script ini SATU KALI di server Ubuntu (Proxmox)
# ===========================================================
# Usage: 
#   chmod +x deploy.sh && ./deploy.sh
# ===========================================================

set -e

# --- Konfigurasi ---
REPO_URL="https://github.com/bhibhit-pohon/jurnal-guru-smkbintek.git"
APP_DIR="$HOME/jurnal-guru-smkbintek"
WORK_DIR="$APP_DIR/app-next"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  🚀 DEPLOY JURNAL GURU ONLINE — HOME SERVER      ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║  Domain : jurnal.smkbintekpwt.my.id               ║"
echo "║  Port   : 8080 → 3000 (internal)                  ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# --- Step 1: Clone atau Pull Repository ---
echo "📦 [1/4] Menyiapkan repository..."
if [ -d "$APP_DIR" ]; then
    echo "   → Repository sudah ada, melakukan git pull..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "   → Cloning repository baru..."
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$WORK_DIR"

# --- Step 2: Buat file .env dari .env.example ---
echo ""
echo "🔐 [2/4] Menyiapkan environment variables..."
if [ ! -f ".env" ]; then
    echo "   → File .env belum ada. Membuat dari template..."
    cp .env.example .env
    echo ""
    echo "   ⚠️  PENTING: Edit file .env dengan nilai Firebase yang benar!"
    echo "   → Jalankan: nano $WORK_DIR/.env"
    echo ""
    read -p "   Apakah Anda sudah mengisi .env? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "   → Silakan edit .env terlebih dahulu, lalu jalankan ulang script ini."
        echo "   → nano $WORK_DIR/.env"
        exit 1
    fi
else
    echo "   → File .env sudah ada. ✅"
fi

# --- Step 3: Build & Run Docker ---
echo ""
echo "🐳 [3/4] Membangun dan menjalankan Docker container..."
docker compose down 2>/dev/null || true
docker compose up -d --build

# --- Step 4: Verifikasi ---
echo ""
echo "🔍 [4/4] Verifikasi deployment..."
sleep 5

if docker ps --filter "name=jurnal-guru-app" --filter "status=running" | grep -q "jurnal-guru-app"; then
    echo ""
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║  ✅ DEPLOYMENT BERHASIL!                          ║"
    echo "╠═══════════════════════════════════════════════════╣"
    echo "║  Container : jurnal-guru-app (running)            ║"
    echo "║  Lokal     : http://192.168.18.179:8080           ║"
    echo "║  Publik    : https://jurnal.smkbintekpwt.my.id    ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo ""
    echo "📋 Log container: docker logs -f jurnal-guru-app"
    echo "🔄 Restart     : docker compose restart"
    echo "🛑 Stop        : docker compose down"
else
    echo ""
    echo "❌ Container gagal berjalan. Cek log:"
    echo "   docker logs jurnal-guru-app"
    exit 1
fi
