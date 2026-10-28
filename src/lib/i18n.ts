import type { Category, Product, PublicBusiness } from "./types";

export type Locale = "en" | "ar";
export const LOCALE_COOKIE = "lang";

interface Dict {
  skip: string;
  nav: { products: string; collections: string; about: string; contact: string };
  whatsapp: string;
  switchTo: string;
  switchLabel: string;
  chatAria: (n: string) => string;
  instagramAria: (n: string) => string;
  facebookAria: (n: string) => string;
  handmadeIn: (loc: string) => string;
  heroTitle: string;
  heroDesc: string;
  viewProducts: string;
  orderWhatsApp: string;
  personalTouch: string;
  collectionsKicker: string;
  collectionsTitle: string;
  collectionsLead: readonly [string, string];
  pieces: (n: number) => string;
  comingSoon: string;
  featuredKicker: string;
  featuredTitle: string;
  viewAll: string;
  featuredEmpty: string;
  customTitle: string;
  customText: string;
  customButton: string;
  aboutKicker: (n: string) => string;
  aboutTitle: string;
  aboutDefault: (n: string) => string;
  values: readonly [string, string, string];
  madeByHand: string;
  seeInstagram: string;
  howKicker: string;
  howTitle: string;
  howLead: string;
  steps: readonly (readonly [string, string])[];
  startWhatsApp: string;
  contactKicker: string;
  contactTitle: string;
  labels: { whatsapp: string; instagram: string; facebook: string; location: string };
  footerLine: (loc: string) => string;
  unavailableBadge: string;
  notAvailable: string;
  askWhatsApp: string;
  askAboutAria: (p: string) => string;
  askForPrice: string;
  from: (price: string) => string;
  photoSoon: (p: string) => string;
  shopKicker: string;
  allProducts: string;
  all: string;
  filterAria: string;
  collectionEmpty: string;
  askUs: string;
  siteUnavailable: string;
  siteNotFound: string;
  notFoundTitle: string;
  visitInstagram: string;
  homeAria: (n: string) => string;
  wa: { general: (b: string) => string; product: (b: string, p: string) => string; custom: (b: string) => string };
  footer: {
    tagline: string;
    shop: string;
    help: string;
    contact: string;
    howToOrder: string;
    customOrders: string;
    delivery: string;
    returns: string;
    privacy: string;
    rights: string;
    policies: string;
  };
  info: {
    kicker: string;
    title: string;
    lead: string;
    sections: { id: string; title: string; body: string[] }[];
    questions: string;
  };
}

const en: Dict = {
  skip: "Skip to content",
  nav: { products: "Products", collections: "Collections", about: "About", contact: "Contact" },
  whatsapp: "WhatsApp",
  switchTo: "عربي",
  switchLabel: "اقرأ الموقع بالعربية",
  chatAria: (n: string) => `Chat with ${n} on WhatsApp`,
  instagramAria: (n: string) => `Visit ${n} on Instagram`,
  facebookAria: (n: string) => `Visit ${n} on Facebook`,
  handmadeIn: (loc: string) => `Handmade in ${loc}`,
  heroTitle: "Beautiful handmade pieces for every occasion.",
  heroDesc: "Discover handmade gifts, accessories and personalized creations made with care in Lebanon.",
  viewProducts: "View Products",
  orderWhatsApp: "Order on WhatsApp",
  personalTouch: "Handmade with a personal touch",
  collectionsKicker: "Collections",
  collectionsTitle: "Our Collections",
  collectionsLead: ["Every collection is a window — ", " — onto a different craft."] as const,
  pieces: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`,
  comingSoon: "Coming soon",
  featuredKicker: "Featured",
  featuredTitle: "Featured Creations",
  viewAll: "View all products",
  featuredEmpty: "New creations are coming soon. Message us on WhatsApp to see what's available.",
  customTitle: "Have something special in mind?",
  customText: "Send us your idea, preferred colors, name or occasion and we'll help create something personalized for you.",
  customButton: "Start a Custom Order",
  aboutKicker: (n: string) => `About ${n}`,
  aboutTitle: "Handmade with care.",
  aboutDefault: (n: string) =>
    `${n} creates handmade products, gifts, accessories and personalized pieces with attention to detail and creativity.`,
  values: ["Made by hand", "Personalized for you", "Perfect for gifting"] as const,
  madeByHand: "Made by hand",
  seeInstagram: "See more of our work on Instagram",
  howKicker: "How to order",
  howTitle: "Ordering is simple",
  howLead: "No checkout, no accounts — just a friendly conversation.",
  steps: [
    ["Choose your item", "Browse the creations and pick what you love."],
    ["Tell us how to customize it", "Colors, names, sizes or the occasion — just ask."],
    ["Confirm through WhatsApp", "We'll confirm the details and your order with you directly."],
  ] as const,
  startWhatsApp: "Start on WhatsApp",
  contactKicker: "Contact",
  contactTitle: "Say hello",
  labels: { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", location: "Location" },
  footerLine: (loc: string) => `Handmade with care in ${loc}.`,
  unavailableBadge: "Currently Unavailable",
  notAvailable: "Not available right now",
  askWhatsApp: "Ask on WhatsApp",
  askAboutAria: (p: string) => `Ask about ${p} on WhatsApp`,
  askForPrice: "Ask for Price",
  from: (p) => `From ${p}`,
  photoSoon: (p: string) => `${p} — photo coming soon`,
  shopKicker: "Shop the collection",
  allProducts: "All Products",
  all: "All",
  filterAria: "Filter by category",
  collectionEmpty: "New pieces for this collection are coming soon.",
  askUs: "Ask us on WhatsApp",
  siteUnavailable: "This website is temporarily unavailable. Please check back soon.",
  siteNotFound: "We couldn't find the website you're looking for.",
  notFoundTitle: "Website not found",
  visitInstagram: "Visit us on Instagram",
  homeAria: (n: string) => `${n} — home`,
  wa: {
    general: (b: string) => `Hello ${b}, I saw your website and I would like to ask about your products.`,
    product: (b: string, p: string) => `Hello ${b}, I'm interested in the ${p}. Can you give me more information?`,
    custom: (b) => `Hello ${b}, I would like to request a custom handmade order.`,
  },
  footer: {
    tagline: "Handmade gifts, candles, resin, gypsum and craft supplies — made and chosen with care.",
    shop: "Shop",
    help: "Help",
    contact: "Contact us",
    howToOrder: "How to order",
    customOrders: "Custom orders",
    delivery: "Delivery & payment",
    returns: "Returns & exchanges",
    privacy: "Privacy",
    rights: "All rights reserved.",
    policies: "Ordering & policies",
  },
  info: {
    kicker: "Help",
    title: "Ordering & policies",
    lead: "Everything you need to know before you order. If anything is unclear, just message us on WhatsApp.",
    sections: [
      {
        id: "ordering",
        title: "How ordering works",
        body: [
          "Browse the website and message us on WhatsApp about any piece you like.",
          "We confirm availability, price, colors and any personalization with you before we prepare your order.",
          "Custom pieces are made to order, so preparation time depends on the piece — we'll tell you before you confirm.",
        ],
      },
      {
        id: "delivery",
        title: "Delivery & payment",
        body: [
          "Pick-up and delivery options, fees and timing are agreed with you on WhatsApp when you order.",
          "Payment details are confirmed with you before your order is prepared.",
        ],
      },
      {
        id: "returns",
        title: "Returns & exchanges",
        body: [
          "Every piece is handmade, so small differences in color and shape are part of its charm.",
          "Personalized and custom-made pieces can't be returned or exchanged.",
          "If something arrives damaged or isn't what we agreed, message us on WhatsApp as soon as you receive it and we'll find a solution together.",
        ],
      },
      {
        id: "privacy",
        title: "Privacy",
        body: [
          "This website has no customer accounts and doesn't ask for your personal details.",
          "When you message us on WhatsApp, we only use your name and number to handle your order.",
          "We never sell or share your information.",
        ],
      },
    ],
    questions: "Still have a question?",
  },
};

const ar: Dict = {
  skip: "انتقل إلى المحتوى",
  nav: { products: "المنتجات", collections: "المجموعات", about: "من نحن", contact: "تواصل معنا" },
  whatsapp: "واتساب",
  switchTo: "EN",
  switchLabel: "View the website in English",
  chatAria: (n) => `تواصل مع ${n} على واتساب`,
  instagramAria: (n) => `زوروا ${n} على إنستغرام`,
  facebookAria: (n) => `زوروا ${n} على فيسبوك`,
  handmadeIn: (loc) => `صُنع يدوياً في ${loc}`,
  heroTitle: "قطع يدوية جميلة لكل مناسبة.",
  heroDesc: "اكتشفوا هدايا وإكسسوارات وقطعاً مخصّصة مصنوعة يدوياً بحب في لبنان.",
  viewProducts: "تصفّح المنتجات",
  orderWhatsApp: "اطلب عبر واتساب",
  personalTouch: "صُنع يدوياً بلمسة شخصية",
  collectionsKicker: "المجموعات",
  collectionsTitle: "مجموعاتنا",
  collectionsLead: ["كل مجموعة هي ", " على حِرفة مختلفة."] as const,
  pieces: (n) => (n === 1 ? "قطعة واحدة" : n === 2 ? "قطعتان" : n <= 10 ? `${n} قطع` : `${n} قطعة`),
  comingSoon: "قريباً",
  featuredKicker: "مختارات",
  featuredTitle: "أعمال مميّزة",
  viewAll: "عرض كل المنتجات",
  featuredEmpty: "منتجات جديدة قريباً. راسلونا على واتساب لمعرفة المتوفّر.",
  customTitle: "عندك فكرة خاصة؟",
  customText: "أرسلوا لنا فكرتكم والألوان المفضّلة أو الاسم أو المناسبة، ونساعدكم في صنع قطعة مخصّصة لكم.",
  customButton: "ابدأ طلباً خاصاً",
  aboutKicker: (n) => `عن ${n}`,
  aboutTitle: "مصنوع يدوياً بعناية.",
  aboutDefault: (n) => `${n} تصنع منتجات وهدايا وإكسسوارات وقطعاً مخصّصة يدوياً، بعناية بالتفاصيل وإبداع.`,
  values: ["مصنوع يدوياً", "مخصّص لكم", "مثالي كهدية"] as const,
  madeByHand: "صُنع يدوياً",
  seeInstagram: "شاهدوا المزيد من أعمالنا على إنستغرام",
  howKicker: "طريقة الطلب",
  howTitle: "الطلب سهل",
  howLead: "بدون دفع إلكتروني وبدون حسابات — مجرد محادثة ودّية.",
  steps: [
    ["اختاروا القطعة", "تصفّحوا الأعمال واختاروا ما يعجبكم."],
    ["أخبرونا كيف تريدونها", "الألوان، الأسماء، المقاسات أو المناسبة — فقط اسألوا."],
    ["أكّدوا الطلب عبر واتساب", "نؤكّد معكم التفاصيل والطلب مباشرة."],
  ] as const,
  startWhatsApp: "ابدأ عبر واتساب",
  contactKicker: "تواصل معنا",
  contactTitle: "أهلاً وسهلاً",
  labels: { whatsapp: "واتساب", instagram: "إنستغرام", facebook: "فيسبوك", location: "الموقع" },
  footerLine: (loc) => `مصنوع يدوياً بعناية في ${loc}.`,
  unavailableBadge: "غير متوفّر حالياً",
  notAvailable: "غير متوفّر الآن",
  askWhatsApp: "اسأل عبر واتساب",
  askAboutAria: (p) => `اسأل عن ${p} عبر واتساب`,
  askForPrice: "اسأل عن السعر",
  // ⁦…⁩ keeps "$9" left-to-right inside Arabic text
  from: (p) => `ابتداءً من ⁦${p}⁩`,
  photoSoon: (p) => `${p} — الصورة قريباً`,
  shopKicker: "تسوّق المجموعة",
  allProducts: "كل المنتجات",
  all: "الكل",
  filterAria: "تصفية حسب المجموعة",
  collectionEmpty: "قطع جديدة لهذه المجموعة قريباً.",
  askUs: "اسألونا على واتساب",
  siteUnavailable: "هذا الموقع غير متاح مؤقتاً. يرجى المحاولة لاحقاً.",
  siteNotFound: "لم نجد الموقع الذي تبحثون عنه.",
  notFoundTitle: "الموقع غير موجود",
  visitInstagram: "زورونا على إنستغرام",
  homeAria: (n) => `${n} — الصفحة الرئيسية`,
  wa: {
    general: (b) => `مرحباً ${b}، شاهدت موقعكم وأودّ الاستفسار عن منتجاتكم.`,
    product: (b, p) => `مرحباً ${b}، أنا مهتم/ة بـ ${p}. هل يمكنكم إعطائي المزيد من المعلومات؟`,
    custom: (b) => `مرحباً ${b}، أودّ طلب قطعة يدوية حسب الطلب.`,
  },
  footer: {
    tagline: "هدايا يدوية، شموع، رزين، جفصين ومستلزمات أشغال يدوية — مصنوعة ومختارة بعناية.",
    shop: "تسوّق",
    help: "مساعدة",
    contact: "تواصل معنا",
    howToOrder: "طريقة الطلب",
    customOrders: "الطلبات الخاصة",
    delivery: "التوصيل والدفع",
    returns: "الإرجاع والاستبدال",
    privacy: "الخصوصية",
    rights: "جميع الحقوق محفوظة.",
    policies: "الطلب والسياسات",
  },
  info: {
    kicker: "مساعدة",
    title: "الطلب والسياسات",
    lead: "كل ما تحتاجون معرفته قبل الطلب. وإذا كان أي شيء غير واضح، راسلونا على واتساب.",
    sections: [
      {
        id: "ordering",
        title: "كيف يتمّ الطلب",
        body: [
          "تصفّحوا الموقع وراسلونا على واتساب عن أي قطعة تعجبكم.",
          "نؤكّد معكم التوفّر والسعر والألوان وأي تخصيص قبل تحضير طلبكم.",
          "القطع الخاصة تُصنع حسب الطلب، لذلك يختلف وقت التحضير حسب القطعة — ونخبركم به قبل التأكيد.",
        ],
      },
      {
        id: "delivery",
        title: "التوصيل والدفع",
        body: [
          "يتمّ الاتفاق معكم على واتساب على الاستلام أو التوصيل والكلفة والموعد عند الطلب.",
          "نؤكّد معكم طريقة الدفع قبل تحضير الطلب.",
        ],
      },
      {
        id: "returns",
        title: "الإرجاع والاستبدال",
        body: [
          "كل قطعة مصنوعة يدوياً، لذلك الفروقات البسيطة في اللون والشكل جزء من جمالها.",
          "القطع المخصّصة والمصنوعة حسب الطلب لا تُرجع ولا تُستبدل.",
          "إذا وصلت قطعة متضرّرة أو مختلفة عمّا اتفقنا عليه، راسلونا على واتساب فور استلامها وسنجد حلاً معاً.",
        ],
      },
      {
        id: "privacy",
        title: "الخصوصية",
        body: [
          "لا يحتوي هذا الموقع على حسابات للزبائن ولا يطلب بياناتكم الشخصية.",
          "عندما تراسلوننا على واتساب، نستعمل اسمكم ورقمكم فقط لمتابعة طلبكم.",
          "لا نبيع معلوماتكم ولا نشاركها مع أحد.",
        ],
      },
    ],
    questions: "عندكم سؤال؟",
  },
};

export function dict(locale: Locale): Dict {
  return locale === "ar" ? ar : en;
}

export function parseLocale(value: string | null | undefined): Locale | null {
  return value === "ar" || value === "en" ? value : null;
}

/** Swap in the Arabic texts (when filled in) so components can stay language-agnostic. */
export function localizeBusiness(b: PublicBusiness, locale: Locale): PublicBusiness {
  if (locale !== "ar") return b;
  return {
    ...b,
    hero_title: b.hero_title_ar || ar.heroTitle,
    hero_description: b.hero_description_ar || ar.heroDesc,
    about_text: b.about_text_ar || null,
    location: b.location_ar || b.location,
  };
}

export function localizeProducts(products: Product[], locale: Locale): Product[] {
  if (locale !== "ar") return products;
  return products.map((p) => ({
    ...p,
    name: p.name_ar || p.name,
    short_description: p.short_description_ar || p.short_description,
    options: p.options_ar || p.options,
  }));
}

export function localizeCategories(categories: Category[], locale: Locale): Category[] {
  if (locale !== "ar") return categories;
  return categories.map((c) => ({ ...c, name: c.name_ar || c.name }));
}

/** The short shop name used in greetings: "Shababik" / "شبابيك". */
export function greetingName(b: PublicBusiness, locale: Locale, englishShort: string): string {
  return locale === "ar" && b.arabic_name ? b.arabic_name : englishShort;
}
