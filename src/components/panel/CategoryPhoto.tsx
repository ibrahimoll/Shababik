"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { createClient } from "@/lib/supabase/browser";
import { setCategoryImage } from "@/app/admin/actions";
import { ALLOWED_IMAGE_TYPES, MAX_INPUT_BYTES, compressImage } from "@/lib/compress-image";

export function CategoryPhoto({
  categoryId,
  categoryName,
  businessId,
  imageUrl,
}: {
  categoryId: string;
  categoryName: string;
  businessId: string;
  imageUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(imageUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(next: string | null, uploadedPath?: string) {
    const res = await setCategoryImage(categoryId, next);
    if (res.error) {
      setError(res.error);
      // don't leave an orphaned upload behind
      if (uploadedPath) await createClient().storage.from("product-images").remove([uploadedPath]);
      return false;
    }
    setUrl(next);
    return true;
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WEBP photo.");
    if (file.size > MAX_INPUT_BYTES) return setError("This photo is too large.");
    setBusy(true);
    try {
      const blob = await compressImage(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${businessId}/categories/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      await save(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl, path);
    } catch {
      setError("Unable to upload image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!confirm(`Remove the photo of “${categoryName}”?`)) return;
    setBusy(true);
    setError(null);
    await save(null);
    setBusy(false);
  }

  return (
    <div className="cat-photo">
      <button
        type="button"
        className="cat-photo-btn"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        title={url ? "Replace photo" : "Add photo"}
        aria-label={url ? `Replace photo of ${categoryName}` : `Add photo to ${categoryName}`}
      >
        {busy ? (
          <span className="spinner spinner-dark" aria-hidden="true" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <Icon name="image" size={22} />
        )}
      </button>
      {url && !busy && (
        <button type="button" className="cat-photo-remove" onClick={onRemove} aria-label={`Remove photo of ${categoryName}`}>
          ×
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {error && <p className="field-error cat-photo-error" role="alert">{error}</p>}
    </div>
  );
}