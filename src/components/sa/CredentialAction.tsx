"use client";

import { useRef } from "react";
import { Credentials } from "./Credentials";
import { SubmitButton } from "../ui/SubmitButton";
import { FormError } from "../ui/Flash";
import { useKeepForm } from "../ui/useKeepForm";
import type { CredentialsState } from "@/app/super-admin/actions";

/** Confirm → run an action that returns a temporary password → display it once. */
export function CredentialAction({
  action,
  fields,
  triggerLabel,
  title,
  message,
  confirmLabel,
  children,
}: {
  action: (s: CredentialsState, fd: FormData) => Promise<CredentialsState>;
  fields: Record<string, string>;
  triggerLabel: React.ReactNode;
  title: string;
  message?: string;
  confirmLabel: string;
  children?: React.ReactNode; // extra inputs (e.g. name/email for a new admin)
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { state, pending, onSubmit } = useKeepForm(action);
  return (
    <>
      <button type="button" className="pbtn pbtn-ghost pbtn-sm" onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog ref={ref} className="confirm-dialog">
        {state.done && state.password ? (
          <div>
            <h2>Done</h2>
            <Credentials
              email={state.email!}
              password={state.password}
              note="Send these to the customer and ask them to keep them safe."
            />
            <div className="dialog-actions">
              <button type="button" className="pbtn pbtn-primary" onClick={() => window.location.reload()}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {Object.entries(fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <h2>{title}</h2>
            {message && <p>{message}</p>}
            <FormError message={state.error} />
            {children}
            <div className="dialog-actions">
              <button type="button" className="pbtn pbtn-ghost" onClick={() => ref.current?.close()}>
                Cancel
              </button>
              <SubmitButton pending={pending} pendingText="Working…">
                {confirmLabel}
              </SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
