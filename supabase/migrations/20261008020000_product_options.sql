-- Optional sizes / options list per product, one per line: "12 colors: 4" (price optional).
alter table public.products
  add column options text check (options is null or length(options) <= 600),
  add column options_ar text check (options_ar is null or length(options_ar) <= 600);
