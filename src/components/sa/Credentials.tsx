"use client";

import { useState } from "react";

/** Shows a one-time temporary password with a copy button. */
export function Credentials({ email, password, note }: { email: string; password: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Email: ${email}\nTemporary password: ${password}`;
  return (
    <div className="credentials" role="status">
      <p>
        <b>Login details — shown only once.</b> {note}
      </p>
      <dl>
        <dt>Email</dt>
        <dd>{email}</dd>
        <dt>Temporary password</dt>
        <dd>
          <code>{password}</code>
        </dd>
      </dl>
      <button
        type="button"
        className="pbtn pbtn-ghost pbtn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy details"}
      </button>
    </div>
  );
}
