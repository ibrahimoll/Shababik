"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "../Icon";
import { dict, type Locale } from "@/lib/i18n";
import { waLink } from "@/lib/whatsapp";

/**
 * "My list": customers collect several products and send them in ONE WhatsApp message.
 * Kept in this browser only (localStorage) — no accounts, no server.
 */
type Item = { id: string; name: string; price: string };

const KEY = "order-list";
const MAX = 60;
const EMPTY: Item[] = [];
let cache: Item[] | null = null;
const listeners = new Set<() => void>();

function read(): Item[] {
  if (cache) return cache;
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    // stored data is untrusted: keep only well-formed items
    cache = Array.isArray(raw)
      ? raw
          .filter((i): i is Item => typeof i?.id === "string" && typeof i?.name === "string" && typeof i?.price === "string")
          .slice(0, MAX)
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: Item[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode / storage full: the list still works until the page closes */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null; // changed in another tab
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const useList = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Toggle button on a product card. */
export function AddToList({ id, name, price, locale }: Item & { locale: Locale }) {
  const t = dict(locale).list;
  const items = useList();
  const inList = items.some((i) => i.id === id);
  return (
    <button
      type="button"
      className={`btn card-list${inList ? " is-added" : ""}`}
      aria-pressed={inList}
      onClick={() => write(inList ? read().filter((i) => i.id !== id) : [...read(), { id, name, price }].slice(-MAX))}
    >
      <Icon name={inList ? "check" : "plus"} size={17} /> {inList ? t.added : t.add}
      <span className="sr-only"> — {name}</span>
    </button>
  );
}

/** Bar at the bottom of the screen while the list has items. */
export function ListBar({ locale, whatsapp, greet }: { locale: Locale; whatsapp: string; greet: string }) {
  const t = dict(locale).list;
  const items = useList();
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const message = t.message(greet, items.map((i, n) => `${n + 1}. ${i.name}${i.price ? ` — ${i.price}` : ""}`));
  return (
    <div className="order-bar" role="region" aria-label={t.title}>
      {open && (
        <div className="order-panel" id="order-panel">
          <div className="order-panel-head">
            <b>{t.title}</b>
            <button type="button" className="order-clear" onClick={() => { write([]); setOpen(false); }}>{t.clear}</button>
          </div>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                <span className="order-name">{i.name}</span>
                {i.price && <span className="order-price">{i.price}</span>}
                <button type="button" className="order-remove" aria-label={t.remove(i.name)} onClick={() => write(read().filter((x) => x.id !== i.id))}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="order-bar-row">
        <button type="button" className="order-toggle" aria-expanded={open} aria-controls="order-panel" onClick={() => setOpen(!open)}>
          <span className="order-count">{items.length}</span> {t.items(items.length)}
          <Icon name="arrow" size={15} className={open ? "rot-down" : "rot-up"} />
        </button>
        <a className="btn btn-wa order-send" href={waLink(whatsapp, message)} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={18} /> {t.send}
        </a>
      </div>
    </div>
  );
}
