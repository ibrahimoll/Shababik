export type BusinessStatus = "active" | "due_soon" | "expired" | "suspended";

export interface Business {
  id: string;
  name: string;
  arabic_name: string | null;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  location: string | null;
  hero_title: string | null;
  hero_description: string | null;
  about_text: string | null;
  hero_title_ar: string | null;
  hero_description_ar: string | null;
  about_text_ar: string | null;
  location_ar: string | null;
  status: BusinessStatus;
  plan: string;
  setup_fee: number;
  monthly_fee: number | null;
  next_payment_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Customer-facing subset exposed by the public_businesses view. */
export type PublicBusiness = Pick<
  Business,
  | "id" | "name" | "arabic_name" | "slug" | "domain" | "logo_url" | "phone" | "whatsapp_number"
  | "instagram_url" | "facebook_url" | "location" | "hero_title" | "hero_description" | "about_text"
  | "hero_title_ar" | "hero_description_ar" | "about_text_ar" | "location_ar"
> & { is_suspended: boolean };

export interface Category {
  id: string;
  business_id: string;
  name: string;
  name_ar: string | null;
  image_url: string | null;
  slug: string;
  display_order: number;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  short_description: string | null;
  short_description_ar: string | null;
  options: string | null;
  options_ar: string | null;
  price: number | null;
  ask_for_price: boolean;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  /** position in the homepage "All" view; null = not arranged yet */
  home_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  business_id: string | null;
  name: string | null;
  email: string;
  role: "super_admin" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  business_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}
