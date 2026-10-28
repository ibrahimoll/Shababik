import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Thumb } from "@/components/panel/Thumb";
import { CredentialAction } from "@/components/sa/CredentialAction";
import { StatusBadge } from "@/components/sa/StatusBadge";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Flash } from "@/components/ui/Flash";
import { requireManagedBusiness } from "@/lib/auth";
import { daysUntil, effectiveStatus, formatDate, formatPrice, siteUrl } from "@/lib/utils";
import type { AuditEntry, Category, Product, Profile } from "@/lib/types";
import { addAdmin, openAdmin, resetAdminPassword, setAdminActive, setStatus } from "../actions";
import { saPath } from "@/lib/sa-link";

const money = (n: number) => `$${Number(n).toLocaleString("en-US")}`;

export default async function SuperAdminOverview({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { supabase, business: b } = await requireManagedBusiness();

  const [{ data: admins }, { data: products }, { data: categories }, { data: activity }] = await Promise.all([
    supabase.from("profiles").select("*").eq("business_id", b.id).order("created_at"),
    supabase.from("products").select("*").eq("business_id", b.id).order("created_at", { ascending: false }),
    supabase.from("categories").select("*").eq("business_id", b.id).order("display_order"),
    supabase
      .from("audit_log")
      .select("*")
      .or(`business_id.eq.${b.id},business_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);
  const adminList = (admins ?? []) as Profile[];
  const productList = (products ?? []) as Product[];
  const categoryList = (categories ?? []) as Category[];
  const catName = new Map(categoryList.map((c) => [c.id, c.name]));
  const status = effectiveStatus(b);
  const url = siteUrl(b);
  const days = b.next_payment_date ? daysUntil(b.next_payment_date) : null;

  const stats = [
    { label: "Products", value: productList.length, icon: "box" as const },
    { label: "Featured", value: productList.filter((p) => p.is_featured).length, icon: "star" as const },
    { label: "Unavailable", value: productList.filter((p) => !p.is_available).length, icon: "eyeOff" as const },
    { label: "Categories", value: categoryList.length, icon: "tag" as const },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            {b.name} <StatusBadge business={b} />
          </h1>
          <p className="muted">{b.domain ?? `Preview address: /s/${b.slug}`}</p>
        </div>
        <div className="head-actions">
          <a href={url} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-ghost">
            <Icon name="external" size={17} /> View Website
          </a>
          <form action={openAdmin}>
            <button type="submit" className="pbtn pbtn-primary">
              <Icon name="grid" size={17} /> Open Admin
            </button>
          </form>
        </div>
      </div>
      <Flash code={msg} />

      {status === "expired" && (
        <div className="flash flash-error" role="alert">
          <Icon name="alert" size={18} /> Payment overdue{b.next_payment_date ? ` since ${formatDate(b.next_payment_date)}` : ""}. Update the next payment date in Settings or suspend the website.
        </div>
      )}
      {status === "due_soon" && days !== null && (
        <div className="flash flash-warn" role="status">
          <Icon name="alert" size={18} /> Next payment due {days === 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`} ({formatDate(b.next_payment_date)}).
        </div>
      )}

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat stat-icon">
            <Icon name={s.icon} size={20} />
            <span>{s.label}</span>
            <b>{s.value}</b>
          </div>
        ))}
      </div>

      <div className="detail-grid">
        <section className="card">
          <div className="card-head">
            <h2>Subscription</h2>
            <Link href={await saPath("/settings")} className="text-link">Edit</Link>
          </div>
          <dl className="kv">
            <dt>Plan</dt>
            <dd>{b.plan}</dd>
            <dt>Setup Fee</dt>
            <dd>{money(b.setup_fee)}</dd>
            <dt>Monthly Fee</dt>
            <dd>{b.monthly_fee == null ? <span className="muted">Not set</span> : `${money(b.monthly_fee)} / month`}</dd>
            <dt>Next Payment</dt>
            <dd>
              {formatDate(b.next_payment_date)}
              {days !== null && days >= 0 && <span className="muted small"> · in {days} days</span>}
            </dd>
            <dt>Website</dt>
            <dd><a href={url} target="_blank" rel="noopener noreferrer">{b.domain ?? `/s/${b.slug}`}</a></dd>
            <dt>WhatsApp</dt>
            <dd>{b.whatsapp_number ? `+${b.whatsapp_number}` : "—"}</dd>
            <dt>Instagram</dt>
            <dd>{b.instagram_url ? <a href={b.instagram_url} target="_blank" rel="noopener noreferrer">Open</a> : "—"}</dd>
            <dt>Facebook</dt>
            <dd>{b.facebook_url ? <a href={b.facebook_url} target="_blank" rel="noopener noreferrer">Open</a> : "—"}</dd>
          </dl>
          <div className="btn-row">
            {b.status === "suspended" ? (
              <form action={setStatus}>
                <input type="hidden" name="status" value="active" />
                <button type="submit" className="pbtn pbtn-primary">Activate Website</button>
              </form>
            ) : (
              <ConfirmAction
                action={setStatus}
                fields={{ status: "suspended" }}
                trigger="Suspend Website"
                triggerClassName="pbtn pbtn-ghost pbtn-danger-text"
                title={`Suspend ${b.name}?`}
                message="The public website will show an “unavailable” message and the admin won’t be able to log in."
                confirmLabel="Suspend Website"
                pendingText="Suspending…"
              />
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Admin access</h2>
          </div>
          {adminList.length === 0 && <p className="muted">No admin account yet.</p>}
          <ul className="admin-rows">
            {adminList.map((a) => (
              <li key={a.id}>
                <div>
                  <b>{a.name || a.email}</b>
                  {a.name && <span className="muted small">{a.email}</span>}
                  {a.is_active ? (
                    <span className="pill pill-ok">Active</span>
                  ) : (
                    <span className="pill pill-muted">Disabled</span>
                  )}
                </div>
                <div className="btn-row">
                  <CredentialAction
                    action={resetAdminPassword}
                    fields={{ profile_id: a.id }}
                    triggerLabel={<><Icon name="key" size={15} /> Reset Password</>}
                    title={`Reset password for ${a.email}?`}
                    message="A new temporary password will be generated. The old password stops working immediately."
                    confirmLabel="Reset Password"
                  />
                  {a.is_active ? (
                    <ConfirmAction
                      action={setAdminActive}
                      fields={{ profile_id: a.id, active: "false" }}
                      trigger="Disable"
                      triggerClassName="pbtn pbtn-ghost pbtn-sm pbtn-danger-text"
                      title={`Disable ${a.email}?`}
                      message="They will no longer be able to log in to the admin panel."
                      confirmLabel="Disable Admin"
                      pendingText="Disabling…"
                    />
                  ) : (
                    <form action={setAdminActive}>
                      <input type="hidden" name="profile_id" value={a.id} />
                      <input type="hidden" name="active" value="true" />
                      <button type="submit" className="pbtn pbtn-ghost pbtn-sm">Enable</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <CredentialAction
            action={addAdmin}
            fields={{}}
            triggerLabel={<><Icon name="plus" size={15} /> Add Admin</>}
            title="Add admin account"
            confirmLabel="Create Admin"
          >
            <label className="field">
              <span>Name</span>
              <input name="name" autoComplete="off" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" required autoComplete="off" />
            </label>
          </CredentialAction>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Products ({productList.length})</h2>
          <form action={openAdmin}>
            <button type="submit" className="text-link text-button">Manage in Admin →</button>
          </form>
        </div>
        {productList.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          <ul className="mini-list">
            {productList.map((p) => (
              <li key={p.id}>
                <Thumb src={p.image_url} />
                <span className="mini-name">{p.name}</span>
                <span className="muted small hide-xs">{catName.get(p.category_id)}</span>
                <span className="muted small">{formatPrice(p.price, p.ask_for_price)}</span>
                <span className="pills">
                  {p.is_featured && <span className="pill pill-accent">Featured</span>}
                  {!p.is_available && <span className="pill pill-muted">Unavailable</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Recent activity</h2>
          <span className="muted small">Logins, changes and security events</span>
        </div>
        {(activity ?? []).length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          <ul className="activity">
            {((activity ?? []) as AuditEntry[]).map((e) => (
              <li key={e.id} className={e.action.endsWith("failed") ? "is-alert" : undefined}>
                <span className="activity-dot" aria-hidden="true" />
                <span className="activity-main">
                  <b>{describe(e)}</b>
                  <span className="muted small">
                    {e.actor_email ?? "Unknown"}
                    {e.actor_role === "super_admin" ? " (you)" : ""} · {e.ip ?? "—"}
                  </span>
                </span>
                <time className="muted small" dateTime={e.created_at}>
                  {new Date(e.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const ACTIONS: Record<string, string> = {
  login: "Signed in",
  "login.failed": "Failed sign-in attempt",
  "password.changed": "Password changed",
  "product.created": "Product added",
  "product.updated": "Product edited",
  "product.deleted": "Product deleted",
  "category.created": "Category added",
  "category.renamed": "Category renamed",
  "category.deleted": "Category deleted",
  "settings.saved": "Settings saved",
  "website.suspended": "Website suspended",
  "website.activated": "Website activated",
  "admin.created": "Admin account created",
  "admin.password_reset": "Admin password reset",
  "admin.disabled": "Admin disabled",
  "admin.enabled": "Admin enabled",
  "admin.opened": "Opened the Admin panel",
};

function describe(e: AuditEntry): string {
  const label = ACTIONS[e.action] ?? e.action;
  return e.target ? `${label}: ${e.target}` : label;
}
