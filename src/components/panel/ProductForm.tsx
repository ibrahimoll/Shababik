"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { SubmitButton } from "../ui/SubmitButton";
import { FormError } from "../ui/Flash";
import { useKeepForm } from "../ui/useKeepForm";
import { createClient } from "@/lib/supabase/browser";
import { saveProduct } from "@/app/admin/actions";
import type { Category, Product } from "@/lib/types";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // phone photos can be big; we shrink them before upload
const MAX_SIDE = 1600;

/** Resize + re-encode in the browser so the website stays fast (~200–400 KB per photo). */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  // some older Safari versions can't encode WEBP — fall back to JPEG
  const webp = await toBlob("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode failed");
  return jpeg;
}

export function ProductForm({
  businessId,
  categories,
  product,
  defaultCategoryId,
}: {
  businessId: string;
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
}) {
  const { state, pending, onSubmit } = useKeepForm(saveProduct);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [askForPrice, setAskForPrice] = useState(product?.ask_for_price ?? false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG or WEBP photo.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setUploadError("This photo is too large. Please choose a smaller one.");
      return;
    }
    setUploading(true);
    try {
      const blob = await compress(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (error) throw error;
      setImageUrl(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    } catch {
      setUploadError("Unable to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="tag" size={32} />
        <p>Before adding products, create at least one category (for example “Gifts”).</p>
        <Link href="/admin/categories" className="pbtn pbtn-primary">Create Your First Category</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card product-form">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />
      <FormError message={state.error} />

      {/* PHOTO */}
      <div className="field">
        <span>Product Photo <em className="req">*</em></span>
        <div className="photo-picker">
          {imageUrl ? (
            <div className="photo-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Product photo preview" />
            </div>
          ) : (
            <button type="button" className="photo-empty" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <span className="spinner spinner-dark" aria-hidden="true" /> : <Icon name="image" size={34} />}
              <b>{uploading ? "Uploading photo…" : "Tap to add a photo"}</b>
              <small>JPG, PNG or WEBP</small>
            </button>
          )}
          {imageUrl && (
            <div className="photo-actions">
              <button type="button" className="pbtn pbtn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <><span className="spinner spinner-dark" aria-hidden="true" /> Uploading…</> : "Replace photo"}
              </button>
              <button type="button" className="pbtn pbtn-ghost pbtn-danger-text" onClick={() => setImageUrl(null)} disabled={uploading}>
                Remove
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPick}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose product photo"
          />
        </div>
        {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
      </div>

      <label className="field">
        <span>Product Name <em className="req">*</em></span>
        <input name="name" required maxLength={120} defaultValue={product?.name} placeholder="e.g. Personalized Resin Name" />
      </label>

      <label className="field">
        <span>Name in Arabic <small className="hint">(optional, shown on the Arabic website)</small></span>
        <input name="name_ar" maxLength={120} dir="rtl" lang="ar" defaultValue={product?.name_ar ?? ""} placeholder="مثال: اسم من الرزين" />
      </label>

      <label className="field">
        <span>Category <em className="req">*</em></span>
        <select name="category_id" required defaultValue={product?.category_id ?? defaultCategoryId ?? ""}>
          <option value="" disabled>Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.name_ar ? ` — ${c.name_ar}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Short Description</span>
        <textarea name="short_description" rows={3} maxLength={400} defaultValue={product?.short_description ?? ""} placeholder="One or two sentences about the piece" />
      </label>

      <label className="field">
        <span>Description in Arabic <small className="hint">(optional)</small></span>
        <textarea name="short_description_ar" rows={3} maxLength={400} dir="rtl" lang="ar" defaultValue={product?.short_description_ar ?? ""} />
      </label>

      <label className="field">
        <span>Sizes / options <small className="hint">(optional, one per line)</small></span>
        <textarea
          name="options"
          rows={4}
          maxLength={600}
          defaultValue={product?.options ?? ""}
          placeholder={"12 colors: 4\n18 colors: 5\n24 colors: 6.50"}
        />
        <small className="hint">Write the option, a colon, then the price in $ — or just the option (e.g. “Gloss”). The website shows a neat list and “From $…”.</small>
      </label>

      <label className="field">
        <span>Sizes / options in Arabic <small className="hint">(optional)</small></span>
        <textarea name="options_ar" rows={4} maxLength={600} dir="rtl" lang="ar" defaultValue={product?.options_ar ?? ""} placeholder={"12 لون: 4\n18 لون: 5"} />
      </label>

      <div className="field">
        <span>Price</span>
        <div className="price-row">
          <label className={`price-input${askForPrice ? " is-disabled" : ""}`}>
            <span aria-hidden="true">$</span>
            <input
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              disabled={askForPrice}
              defaultValue={product?.price ?? ""}
              aria-label="Price in US dollars"
            />
          </label>
          <label className="check">
            <input type="checkbox" name="ask_for_price" checked={askForPrice} onChange={(e) => setAskForPrice(e.target.checked)} />
            <span>Ask for Price</span>
          </label>
        </div>
      </div>

      <fieldset className="field">
        <legend>Availability</legend>
        <div className="segmented">
          <label>
            <input type="radio" name="is_available" value="yes" defaultChecked={product?.is_available ?? true} />
            <span>Available</span>
          </label>
          <label>
            <input type="radio" name="is_available" value="no" defaultChecked={product ? !product.is_available : false} />
            <span>Unavailable</span>
          </label>
        </div>
      </fieldset>

      <label className="check check-card">
        <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} />
        <span>
          <b>Featured Product</b>
          <small>Show it in “Featured Creations” on the homepage</small>
        </span>
      </label>

      <div className="form-actions">
        <Link href="/admin/products" className="pbtn pbtn-ghost">Cancel</Link>
        <SubmitButton pending={pending} disabled={uploading} pendingText="Saving…">
          {product ? "Save Changes" : "Save Product"}
        </SubmitButton>
      </div>
    </form>
  );
}
