# Shababik Arts & Crafts

A lightweight product-catalog website for small handmade businesses, built around one primary sales channel: **WhatsApp**.

Customers browse products on the website and contact the business directly through WhatsApp.

There is no cart, checkout, online payment, or customer account system.

When a visitor clicks **Ask on WhatsApp**, WhatsApp opens with a pre-filled message such as:

> Hello Shababik, I'm interested in the Personalized Resin Name. Can you give me more information?

---

## Overview

| Area | Route | Access |
|---|---|---|
| Public Website | `/`, `/products` | Customers — no login |
| Admin Panel | `/admin/login` → `/admin` | Shababik owner |

The website is intentionally simple:

```text
Customer
   ↓
Website
   ↓
Browse Products
   ↓
Ask on WhatsApp
   ↓
Shababik
```

---

# Technology Stack

- **Next.js 15**
  - App Router
  - Server Actions
- **React**
- **Supabase**
  - PostgreSQL
  - Authentication
  - Storage
  - Row Level Security
- **Plain CSS**

The project intentionally avoids unnecessary UI frameworks and client-side state-management libraries.

Core application dependencies include:

- `next`
- `react`
- `@supabase/ssr`
- `@supabase/supabase-js`

---

# Features

## Public Website

Visitors can:

- Browse product categories
- Browse products
- View product descriptions
- View product prices where available
- See featured products
- Contact Shababik directly through WhatsApp

There is intentionally no:

- Shopping cart
- Checkout
- Online payment
- Customer registration
- Customer login
- Customer order portal

The website acts as an online catalog with WhatsApp as the main conversion channel.

---

# WhatsApp Product Enquiries

Each product includes an **Ask on WhatsApp** action.

For example:

```text
Hello Shababik, I'm interested in the Personalized Resin Name.
Can you give me more information?
```

The product name is automatically included in the WhatsApp message.

This allows customers to move directly from product discovery to a conversation with the business.

---

# Admin Panel

The Shababik owner manages the catalog through:

```text
/admin/login
```

After authentication, the Admin can access:

```text
/admin
```

The Admin interface is intentionally limited to day-to-day catalog management.

---

## Products

The Admin can:

- Add products
- Edit products
- Delete products
- Upload product photos
- Replace product photos
- Mark products as featured
- Control product availability
- Assign products to categories
- Set a product price
- Mark a product as "Ask for Price"

---

## Categories

The Admin can:

- Add categories
- Edit categories
- Delete categories
- Organize products into categories

---

# Getting Started

## 1. Create a Supabase Project

Create a project at:

[https://supabase.com](https://supabase.com)

Open **SQL Editor** and run the database migration files in the required order.

```text
supabase/migrations/
```

Then apply:

```text
supabase/seed.sql
```

The seed contains the initial Shababik demo data, including:

- Business configuration
- Demo categories
- Demo products

---

# Configure Supabase Authentication

In the Supabase dashboard:

## Authentication → Providers → Email

Keep Email authentication enabled.

## Authentication → Sign In / Up

Disable:

```text
Allow new users to sign up
```

The website does not provide public account registration.

---

## Password Policy

For production, configure a strong authentication policy.

Recommended minimum:

- 12 characters
- Lowercase letters
- Uppercase letters
- Numbers

Local Supabase settings can also be configured through:

```text
supabase/config.toml
```

---

# Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then configure the required Supabase and application environment variables.

Typical configuration includes:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_SITE_URL=

DEFAULT_BUSINESS_SLUG=shababik
```

Server-side secrets should never be exposed to browser code.

Refer to `.env.example` for the complete list of required variables.

---

# Install

Install project dependencies:

```bash
npm install
```

---

# Initial Setup

Run the application's setup/bootstrap command if required by the deployment:

```bash
npm run bootstrap
```

Then start the development server:

```bash
npm run dev
```

The project runs locally at:

```text
http://localhost:3100
```

---

# Default Business

The application supports business-specific data internally.

The default website is configured using:

```env
DEFAULT_BUSINESS_SLUG=shababik
```

When no specific business domain is detected, the application loads the Shababik website.

---

# Deployment

The website can be deployed to:

- Vercel
- Another compatible Node.js hosting environment

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Set the production site URL.

Example:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

5. Configure the custom domain in Vercel.
6. Confirm that the production Supabase project is being used.

---

# Product Images

Admins can select product photos from:

- Phone gallery
- Phone camera
- Desktop computer

Before upload, the browser optimizes the image.

The application:

1. Loads the selected image.
2. Resizes large images.
3. Limits the maximum size to approximately `1600px`.
4. Converts supported images to WEBP.
5. Falls back to JPEG where required.
6. Uploads the result to Supabase Storage.

---

## Supported Image Formats

Supported uploads include:

```text
JPG
JPEG
PNG
WEBP
```

Maximum file size:

```text
5 MB
```

---

# Image Display

Product images are displayed consistently using an approximately:

```css
aspect-ratio: 4 / 5;
object-fit: cover;
```

The website uses `next/image` for optimized image delivery.

When a product photo is replaced or a product is deleted, unused images are removed from storage where applicable.

---

# Demo Products

Seeded demo products may not contain actual product photography.

Until real images are uploaded, the website displays placeholder artwork.

The owner can replace these placeholders from the Admin Panel.

---

# Bulk Product Import

Products can also be imported in bulk.

Place product photos inside:

```text
content/products/
```

Define products inside:

```text
content/products/products.json
```

Example:

```json
{
  "name": "Personalized Resin Name",
  "collection_slug": "resin",
  "image": "personalized-resin-name.jpg",
  "description": "Custom handmade resin name.",
  "price": 25,
  "ask_for_price": false,
  "featured": true
}
```

Run:

```bash
npm run import-products
```

The importer:

- Uploads product images
- Creates product records
- Associates products with categories
- Preserves compatibility with Admin editing
- Skips products that already exist when applicable

This makes it suitable for initially loading a large catalog.

---

# Security

Security is enforced at both the application and database layers.

Supabase Row Level Security is used to restrict access to business data.

Key protections include:

- Authenticated Admin access
- Database-level permissions
- Row Level Security
- Business-specific data isolation
- Restricted product-image uploads
- Server-side session validation
- Disabled public signup
- Password policy enforcement
- Protected server-only secrets
- Security headers
- Audit-related security controls

---

# Database-Level Access Control

Admin permissions are not enforced only through the user interface.

Supabase Row Level Security ensures authenticated users can access only the business data they are authorized to manage.

Business separation is based on:

```text
business_id
```

This provides a foundation for supporting additional businesses in the future.

---

# Product Image Security

Uploads are restricted by:

- File type
- File size
- Authentication
- Storage policies
- Business ownership

Product images are stored inside business-specific storage paths.

Example:

```text
<business_id>/
```

This prevents one business account from modifying another business's files.

---

# Authentication Protection

The application includes protection against repeated failed login attempts.

Security controls may include:

- Login-attempt limits
- Temporary lockouts
- Generic login-error responses
- Password-strength requirements
- Forced password changes where applicable
- Session validation

Passwords are handled by Supabase Authentication and are never stored directly by the application.

---

# Browser Security

Production responses include browser-security controls such as:

- Content-Security-Policy
- HTTP Strict Transport Security
- `X-Frame-Options`
- `X-Content-Type-Options`
- Referrer-Policy
- Permissions-Policy

Authenticated pages should not be publicly cached.

---

# Project Structure

```text
.
├── content/
│   └── products/
│       ├── products.json
│       └── ...
│
├── scripts/
│   └── bootstrap.mjs
│
├── supabase/
│   ├── migrations/
│   ├── config.toml
│   └── seed.sql
│
└── src/
    ├── app/
    │   ├── (site)/
    │   ├── s/[slug]/
    │   └── admin/
    │
    ├── components/
    │   ├── site/
    │   ├── panel/
    │   └── ui/
    │
    └── lib/
```

---

# Important Directories

## `supabase/migrations/`

Contains database schema and security configuration, including:

- Tables
- Database functions
- Row Level Security policies
- Storage configuration
- Security-related database logic

---

## `supabase/seed.sql`

Contains the initial Shababik demo content.

---

## `scripts/`

Contains application setup and maintenance scripts.

---

## `src/lib/`

Contains shared application logic such as:

- Authentication utilities
- Supabase clients
- WhatsApp helpers
- Shared server-side utilities

---

## `src/components/site/`

Contains the public website interface.

---

## `src/components/panel/`

Contains the authenticated Admin interface.

---

## `src/app/admin/`

Contains Admin routes and Admin-side server actions.

---

# Supabase CLI

If using the Supabase CLI:

```bash
npx supabase link
npx supabase db push
```

Then apply the required seed data.

---

# Production Checklist

Before launching the website:

- [ ] Create the production Supabase project
- [ ] Apply all required migrations
- [ ] Apply the production seed/configuration
- [ ] Disable public account signup
- [ ] Configure a strong password policy
- [ ] Configure production environment variables
- [ ] Configure `NEXT_PUBLIC_SITE_URL`
- [ ] Configure the custom domain
- [ ] Upload real product photos
- [ ] Remove or replace demo products
- [ ] Review website texts
- [ ] Verify contact information
- [ ] Verify the WhatsApp number
- [ ] Test every **Ask on WhatsApp** button
- [ ] Test Admin login
- [ ] Test product creation
- [ ] Test product editing
- [ ] Test product deletion
- [ ] Test image uploads
- [ ] Verify database access policies
- [ ] Run the production build
- [ ] Run the dependency security check

---

# Dependency Security

Check dependencies before production deployment:

```bash
npm audit
```

Keep the core framework and Supabase dependencies updated as part of regular maintenance.

---

# Philosophy

Shababik is intentionally not a traditional e-commerce platform.

The goal is to give a small handmade business a professional online catalog without introducing unnecessary complexity.

Instead of:

```text
Product
→ Cart
→ Checkout
→ Payment
→ Account
→ Order
```

the experience is:

```text
Product
→ WhatsApp
→ Conversation
→ Sale
```

This keeps the experience simple for both the customer and the business owner.
