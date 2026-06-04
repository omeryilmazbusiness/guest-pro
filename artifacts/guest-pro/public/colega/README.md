## Guest Pro marketing site (Colega template)

Static assets served by Vite at `/colega/`. The app home route (`/`) embeds `index.html` in an iframe.

### Pages (production)

| File | Purpose |
|------|---------|
| `index.html` | Home — hero video loop |
| `project01.html` | Product story |
| `about.html` | Company & endorsement |
| `contact.html` | Contact form |

### Hero media (web-optimized)

| Asset | Size (typical) | Role |
|-------|----------------|------|
| `images/bauman-hero-poster.jpg` | ~120 KB | Instant LCP poster |
| `videos/bauman-hero.webm` | ~2 MB | Primary video (modern browsers) |
| `videos/bauman-hero.mp4` | ~1.7 MB | Fallback (H.264 + faststart) |

Regenerate from master: put source at `videos/source/bauman.mp4`, then `pnpm colega:hero-media`.

### Config

`js/guestpro-config.js` — `singleProjectMode`, demo mailto, contact API path.

### Contact API

- `POST /api/public/contact` (proxied to API in dev)
- Inbox: `omerfarukyilmazrbusiness@gmail.com`
- SMTP: `GMAIL_USER` + `GMAIL_APP_PASSWORD`, or `RESEND_API_KEY` in production

### Dev

Run root `pnpm dev` for Vite + API. API marketing-only mode works without Postgres when DB is down.
