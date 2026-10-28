import { Icon } from "../Icon";
import { dict, greetingName, type Locale } from "@/lib/i18n";
import { shortName, waLink } from "@/lib/whatsapp";
import type { PublicBusiness } from "@/lib/types";

export function SocialLinks({
  business,
  locale,
  className = "social",
  whatsapp = true,
}: {
  business: PublicBusiness;
  locale: Locale;
  className?: string;
  whatsapp?: boolean;
}) {
  const t = dict(locale);
  const name = greetingName(business, locale, shortName(business.name));
  return (
    <div className={className}>
      {business.instagram_url && (
        <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" aria-label={t.instagramAria(name)} className="icon-btn">
          <Icon name="instagram" />
        </a>
      )}
      {business.facebook_url && (
        <a href={business.facebook_url} target="_blank" rel="noopener noreferrer" aria-label={t.facebookAria(name)} className="icon-btn">
          <Icon name="facebook" />
        </a>
      )}
      {whatsapp && business.whatsapp_number && (
        <a href={waLink(business.whatsapp_number, t.wa.general(name))} target="_blank" rel="noopener noreferrer" aria-label={t.chatAria(name)} className="icon-btn">
          <Icon name="whatsapp" />
        </a>
      )}
    </div>
  );
}
