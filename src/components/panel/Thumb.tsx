import { Icon } from "../Icon";

export function Thumb({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="thumb" loading="lazy" />
  ) : (
    <span className="thumb thumb-empty">
      <Icon name="image" size={18} />
    </span>
  );
}
