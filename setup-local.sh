#!/bin/bash
set -e

ROOT="/Users/omeryilmaz/Desktop/ReplitExport-yilmazbusiness (2)/Guest-pro"
LOG="$ROOT/setup.log"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"; }

log "=========================================="
log " GuestPro Local Setup"
log "=========================================="

# ── 1. .env yaz ──────────────────────────────
log "1/6 .env yazılıyor..."
cat > "$ROOT/.env" << 'EOF'
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://guestpro:guestpro123@localhost:5432/guestpro
SESSION_SECRET=guestpro_dev_secret_change_in_production_32chars
GEMINI_API_KEY=AIzaSyABG_7KzDelo-iJ5MR52vu399Ki8FuibBQ
AI_INTEGRATIONS_GEMINI_API_KEY=AIzaSyABG_7KzDelo-iJ5MR52vu399Ki8FuibBQ
BASE_PATH=/
EOF
log "   .env tamam: $(cat "$ROOT/.env" | grep -c '=' ) satır"

# ── 2. PostgreSQL kontrol / kur ───────────────
log "2/6 PostgreSQL kontrol ediliyor..."

if ! command -v psql &>/dev/null; then
  log "   psql bulunamadı, Homebrew ile kuruluyor..."
  if ! command -v brew &>/dev/null; then
    log "   HATA: Homebrew yok! https://brew.sh adresinden kurun."
    exit 1
  fi
  brew install postgresql@17
  brew link postgresql@17 --force
fi
log "   psql: $(psql --version)"

# ── 3. PostgreSQL servisini başlat ───────────
log "3/6 PostgreSQL servisi başlatılıyor..."
brew services start postgresql@17 2>/dev/null || brew services start postgresql 2>/dev/null || true
sleep 3

if pg_isready -q; then
  log "   PostgreSQL hazır ✅"
else
  log "   PostgreSQL başlatılamadı, farklı sürüm deneniyor..."
  # Farklı sürüm dene
  for v in 16 15 14; do
    brew services start postgresql@$v 2>/dev/null && sleep 2 && pg_isready -q && break
  done
fi

pg_isready || { log "HATA: PostgreSQL başlatılamadı!"; exit 1; }

# ── 4. DB ve kullanıcı oluştur ───────────────
log "4/6 Veritabanı ve kullanıcı oluşturuluyor..."

psql postgres -c "CREATE USER guestpro WITH PASSWORD 'guestpro123';" 2>/dev/null || log "   Kullanıcı zaten var"
psql postgres -c "CREATE DATABASE guestpro OWNER guestpro;" 2>/dev/null || log "   DB zaten var"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE guestpro TO guestpro;" 2>/dev/null || true
log "   DB hazır ✅"

# ── 5. pnpm install ───────────────────────────
log "5/6 Paketler kontrol ediliyor..."
cd "$ROOT"
if [ ! -d "node_modules" ]; then
  log "   node_modules yok, pnpm install çalıştırılıyor..."
  pnpm install 2>&1 | tail -5
else
  log "   node_modules mevcut ✅"
fi

# ── 6. DB schema push ─────────────────────────
log "6/6 Veritabanı şeması oluşturuluyor (drizzle push)..."
cd "$ROOT"
export $(cat .env | grep -v '^#' | xargs)
pnpm --filter @workspace/db push 2>&1 | tail -10
log "   Schema push tamam ✅"

log "=========================================="
log " SETUP TAMAMLANDI ✅"
log "=========================================="
log ""
log " Uygulamayı başlatmak için:"
log "   pnpm dev"
log ""
log " Servisler:"
log "   API  → http://localhost:3000"
log "   Web  → http://localhost:5173"
log "=========================================="
