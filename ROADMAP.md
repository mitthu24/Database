# Database SaaS — Roadmap

A multi-tenant data-ingestion platform: a **founder (super admin) panel** creates
company accounts; each **company panel** lets a company admin create limited-access
users (Data Entry, Data Analyst, Data Manager) and manage its own tables
(create, append, replace, delete-all-rows, delete-table, export CSV) backed by SQL
(PostgreSQL via Prisma).

Domains (final):
- `maindomain.com` — marketing website (built later, Phase 3)
- `admin.maindomain.com` — founder panel
- `app.maindomain.com` — company panel

## Phase 0 — Architecture (this commit)
- Next.js 14 (App Router) + TypeScript, single codebase, subdomain-based routing
  via `middleware.ts` (keeps one Vercel project/deploy instead of three).
- PostgreSQL on Railway, Prisma ORM.
- Tables are modeled as **logical tables**: `TableDef` (name + JSON column schema)
  + `TableRow` (JSONB row data) per company, rather than raw per-tenant `CREATE TABLE`
  DDL. This gives every company its own named, typed "tables" (like `sp_users`,
  `sp_visits` in the reference app) without the operational risk of dynamic DDL,
  while keeping an upgrade path to real per-tenant tables in Phase 4 if needed.
- Auth: custom email+password auth, bcrypt hashing, JWT session cookies (`jose`),
  two separate cookies (`founder_session`, `company_session`) so a founder login
  and a company login never collide.
- RBAC: `COMPANY_ADMIN` (full control), `DATA_MANAGER` (create/delete tables,
  append/replace/delete rows, export), `DATA_ANALYST` (read + export only),
  `DATA_ENTRY` (append rows only).

## Phase 1 — MVP (this commit)
Goal: founder can create a company; company admin can create users and tables;
data entry/export works end to end; deployed and usable.

- [x] Prisma schema: Founder, Company, CompanyUser, TableDef, TableRow, IngestionLog
- [x] Auth: signup-free (founder seeded), login/logout for founder + company users
- [x] Founder panel: login, list companies, create company (+ auto-creates the
      company's first COMPANY_ADMIN user with a generated password shown once)
- [x] Company panel: login, Team page (create/deactivate users, assign role),
      Tables page:
  - Create table (name + columns: text/number/date/boolean)
  - Upload CSV → **Append** (adds rows) or **Replace** (wipes + reloads), matching
    columns by header name
  - **Delete all data** (empties the table, keeps schema)
  - **Delete table** (drops the table definition + all rows)
  - **Export CSV** (downloads current rows)
  - Ingestion log per table (who/when/action/row count)
- [x] Permission checks enforced server-side on every API route, not just hidden
      in the UI
- [x] Seed script to bootstrap the first founder account from env vars
- [x] Deployment docs for Railway (Postgres) + Vercel (app), with the
      admin/app subdomain wiring

Out of scope for Phase 1 (explicitly deferred): billing, email delivery (invite
emails), password reset flow, audit UI beyond a simple log table, file size
limits/streaming CSV import, column type validation beyond basic casting.

## Phase 2 — Hardening & RBAC depth
- [x] Forced password change on first login for company users created with a
      temp password (`mustChangePassword` flag, `/company/change-password`)
- [x] Founder can suspend/reactivate a company (blocks login immediately, even
      for an already-active session, via a per-request status check)
- [x] Client-side search box on the table data viewer (filters loaded rows)
- [ ] Email delivery for invites + password reset (Resend/Postgres-backed tokens)
- [ ] Per-table granular permissions (e.g. restrict a Data Entry user to specific
  tables, not all tables in the company)
- [ ] Server-side pagination and column sorting in table viewers (current MVP
  loads the latest 200/500 rows and searches only within that page — fine for
  small/medium datasets, not for 50k+ rows)
- [ ] Full audit trail UI (filter by user/action/date) built on `IngestionLog`
- [ ] Rate limiting + basic abuse protection on auth routes

## Phase 3 — Marketing site & self-serve
- Build `maindomain.com` marketing/landing site (separate lightweight Next.js
  route group or its own project)
- Self-serve signup flow (replace founder-manual company creation with a
  request/approval flow, still founder-gated)
- Billing/subscription (Stripe) tied to Company
- Branding/theming per company (logo, colors) on the company panel

## Phase 4 — Scale & advanced data features
- Optional real per-tenant Postgres schemas/tables for companies with heavy
  volume (replacing the JSONB row model for those tenants only)
- Scheduled/recurring imports (e.g. pull a CSV from an SFTP/API on a cron)
- Dashboards & charts on top of table data (mirrors the "Combined Reports" /
  "Visit Analytics" style views in the reference screenshots)
- Public API + API keys per company for programmatic ingestion
- Role-based dashboards (KPI/KRA-style reports) and cross-table reporting

## Deployment model
- **Railway**: hosts the PostgreSQL database only (Phase 1). `DATABASE_URL` is
  copied into Vercel's env vars.
- **Vercel**: hosts the single Next.js app. Two domains are attached to the
  *same* Vercel project — `admin.maindomain.com` and `app.maindomain.com` (and
  later the apex `maindomain.com` for marketing) — `middleware.ts` decides which
  UI to serve based on the request host, so there is one codebase/deploy to
  maintain, not three.
- See `README.md` for exact step-by-step setup.
