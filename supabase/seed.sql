-- Demo data for Shababik Arts & Crafts.
-- Admin / Super Admin accounts are created with `npm run bootstrap` (see README),
-- because they need the Supabase Auth API.

insert into public.businesses (
  id, name, arabic_name, slug, domain, logo_url, phone, whatsapp_number,
  instagram_url, facebook_url, location, hero_title, hero_description, about_text,
  status, plan, setup_fee, monthly_fee, next_payment_date,
  hero_title_ar, hero_description_ar, about_text_ar, location_ar
) values (
  '11111111-1111-4111-8111-111111111111',
  'Shababik Arts & Crafts',
  'شبابيك',
  'shababik',
  null,
  '/brand/logo.png',
  '03 113 390',
  '9613113390',
  'https://www.instagram.com/shababik_art_crafts/?hl=ar',
  'https://www.facebook.com/people/%D8%B4%D8%A8%D8%A7%D8%A8%D9%8A%D9%83-Arts-Crafts/100063450356768/',
  'Toul, Nabatieh',
  'Beautiful handmade pieces for every occasion.',
  'Discover handmade gifts, accessories and personalized creations made with care in Lebanon.',
  'Shababik Arts & Crafts creates handmade products, gifts, accessories and personalized pieces with attention to detail and creativity.',
  'active',
  'Basic Website',
  100,
  null, -- monthly fee: set it in Super Admin → Settings
  (current_date + interval '1 month')::date,
  'قطع يدوية جميلة لكل مناسبة.',
  'اكتشفوا هدايا وإكسسوارات وقطعاً مخصّصة مصنوعة يدوياً بحب في لبنان.',
  'شبابيك للفنون والأشغال اليدوية تصنع منتجات وهدايا وإكسسوارات وقطعاً مخصّصة يدوياً، بعناية بالتفاصيل وإبداع.',
  'تول، النبطية'
) on conflict (id) do nothing;

-- Collections: each one is a "window" (شبّاك) of the shop.
insert into public.categories (id, business_id, name, name_ar, slug, display_order) values
  ('22222222-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Wool', 'شباك الصوف', 'wool', 1),
  ('22222222-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Resin', 'شباك الرزين', 'resin', 2),
  ('22222222-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Candles', 'شباك الشمع', 'candles', 3),
  ('22222222-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Soap', 'شباك الصابون', 'soap', 4),
  ('22222222-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Mastic & Incense', 'شباك المستكة والبخور', 'mastic-incense', 5),
  ('22222222-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Gypsum', 'شباك الجفصين', 'gypsum', 6),
  ('22222222-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Embroidery', 'شباك التطريز', 'embroidery', 7),
  ('22222222-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Handicrafts', 'شباك الأشغال اليدوية', 'handicrafts', 8),
  ('22222222-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Beads', 'شباك الخرز', 'beads', 9),
  ('22222222-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Mirrors', 'شباك المرايا', 'mirrors', 10)
on conflict (id) do nothing;

-- collection cover photos (optional)
update public.categories set image_url = '/collections/' || slug || '.png'
  where business_id = '11111111-1111-4111-8111-111111111111';

-- image_url is null → the website shows an elegant placeholder until a real photo is uploaded.
insert into public.products (business_id, category_id, name, slug, short_description, price, ask_for_price, is_available, is_featured, display_order) values
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000001', 'Crochet Wool Piece', 'crochet-wool-piece', 'Hand-crocheted wool piece, made in the colors you choose.', null, true, true, true, 1),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000002', 'Personalized Resin Name', 'personalized-resin-name', 'Resin name piece with your choice of colors and details.', null, true, true, true, 2),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000003', 'Decorative Candle', 'decorative-candle', 'Handmade candle décor for your home.', 15, false, true, true, 3),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000004', 'Handmade Soap', 'handmade-soap', 'Handmade decorative soap, lovely as a gift.', null, true, true, true, 4),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000005', 'Mastic & Incense Set', 'mastic-incense-set', 'A handmade mastic and incense set for your home or as a gift.', null, true, true, true, 5),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000006', 'Gypsum Decoration', 'gypsum-decoration', 'Handmade gypsum decorative piece.', null, true, true, false, 6),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000007', 'Embroidered Name Piece', 'embroidered-name-piece', 'Hand-embroidered piece with an Arabic or English name.', null, true, true, false, 7),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000008', 'Handmade Gift Box', 'handmade-gift-box', 'A handmade gift box, prepared for your occasion.', null, true, true, false, 8),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000009', 'Beaded Accessory', 'beaded-accessory', 'Handmade beaded accessory in your favorite colors.', null, true, true, false, 9),
  ('11111111-1111-4111-8111-111111111111', '22222222-0000-4000-8000-000000000010', 'Decorative Mirror', 'decorative-mirror', 'Handmade decorated mirror.', null, true, false, true, 10)
on conflict do nothing;
