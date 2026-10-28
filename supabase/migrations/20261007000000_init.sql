-- Shababik platform — initial schema
-- Multi-business ready: every product / category / admin belongs to a business_id.
-- Security is enforced here with Row Level Security, not only in the UI.

create extension if not exists pgcrypto;

-- =========================================================
-- TABLES
-- =========================================================

create table public.businesses (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  arabic_name      text,
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  domain           text unique,
  logo_url         text,
  phone            text,
  whatsapp_number  text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{6,15}$'),
  instagram_url    text,
  facebook_url     text,
  location         text,
  hero_title       text,
  hero_description text,
  about_text       text,
  status           text not null default 'active'
                   check (status in ('active', 'due_soon', 'expired', 'suspended')),
  plan             text not null default 'Basic Website',
  setup_fee        numeric(10, 2) not null default 0,
  monthly_fee      numeric(10, 2) check (monthly_fee is null or monthly_fee >= 0),
  next_payment_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  business_id   uuid references public.businesses (id) on delete cascade,
  name          text,
  email         text not null,
  role          text not null check (role in ('super_admin', 'admin')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  -- an admin must always belong to exactly one business; a super admin to none
  constraint profiles_role_business check (
    (role = 'admin' and business_id is not null) or
    (role = 'super_admin' and business_id is null)
  )
);

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  name          text not null,
  slug          text not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  unique (business_id, slug),
  unique (id, business_id)
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  category_id       uuid not null,
  name              text not null,
  slug              text not null,
  short_description text,
  price             numeric(10, 2) check (price is null or price >= 0),
  ask_for_price     boolean not null default false,
  image_url         text,
  is_available      boolean not null default true,
  is_featured       boolean not null default false,
  display_order     int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (business_id, slug),
  -- composite FK: a product can only use a category of the SAME business,
  -- and a category with products cannot be deleted
  foreign key (category_id, business_id)
    references public.categories (id, business_id) on delete restrict,
  constraint products_price_or_ask check (ask_for_price or price is not null)
);

create index products_business_idx on public.products (business_id, is_featured, created_at desc);
create index categories_business_idx on public.categories (business_id, display_order);
create index profiles_business_idx on public.profiles (business_id);

-- =========================================================
-- updated_at
-- =========================================================

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger businesses_touch before update on public.businesses
  for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- =========================================================
-- AUTH HELPERS (security definer so policies can call them
-- without recursing through RLS)
-- =========================================================

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'super_admin'
      and p.is_active
  );
$$;

-- The business the signed-in admin may manage.
-- Returns NULL when the admin is disabled or the business is suspended,
-- which automatically blocks every admin write.
create or replace function public.my_business_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.business_id
  from public.profiles p
  join public.businesses b on b.id = p.business_id
  where p.auth_user_id = auth.uid()
    and p.role = 'admin'
    and p.is_active
    and b.status <> 'suspended';
$$;

-- Whether a business website is publicly visible.
create or replace function public.business_is_public(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.businesses b where b.id = bid and b.status <> 'suspended'
  );
$$;

-- =========================================================
-- Admins may edit their website info but NEVER subscription /
-- status / domain / slug fields — even through direct API calls.
-- =========================================================

-- Not security definer on purpose: current_user must be the caller's role.
create or replace function public.guard_business_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Only API users (anon / authenticated) are restricted. The service role,
  -- the SQL editor / migrations (postgres) and super admins may change anything.
  if current_user not in ('anon', 'authenticated') or public.is_super_admin() then
    return new;
  end if;
  if new.status       is distinct from old.status
  or new.plan         is distinct from old.plan
  or new.setup_fee    is distinct from old.setup_fee
  or new.monthly_fee  is distinct from old.monthly_fee
  or new.next_payment_date is distinct from old.next_payment_date
  or new.domain       is distinct from old.domain
  or new.slug         is distinct from old.slug
  or new.id           is distinct from old.id then
    raise exception 'permission denied: platform-managed field' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger businesses_guard before update on public.businesses
  for each row execute function public.guard_business_columns();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.businesses enable row level security;
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- businesses: no public access to the raw table (it holds fees / renewal info).
create policy "super admin manages businesses" on public.businesses
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admin reads own business" on public.businesses
  for select to authenticated
  using (id = public.my_business_id());

-- Admins do NOT update the business row: website texts, social links and
-- WhatsApp are managed by the Super Admin only. (No admin UPDATE policy.)

-- profiles: users see their own row; only super admin manages them.
create policy "read own profile" on public.profiles
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_super_admin());

create policy "super admin manages profiles" on public.profiles
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- categories
create policy "public reads categories" on public.categories
  for select to anon, authenticated
  using (public.business_is_public(business_id));

create policy "admin manages own categories" on public.categories
  for all to authenticated
  using (business_id = public.my_business_id() or public.is_super_admin())
  with check (business_id = public.my_business_id() or public.is_super_admin());

-- products
create policy "public reads products" on public.products
  for select to anon, authenticated
  using (public.business_is_public(business_id));

create policy "admin manages own products" on public.products
  for all to authenticated
  using (business_id = public.my_business_id() or public.is_super_admin())
  with check (business_id = public.my_business_id() or public.is_super_admin());

-- =========================================================
-- PUBLIC VIEW — only safe, customer-facing business columns.
-- (No fees, renewal dates or plan.)
-- =========================================================

create view public.public_businesses
with (security_barrier = true) as
  select id, name, arabic_name, slug, domain, logo_url, phone, whatsapp_number,
         instagram_url, facebook_url, location, hero_title, hero_description,
         about_text, (status = 'suspended') as is_suspended
  from public.businesses;

revoke all on public.public_businesses from public;
grant select on public.public_businesses to anon, authenticated;

-- =========================================================
-- STORAGE — product images
-- Files live at  product-images/<business_id>/<file>.
-- Only JPG / PNG / WEBP up to 5 MB.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "product images: admin uploads to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images' and (
      (storage.foldername(name))[1] = public.my_business_id()::text
      or public.is_super_admin()
    )
  );

create policy "product images: admin updates own folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images' and (
      (storage.foldername(name))[1] = public.my_business_id()::text
      or public.is_super_admin()
    )
  );

-- Storage needs SELECT on a file to update or delete it (otherwise removal silently does nothing).
create policy "product images: admin reads own folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-images' and (
      (storage.foldername(name))[1] = public.my_business_id()::text
      or public.is_super_admin()
    )
  );

create policy "product images: admin deletes own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images' and (
      (storage.foldername(name))[1] = public.my_business_id()::text
      or public.is_super_admin()
    )
  );
