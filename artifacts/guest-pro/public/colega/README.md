## Guest Pro marketing site (Colega template)

Static assets served by Vite at `/colega/`. The app home route (`/`) embeds `index.html` in an iframe.

### Pages (production)

| File | Purpose |
|------|---------|
| `/` → `index.html` | Home — Guest Pro hero video |
| `/about` → `about.html` | Company & endorsement |
| `/contact` → `contact.html` | Contact form |
| `project01.html` | Product story |

### Config

`js/guestpro-config.js` — `singleProjectMode`, demo mailto, contact API path, inbox email.

### Contact API

- `POST /api/public/contact` (proxied to API in dev)
- Inbox: `omerfarukyilmazrbusiness@gmail.com`
- SMTP: `GMAIL_USER` + `GMAIL_APP_PASSWORD`, or `RESEND_API_KEY` in production

### Assets

- Logos: `images/guestpro-logo-*.png`
- Hero video: YouTube stream (`heroYoutubeVideoId` in `js/guestpro-config.js`) — no large MP4 deploy
- Product images: `images/projects/guestpro-*`

### Dev

API marketing-only mode starts without Postgres when DB is down (contact still works). Run root `pnpm dev` for Vite + API.
