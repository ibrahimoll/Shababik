-- Security hardening
--  1. Forced password change after a temporary password.
--  2. Login attempt tracking (brute-force lockout).
--  3. Audit log.

-- ---------------------------------------------------------------- 1. forced password change
alter table public.profiles
  add column must_change_password boolean not null default false;

-- ---------------------------------------------------------------- 2. login attempts
-- Written and read only by the server (service role). No API access at all.
create table public.login_attempts (
  id          bigint generated always as identity primary key,
  kind        text not null default 'password' check (kind = 'password'),
  email       text not null,
  ip          text,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index login_attempts_email_idx on public.login_attempts (email, created_at desc);
create index login_attempts_ip_idx on public.login_attempts (ip, created_at desc);
alter table public.login_attempts enable row level security;
-- (no policies: anon/authenticated can never read or write it)

-- ---------------------------------------------------------------- 3. audit log
create table public.audit_log (
  id           bigint generated always as identity primary key,
  business_id  uuid references public.businesses (id) on delete set null,
  actor_id     uuid,
  actor_email  text,
  actor_role   text,
  action       text not null,
  target       text,
  details      jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);
create index audit_log_business_idx on public.audit_log (business_id, created_at desc);
alter table public.audit_log enable row level security;

-- Only the super admin can read it; only the server writes it.
create policy "super admin reads audit log" on public.audit_log
  for select to authenticated
  using (public.is_super_admin());
