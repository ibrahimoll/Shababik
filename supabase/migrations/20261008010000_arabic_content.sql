-- Arabic versions of customer-facing text. All optional: the website falls back to English.
alter table public.products
  add column name_ar text check (name_ar is null or length(name_ar) <= 120),
  add column short_description_ar text check (short_description_ar is null or length(short_description_ar) <= 400);

alter table public.businesses
  add column hero_title_ar text,
  add column hero_description_ar text,
  add column about_text_ar text,
  add column location_ar text;

-- Re-create the public view with the Arabic columns (still no fees / payment dates).
drop view public.public_businesses;
create view public.public_businesses
with (security_barrier = true) as
  select id, name, arabic_name, slug, domain, logo_url, phone, whatsapp_number,
         instagram_url, facebook_url, location, hero_title, hero_description,
         about_text, hero_title_ar, hero_description_ar, about_text_ar, location_ar,
         (status = 'suspended') as is_suspended
  from public.businesses;

revoke all on public.public_businesses from public;
grant select on public.public_businesses to anon, authenticated;
