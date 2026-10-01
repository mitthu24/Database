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

There are no real subdomains on `localhost`, so in dev either:
- visit `http://localhost:3000/founder/login` or `/company/login` directly, or
- append `?panel=founder` / `?panel=company` to any URL to force a panel.

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
3. Framework preset: Next.js (auto-detected). Build command / output: defaults are fine
   (`npm run build`, which runs `prisma generate` first).
4. Add environment variables (Project → Settings → Environment Variables):
   - `DATABASE_URL` — from Railway step 1
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `ROOT_DOMAIN` — your apex domain, e.g. `maindomain.com`
5. Deploy once to get a `*.vercel.app` URL and confirm the build is green.
6. Run the schema push + seed against the Railway database (one-time, from your
   machine or Vercel's CLI):
   ```bash
   DATABASE_URL="<railway-url>" npx prisma db push
   DATABASE_URL="<railway-url>" FOUNDER_EMAIL=you@company.com FOUNDER_PASSWORD='...' npm run db:seed
   ```

### 3. Attach your domains to the one Vercel project
In Vercel → Project → Settings → Domains, add:
- `admin.maindomain.com`
- `app.maindomain.com`
- (later, Phase 3) `maindomain.com` for the marketing site

Point each as a CNAME (or the A/ALIAS record Vercel gives you for the apex) at
Vercel per their instructions. Because `middleware.ts` branches on the request
`Host` header, all three domains are served by this same deployment — you do
**not** need three separate Vercel projects.

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
