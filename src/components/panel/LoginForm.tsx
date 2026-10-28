"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { SubmitButton } from "../ui/SubmitButton";
import { FormError } from "../ui/Flash";
import { useKeepForm } from "../ui/useKeepForm";

type State = { error?: string | null };

export function LoginForm({
  action,
  title,
  subtitle,
  notice,
  className = "login-card",
  footnote,
}: {
  action: (s: State, fd: FormData) => Promise<State>;
  title: string;
  subtitle: string;
  notice?: string | null;
  className?: string;
  footnote?: React.ReactNode;
}) {
  const { state, pending, onSubmit } = useKeepForm(action);
  const [showPw, setShowPw] = useState(false);
  return (
    <form onSubmit={onSubmit} className={className}>
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
      <FormError message={state.error ?? notice} />
      <label className="field">
        <span>Email</span>
        <span className="input-icon">
          <Icon name="mail" size={18} />
          <input name="email" type="email" autoComplete="email" inputMode="email" required autoFocus placeholder="you@example.com" />
        </span>
      </label>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <span className="input-icon">
          <Icon name="lock" size={18} />
          <input id="login-password" name="password" type={showPw ? "text" : "password"} autoComplete="current-password" required />
          <button
            type="button"
            className="pw-toggle"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            aria-pressed={showPw}
          >
            <Icon name={showPw ? "eyeOff" : "eye"} size={18} />
          </button>
        </span>
      </div>
      <SubmitButton pending={pending} className="pbtn pbtn-primary pbtn-block pbtn-lg" pendingText="Signing in…">
        Sign in <Icon name="arrow" size={18} />
      </SubmitButton>
      {footnote && <p className="login-foot">{footnote}</p>}
    </form>
  );
}
