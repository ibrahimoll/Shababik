"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";

type Item = { id: string; card: ReactNode };

/**
 * Featured products in one sideways-scrolling row with category buttons and ‹ › arrows.
 * Cards are rendered on the server and passed in.
 */
export function FeaturedFilter({
  tabs,
  all,
  allLabel,
  ariaLabel,
  prevLabel,
  nextLabel,
}: {
  tabs: { id: string; label: string; items: Item[] }[];
  all: Item[];
  allLabel: string;
  ariaLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const visible = (active && tabs.find((t) => t.id === active)?.items) || all;
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  // which arrows make sense right now (works for left-to-right and Arabic right-to-left)
  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos < 4, end: pos + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    el.scrollTo({ left: 0 }); // back to the first product when the category changes
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active, update]);

  const page = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <>
      <div className="featured-bar">
        {tabs.length > 1 ? (
          <div className="chips featured-chips" role="group" aria-label={ariaLabel}>
            <button type="button" className="chip" aria-pressed={active === null} onClick={() => setActive(null)}>
              {allLabel}
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="chip"
                aria-pressed={active === tab.id}
                onClick={() => setActive(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {!(edges.start && edges.end) && (
          <div className="featured-arrows">
            <button type="button" className="arrow-btn" onClick={() => page(-1)} disabled={edges.start} aria-label={prevLabel}>
              <Icon name="arrow" size={18} className="arrow-back" />
            </button>
            <button type="button" className="arrow-btn" onClick={() => page(1)} disabled={edges.end} aria-label={nextLabel}>
              <Icon name="arrow" size={18} className="flip-rtl" />
            </button>
          </div>
        )}
      </div>
      <div ref={row} className="product-grid featured-grid">
        {visible.map((i) => (
          <Fragment key={i.id}>{i.card}</Fragment>
        ))}
      </div>
    </>
  );
}
