## Learned User Preferences

## Learned Workspace Facts

- Next.js app using Supabase for authentication and Prisma with Postgres for app data; Prisma-backed routes fail without valid `DATABASE_URL` and `DIRECT_URL`.
- OAuth return URL is `/auth/callback`; implement the handler under `app/auth/callback`. Route groups such as `(auth)` are omitted from the URL, so `(auth)/callback` maps to `/callback`, not `/auth/callback`.
- Google OAuth controls are gated with `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`; the Google provider must still be enabled in the Supabase project that matches `NEXT_PUBLIC_SUPABASE_URL`.
- Prisma CLI does not auto-load `.env.local`; this workspace runs Prisma commands via `node --env-file=.env.local`.
- Build reliability currently depends on Webpack mode (`next build --webpack`) because Turbopack production builds have shown route collection instability in this repo.
- Local `npm run dev` uses `next dev --webpack` by default; Turbopack dev has panicked/corrupted-cache issues in this repo—use `npm run dev:turbo` only if you want Turbopack and accept that risk.
