# Shababik Arts & Crafts — website platform

A lightweight website service for small handmade businesses, built around one sales channel: **WhatsApp**.

| Area | URL | Who |
|---|---|---|
| Public website | `/`, `/products` | Customers (no login) |
| Admin | `/admin/login` → `/admin` | The Shababik owner: products and categories only |
| Super Admin | your secret console address, configured as a hash in `SUPER_ADMIN_PATH_HASH` (or sign in at `/admin/login` with the super admin email) | You: everything about Shababik (status, subscription, admin logins, website texts, social links, WhatsApp) |

There is no cart, checkout, payments or customer accounts. Visitors browse products, tap
**Ask on WhatsApp**, and a pre-filled message such as
*"Hello Shababik, I'm interested in the Personalized Resin Name. Can you give me more information?"* opens in WhatsApp.

**Stack:** Next.js 15 (App Router, server actions) · Supabase (Postgres, Auth, Storage) · plain CSS.
There are three runtime dependencies (Next/React, `@supabase/ssr`, `@supabase/supabase-js`), and no UI or state libraries.

---

## 1. Set up Supabase (free tier is enough)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run these files in order:
   1. `supabase/migrations/20261007000000_init.sql`: tables, security rules and the image bucket
   2. `supabase/migrations/20261007010000_security.sql`: audit log, login lockout, forced password change
   3. `supabase/seed.sql`: the Shababik business, 6 categories and 6 demo products
3. **Authentication → Providers → Email**: keep it enabled. **Authentication → Sign In / Up**: turn off **"Allow new users to sign up"**. Only the Super Admin creates accounts.
4. Copy the keys from **Project Settings → API**.

> With the Supabase CLI you can instead run `npx supabase link` and then `npx supabase db push`, followed by the seed.

## 2. Configure and run

```bash
cp .env.example .env.local      # fill in the Supabase URL/keys and the bootstrap accounts
npm install
npm run bootstrap               # creates the Super Admin + the Shababik admin login
npm run dev                     # http://localhost:3100
```

`DEFAULT_BUSINESS_SLUG=shababik` makes `/` show Shababik when the domain doesn't match any business.

## 3. Deploy (Vercel Hobby or any Node host)

1. Push the repo to GitHub and import it in Vercel.
2. Add the same environment variables. Set `NEXT_PUBLIC_SITE_URL` to the real URL.
3. Add the Shababik domain in Vercel **and** in Super Admin → Settings → Domain.
   Requests to that domain then show the Shababik website.

---

## Who manages what

- **Admin (the owner):** Dashboard, Products (add, edit, delete, photos, featured, availability) and Categories. That's all.
- **Super Admin (you):** one console for Shababik.
  - **Overview:** status, monthly fee and next payment date (with a warning when it's close or overdue), admin logins (add, reset password, disable) and products. It also has **Open Admin** and **View Website**.
  - **Settings:** website texts (hero, about), phone, location, Instagram, Facebook, WhatsApp number, domain, plan, setup fee, monthly fee, next payment date and status.

The console manages the business named in `DEFAULT_BUSINESS_SLUG`. The database still stores everything per `business_id`, so adding more customers later doesn't need a schema change.

## Security model

Permissions are enforced in the **database** (Row Level Security), not only in the UI:

| Rule | Where |
|---|---|
| An admin can only read/write rows where `business_id` = their business | RLS policies via `my_business_id()` |
| An admin can't change any business info (texts, social links, WhatsApp, status, fees), even by calling the API directly | No admin UPDATE policy on `businesses`, plus the `guard_business_columns` trigger |
| Disabled admins and suspended businesses lose all write access | `my_business_id()` returns NULL |
| Visitors only see the safe business columns, never fees or payment dates | `public_businesses` view |
| Product photos: JPG/PNG/WEBP only, max 5 MB, uploads only into the admin's own `<business_id>/` folder | Storage bucket config and policies |
| Account creation, password reset and disable use the service-role key **only** in Super Admin server actions, after `requireSuperAdmin()` | `src/app/super-admin/actions.ts` |
| Every page and server action re-checks the session server-side | `requireAdmin()` / `requireSuperAdmin()` in `src/lib/auth.ts` |

Passwords are handled by Supabase Auth (bcrypt) and are never stored by the app.

**Open Admin**: the Super Admin can enter the Shababik admin panel. A banner shows that you're viewing as Super Admin, with a link back.

### Hidden Super Admin

- `/super-admin` returns **404 to everyone**. The console only answers at a secret address (e.g. `/console-…`), which is never linked, listed in robots.txt or shown on the site. Only its SHA-256 hash is configured (`SUPER_ADMIN_PATH_HASH`, made with `npm run sa-hash`), so leaked env vars or source don't reveal it. Keep the address itself somewhere safe — it can't be recovered from the hash.
- You can also sign in at the normal `/admin/login` with the super admin email — you're sent straight to the console once it has been opened in that browser.
- Only the email in `SUPER_ADMIN_EMAIL` is accepted, checked on every page and action. The database allows **one** super admin account only, and `npm run bootstrap` deletes any other.
- Keep `SUPER_ADMIN_PATH_HASH` and `SUPER_ADMIN_EMAIL` private; set them in the hosting environment variables too.

### Account protection

| Protection | Details |
|---|---|
| **Brute-force lockout** | 5 failed logins on an account, or 30 from one network, block further attempts for 15 minutes. Failures get a random delay, and every failure shows the same message. |
| **Temporary passwords must be changed** | New admins and password resets get a temporary password. On first login the user has to choose their own before they can do anything else. |
| **Password rules** | At least 12 characters, with upper-case and lower-case letters and numbers. Common words are rejected. Changing a password requires the current one and signs out other devices. |
| **Audit log** | Logins, failed logins, password changes, product and category changes, settings, suspensions and admin-account actions are recorded with time and IP address. They show in Super Admin → Overview → Recent activity. Only the Super Admin can read the log, and nobody can write to it through the API. |
| **No public sign-up** | Accounts can only be created by the Super Admin. |
| **Browser security headers** | Strict Content-Security-Policy with a per-request nonce (blocks injected scripts), HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy. The framework isn't advertised. Admin pages are never cached. |
| **Secrets** | The service-role key is only importable from server code (`server-only`). Builds fail if client code tries to import it. |
| **Dependencies** | `npm audit` reports 0 vulnerabilities (PostCSS is pinned to a patched version via `overrides`). |

**In production (Supabase dashboard):** Authentication → Sign In / Up → turn **off** "Allow new users to sign up". Authentication → Policies → set minimum password length **12** with lower, upper and digits. Locally, `supabase/config.toml` already has these settings.


## Website status

| Status | Public website | Admin login |
|---|---|---|
| Active | Normal | Allowed |
| Due Soon | Normal (Super Admin sees a warning) | Allowed |
| Expired | Normal (Super Admin sees an "expired" warning) | Allowed |
| Suspended | "Temporarily unavailable" page | Blocked |

Billing is monthly. "Due Soon" and "Expired" are also worked out automatically from the **next payment date**: 7 days or less means Due Soon, and a past date means Expired. When the customer pays, move the next payment date forward one month in Super Admin → Settings.

## Importing products in bulk

Put photos in `content/products/` and list the products in `content/products/products.json` (name, collection slug, image, description, price or `ask_for_price`, featured). Then run:

```bash
npm run import-products
```

The photos go to the same storage as Admin uploads, so the owner can edit or replace these products afterwards. Products that already exist (same name) are skipped, so it's safe to run again. Point `.env.local` at the live Supabase project to import there.

## Product photos

The admin picks a photo from the phone's library or camera. The browser resizes it to 1600 px at most, converts it to WEBP (JPEG on older Safari), and uploads it straight to Supabase Storage. Pages serve the photos through `next/image` with a consistent 4:5 `object-fit: cover` crop. Replaced or deleted photos are removed from storage.

Seeded demo products have no photos. Until the owner uploads real ones, the site shows soft "window" placeholders.

## Project map

```
supabase/migrations/…_init.sql   schema, RLS, storage
supabase/seed.sql                Shababik demo data
scripts/bootstrap.mjs            creates the Super Admin and Shababik admin logins
src/lib/                         auth guards, Supabase clients, WhatsApp links, helpers
src/components/site/             public website
src/components/panel|sa|ui/      admin, super admin and shared UI
src/app/(site) & s/[slug]        public routes
src/app/admin/                   owner admin (actions.ts = all admin mutations)
src/app/super-admin/             platform console (actions.ts = all platform mutations)
```
