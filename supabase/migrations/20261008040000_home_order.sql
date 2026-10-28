-- Position of a product in the homepage "Featured Creations → All" view (set on Admin → Arrange).
-- null = not arranged yet: shown after arranged products, taking turns across categories.
alter table public.products
  add column home_order int;
