"use client";

import { useRef } from "react";
import { SubmitButton } from "./SubmitButton";

/**
 * A button that opens a confirmation dialog; the action only runs after "Confirm".
 * `fields` become hidden inputs posted to the server action.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  triggerClassName = "pbtn pbtn-ghost",
  title,
  message,
  confirmLabel,
  pendingText = "Working…",
  danger = true,
  triggerLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  message?: string;
  confirmLabel: string;
  pendingText?: string;
  danger?: boolean;
  triggerLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()} aria-label={triggerLabel}>
        {trigger}
      </button>
      <dialog ref={ref} className="confirm-dialog" aria-labelledby={undefined}>
        <form action={action}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2>{title}</h2>
          {message && <p>{message}</p>}
          <div className="dialog-actions">
            <button type="button" className="pbtn pbtn-ghost" onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <SubmitButton className={`pbtn ${danger ? "pbtn-danger" : "pbtn-primary"}`} pendingText={pendingText}>
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
