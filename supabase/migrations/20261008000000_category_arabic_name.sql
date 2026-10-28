-- Collections are shown in English with their original Arabic name
-- (e.g. "Wool" / "شباك الصوف"). The Arabic name is optional.
alter table public.categories
  add column name_ar text check (name_ar is null or length(name_ar) <= 60);

-- Optional cover photo for a collection card. When empty, the website uses
-- the first product photo in that collection.
-- Only our own images: bundled covers (/collections/...) or the shop's photo storage.
alter table public.categories
  add column image_url text check (
    image_url is null
    or image_url ~ '^/collections/[a-z0-9-]+\.(png|jpe?g|webp)$'
    or image_url ~ '^https?://[^/]+/storage/v1/object/public/product-images/[0-9a-f-]+/[A-Za-z0-9._-]+$'
  );
