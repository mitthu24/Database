# Database SaaS — Phase 1 MVP

Multi-tenant data-ingestion platform. One Next.js app serves three panels based
on the request's subdomain:

| Domain                     | Panel                                                   |
| --------------------------- | -------------------------------------------------------- |
| `admin.<yourdomain>`        | Founder (super admin) — create & manage companies        |
| `app.<yourdomain>`          | Company panel — manage team + tables (data ingestion)    |
| `<yourdomain>` (apex)       | Marketing placeholder (built out in Phase 3)              |

See `ROADMAP.md` for the full phased plan.

## Stack
- Next.js 14 App Router + TypeScript (single codebase, subdomain routing via `src/middleware.ts`)
- PostgreSQL + Prisma ORM
- Auth: custom email/password, bcrypt + signed JWT session cookies (no third-party auth provider needed for MVP)
- CSV import/export via `papaparse`

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, FOUNDER_EMAIL/PASSWORD
npm run db:push        # creates tables in your Postgres (use db:migrate instead once you want tracked migrations)
npm run db:seed        # creates the first founder account from FOUNDER_EMAIL/FOUNDER_PASSWORD
npm run dev
```

There are no real subdomains on `localhost` (or on a raw `*.vercel.app` URL
before you attach a custom domain), so just visit `/founder/login` or
`/company/login` directly — any path starting with `/founder` or `/company` is
routed there regardless of host, so the app's own internal links work fine
without subdomains too.

## Deployment: Railway (Postgres) + Vercel (app)

### 1. Create the Railway project (database only)
1. Go to railway.app → **New Project** → **Provision PostgreSQL**.
2. Open the Postgres service → **Connect** tab → copy the `DATABASE_URL`
   (use the **public** connection string, since Vercel is outside Railway's
   private network).
3. That's all Railway hosts for Phase 1 — the app itself runs on Vercel.

### 2. Create the Vercel project (app)
1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Vercel → **Add New Project** → import the repo.
3. Framework preset: Next.js (auto-detected). Build command / output: defaults are fine —
   `npm run build` runs `prisma generate && prisma db push --accept-data-loss && next build`,
   so **the schema is pushed to Postgres automatically on every deploy** from
   Vercel's own build network. (Fine for Phase 1's single-environment setup;
   switch to tracked `prisma migrate deploy` once you need migration history
   or multiple environments.)
4. Add environment variables (Project → Settings → Environment Variables):
   - `DATABASE_URL` — from Railway step 1 (needed at **build time** too, since the
     build step pushes the schema — don't restrict it to "Production" only if
     you also build Preview deployments)
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `ROOT_DOMAIN` — your apex domain, e.g. `maindomain.com`
   - `SETUP_SECRET` — any random string; used once to seed the founder (step 5)
5. Deploy to get a `*.vercel.app` URL and confirm the build is green (the schema
   push happened as part of that build).
6. Seed the first founder account by POSTing to the one-time setup route (this
   runs on Vercel's network, so it can reach Postgres):
   ```bash
   curl -X POST https://<your-deployment>.vercel.app/api/internal/setup-founder \
     -H 'Content-Type: application/json' \
     -d '{"secret":"<SETUP_SECRET>","email":"you@company.com","password":"...","name":"Founder"}'
   ```
   It refuses to run a second time once a founder exists, so it's safe to leave
   deployed.

### 3. Attach your domains to the one Vercel project
In Vercel → Project → Settings → Domains, add:
- `admin.maindomain.com`
- `app.maindomain.com`
- (later, Phase 3) `maindomain.com` for the marketing site

Point each as a CNAME (or the A/ALIAS record Vercel gives you for the apex) at
Vercel per their instructions. Because `middleware.ts` branches on the request
`Host` header, all three domains can be served by this one deployment if you'd
rather not run three projects.

### 3b. Alternative: three separate Vercel projects
If you want each panel independently deployable (its own build/rollback
history, no risk of one panel's traffic affecting another) rather than one
project serving all three hosts, create three Vercel projects from this same
repo/branch instead of one:

1. Import this repo into Vercel **three times** (Add New Project, same repo,
   same branch each time) — e.g. `yourapp-marketing`, `yourapp-admin`,
   `yourapp-app`.
2. Give all three the same `DATABASE_URL`, `AUTH_SECRET`, and `SETUP_SECRET`
   (they're one platform sharing one database — only the panel each project
   *serves* differs, not the data).
3. Set `APP_PANEL` in each project's Environment Variables:
   - marketing project: leave `APP_PANEL` unset
   - admin project: `APP_PANEL=founder`
   - app project: `APP_PANEL=company`
4. Each project gets its own `*.vercel.app` URL immediately — no domain
   needed to test. When you do attach `admin.maindomain.com` /
   `app.maindomain.com` / `maindomain.com` (one per project, not all three on
   one), host-based detection in `middleware.ts` takes over automatically and
   `APP_PANEL` becomes a no-op fallback, so nothing needs to change in code.

### 4. First login
- Go to `https://admin.maindomain.com/login` and sign in with the
  `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` you seeded.
- Create a company. The response shows a one-time temporary password for that
  company's first `COMPANY_ADMIN` — share it with the customer securely (email
  delivery is a Phase 2 item; for now, copy it manually).
- The company admin logs in at `https://app.maindomain.com/login`, then creates
  Data Entry / Data Analyst / Data Manager users from the **Team** page and
  tables from the **Tables** page.
- Every company user created with a temp password (the admin included) is
  forced to set a real password on first login before reaching any other page
  (`mustChangePassword` flag, enforced server-side in the dashboard layout).

## Roles & permissions

| Role           | Create/delete tables | Append rows | Replace all rows | Delete all rows | Export | Manage team |
| -------------- | :---: | :---: | :---: | :---: | :---: | :---: |
| COMPANY_ADMIN  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DATA_MANAGER   | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| DATA_ANALYST   | — | — | — | — | ✅ | — |
| DATA_ENTRY     | — | ✅ | — | — | — | — |

Enforced server-side in every API route (`src/lib/require-session.ts` +
`src/lib/auth.ts#can`), not just hidden in the UI.

## Data model notes

Company "tables" are logical, not raw SQL `CREATE TABLE`s: `TableDef` stores a
JSON column schema, `TableRow` stores each row's data as JSONB. This keeps
multi-tenant data in one physical Postgres schema (`prisma/schema.prisma`)
without per-tenant DDL risk, while still giving each company independently
named, typed tables with create/append/replace/delete-all/delete-table/export —
exactly the Data Ingestion workflow in the reference app. Phase 4 revisits this
if a tenant needs true per-tenant tables at scale.
