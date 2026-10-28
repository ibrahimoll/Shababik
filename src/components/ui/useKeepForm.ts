"use client";

import { startTransition, useActionState } from "react";

type State = { error?: string | null };

/**
 * Like useActionState, but submits via onSubmit so React does NOT reset the form
 * when the server returns a validation error — the user keeps what they typed.
 */
export function useKeepForm<S extends State>(action: (s: S, fd: FormData) => Promise<S>, initial = {} as S) {
  const [state, run, pending] = useActionState<S, FormData>(action, initial as Awaited<S>);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => run(fd));
  };
  return { state, pending, onSubmit };
}
