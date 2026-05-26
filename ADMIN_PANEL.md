# Single Lender Admin Panel

## Routes

- `/admin` - SaaS admin panel
- `/admin/api/leads` - list leads
- `/admin/api/leads/:id` - lead details and status update
- `/admin/api/leads/export` - CSV export
- `/admin/api/settings` - read and update lender settings
- `/admin/api/analytics` - total leads and form submission metrics

## PostgreSQL Tables

```sql
create table leads (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  country text not null check (country in ('US', 'CA')),
  loan_balance numeric(14, 2) not null,
  desired_action text not null,
  status text not null check (status in ('new', 'contacted', 'closed')) default 'new',
  created_at timestamptz not null default now()
);

create table calculations (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  inputs jsonb not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create table settings (
  id text primary key default 'single_lender',
  default_interest_rate numeric(5, 2) not null,
  loan_types text[] not null,
  countries text[] not null,
  updated_at timestamptz not null default now()
);
```

## Deployment

- Frontend: deploy the Next.js app to Vercel.
- Backend: deploy the NestJS service in `backend/` to Railway or AWS.
- Database: use PostgreSQL on Railway, AWS RDS, Neon, or Supabase.

The current local demo uses an in-memory store in `lib/admin-store.ts`; replace that repository with PostgreSQL queries when wiring production persistence.
