# Guest Pro — Otel AI Concierge Platformu

Otel misafirleri ve yöneticileri için geliştirilmiş, AI destekli premium konsiyerj sistemi.

---

## 🏗 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, Vite 7, TailwindCSS 4, Radix UI, TanStack Query, Wouter, Framer Motion |
| **Backend** | Node.js 24, Express 5, TypeScript, Pino (logger) |
| **Veritabanı** | PostgreSQL 16, Drizzle ORM |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Auth** | Session tabanlı + Google OAuth (opsiyonel) |
| **Package Manager** | pnpm (workspace monorepo) |
| **PWA** | vite-plugin-pwa (offline destek) |

---

## 📦 Proje Yapısı

```
Guest-pro/
├── artifacts/
│   ├── api-server/      # Express backend (port 3000)
│   └── guest-pro/       # React frontend (port 5173)
├── lib/
│   ├── db/              # Drizzle ORM şemaları & bağlantı
│   ├── api-zod/         # Paylaşılan Zod şemaları
│   ├── api-client-react/ # TanStack Query API client
│   └── integrations-gemini-ai/  # Gemini AI client
└── pnpm-workspace.yaml
```

---

## ⚙️ Kurulum

### 1. Gereksinimler
- **Node.js** >= 20
- **pnpm** >= 9 → `npm install -g pnpm`
- **PostgreSQL** >= 14 (lokal veya Docker)

### 2. PostgreSQL başlat (Docker ile)
```bash
docker run -d \
  --name guestpro-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=guestpro \
  -p 5432:5432 \
  postgres:16
```

### 3. Environment değişkenlerini ayarla
```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/guestpro
SESSION_SECRET=guestpro_dev_secret_change_in_production_32chars
GEMINI_API_KEY=your_gemini_api_key_here   # https://aistudio.google.com/apikey
```

### 4. Bağımlılıkları yükle
```bash
pnpm install
```

### 5. Veritabanı şemasını oluştur
```bash
pnpm db:push
```

### 6. (Opsiyonel) Seed verisi yükle
```bash
cd artifacts/api-server
DATABASE_URL=<your_url> node --loader tsx src/seed.ts
```

---

## 🚀 Uygulamayı Başlat

### Development (API + Frontend birlikte)
```bash
pnpm dev
```
- API Server: http://localhost:3000
- Frontend:   http://localhost:5173

### Ayrı ayrı başlatmak için
```bash
pnpm dev:api   # sadece backend
pnpm dev:web   # sadece frontend
```

### Production build
```bash
pnpm build          # her iki projeyi derle
pnpm start          # API server'ı başlat (frontend dist'i serve et)
```

---

## 🗄 Veritabanı Komutları

```bash
pnpm db:push         # Şema değişikliklerini DB'ye uygula
pnpm db:push-force   # Zorla uygula (dikkatli kullan)
```

---

## �� Environment Değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DATABASE_URL` | ✅ | PostgreSQL bağlantı URL'si |
| `GEMINI_API_KEY` | ✅ | Google Gemini API anahtarı |
| `PORT` | ❌ | API server portu (varsayılan: 3000) |
| `SESSION_SECRET` | ❌ | Session şifreleme anahtarı |
| `AUTH_GOOGLE_CLIENT_ID` | ❌ | Google OAuth (opsiyonel) |
| `AUTH_GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth (opsiyonel) |
| `AUTH_GOOGLE_REDIRECT_URI` | ❌ | Google OAuth callback URL |
| `ALLOWED_ORIGIN` | ❌ | Production'da CORS origin |

---

## 🩺 Health Check

```bash
curl http://localhost:3000/api/health
```

---

## 📝 Notlar

- `pnpm-workspace.yaml` — pnpm monorepo yapılandırması
- Replit'e özgü tüm bağımlılıklar ve konfigürasyonlar kaldırılmıştır
- Google OAuth opsiyoneldir; email/şifre ile de giriş yapılabilir
