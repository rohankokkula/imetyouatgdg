# I Met You At GDG

A tiny web app for **GDG DevFest Hyderabad**. Everyone gets a personal QR code. When someone scans it and signs in with LinkedIn, the two of you are connected (with an optional note). Everyone can see the whole event graph: who met whom, and who your connections met.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres + LinkedIn OIDC auth + Realtime) · Tailwind · `react-force-graph-2d` · `qrcode.react`. Deploys free on Vercel.

## How it works

| Route | What it does |
| --- | --- |
| `/` | Landing page (logged out), or **your QR** plus stats (logged in) |
| `/c/[id]` | What a QR code opens: "You met X" → sign in → Connect + note |
| `/onboarding` | Asks once for your `linkedin.com/in/…` username (LinkedIn's sign-in API doesn't provide it) |
| `/people` | People you met directly (with notes), and people they met ("through them") |
| `/graph` | The full DevFest graph. Tap anyone to see the path from you to them |

Data model (`supabase/migrations/0001_init.sql`):
- `profiles`: one row per LinkedIn user (name and photo are synced from LinkedIn on each login).
- `connections`: one row per pair, with `note_a` and `note_b` (each person writes their own).
- Row-level security: notes are readable only by the two people in a connection. The graph (without notes) is served by the `event_graph()` function, so everyone can see it.

## Setup (~20 minutes)

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
3. Note your **Project URL** and **anon key** (Project Settings → API) and the callback URL `https://<project-ref>.supabase.co/auth/v1/callback`.

### 2. LinkedIn app
1. LinkedIn requires every app to be tied to a **Company Page**. If you don't have one, create a small page such as "I Met You At GDG" at linkedin.com/company/setup/new.
2. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) → **Create app**, and link it to that page. Upload any logo.
3. **Products** tab → request **Sign In with LinkedIn using OpenID Connect** (approved instantly).
4. **Auth** tab:
   - Copy the **Client ID** and **Client Secret**.
   - Under *Authorized redirect URLs*, add `https://<project-ref>.supabase.co/auth/v1/callback`.

### 3. Connect them
In Supabase, go to **Authentication → Sign In / Providers → LinkedIn (OIDC)**, enable it, and paste the Client ID and Secret.

Then in **Authentication → URL Configuration**:
- **Site URL:** your production URL (e.g. `https://imetyouatgdg.vercel.app`)
- **Redirect URLs:** `http://localhost:3000/**` and `https://imetyouatgdg.vercel.app/**`

### 4. Run locally
```bash
cp .env.local.example .env.local   # fill in the two values
npm install
npm run dev
```
To test the full scan flow on your phone, deploy first (LinkedIn and phones need a real HTTPS URL).

### 5. Deploy
Push to GitHub → import the repo in [Vercel](https://vercel.com/new) → add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Deploy. Add the Vercel URL to the Supabase redirect URLs (step 3).

## Event-day checklist
- [ ] Test the full flow with 3 real accounts in a chain (X → A → B). X should see B under "Through them".
- [ ] Print your QR (or keep the full-screen QR handy). Put the app URL on a slide or poster so people can get their own QR.
- [ ] The Supabase free tier is plenty for a few thousand attendees.
