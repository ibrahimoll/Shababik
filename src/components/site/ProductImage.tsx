import Image from "next/image";

const tints = ["#d6f5f5", "#cfe4f6", "#e3f6f8", "#d4e3f2", "#dbf2f6", "#e0ecf8"];

/** Real photo when uploaded, otherwise a soft "window" placeholder. Always a 4:5 cover crop. */
export function ProductImage({
  src,
  alt,
  index = 0,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  index?: number;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="cover-img" />;
  }
  return (
    <div className="ph" style={{ background: tints[index % tints.length] }} role="img" aria-label={alt}>
      <div className="ph-arch">
        <span>{alt}</span>
      </div>
    </div>
  );
}
