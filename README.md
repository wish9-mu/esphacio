# Esphacio MVP

Next.js App Router, TypeScript, Tailwind 4 and Supabase foundations. Local development deliverable; no hosted deployment or live Supabase project was created.

## Run

Requires Node 20.9+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Checks: `npm run typecheck`, `npm test`, `npm run build`.

Verified in this workspace: TypeScript checking, three domain tests, production build, browser city search, saving/filtering a stay, property details, simulated inquiry completion, and desktop/390px mobile visual inspection. Live Supabase policies have not been tested. On this Windows setup the production builder needed permission outside the sandbox to resolve a filesystem path-access error.

## Implemented

- Responsive Figma-based homepage, nodes 3:2 and 3:66. Cream #F7F2E5, caramel #AD7D49, dark olive #343B2B. Architectural placeholders are native Figma shapes, not photographs. Mobile text overlap was corrected for usability.
- Three explicitly fictional demo properties, city/neighborhood search, monthly/short-term/furnished/budget filters and browser-local favorites.
- Property routes with stay length estimates separating rent, dues, cleaning, refundable deposit and unknown utility exclusions.
- Validated simulated inquiry endpoint; no email, booking, payment, database write or personal-data storage.
- Host/admin foundation routes with server-side user/role checks when configured; no private data in unconfigured mode.
- Supabase migration: profiles, properties, inquiries, saved properties and row-level policies. Public users cannot assign roles or publish properties.

## Supabase setup and remaining work

Copy `.env.example` to `.env.local`, supply your project URL and publishable key, and apply `supabase/migrations/001_foundation.sql` followed by `supabase/migrations/002_self_service_host_access.sql` to a new project. Never place service-role credentials in NEXT_PUBLIC variables. The SQL has not been executed against a real database; validate policies and the renter-to-host transition with separate renter/host/admin identities before live deployment. The current public catalog intentionally remains demo-only after configuration.

Next milestones: live published-property queries, authenticated inquiry persistence, abuse protection, notifications with consent, real photos, availability, privacy/retention policy and terms. Host self-service only enables draft access; it does not verify identity or property ownership, and admin review remains required before publication. Current workspace is not production-ready.

## Requirements baseline

The referenced chat could be read, but earlier assistant BRD/SRS content returned only content-reference placeholders. No BRD/SRS files were present locally. This implementation uses the current user brief and retrieved Figma context. Reconcile against the original BRD/SRS when supplied; do not invent their requirements.

## Coordinate with Antigravity

Open this `esphacio` directory in Antigravity. This chat has access to workspace files and terminal tools, but no direct Antigravity connector or IDE-control tool. Use the same local directory with one active writer at a time, or separate Git branches/checkouts and review changes before merging. In a remote Work environment, exchange a repository commit or project archive plus this README rather than assuming a shared filesystem. See `HANDOFF.md`.

Google documents Antigravity MCP support at https://antigravity.google/docs/mcp?tab=ide. MCP connections expose the specific tools of a configured server; adding the same Figma/Supabase server to two clients does not create a chat-to-IDE control channel. A custom bridge would need explicitly scoped tools, authentication and configuration in both clients. No bridge has been installed.

OpenAI documents its IDE extension at https://learn.chatgpt.com/docs/codex/ide. Antigravity compatibility has not been established here; do not assume the extension installs or works there. A supported IDE or Codex CLI can work on the same repository independently.
