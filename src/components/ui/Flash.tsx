const MESSAGES: Record<string, { text: string; error?: boolean }> = {
  "product-saved": { text: "Product saved successfully." },
  "product-deleted": { text: "Product deleted successfully." },
  "category-saved": { text: "Category saved successfully." },
  "category-deleted": { text: "Category deleted successfully." },
  "order-saved": { text: "Order saved. The website is updated." },
  "category-in-use": { text: "This category still has products. Move them to another category first, then delete it.", error: true },
  "settings-saved": { text: "Settings saved. The website is updated." },
  "password-changed": { text: "Your password has been changed. Other devices were signed out." },
  "status-updated": { text: "Website status updated." },
  "admin-updated": { text: "Admin access updated." },
  "not-found": { text: "That item could not be found.", error: true },
  error: { text: "Something went wrong. Please try again.", error: true },
};

/** Friendly success / error banner driven by ?msg= after a redirect. */
export function Flash({ code }: { code?: string }) {
  const m = code ? MESSAGES[code] : undefined;
  if (!m) return null;
  return (
    <div className={`flash ${m.error ? "flash-error" : "flash-ok"}`} role={m.error ? "alert" : "status"}>
      {m.text}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="flash flash-error" role="alert">{message}</div>;
}
