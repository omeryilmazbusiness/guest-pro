# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
The main product is **Guest Pro** — a premium mobile-first hotel guest web app.

## Localization (i18n) Architecture

### Locale Derivation Chain
`countryCode` (ISO 3166-1, stored in DB) → `deriveLocaleFromCountry()` (API server) → `{ voiceLocale, uiLocale, dir }` returned on login and `/auth/me`.

- **voiceLocale**: BCP 47 (e.g. `"tr-TR"`) — used for TTS, STT, and Gemini language hints. Stored as `language` column.
- **uiLocale**: short code (e.g. `"tr"`) — used for translation dictionary lookup.
- **dir**: `"ltr"` or `"rtl"` — set on `document.dir` by `useLocale()` hook.

### Supported UI Languages
`en`, `tr`, `ar` (RTL), `ru`, `de`, `fr`, `es` — all via `artifacts/guest-pro/src/lib/i18n.ts`.

### GuestTranslations Interface (full coverage)
The `GuestTranslations` interface has 190+ keys covering:
- Global labels (cancel, logout, room, guest, etc.)
- Home page, chat, voice, install sheet
- **Guided Flow** — all step questions, subtitles, option labels, dividers, success messages, confirm card labels for food, support, and care modes
- **Quick Actions** — titles and subtitles for all 3 action types (food, support, care)
- My Requests section labels
- All 7 locales have complete translations with no fallback gaps

### Key Files
- `artifacts/guest-pro/src/lib/locale.ts` — COUNTRY_LOCALE_MAP, COUNTRIES list, countryFlag helper, uiLocaleFromVoiceLocale, dirFromUiLocale
- `artifacts/guest-pro/src/lib/i18n.ts` — GuestTranslations interface + full dictionaries for 7 locales
- `artifacts/guest-pro/src/hooks/use-locale.ts` — reads `user.language` → returns `{ t, voiceLocale, uiLocale, dir }`; sets document.dir/lang
- `artifacts/api-server/src/lib/locale.ts` — server-side country→locale mapping (70+ countries)

### Country Selector (Manager)
`create-guest.tsx` uses a shadcn Command + Popover combobox to pick country. Validation requires country selection.

## Guest QR Auto-Login Architecture

### Security Design
When a guest is created, a **single-use 24-hour QR auto-login token** is issued alongside the guest key:
- Raw token = 32 cryptographically-random bytes (hex). **Never stored in DB.**
- DB stores only `SHA-256(rawToken)` — a breach yields no usable tokens.
- QR code encodes: `https://<domain>/guest/auto-login?token=<rawToken>`
- Token is **single-use**: `usedAt` is set on first consumption; replay attempts are rejected.
- Previous tokens for a guest are **revoked** when a new QR is issued.
- All issuance and consumption events are audit-logged.

### Flow
1. Staff creates guest → API returns `{ guestKey, qrLoginUrl, qrTokenExpiresAt }`
2. `GuestHandoffModal` opens with QR code (rendered via `qrcode` canvas), key display, copy button
3. Guest scans QR → lands on `/guest/auto-login?token=...` page
4. Page calls `GET /api/auth/guest/qr-login?token=...` (no auth required)
5. Server validates token (read-only) → loads guest → checks stay window → if OK, marks `usedAt`, issues guest JWT
6. Frontend stores token → redirects to `/guest`
7. Invalid/expired/used tokens show a clean dark error page with "Sign in with Guest Key" fallback

### Validate-then-Consume Pattern (critical)
The QR login route uses a two-step validation:
1. `lookupValidQrToken()` — validates cryptographically, no DB write
2. Stay-window check via `evaluateStayAccess()` — uses `guest-stay-policy.ts`
3. `consumeValidQrToken()` — only called AFTER all checks pass

If the stay window check fails (upcoming or expired), the token is **NOT consumed**.
This allows the guest to scan the same QR code when their check-in date arrives, without needing staff to issue a new one.

### Stay-Window Error Codes
Both guest key login and QR login return specific machine-readable codes:
- `stay_upcoming` — check-in date is in the future
- `stay_expired` — checkout date has passed
The legacy `stay_access_denied` code is no longer emitted but is handled in the frontend for backward-compatibility.

### Key Files
- `lib/db/src/schema/guests.ts` — `guestQrTokensTable` (new)
- `artifacts/api-server/src/lib/qr-token.ts` — `issueQrToken`, `consumeQrToken`, `revokeAllGuestQrTokens`
- `artifacts/api-server/src/routes/auth.ts` — `GET /auth/guest/qr-login` endpoint
- `artifacts/api-server/src/routes/guests.ts` — `POST /guests` now returns `qrLoginUrl` + `qrTokenExpiresAt`
- `artifacts/guest-pro/src/components/GuestHandoffModal.tsx` — premium post-create modal with QR
- `artifacts/guest-pro/src/pages/guest/auto-login.tsx` — landing page for QR scans

## Manager Dashboard — Guest CRUD

### Operations
| Action | Who | Endpoint | Notes |
|--------|-----|----------|-------|
| List guests | Staff | `GET /api/guests` | Excludes soft-deleted; active key joined |
| Create guest | Staff | `POST /api/guests` | Returns key + QR token |
| Edit guest | Staff | `PATCH /api/guests/:id` | Updates name/room/country; audit logged |
| Delete guest | Manager only | `DELETE /api/guests/:id` | Soft delete; deactivates keys + QR tokens |
| Renew key | Staff | `POST /api/guests/:id/renew-key` | Old key deactivated; new key + QR issued |

### Permissions Matrix
| Permission | Manager | Personnel |
|------------|---------|-----------|
| VIEW_GUESTS | ✓ | ✓ |
| CREATE_GUEST | ✓ | ✓ |
| EDIT_GUEST | ✓ | ✓ |
| DELETE_GUEST | ✓ | ✗ |
| RENEW_GUEST_KEY | ✓ | ✓ |
| MANAGE_HOTEL | ✓ | ✗ |

### Dashboard Features
- KPI cards: Total Guests, Checked In Today, Rooms Occupied
- Live search: name, room number, or guest key
- Room filter dropdown: filter by specific room, sorted numerically
- Result count + "Clear filters" shortcut
- Per-guest action menu (⋯): Edit, Renew Key, Copy Key, Remove Guest (manager only)
- Edit modal: inline form with country selector
- Delete dialog: safety confirmation with guest name in copy
- Key renewal: triggers GuestHandoffModal reuse with new key + QR

### Key Files (Frontend)
- `artifacts/guest-pro/src/pages/manager/dashboard.tsx` — main console, role-aware, mobile-first
- `artifacts/guest-pro/src/components/manager/GuestCard.tsx` — compact 2-line mobile guest card
- `artifacts/guest-pro/src/components/manager/GuestEditModal.tsx` — edit dialog
- `artifacts/guest-pro/src/components/manager/GuestDeleteDialog.tsx` — delete confirmation

### Role Personas (same route `/manager`, different UX)
| Persona | Header section | Actions visible |
|---------|----------------|-----------------|
| Manager | Horizontal stat chips (scrollable) | All: Edit, Renew, Copy, Delete |
| Personnel | Dark welcome card + CTA | Edit, Renew, Copy (no Delete) |

### Tabs System
- `Guests` tab: compact 3-line guest card list, newest-first, searchable + room-filterable
- `Rooms` tab: 2-column card grid, occupancy aggregated from guest records, search-only filter (all shown rooms are occupied)
- Tab switcher: custom segmented control with badge counts

### Flag Icons
- Package: `flag-icons` (CSS library, self-contained SVG flags, no CDN requests)
- Component: `src/components/ui/CountryFlag.tsx` — centralized
- `monochrome` prop: applies grayscale filter for ops/staff contexts (GuestCard, RoomCard back)
- Emoji flags only in create/edit country combobox trigger (not in cards)

### Stay Dates & Extension Tracking
- `guestsTable` columns: `checkInDate`, `checkOutDate`, `originalCheckOutDate`, `isExtended`, `extensionCount`
- `src/lib/stays.ts` — pure domain helpers: `formatStayDate()`, `stayNights()`, `extensionDays()`, `todayIso()`, `minCheckOutDate()`
- Create form: native `<input type="date">` pickers (check-in defaults today, checkout must be > checkin)
- Edit modal: extension-aware — live `+{N}d` preview, extension message, "Extended ×N" badge
- API PATCH: detects extension when newCheckOut > storedCheckOut; auto-sets isExtended, increments extensionCount, preserves originalCheckOutDate on first extension; writes separate audit log

### Domain Lib Architecture
- `src/lib/guests.ts` — `filterGuests()`, `extractRoomNumbers()` — pure functions
- `src/lib/rooms.ts` — `aggregateRooms()`, `filterRooms(rooms, search?)`, `computeRoomStats()` — pure functions; `RoomGuestSnapshot` includes `fullKey`, `checkInDate`, `checkOutDate`, `isExtended`
- `src/lib/stays.ts` — date formatting, night counting, extension derivation
- `src/lib/permissions.ts` — `can()`, `isStaffRole()`, `roleLabel()`
- Dashboard imports from these libs — no logic in page components

### Mobile-First UX Decisions
- Stat chips: horizontal scroll row (`overflow-x-auto snap-x`) — no tall stacked cards on mobile
- Guest card: 3-line ~90px item (name+flag / room+dates+extension badge / masked key)
- Room card back: guest row shows dates + copy-key button; back face stops click propagation
- FAB: fixed bottom-right `+ New Guest` button (mobile only, sm:hidden)
- Header: 56px sticky, minimal — brand + role identity + logout only
- Rooms sticky filter: search-only bar (no status chips — all rooms shown are occupied by design)
- Container: `max-w-2xl` — tighter centering optimized for phone/tablet

## Personnel Role (Staff Tier 2)

### Access Policy
- `manager` — full access: view guests, create guests, manage hotel settings
- `personnel` — limited access: view guests, create guests (no hotel management)
- Defined in `artifacts/api-server/src/lib/roles.ts` and mirrored in `artifacts/guest-pro/src/lib/permissions.ts`

### Key Files
- `artifacts/api-server/src/lib/roles.ts` — `STAFF_ROLES`, `Permission`, `ROLE_PERMISSIONS`, `isStaffRole()`, `can()`
- `artifacts/api-server/src/middlewares/requireAuth.ts` — `requireStaff` (manager|personnel), `requireManager`, `requireGuest`
- `artifacts/guest-pro/src/lib/permissions.ts` — client-side permission mirror

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@grandhotel.com` | `manager123` |
| Personnel | `staff@grandhotel.com` | `staff123` |
| Guest | key: `5FC43C-AA40F4-3170FA` | — |

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

## Active Tracking System

Tracks whether guests are in-hotel, in-hotel but not on hotel Wi-Fi, outside the hotel, or unknown.

### Architecture
- **Domain logic**: `artifacts/api-server/src/lib/tracking-policy.ts` — pure functions: `haversineMeters`, `isInGeofence`, `matchesCidr`, `isOnAllowedNetwork`, `resolveTrackingStatus`, `extractSourceIp`, validators.
- **Backend routes**: `artifacts/api-server/src/routes/tracking.ts` — 5 endpoints (see below).
- **Frontend API lib**: `artifacts/guest-pro/src/lib/tracking.ts` — types + `customFetch` wrappers.
- **Guest heartbeat hook**: `artifacts/guest-pro/src/hooks/use-tracking-heartbeat.ts` — `watchPosition`, 60 s throttle.
- **Manager settings page**: `artifacts/guest-pro/src/pages/manager/settings.tsx` — `/manager/settings`, manager-only.
- **Tracking badge**: `artifacts/guest-pro/src/components/manager/GuestTrackingBadge.tsx` — colour dot + label.

### Tracking Statuses
- `IN_HOTEL_AND_ON_WIFI` — inside geofence AND source IP matches allowed hotel network
- `IN_HOTEL_NOT_ON_WIFI` — inside geofence but NOT on hotel network
- `OUTSIDE_HOTEL` — outside geofence
- `UNKNOWN` — no location data or tracking disabled

### API Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/tracking/config` | staff | Fetch config + networks |
| PUT | `/api/tracking/config` | manager | Upsert tracking config |
| POST | `/api/tracking/networks` | manager | Add allowed network |
| DELETE | `/api/tracking/networks/:id` | manager | Remove network rule |
| POST | `/api/tracking/heartbeat` | guest | Guest presence heartbeat (returns debug block) |
| GET | `/api/tracking/presences` | staff | All guest presence snapshots |
| GET | `/api/tracking/my-ip` | staff | Returns the server-seen IP for the manager's request |

### Heartbeat Debug Block
Every `POST /api/tracking/heartbeat` response includes a `debug` object:
```json
{
  "status": "IN_HOTEL_AND_ON_WIFI",
  "sourceIp": "5.27.39.187",
  "debug": {
    "browserLat": 41.19, "browserLng": 28.72, "browserAccuracyMeters": 12,
    "resolvedSourceIp": "5.27.39.187",
    "reqIp": "5.27.39.187", "reqIps": ["5.27.39.187"],
    "xForwardedFor": "5.27.39.187", "socketRemoteAddress": "::1",
    "hotelCenterLat": 41.1952, "hotelCenterLng": 28.7252, "hotelRadiusMeters": 150,
    "trackingEnabled": true, "allowedNetworks": ["5.27.39.187"],
    "distanceMeters": 0, "isInGeofence": true, "isOnAllowedNetwork": true,
    "unknownReason": null, "resolvedStatus": "IN_HOTEL_AND_ON_WIFI"
  }
}
```

### UNKNOWN Root Cause Fix (critical — Apr 2026)
**Bug**: The heartbeat hook sent a null heartbeat on mount, setting `lastSentAt`. When `watchPosition` fired 1-5s later with real GPS, the 60s rate limiter blocked it. Result: first snapshot was always UNKNOWN.

**Fix in `use-tracking-heartbeat.ts`**:
- Removed the immediate null heartbeat on mount
- First real position always bypasses the rate limiter (`hasSentFirst` flag)
- Added 12s fallback timer — only sends null if no GPS position arrives (denied/unsupported)
- Added accuracy threshold: positions coarser than 500m are skipped (sends null instead)
- Changed to `enableHighAccuracy: true` for indoor-grade geofencing
- Rate limit still applies to all subsequent heartbeats (60s minimum)

### Manager UX
- Settings gear icon in dashboard header (manager only) → `/manager/settings`
- "Active Tracking System" card: enable/disable toggle, lat/lng/radius fields
- "Allowed Networks" card: add/remove IP or CIDR ranges with optional labels
- **"Your Current IP" card**: click "Detect my IP" to see the server-seen IP, with one-click copy and pre-fill into the Add Network form

### Guest UX
- `useTrackingHeartbeat()` runs on guest home page
- First real GPS fix is sent immediately; subsequent ones are rate-limited to 60s
- Backend resolves status from location + request source IP

### Guided Quick-Action Flows (`/guest/flow?mode=`)
- **food** — multi-step food order wizard: category → item → quantity → note → confirm (FOOD_ORDER)
- **support** — support request wizard: issue type → urgency → note → confirm (SUPPORT_REQUEST)
- **care** — preference profile: free-text intro → sleep → diet → comfort → service → confirm (CARE_PROFILE_UPDATE)
- **No emoji** anywhere in flows — Lucide icons only
- **Always-visible custom textarea** at the bottom of every select step (overrides button selection)
- Care step 1 is free-text first (large textarea) + guided options on subsequent steps
- All button labels (Confirm/Skip/Next/Back) use `useLocale()` → `t` translations across 7 locales
- Success screen shows CheckCircle + flow icon; routes back to guest home
- On confirm: calls `createServiceRequest` which posts to `POST /api/requests` (requireGuest)
- **i18n-driven step builders**: `buildFoodSteps(t)`, `buildSupportSteps(t)`, `buildCareSteps(t)` in `flow.tsx` build all step definitions dynamically from the translation function; option VALUES are semantic English keys (e.g. MINIBAR_REFRESH, URGENT, VEGETARIAN) stored in structuredData; `originalLanguage: navigator.language` is stored alongside all structuredData
- **ServiceQuickActions** now accepts `t: GuestTranslations` prop; all titles, subtitles, section headers are i18n strings
- **ConfirmCard**: `resolveLabel(stepId, value)` maps semantic keys to localized display text by looking up step.options; custom text overrides option label

### Guest My Requests
- `GET /api/requests/mine` (requireGuest) — returns all requests for authenticated guest, newest first
- `listMyRequests()` in `service-requests.ts`
- Guest home shows "Taleplerim" section below quick actions (shown only after first load)
- Each request shown as a status card: type icon, summary, colored status dot + label, time-ago
- Status badge colors: open=amber, in_progress=sky, resolved=emerald
- Section disappears if loading (optimistic: shown only when data available)

### Staff Requests Board
- Redesigned from tabbed list → 4 grouped collapsible card stacks
- Groups: Food Orders (amber), Support Requests (sky), Care About Me (rose), General (zinc)
- Each group header has a "3D card stack" depth effect (2 absolute behind layers)
- Shows: type icon, label, open-count badge, newest request summary preview, status mini-bar
- Clicking a group header expands/collapses its request cards vertically
- Default expanded: Support Requests
- Uses existing `ServiceRequestCard` for individual expanded cards

## Manager Analytics & Reporting

### Architecture (Layered)
- **Domain**: `RequestAnalyticsSnapshot`, `DailySummaryRecord`, `AIInsightOutput` — defined in backend lib
- **Aggregation**: `artifacts/api-server/src/lib/request-analytics.ts` — `buildAnalyticsSnapshot(hotelId, start, end)` — pure data crunching, no AI, no routes
- **AI pipeline**: `artifacts/api-server/src/lib/ai-summary.ts` — `generateAISummary(snapshot)` → `{ insights[], recommendations[] }` using Gemini 2.5 Flash with structured JSON output; safe fallback on failure
- **Scheduler**: `artifacts/api-server/src/lib/scheduler.ts` — setInterval checks every 60s for 23:30 UTC; idempotent (skips if today's summary already exists); generates for all hotels
- **Routes**: `artifacts/api-server/src/routes/analytics.ts` — all `requireManager`-protected:
  - `GET /api/analytics/quick-report` — live on-demand: aggregates today so far + AI
  - `GET /api/analytics/daily-summaries` — list stored summaries for hotel (last 30 days)
  - `POST /api/analytics/daily-summaries/generate` — manually trigger for a date (upserts)
- **Client**: `artifacts/guest-pro/src/lib/analytics.ts` — typed API client, `formatMinutes()` helper, `TYPE_LABELS`
- **UI**: `DailySummaryTab` + `QuickReportModal` in `artifacts/guest-pro/src/components/manager/`

### Daily Summary Tab
- Manager-only tab ("Summary") added to dashboard tab switcher
- Shows stored daily summaries as expandable cards (newest first)
- Each card: date label, total/resolved/avgTime metrics, type breakdown chips, AI insight bullets, AI recommendation bullets
- "Generate Today" / "Refresh Today" button — triggers POST to generate/update today's summary
- Auto-generated nightly at 23:30 UTC for all hotels

### Quick Report Modal
- Triggered by the `FileText` icon button in the dashboard header (manager-only)
- Live on-demand: fetches and calls AI every time it opens
- Refresh button re-fetches without closing
- Shows: today's total/avgResolution KPIs, open/in-progress/resolved status bar with color indicators, longest waiting active request highlight (amber), by-category breakdown, top rooms, AI insights, AI recommendations
- Premium modal design: backdrop blur, rounded panel, scrollable body, safe area footer

### Metrics Available (from `service_requests` timestamps)
- `createdAt` → `updatedAt` on resolved rows = resolution time
- `createdAt` → now on open/in_progress rows = waiting time
- `topRooms` — grouped by roomNumber, sorted descending
- `byType` / `byStatus` — full breakdowns
- `longestWaitingRequest` — oldest non-resolved request

## Database Schema

- `hotels` — hotel/tenant records
- `users` — manager accounts (email/password or Google OAuth)
- `guests` — hotel guests
- `guest_keys` — one-time access keys with optional expiry
- `chat_sessions` — concierge chat sessions (per guest)
- `messages` — chat message history
- `quick_actions` — suggested prompts shown in guest chat
- `audit_logs` — security event log
- `hotel_tracking_configs` — geofence config per hotel (enabled, lat/lng/radius, notes)
- `hotel_tracking_networks` — allowed IP/CIDR rules per hotel
- `guest_presence_snapshots` — latest presence state per guest (status, last location, last IP, lastSeenAt)
- `daily_summaries` — stored AI-generated daily summaries (hotelId, date YYYY-MM-DD, insights[], recommendations[], metricsSnapshot jsonb)

## Guest Voice Conversation Architecture

### Design: Continuous Loop, Not Single-Turn
Voice conversation is a dedicated mode with a proper state machine. Tap mic → start loop → speak → AI responds → TTS plays → mic reopens automatically → repeat until guest taps "End".

### State Machine (`use-voice-conversation.ts`)
States: `idle | listening | processing | speaking | error | stopped | unsupported`

Loop:
1. `startConversation()` → opens mic → `listening`
2. STT final result → `processing` → `onSpeechResult` fires → chat sends to AI
3. AI responds → chat calls `conv.speakResponse(text, lang)` → `speaking`
4. TTS `onEnd` → auto-restart listening (250ms gap to avoid mic pickup) → `listening`

Interruption: `interruptAndListen()` cancels TTS and immediately re-opens mic.

### Infrastructure (SOLID layered)
- `lib/voice/capability.ts` — `VoiceCapabilityModel`, PWA detection, feature flags
- `lib/voice/language-resolver.ts` — Unicode-based language detection, best-voice picker, markdown stripper
- `lib/voice/speech-synthesis.ts` — TTS adapter with `onEnd`/`onError` callbacks, `cancelSpeech()` with callback suppression
- `lib/voice/speech-recognition.ts` — STT adapter, Chrome/Safari quirks, proper session lifecycle
- `hooks/use-voice-conversation.ts` — state machine, amplitude tracking, loop management
- `hooks/use-voice.ts` — single-turn hook (used by home page hero mic), delegates to lib/voice

### UI Components
- `components/chat/VoiceConversationPanel.tsx` — floating panel replacing the input bar when active; shows state label, amplitude rings, live transcript, interrupt button, stop button; unsupported fallback notice for Safari PWA mode
- `components/chat/MicrophoneButton.tsx` — toggle button (hero + inline variants), `isConversationActive` prop drives styling

### Chat Integration (`pages/guest/chat.tsx`)
- Input bar replaced by `VoiceConversationPanel` when `conv.isActive`
- Message `useEffect`: when new assistant message arrives AND `conv.isActive` → `conv.speakResponse(text, lang)`
- `?voice=1` URL param → auto-starts conversation loop
- Error handling: quota exceeded stops conversation; AI errors retry listening

### Browser Compatibility (Honest)
- Chrome: full support — STT + TTS, voices load async via `voiceschanged`
- Safari (browser tab): `webkitSpeechRecognition` supported, works well
- Safari PWA / home-screen: may restrict STT — detected at first failure, `VoiceConversationPanel` shows a clear fallback notice
- Fallback: text input always available; voice mode gracefully degrades to "unsupported" state with explanation

### Language In = Language Out
- Guest's registered locale seeds STT `lang` hint for better accuracy
- `detectLanguageFromText()` re-detects from Unicode character ranges after each turn
- `pickBestVoice(lang)` selects best available TTS voice for that language (exact → prefix → any)
- Both STT lang and TTS voice update each turn to follow switching languages naturally

## Welcome-Area Public Support Alerts

Anonymous guests on `/welcoming` can tap "Call for help" (Destek çağır in Turkish) to notify reception without logging in.

### DB Table: `welcome_area_alerts`
- Fields: id, hotelId, selectedLanguage, sessionId, status (open|acknowledged), createdAt, acknowledgedAt
- Separate from `service_requests` (which requires auth) — intentionally isolated

### API Endpoints
- `POST /api/public/welcome-support` — no auth required, creates alert (single-hotel: always hotelId=1)
- `GET /api/welcome-alerts` — staff only, returns all hotel alerts
- `PATCH /api/welcome-alerts/:id/status` — staff only, mark acknowledged

### Frontend
- `lib/welcoming/welcome-support.ts` — creates stable anonymous sessionId in sessionStorage; calls public endpoint
- `components/manager/WelcomeAreaAlertBanner.tsx` — polls every 20s, shows horizontal pill banner when open alerts exist; staff can acknowledge individual alerts

## Welcoming Info Blocks Redesign (v2)

### DiningCard — icon-based meal rows
- Sunrise → Breakfast, Sun → Lunch, Moon → Dinner, Bell → Room Service
- Room service shown with emerald badge

### MenuCard — icon-based category headers
- `icon` field on `MenuSection` type: "Coffee" | "UtensilsCrossed" | "IceCream2" | "Soup" | "ChefHat"
- Each icon has matching bg/text colour pair

### NearbyCard + NearbyPlaceModal
- Places are clickable rows (ChevronRight indicator)
- Modal shows: place description, OpenStreetMap iframe (no API key), "Open in Google Maps" (walking directions deep-link), QR code via `qrcode.react`
- NearbyPlace type extended with `coords?: {lat, lng}` and `description?`
- Istanbul Grand Bazaar area coordinates used for the 4 demo places

### EmergencyCard — dual CTA
- Phone number + "Call hotel" link (unchanged)
- "Call for help" / "Destek çağır" button fires `callForWelcomeSupport()` with 4 states (idle → sending → sent → failed)

### New i18n strings (all 6 welcoming locales)
`callForSupport`, `callForSupportSending`, `callForSupportSent`, `callForSupportFailed`,
`nearbyOpenInMaps`, `nearbyGetQr`, `nearbyModalTitle`, `nearbyQrScanNote`

## Staff Management System

Managers can create and manage personnel accounts via a dedicated **Team** tab in the manager dashboard.

### DB Schema (users table additions)
- `staffDepartment` — nullable text; one of `HOUSEKEEPING | BELLMAN | RECEPTION | RESTAURANT`
- `isActive` — boolean (default `true`); deactivated personnel cannot log in

### Auth hardening
`authenticateManager()` in `lib/auth.ts` checks `isActive === false` and returns `null` before verifying the password — deactivated accounts are fully blocked.

### API: `/api/staff` (all manager-only via `requireManager`)
- `GET /api/staff` — list all personnel users for the hotel
- `POST /api/staff` — create a new personnel user; body: `{ email, password, firstName, lastName, staffDepartment }`
- `PATCH /api/staff/:id` — update name, department, or `isActive`
- `DELETE /api/staff/:id` — soft-deactivates (sets `isActive = false`)

### Frontend
- `lib/staff.ts` — `listStaff`, `createStaff`, `updateStaff`, `deactivateStaff`, domain types, department labels + colour maps
- `components/manager/StaffTeamTab.tsx` — full tab with staff card grid, create modal (name/email/password/department), edit modal, deactivate/reactivate flow
- `lib/permissions.ts` — `MANAGE_STAFF` permission added; granted to `manager` role only
- Dashboard `DashboardTab` extended with `"team"`; tab is manager-only (hidden from personnel)

### Demo credentials
- Manager: `manager@grandhotel.com` / `manager123`
- Personnel: `staff@grandhotel.com` / `staff123`

## Artifacts

- `artifacts/api-server` — Express API server (port via `PORT` env)
- `artifacts/guest-pro` — React + Vite frontend (port via `PORT` env)
- `artifacts/mockup-sandbox` — Component preview server for canvas
