import { Icon } from "@/components/Icon";
import { SettingsForm } from "@/components/panel/SettingsForm";
import { Flash } from "@/components/ui/Flash";
import { requireManagedBusiness } from "@/lib/auth";
import { saveSettings } from "../../actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { business: b } = await requireManagedBusiness();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Website texts, contact links and subscription for {b.name}. Changes appear on the website immediately.</p>
        </div>
      </div>
      <Flash code={msg} />

      <SettingsForm action={saveSettings}>
        <fieldset className="fieldset">
          <legend>Website information</legend>
          <div className="grid-2">
            <label className="field">
              <span>Business Name <em className="req">*</em></span>
              <input name="name" required defaultValue={b.name} />
            </label>
            <label className="field">
              <span>Arabic Name</span>
              <input name="arabic_name" dir="rtl" lang="ar" defaultValue={b.arabic_name ?? ""} />
            </label>
          </div>
          <label className="field">
            <span>Hero Title</span>
            <input name="hero_title" maxLength={120} defaultValue={b.hero_title ?? ""} placeholder="Beautiful handmade pieces for every occasion." />
          </label>
          <label className="field">
            <span>Hero Description</span>
            <textarea name="hero_description" rows={3} maxLength={300} defaultValue={b.hero_description ?? ""} />
          </label>
          <label className="field">
            <span>About Us</span>
            <textarea name="about_text" rows={4} maxLength={800} defaultValue={b.about_text ?? ""} />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Phone (as shown on the website)</span>
              <input name="phone" type="tel" defaultValue={b.phone ?? ""} placeholder="03 113 390" />
            </label>
            <label className="field">
              <span>Location</span>
              <input name="location" defaultValue={b.location ?? ""} placeholder="Lebanon" />
            </label>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Arabic website texts (optional — English is used when empty)</legend>
          <label className="field">
            <span>Hero Title (Arabic)</span>
            <input name="hero_title_ar" dir="rtl" lang="ar" maxLength={120} defaultValue={b.hero_title_ar ?? ""} placeholder="قطع يدوية جميلة لكل مناسبة." />
          </label>
          <label className="field">
            <span>Hero Description (Arabic)</span>
            <textarea name="hero_description_ar" dir="rtl" lang="ar" rows={3} maxLength={300} defaultValue={b.hero_description_ar ?? ""} />
          </label>
          <label className="field">
            <span>About Us (Arabic)</span>
            <textarea name="about_text_ar" dir="rtl" lang="ar" rows={4} maxLength={800} defaultValue={b.about_text_ar ?? ""} />
          </label>
          <label className="field">
            <span>Location (Arabic)</span>
            <input name="location_ar" dir="rtl" lang="ar" defaultValue={b.location_ar ?? ""} placeholder="تول، النبطية" />
          </label>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Social media &amp; WhatsApp</legend>
          <div className="grid-2">
            <label className="field">
              <span className="label-icon"><Icon name="instagram" size={17} /> Instagram URL</span>
              <input name="instagram_url" type="url" defaultValue={b.instagram_url ?? ""} placeholder="https://www.instagram.com/your_page/" />
            </label>
            <label className="field">
              <span className="label-icon"><Icon name="facebook" size={17} /> Facebook URL</span>
              <input name="facebook_url" type="url" defaultValue={b.facebook_url ?? ""} placeholder="https://www.facebook.com/your_page" />
            </label>
            <label className="field">
              <span className="label-icon"><Icon name="whatsapp" size={17} /> WhatsApp Number</span>
              <input name="whatsapp_number" type="tel" inputMode="numeric" defaultValue={b.whatsapp_number ?? ""} placeholder="9613113390" />
              <small className="hint">Country code + number, no spaces or “+”. Product buttons build their WhatsApp messages from this.</small>
            </label>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Address</legend>
          <div className="grid-2">
            <label className="field">
              <span>Slug <em className="req">*</em></span>
              <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={b.slug} />
              <small className="hint">Preview address: /s/{b.slug}</small>
            </label>
            <label className="field">
              <span>Domain</span>
              <input name="domain" defaultValue={b.domain ?? ""} placeholder="shababik.com" />
              <small className="hint">Without https:// — point the domain at the hosting first.</small>
            </label>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Subscription</legend>
          <div className="grid-3">
            <label className="field">
              <span>Plan</span>
              <input name="plan" defaultValue={b.plan} />
            </label>
            <label className="field">
              <span>Setup Fee ($)</span>
              <input name="setup_fee" type="number" min="0" step="1" defaultValue={b.setup_fee} />
            </label>
            <label className="field">
              <span>Monthly Fee ($)</span>
              <input name="monthly_fee" type="number" min="0" step="0.01" defaultValue={b.monthly_fee ?? ""} placeholder="e.g. 10" />
            </label>
            <label className="field">
              <span>Next Payment Date</span>
              <input name="next_payment_date" type="date" defaultValue={b.next_payment_date ?? ""} />
              <small className="hint">Move it forward one month each time the customer pays.</small>
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue={b.status}>
                <option value="active">Active</option>
                <option value="due_soon">Due Soon</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
        </fieldset>
      </SettingsForm>
    </>
  );
}
