"use client";

import { SubmitButton } from "../ui/SubmitButton";
import { FormError } from "../ui/Flash";
import { useKeepForm } from "../ui/useKeepForm";

type State = { error?: string | null };

/** Generic card form: server-rendered fields as children, friendly error, loading button. */
export function SettingsForm({
  action,
  children,
  submitLabel = "Save Changes",
  pendingText = "Saving…",
  className = "form-card",
}: {
  action: (s: State, fd: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingText?: string;
  className?: string;
}) {
  const { state, pending, onSubmit } = useKeepForm(action);
  return (
    <form onSubmit={onSubmit} className={className}>
      <FormError message={state.error} />
      {children}
      <div className="form-actions">
        <SubmitButton pending={pending} pendingText={pendingText}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
