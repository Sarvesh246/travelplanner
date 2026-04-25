## Learned User Preferences

- Wants a cohesive outdoors-inspired look in both light and dark mode, with layered contrast and neutral bases (avoid a single flat hue across the whole UI).
- Prefers compact, efficient navigation on narrow/mobile widths (avoid redundant controls and excessive empty spacing).

## Learned Workspace Facts

- Next.js app using Supabase for authentication and Prisma with Postgres for app data; Prisma-backed routes fail without valid `DATABASE_URL` and `DIRECT_URL`.
- OAuth return URL is `/auth/callback`; implement the handler under `app/auth/callback`. Route groups such as `(auth)` are omitted from the URL, so `(auth)/callback` maps to `/callback`, not `/auth/callback`.
- Google OAuth controls are gated with `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`; the Google provider must still be enabled in the Supabase project that matches `NEXT_PUBLIC_SUPABASE_URL`.
- Prisma CLI does not auto-load `.env.local`; this workspace runs Prisma commands via `node --env-file=.env.local`.
- Build reliability currently depends on Webpack mode (`next build --webpack`) because Turbopack production builds have shown route collection instability in this repo.
- Local `npm run dev` uses `next dev --webpack` by default; Turbopack dev has panicked/corrupted-cache issues in this repo—use `npm run dev:turbo` only if you want Turbopack and accept that risk.
- Running multiple `next dev` processes against the same project folder (or a stale process after a Next upgrade) can cause module-resolution and cache errors; use a single dev server and `npm run dev:clean` when behavior looks inconsistent after upgrades.
- Prisma `Decimal` values (and other non-JSON values) must be serialized to plain data before passing from Server Components or server actions to Client Components; this workspace uses helpers under `src/lib/serialize/`.
- Custom trip cover images are stored in a public Supabase Storage bucket named `trip-covers` (see `.env.local.example`); the dashboard can fall back to an OpenStreetMap static map preview on trip cards when there is no cover but a stop has coordinates (ensure the OSM and Supabase image hosts are allowed in `next.config` `images.remotePatterns` when using `next/image`).
- Trip deletion removes the `Trip` row and child rows through Prisma cascade; `deleteTrip` also best-effort removes cover objects under per-uploader `trip-covers/{userId}/{tripId}/` paths (the database delete still succeeds if storage cleanup fails).
- Trip collaboration now includes a `VIEWER` role and centralized permission helpers in `src/lib/auth/trip-permissions.ts`; `VIEWER` can view but cannot contribute, while member/invite management is `OWNER`/`ADMIN` only.
- Invite creation supports optional Resend delivery (`RESEND_API_KEY` + `EMAIL_FROM`); if email sending is unavailable or fails, invites still work via copyable invite links.
