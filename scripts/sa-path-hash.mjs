// Prints the SUPER_ADMIN_PATH_HASH for a Super Admin console address.
// Usage:  npm run sa-hash -- your-secret-path    (hash an address you chose; leading "/" optional —
//                                                 leave it off in Git Bash, which rewrites "/…" args)
//         npm run sa-hash                        (generate a new random address)
// Only the hash goes in .env.local / hosting env vars — keep the address itself somewhere safe.
import { createHash, randomBytes } from "node:crypto";

let path = process.argv[2]?.trim().replace(/\/+$/, "");
if (!path) path = `/console-${randomBytes(18).toString("base64url")}`;
if (!path.startsWith("/")) path = `/${path}`;

if (!/^\/[A-Za-z0-9_-]{10,64}$/.test(path)) {
  console.error("✗ The address must be a slash followed by 10–64 letters, numbers, dashes or underscores.");
  process.exit(1);
}
if (path.length < 21) console.warn("! Short addresses can be guessed from the hash — 20+ random characters is safer.");

console.log(`Console address (keep private, not stored anywhere): ${path}`);
console.log(`SUPER_ADMIN_PATH_HASH=${createHash("sha256").update(path).digest("hex")}`);
