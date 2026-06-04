## Guest Pro marketing site (Colega template)

Static assets served by Vite at `/colega/`. The app home route (`/`) embeds `index.html` in an iframe.

### Pages (production)

| File | Purpose |
|------|---------|
| `index.html` | Home — Guest Pro hero video |
| `project01.html` | Product story |
| `about.html` | Company & endorsement |
| `contact.html` | Contact form |

### Config

`js/guestpro-config.js` — `singleProjectMode`, demo mailto, contact API path, inbox email.

### Contact API

- `POST /api/public/contact` (proxied to API in dev)
- Inbox: `omerfarukyilmazrbusiness@gmail.com`
- SMTP: `GMAIL_USER` + `GMAIL_APP_PASSWORD`, or `RESEND_API_KEY` in production

### Assets

- Logos: `images/guestpro-logo-*.png`
- Hero video: `videos/bauman.mp4` (master in `videos/source/`, gitignored)
- Product images: `images/projects/guestpro-*`

### Dev

API marketing-only mode starts without Postgres when DB is down (contact still works). Run root `pnpm dev` for Vite + API.
