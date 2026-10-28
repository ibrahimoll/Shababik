"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { SubmitButton } from "../ui/SubmitButton";
import { Thumb } from "./Thumb";

export type SortItem = { id: string; label: string; sub?: string; image?: string | null };

/** How long to press before a row lifts (a quick swipe still scrolls the page on a phone). */
const HOLD_MS = { touch: 280, mouse: 120 };
/** Moving further than this before the row lifts means the visitor is scrolling, not grabbing. */
const SLOP_PX = 8;
/** Auto-scroll when dragging within this distance of the top / bottom of the screen. */
const EDGE_PX = 90;

type Press = { x: number; y: number; timer: number };
type Drag = { id: string; grabY: number; offset: number; y: number };

/**
 * Reorder a list, then save it in one go. Three ways to move a row:
 * press and hold it, then drag · the ↑ ↓ / Top / Bottom buttons · tap its number and pick a position.
 * Posts the ids in their new order as repeated "ids" fields (plus any `fields`).
 */
export function SortList({
  items: initial,
  action,
  fields = {},
  showThumbs = false,
  cutoff,
  cutoffLabel,
}: {
  items: SortItem[];
  action: (fd: FormData) => Promise<void>;
  fields?: Record<string, string>;
  showThumbs?: boolean;
  /** draw a line after this many items, e.g. "only the first 10 show on the homepage" */
  cutoff?: number;
  cutoffLabel?: string;
}) {
  const [items, setItems] = useState(initial);
  const changed = items.some((it, i) => it.id !== initial[i]?.id);
  const [dragId, setDragId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const rows = useRef(new Map<string, HTMLLIElement>());
  const press = useRef<Press | null>(null);
  const drag = useRef<Drag | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
  };

  /** Keep the lifted row under the finger, and swap it past rows it is dragged over. */
  const place = useCallback((reorder: boolean) => {
    const d = drag.current;
    const el = d && rows.current.get(d.id);
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const naturalTop = rect.top - d.offset;
    if (reorder) {
      const center = d.y - d.grabY + rect.height / 2;
      const list = itemsRef.current;
      const from = list.findIndex((it) => it.id === d.id);
      let to = 0;
      for (const it of list) {
        if (it.id === d.id) continue;
        const r = rows.current.get(it.id)?.getBoundingClientRect();
        if (r && r.top + r.height / 2 < center) to++;
      }
      if (to !== from) {
        const next = [...list];
        const [it] = next.splice(from, 1);
        next.splice(to, 0, it);
        setItems(next);
      }
    }
    d.offset = d.y - d.grabY - naturalTop;
    el.style.transform = `translateY(${d.offset}px)`;
  }, []);

  // after a swap the row's slot moved: re-place it so it stays under the finger
  useLayoutEffect(() => {
    if (drag.current) place(false);
  }, [items, place]);

  const endDrag = useCallback(() => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
    const d = drag.current;
    if (d) {
      const el = rows.current.get(d.id);
      if (el) el.style.transform = "";
      drag.current = null;
      setDragId(null);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    // while dragging near the top / bottom edge, scroll the page so long lists are easy
    const tick = () => {
      const d = drag.current;
      if (!d) return;
      const bottomEdge = window.innerHeight - EDGE_PX - 70; // above the save bar / phone tab bar
      const speed = d.y < EDGE_PX ? -Math.ceil((EDGE_PX - d.y) / 6) : d.y > bottomEdge ? Math.ceil((d.y - bottomEdge) / 6) : 0;
      if (speed) {
        window.scrollBy(0, speed);
        place(true);
      }
      frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const p = press.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP_PX) {
        window.clearTimeout(p.timer); // moved before the hold finished: it's a scroll
        press.current = null;
      }
      if (drag.current) {
        drag.current.y = e.clientY;
        place(true);
      }
    };
    // stop the page from scrolling under the finger while a row is lifted
    const onTouchMove = (e: TouchEvent) => {
      if (drag.current) e.preventDefault();
    };
    const onStart = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("sortlist:dragstart", onStart);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("sortlist:dragstart", onStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [place, endDrag]);

  const onPointerDown = (e: React.PointerEvent<HTMLLIElement>, id: string) => {
    if (e.button !== 0 || drag.current) return;
    if ((e.target as HTMLElement).closest("button, select, a, input")) return; // buttons keep working
    const el = e.currentTarget;
    const startY = e.clientY;
    const timer = window.setTimeout(() => {
      const p = press.current;
      if (!p) return;
      const rect = el.getBoundingClientRect();
      drag.current = { id, grabY: startY - rect.top, offset: 0, y: startY };
      press.current = null;
      setDragId(id);
      navigator.vibrate?.(15);
      window.dispatchEvent(new Event("sortlist:dragstart"));
    }, e.pointerType === "mouse" ? HOLD_MS.mouse : HOLD_MS.touch);
    press.current = { x: e.clientX, y: e.clientY, timer };
  };

  return (
    <form action={action} className="sort-form">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {items.map((it) => (
        <input key={it.id} type="hidden" name="ids" value={it.id} />
      ))}

      <ol className={`sort-rows${dragId ? " is-sorting" : ""}`}>
        {items.map((it, i) => (
          <Fragment key={it.id}>
          {cutoff !== undefined && i === cutoff && (
            <li className="sort-cut" role="separator">{cutoffLabel}</li>
          )}
          <li
            ref={(el) => {
              if (el) rows.current.set(it.id, el);
              else rows.current.delete(it.id);
            }}
            className={`sort-row${dragId === it.id ? " is-dragging" : ""}`}
            onPointerDown={(e) => onPointerDown(e, it.id)}
            onContextMenu={(e) => e.preventDefault()} // a long press shouldn't open the phone's menu
            title="Press and hold to drag"
          >
            <span className="sort-grip" aria-hidden="true">
              <Icon name="menu" size={16} />
            </span>
            {/* tap the number to jump straight to a position (handy for long lists on a phone) */}
            <select
              className="sort-pos"
              value={i + 1}
              onChange={(e) => move(i, Number(e.target.value) - 1)}
              aria-label={`Position of ${it.label}`}
              title="Choose a position"
            >
              {items.map((_, n) => (
                <option key={n} value={n + 1}>{n + 1}</option>
              ))}
            </select>
            {showThumbs && <Thumb src={it.image ?? null} />}
            <div className="row-main">
              <b>{it.label}</b>
              {it.sub && <span className="muted small">{it.sub}</span>}
            </div>
            <div className="sort-actions">
              <button type="button" className="pbtn pbtn-ghost sort-btn hide-xs-flex" onClick={() => move(i, 0)} disabled={i === 0} aria-label={`Move ${it.label} to the top`} title="Move to top">
                Top
              </button>
              <button type="button" className="pbtn pbtn-ghost sort-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${it.label} up`} title="Move up">
                <Icon name="arrow" size={18} className="rot-up" />
              </button>
              <button type="button" className="pbtn pbtn-ghost sort-btn" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move ${it.label} down`} title="Move down">
                <Icon name="arrow" size={18} className="rot-down" />
              </button>
              <button type="button" className="pbtn pbtn-ghost sort-btn hide-xs-flex" onClick={() => move(i, items.length - 1)} disabled={i === items.length - 1} aria-label={`Move ${it.label} to the bottom`} title="Move to bottom">
                Bottom
              </button>
            </div>
          </li>
          </Fragment>
        ))}
      </ol>

      <div className={`sort-save${changed ? " is-changed" : ""}`}>
        <span className="muted small">
          {changed ? "You have unsaved changes." : "Press and hold a row to drag it, or use the arrows."}
        </span>
        <div className="sort-save-actions">
          {changed && (
            <button type="button" className="pbtn pbtn-ghost" onClick={() => setItems(initial)}>
              Undo
            </button>
          )}
          <SubmitButton disabled={!changed} pendingText="Saving…">
            <Icon name="check" size={18} /> Save Order
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
