# Platform multi-tenant roadmap

Guest Pro is evolving from a single-hotel deployment to **platform + hotel tenants**.

## URL model

| Scope | Example | Purpose |
|--------|---------|---------|
| Marketing | `/`, `/home` | Public site |
| Platform admin | `/platform`, `/platform/login` | Super admin |
| Hotel tenant | `/{slug}/login`, `/{slug}/guest`, `/{slug}/manager` | Per-property app |

`BASE_PATH` (Vite env) remains the **deploy prefix** only (e.g. CDN subfolder), not the hotel slug.

## Phase 1 — Done (foundation)

- [x] `platform_admins` table + migration `0005_platform_admins`
- [x] Platform auth API (`/api/platform/auth/*`)
- [x] Hotel provisioning service (create hotel + GM)
- [x] Platform UI (`/platform/login`, `/platform` dashboard)
- [x] Public tenant bootstrap `GET /api/public/hotels/:slug`
- [x] Nested SPA routes `/:hotelSlug/*` + legacy flat routes
- [x] Login `hotelSlug` validation for tenant sign-in
- [x] `scripts/src/create-platform-admin.ts`

## Phase 2 — Done (tenant-aware APIs)

- [x] `GET /hotel/branding` resolves tenant via session, `X-Hotel-Slug`, query, or default slug
- [x] `GET /hotel/quick-actions` scoped by resolved hotel
- [x] `welcome-alert` + public routes use `hotel-resolver` (no blind `.limit(1)` on hotels)
- [x] Google OAuth stores `hotelSlug` in state; callback redirects to `/{slug}/login`
- [x] Guest QR / renew URLs use `/{slug}/guest/auto-login?token=…`
- [x] `GET /api/public/config` for default hotel slug

## Phase 3 — Done (frontend)

- [x] `useTenantNav()` + `X-Hotel-Slug` on API client (`setHotelSlugGetter`)
- [x] `useHotelDisplay()` — branding from tenant public API + `/hotel/branding`
- [x] Legacy `/guest`, `/login`, … redirect to `/{defaultHotelSlug}/…`
- [x] Guest/manager navigation updated on main flows (home, chat, flow, auto-login, manager dashboard)

## Phase 4 — Done (operations)

- [x] Platform: PATCH hotel `isActive` (activate/deactivate)
- [x] Platform: POST reset manager password
- [x] Platform: GET audit logs (`actorType: platform_admin`)
- [x] OpenAPI paths for public + platform endpoints
- [x] Self-test: `node artifacts/api-server/scripts/tenant-self-test.mjs`
- [x] Unit test: `app-url.unit.test.ts`

## Bootstrap

```bash
# 1. Migrate
pnpm db:push   # or start API (runs migrations)

# 2. Create super admin
DATABASE_URL=... pnpm exec tsx scripts/src/create-platform-admin.ts you@corp.com 'YourPass!' 

# 3. Sign in
open http://localhost:5173/platform/login
```

Optional env:

- `DEFAULT_HOTEL_SLUG=your-hotel` — legacy flat URL redirects + API fallback tenant

## Architecture notes

- **Platform admins** live in `platform_admins` (not `users`) — clear separation from hotel staff.
- **Hotel staff** remain in `users` with required `hotel_id`.
- **Provisioning** logic is centralized in `hotel-provisioning.ts` (shared by API and CLI).
- **Tenant resolution** is centralized in `hotel-resolver.ts`.
