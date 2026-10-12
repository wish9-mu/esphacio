# Antigravity development handoff

## Session: Self-service host onboarding

**Completed by GitHub Copilot — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `supabase/migrations/002_self_service_host_access.sql` | Added `request_host_access()` as a security-definer database transition. It requires the current authenticated user, locks their profile, and permits only `renter -> host`; direct profile updates remain revoked and admin assignment is impossible through this function. |
| `app/api/host/access/route.ts` | Added authenticated POST endpoint that invokes the database function and never accepts a user-supplied role. |
| `components/BecomeHostButton.tsx` | Added renter-only self-service onboarding control. |
| `app/account/page.tsx` | Shows host onboarding explanation and action only for signed-in renters; hosts retain dashboard access and admins retain admin access. |
| `app/host/page.tsx` | Replaced the old workspace placeholder with an explicit host onboarding page for guests, renters, hosts, and admins. |
| `app/globals.css` | Added responsive host landing and onboarding styles. |
| `app/globals.css` | Styled the host onboarding panel. |
| `tests/authorization.test.ts` | Added authorization contract tests for the renter-only transition, blocked direct profile updates, admin publication gate, and demo isolation. |
| `package.json` | `npm test` now runs all `tests/*.test.ts` files. |
| `README.md` / `HANDOFF.md` | Updated Supabase setup and host-access limitations. |

### Security and product behavior

- Becoming a host grants listing-draft access only. It does not verify identity, ownership, documents, or property condition.
- Host listings remain `draft` or `pending_review` until an admin approves them; public reads still require `published` status.
- Renter browsing, saved stays, simulated inquiries, and other renter behavior remain unchanged.
- The host entry point is `/host`; the header and landing page already link there, and guests can continue to `/account?next=/host`.
- Apply migration `001_foundation.sql` before `002_self_service_host_access.sql` in the development Supabase project.

### Verification

- `npm run typecheck` -> exit 0.
- `npm test` -> 6 tests passed, including 3 authorization tests.
- `npm run build` -> exit 0; host access API compiled with all existing routes.
- Unauthenticated host-access requests remain rejected; live renter/host/admin identity testing still requires the migration to be applied to Supabase.
- `/host` browser smoke check shows the onboarding steps and sign-in action without the old workspace placeholder.

### Remaining limitation

No email notification, identity verification, property verification, host application review, or audit history was added. Those are separate product/security work and must not be implied by the host role.

## Session: Map search with MapLibre and OpenFreeMap

**Completed by GitHub Copilot — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Added `maplibre-gl` for client-side vector map rendering. |
| `.env.example` | Added `NEXT_PUBLIC_MAP_STYLE_URL`, defaulting to the OpenFreeMap Liberty style. |
| `lib/domain.ts` | Added realistic `lat`/`lng` coordinates to the three fictional demo listings. |
| `lib/theme.ts` | Added shared map renderer palette values for olive, caramel, and white. |
| `app/map/page.tsx` | Added the `/map` route. |
| `components/map/MapSearch.tsx` | Added URL-backed supported filters, split list/map layout, mobile map/list toggle, local saved stays, bounds filtering, and accessible listing rows. |
| `components/map/MapView.tsx` | Added client-only MapLibre map, GeoJSON clustering, caramel price pins, selection popup, zoom controls, attribution, worker setup, loading/error states, and Search this area behavior. |
| `public/maplibre-gl-worker.mjs` | Serves MapLibre’s bundled worker from the same origin for Next.js/Turbopack. |
| `components/LandingMarketplace.tsx` / `app/layout.tsx` | Map CTA and header Map navigation now link to `/map`. |
| `app/globals.css` | Added responsive map filter bar, split view, list cards, popup, mobile toggle, attribution, and skeleton styles. |
| `HANDOFF.md` | Recorded map architecture and verification. |

### Map decisions and known gaps

- The verified style URL is `https://tiles.openfreemap.org/styles/liberty`; the provider requires visible OpenFreeMap, OpenMapTiles, and OpenStreetMap attribution, which is retained through MapLibre’s default attribution control plus a visible fallback note.
- The map uses OpenFreeMap tiles without API keys. To swap providers, set `NEXT_PUBLIC_MAP_STYLE_URL` to another compatible style URL; the same-origin worker remains MapLibre-specific.
- Search is local listing search across title, neighborhood, and city. No geocoder, routing, or third-party address autocomplete was added; a future geocoder must be rate-limited and must not run on every keystroke.
- Bedroom, floor, building-type, and amenities filters were omitted because the current demo data model does not contain those fields. Supported controls are search, move-in month, budget, furnished, short-term, saved, and reset.
- The shared browser page was marked non-visible during verification. Its worker and style resources loaded and attribution rendered, but its WebGL render loop did not complete tile rendering while hidden; the app now shows a graceful map-unavailable state after 15 seconds while the list remains usable. Verify visible-tab pin rendering in a normal browser window.

### Verification

- `npm run typecheck` -> exit 0.
- `npm test` -> 3 tests passed.
- `npm run build` -> exit 0; `/map` compiled with the existing routes.
- OpenFreeMap Liberty style and exact TileJSON/PBF endpoints returned successfully during local checks.
- Mobile `/map` list mode, local search filtering, demo labels, attribution in map mode, and the landing `/map` CTA were verified. Desktop route structure and no-overflow checks passed.

### Remaining work toward next milestone

Apply and validate Supabase RLS with separate renter, host, and admin identities; add host location picking for future live lat/lng data; keep listing approval, authentication, inquiries, and inventory demo/live separation intact.

## Session: 33m2-inspired landing page redesign

**Completed by GitHub Copilot — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `components/LandingMarketplace.tsx` | Added the new landing experience: two-column hero/search, five data-compatible stay-type cards, map CTA, recently viewed section, existing filters/listing cards, and host CTA. Search and filters continue to use `filterListings`; saved stays continue to use `esphacio-saved`. |
| `app/page.tsx` | Switched the home route to the new landing component. |
| `app/layout.tsx` | Updated desktop/mobile navigation with Map, Stays, Saved, Inquiries, host, language, notification, and account controls. |
| `app/globals.css` | Added landing-specific responsive styles and preserved Tailwind 4 `olive`, `caramel`, and `cream` theme tokens. |
| `components/RecentlyViewedTracker.tsx` | Added browser-local tracking for the five most recently opened demo properties. |
| `app/properties/[id]/page.tsx` | Records a viewed property while preserving the existing detail, cost, and simulated inquiry flow. |
| `HANDOFF.md` | Recorded this redesign and verification. |

### Design and implementation notes

- The current data model has no bedroom/type field, so the five cards use supported concepts: flexible monthly, short-term, furnished, budget, and saved stays.
- No map route exists; the cream map CTA links to the existing stays section and is intentionally labeled as a map-style discovery entry point.
- No assistant feature exists, so no floating assistant button was added.
- Recently viewed units use `localStorage` only and remain explicitly labeled as fictional demo listings.
- Tailwind 4 theme tokens remain in `app/globals.css` via `@theme`; there is no separate `tailwind.config` file in this repository.

### Verification

- `npm run typecheck` -> exit 0.
- `npm test` -> 3 tests passed.
- `npm run build` -> exit 0; all existing routes compiled.
- Browser checks at 375px, 768px, and 1280px: no horizontal overflow; responsive header, two-column desktop hero, five desktop type columns, mobile type-card scrolling, and demo labels verified.
- Search flow: `/?q=Salcedo` produced one matching listing.
- Recently viewed flow: opening the Makati detail page produced a labeled recently viewed card on return to the homepage.

### Remaining work toward next milestone

Supabase authentication, secure renter/host/admin permissions enforced with RLS, host listing drafts, and admin approval remain the next backend milestone. The landing page remains demo-only for inventory, inquiries, availability, and map behavior.

## Session: Auth hardening and local verification

**Completed by GitHub Copilot — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `supabase/migrations/001_foundation.sql` | Profile trigger now copies a bounded signup display name from `raw_user_meta_data`; direct execution of the security-definer trigger function is revoked. |
| `app/api/auth/signup/route.ts` | Removed the follow-up profile update that was blocked by profile RLS; the trigger is now the single trusted profile-name write. |
| `app/api/auth/callback/route.ts` | Restricts post-auth redirects to same-site paths. |
| `app/account/page.tsx` | Applies the same local-path redirect validation to the client sign-in flow. |
| `lib/supabase.ts` | Treats missing or malformed Supabase URLs as unconfigured. |
| `lib/supabase-edge.ts` | Applies the same validation in the request proxy so public pages do not crash on bad local configuration. |
| `HANDOFF.md` | Recorded this session and verification. |

### Verification

- `npm run typecheck` -> exit 0.
- `npm test` -> 3 tests passed.
- `npm run build` -> exit 0; 16 routes and Proxy compiled.
- Browser smoke check at `http://127.0.0.1:3001`: desktop and mobile public homepage rendered with no horizontal overflow; demo labels and filtering surface remained present.
- `/admin` with the current malformed local Supabase URL rendered the safe setup state instead of a runtime error.

### Remaining limitations

- `.env.local` contains non-empty Supabase values, but the URL is not a valid HTTP(S) project URL, so live authentication and database policy tests remain unverified. Replace values locally from the Supabase dashboard; never paste secrets into chat or source control.
- The migration still needs to be applied to a development Supabase project and tested with separate renter, host, and admin identities before live use.

Start by reading README.md, lib/domain.ts and the Supabase migration. Run the existing checks before changing code. Preserve the demo labels and do not make demo inquiries send messages or collect payments.

Current implementation uses desktop Figma node 3:2 and mobile node 3:66 from file q8FS7bfC95BoRk4OEVDy5N. No bitmap/SVG assets were returned; all visual placeholders are layout shapes. Keep the cream/caramel/olive tokens and responsive hierarchy.

Use one agent to edit a shared working directory at a time. For parallel work, use separate branches/checkouts, bounded file ownership and a reviewed merge. Record changed files, verification and unresolved assumptions in this handoff.

---

## Session: Authentication, host onboarding, admin moderation

**Completed by Antigravity — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `lib/supabase.ts` | Replaced stub: proper `setAll` cookie handler on server client, `supabaseMiddleware()` helper for Edge middleware, `supabaseBrowser()` factory. |
| `proxy.ts` | NEW — Edge proxy refreshing Supabase session cookies on every request; redirects unauthenticated users away from `/host/dashboard`, `/host/properties`, `/admin`. Renamed from `middleware.ts` per Next.js 16 convention. |
| `app/api/auth/signin/route.ts` | NEW — POST email/password sign-in. |
| `app/api/auth/signup/route.ts` | NEW — POST account creation; renter role assigned by DB trigger only. |
| `app/api/auth/signout/route.ts` | NEW — POST sign-out. |
| `app/api/auth/callback/route.ts` | NEW — GET OAuth/email-confirmation code exchange. |
| `app/api/host/properties/route.ts` | NEW — POST (create draft) and PATCH (update draft/rejected). Blocks edits to pending_review/published. `is_demo` hardcoded false. |
| `app/api/admin/properties/moderate/route.ts` | NEW — POST approve/reject. Role from DB only. Demo listings blocked. |
| `app/account/page.tsx` | Replaced placeholder: server-rendered session check; shows AuthForm for guests, profile + links for signed-in users. Unconfigured Supabase text preserved verbatim. |
| `app/host/dashboard/page.tsx` | NEW — Server-rendered host dashboard with property table, status badges, edit links for draft/rejected only. |
| `app/host/properties/new/page.tsx` | NEW — New property page; server-side role guard. |
| `app/host/properties/[id]/edit/page.tsx` | NEW — Edit page; only draft/rejected properties reachable; owner-or-admin check. |
| `app/admin/page.tsx` | Replaced stub with full moderation page: pending queue + recent decisions. Unconfigured/unauthenticated/forbidden messaging preserved. |
| `components/AuthForm.tsx` | NEW — Client auth form (login + signup tabs). |
| `components/SignOutButton.tsx` | NEW — Isolated client sign-out button. |
| `components/PropertyDraftEditor.tsx` | NEW — Client draft editor; "save draft" and "submit for review" actions. |
| `components/AdminActions.tsx` | NEW — Client approve/reject buttons with `router.refresh()`. |
| `app/globals.css` | Appended: `.auth-panel`, `.auth-tabs`, `.auth-error`, `.link-btn`. Existing styles untouched. |
| `HANDOFF.md` | This document. |

### Verification

- `npm run typecheck` → exit 0 ✓
- `npm test` (3 domain tests) → exit 0, 3 pass ✓
- `npm run dev` running — demo browsing, search, filtering, inquiry form all unaffected.
- Auth, host and admin features require a live Supabase project (see README for setup).

### Architecture decisions

- **Roles from DB only.** All role checks (`profile.role`) read from `public.profiles` via the server client. No JWT custom claims are trusted. Sign-up always produces a `renter`; host/admin must be granted by a trusted operator via SQL.
- **Cookie refresh.** `proxy.ts` calls `client.auth.getUser()` on every non-static request; Supabase SSR client writes refreshed tokens to the response cookies automatically via `setAll`. Next.js 16 requires the file to be named `proxy.ts` with `export async function proxy(...)` — not the legacy `middleware.ts`/`middleware` convention.
- **Publish guard.** `PATCH /api/host/properties` rejects updates to `pending_review` or `published` properties. The edit page also blocks navigation to these listings. The DB policy (`property_host_update`) adds a database-level enforcement layer.
- **Demo isolation.** `is_demo: false` is hardcoded in the host create route. The moderation route rejects demo listings with HTTP 409.

### Unresolved assumptions / pending product inputs

- Supabase project URL and publishable key are not configured locally. Auth/host/admin flows cannot be end-to-end tested without a live project.
- No email confirmation redirect URL configured (`NEXT_PUBLIC_SUPABASE_URL` needed in Supabase dashboard → Authentication → URL configuration pointing to `/api/auth/callback`).
- Exact deposit/cancellation terms, rental duration rules and inquiry delivery channel are still pending BRD/SRS inputs.
- Privacy/retention policy text is absent; add before any real user data is collected.
- Real inventory, authorized photos and availability rules are not yet supplied.
- No rate-limiting, CAPTCHA or abuse protection on auth or inquiry endpoints.
- Notification system (host notified of new inquiry, host notified of moderation decision) is not implemented.
- The `host/page.tsx` (For property owners landing) still renders the old `Workspace` component — update it once the host landing page copy is agreed.

---

## Session: Proxy fix + landing page redesign

**Completed by Antigravity — 2026-10-13**

### Changed files

| File | Change |
|---|---|
| `lib/supabase-edge.ts` | NEW — Edge-runtime-safe Supabase proxy helper (no `next/headers` import). |
| `lib/supabase.ts` | Removed proxy helper + NextRequest/NextResponse imports (now in supabase-edge.ts). |
| `proxy.ts` | Import updated from `@/lib/supabase` → `@/lib/supabase-edge` to fix Turbopack edge-bundle error. |
| `app/globals.css` | Full rewrite: white background, clean minimal design, Inter font, card styles, sticky header, pill filters, auth panel, responsive breakpoints. Olive/caramel tokens preserved. |
| `app/layout.tsx` | Added Inter font via Google Fonts; updated header/footer markup to match new design classes. |
| `components/Architecture.tsx` | Updated placeholder to use new CSS class names (arch-wall, arch-window, arch-accent). |
| `components/Marketplace.tsx` | Full rewrite: centred hero, search bar, pill filters, card grid with meta/fees, how-it-works (numbered steps), list-your-property CTA, mobile bottom nav. All existing search/filter/save/inquiry logic preserved. All demo labels preserved. |

### Verification

- `npm run typecheck` → exit 0 ✓
- `npm test` (3 domain tests) → exit 0, 3 pass ✓
- `npm run build` → exit 0, 16 routes, Proxy compiled ✓ (browser visual check blocked by Playwright CDN unavailability in sandbox)

### Design decisions

- **White background** everywhere; cream `#F7F2E5` used only for the step-number circles and card image tints.
- **Olive `#343B2B`** for all headings and the list-your-property CTA section background.
- **Caramel `#AD7D49`** for primary buttons, filter active state outline, eyebrow text, and card price accents.
- Cards use `border: 1.5px solid #e8e4dc` + hover shadow lift instead of coloured backgrounds.
- "Demo listing" badge rendered on every card and a disclaimer line below the filter bar.
- Architectural placeholders unchanged in nature — CSS shapes only, no stock photos.
- Sticky header with `border-bottom` replaces the old flat header.
- Mobile ≤640px: single-column cards, hamburger menu, bottom sticky nav bar.

### Unresolved assumptions (carried forward)

See previous session entry for full list. Additional: browser-level visual screenshots unavailable in this Playwright-blocked sandbox environment — verify manually at `http://127.0.0.1:3001`.


