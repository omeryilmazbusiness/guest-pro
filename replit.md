# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
The main product is **Guest Pro** — a premium mobile-first hotel guest web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4` for DB schemas, `zod` v3 API for routes)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **AI**: Gemini via `@workspace/integrations-gemini-ai` (server-side only)
- **Logging**: pino + pino-http (structured, redacts Authorization headers)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Auth Architecture

### Token Format
HMAC-SHA256 signed tokens stored in `localStorage` under `guestpro_token`.
Format: `base64(payload).hmac_hex` where payload = `{userId, role, hotelId, guestId?, iat, exp}`.
- **Manager tokens** expire after 12 hours
- **Guest tokens** expire after 7 days
- Token signature uses `SESSION_SECRET` env var (throws in production if missing/weak)

### Password Hashing
Three-tier with transparent auto-upgrade on login:
1. **v3 (current)**: `pbkdf2v3:<hex_salt>:<hex_hash>` — PBKDF2, 100k iterations, per-user random 16-byte salt
2. **v2 (legacy)**: PBKDF2 with static salt `guestpro_v2` — auto-upgraded to v3 on next login
3. **v1 (legacy)**: SHA-256 with static salt `guestpro_salt` — auto-upgraded to v3 on next login

### Brute-Force Protection
In-memory rate limiter on email/password login:
- 10 failed attempts within 15 minutes → 15 min lockout
- Keyed by normalized email

### Google OAuth Flow
1. `GET /api/auth/google` → redirects to Google with CSRF state token
2. `GET /api/auth/google/callback` → verifies state, exchanges code for profile, creates/finds manager, issues **short-lived exchange code** (60s, single-use)
3. Redirects to frontend with `?google_code=<exchangeCode>` (NOT the real token)
4. Frontend calls `GET /api/auth/google/exchange?code=<exchangeCode>` → returns real token
This keeps the auth token out of browser history and server access logs.

### Middlewares
- `requireAuth` — verifies HMAC token, injects `req.session`
- `requireManager` — requireAuth + role === "manager"
- `requireGuest` — requireAuth + role === "guest"
- `requireHotelScope` — validates `:hotelId` param matches session.hotelId

### Audit Logging
All security-critical events written to `audit_logs` table:
- `login_success` — manager email/password login with IP
- `login_failed` — failed attempt with email and IP
- `google_login` — Google OAuth login with email and IP
- `create_guest` — guest creation by manager

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes (prod throws if missing/weak) | HMAC signing secret (min 32 chars in prod) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `AUTH_GOOGLE_REDIRECT_URI` | Optional | Override OAuth callback URI |
| `APP_BASE_URL` | Optional | Override frontend base URL for redirects |
| `ALLOWED_ORIGIN` | Optional (prod) | CORS allowed origin in production |
| `GEMINI_API_KEY` | Yes | Gemini AI key (server-side only, never exposed to client) |

### Demo Credentials
- **Manager**: `manager@grandhotel.com` / `manager123`
- **Guest key**: Check manager dashboard for active guest keys

## Database Schema

- `hotels` — hotel/tenant records
- `users` — manager accounts (email/password or Google OAuth)
- `guests` — hotel guests
- `guest_keys` — one-time access keys with optional expiry
- `chat_sessions` — concierge chat sessions (per guest)
- `messages` — chat message history
- `quick_actions` — suggested prompts shown in guest chat
- `audit_logs` — security event log

## Artifacts

- `artifacts/api-server` — Express API server (port via `PORT` env)
- `artifacts/guest-pro` — React + Vite frontend (port via `PORT` env)
- `artifacts/mockup-sandbox` — Component preview server for canvas
