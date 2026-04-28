## Learned User Preferences

- Wants a cohesive outdoors-inspired look in both light and dark mode, with layered contrast and neutral bases (avoid a single flat hue across the whole UI).
- Prefers compact, efficient navigation on narrow/mobile widths (avoid redundant controls and excessive empty spacing).
- Wants pre-login/public surfaces to use visible UI controls (for example, a theme toggle) instead of app-only keyboard shortcuts or command palette interactions.
- Prefers smooth, gradual CSS transitions for interactive effects (hover glows, color shifts); abrupt or instant state changes should be avoided.

## Learned Workspace Facts

- Next.js app using Supabase for authentication and Prisma with Postgres for app data; Prisma-backed routes fail without valid `DATABASE_URL` and `DIRECT_URL`.
- OAuth return URL is `/auth/callback`; implement the handler under `app/auth/callback`. Route groups such as `(auth)` are omitted from the URL, so `(auth)/callback` maps to `/callback`, not `/auth/callback`. On localhost, Google sign-in depends on using the real loopback origin for redirects (`getRequestOrigin` avoids letting forwarded host headers target production) and on attaching Supabase session cookies to the OAuth callback redirect after `exchangeCodeForSession`.
- Google OAuth controls are gated with `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`; the Google provider must still be enabled in the Supabase project that matches `NEXT_PUBLIC_SUPABASE_URL`.
- Prisma CLI does not auto-load `.env.local`; run Prisma via `node --env-file=.env.local`. Serialize `Decimal` and other non-JSON values before passing them from Server Components or server actions to Client Components (`src/lib/serialize/`).
- Prefer Webpack for production builds and local dev (`next build --webpack`, default `npm run dev` / `next dev --webpack`): Turbopack has shown production route-collection instability and dev cache/panic issues here—use `npm run dev:turbo` only when you intentionally want Turbopack.
- Running multiple `next dev` processes against the same project folder (or a stale process after a Next upgrade) can cause module-resolution and cache errors; use a single dev server and `npm run dev:clean` when behavior looks inconsistent after upgrades.
- Custom trip covers use the public Supabase Storage bucket `trip-covers` (see `.env.local.example`); trip cards can fall back to an OpenStreetMap static map when there is no cover but a stop has coordinates (allow OSM and Supabase hosts in `next.config` `images.remotePatterns` with `next/image`). Deleting a trip cascades in Prisma; `deleteTrip` best-effort removes objects under `trip-covers/{userId}/{tripId}/` (the DB delete still succeeds if storage cleanup fails).
- Trip collaboration now includes a `VIEWER` role and centralized permission helpers in `src/lib/auth/trip-permissions.ts`; `VIEWER` can view but cannot contribute, while member/invite management is `OWNER`/`ADMIN` only.
- Trip invite email uses Resend only (Maileroo was removed); optional delivery via `RESEND_API_KEY` + `EMAIL_FROM`. If email is unavailable or fails, invites still work via copyable invite links.
- The landing page uses Three.js (`@react-three/fiber`, `@react-three/drei`, `three`) for the 3D hero scene (`src/components/landing/sections/HeroScene.tsx`) and a scroll-driven `JourneySpine` trail in `src/components/landing/LandingExperience.tsx`; the spine path and GPS dot stay below content cards in z-order. The scroll traveler should follow path coordinates with live SVG `getBoundingClientRect()` (plus coalesced updates on scroll)—not viewport-center math with stale cached geometry.
- Tailwind `screens` use pixel breakpoints; keep custom `min-[…]` / `max-[…]` breakpoints in px as well so production builds do not mix rem-based and px-based media queries.
- On Windows, `npm ci` can fail with `EPERM` when replacing Next’s SWC native binary under `node_modules/@next/swc-*` while `next dev`, tests, or another Node process holds the file—stop those processes (or reboot in stubborn cases) before reinstalling dependencies.
