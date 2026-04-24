## Learned User Preferences

## Learned Workspace Facts

- Next.js app using Supabase for authentication and Prisma with Postgres for app data; Prisma-backed routes fail without valid `DATABASE_URL` and `DIRECT_URL`.
- OAuth return URL is `/auth/callback`; implement the handler under `app/auth/callback`. Route groups such as `(auth)` are omitted from the URL, so `(auth)/callback` maps to `/callback`, not `/auth/callback`.
- Google OAuth controls are gated with `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`; the Google provider must still be enabled in the Supabase project that matches `NEXT_PUBLIC_SUPABASE_URL`.
