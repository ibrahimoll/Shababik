// Creates (or repairs) the Super Admin account and the Shababik admin account.
// Usage:  npm run bootstrap        (reads .env.local)
// Safe to run more than once.
import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
  SHABABIK_ADMIN_EMAIL,
  SHABABIK_ADMIN_PASSWORD,
} = process.env;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureAccount({ email, password, role, businessId, name }) {
  if (!email || !password) return console.log(`- skipped ${role}: email/password not set`);
  // same rule as the app: 12+ characters with upper-case, lower-case and a number
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    console.error(`✗ ${role} (${email}): password too weak — use 12+ characters with upper-case, lower-case letters and a number. Edit .env.local and run again.`);
    process.exitCode = 1;
    return;
  }

  let user = await findUser(email);
  if (user) {
    await db.auth.admin.updateUserById(user.id, { password, ban_duration: "none" });
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db.from("profiles").upsert(
    { auth_user_id: user.id, email, role, business_id: businessId, name, is_active: true },
    { onConflict: "auth_user_id" },
  );
  if (error) throw error;
  console.log(`✓ ${role}: ${email}`);
}

// Only ONE super admin may exist: remove any super admin whose email isn't SUPER_ADMIN_EMAIL.
if (SUPER_ADMIN_EMAIL) {
  const { data: others } = await db.from("profiles").select("auth_user_id, email").eq("role", "super_admin");
  for (const o of others ?? []) {
    if (o.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      await db.auth.admin.deleteUser(o.auth_user_id);
      console.log(`✗ removed old super admin: ${o.email}`);
    }
  }
}
if (!/^[0-9a-f]{64}$/i.test(process.env.SUPER_ADMIN_PATH_HASH?.trim() ?? "")) console.warn("! SUPER_ADMIN_PATH_HASH is not set — the Super Admin console is unreachable until you set it (npm run sa-hash).");

const { data: shababik } = await db.from("businesses").select("id").eq("slug", "shababik").maybeSingle();
if (!shababik) console.warn("! Shababik business not found — run the migration and seed.sql first.");

await ensureAccount({
  email: SUPER_ADMIN_EMAIL,
  password: SUPER_ADMIN_PASSWORD,
  role: "super_admin",
  businessId: null,
  name: "Platform Owner",
});
if (shababik) {
  await ensureAccount({
    email: SHABABIK_ADMIN_EMAIL,
    password: SHABABIK_ADMIN_PASSWORD,
    role: "admin",
    businessId: shababik.id,
    name: "Shababik Owner",
  });
}
console.log("Super Admin: open your secret console address (only its hash is configured).");
console.log("Done.");
