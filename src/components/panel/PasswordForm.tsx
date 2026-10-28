"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { SubmitButton } from "../ui/SubmitButton";
import { FormError } from "../ui/Flash";
import { useKeepForm } from "../ui/useKeepForm";
import { changePassword } from "@/app/account-actions";

export function PasswordForm({ forced, backHref }: { forced: boolean; backHref: string }) {
  const { state, pending, onSubmit } = useKeepForm(changePassword);
  return (
    <form onSubmit={onSubmit} className="login-card">
      <span className="shield"><Icon name="key" size={24} /></span>
      <h1>{forced ? "Choose your own password" : "Change password"}</h1>
      <p className="muted">
        {forced
          ? "You signed in with a temporary password. Please replace it with a password only you know."
          : "Other devices will be signed out after the change."}
      </p>
      <FormError message={state.error} />
      <label className="field">
        <span>{forced ? "Temporary password" : "Current password"}</span>
        <input name="current_password" type="password" autoComplete="current-password" required />
      </label>
      <label className="field">
        <span>New password</span>
        <input name="new_password" type="password" autoComplete="new-password" required minLength={12} />
      </label>
      <label className="field">
        <span>Repeat new password</span>
        <input name="confirm_password" type="password" autoComplete="new-password" required minLength={12} />
      </label>
      <ul className="pw-rules">
        <li>At least 12 characters</li>
        <li>Upper-case and lower-case letters</li>
        <li>At least one number</li>
      </ul>
      <SubmitButton pending={pending} className="pbtn pbtn-primary pbtn-block pbtn-lg" pendingText="Saving…">
        Save new password
      </SubmitButton>
      {!forced && (
        <Link href={backHref} className="login-foot">Cancel</Link>
      )}
    </form>
  );
}
