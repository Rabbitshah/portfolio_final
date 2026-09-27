"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/primitives/Button";
import type { ContactCopy } from "@/lib/content";
import { submitContact } from "@/lib/contact/actions";
import type { ContactField, FieldErrorCode } from "@/lib/contact/schema";
import { initialContactState } from "@/lib/contact/state";
import { cx } from "@/lib/cx";

// The form is a Client Component wired to a Server Action with useActionState. That is what
// lets it submit as a plain POST when JavaScript is off; the "/#contact-form" permalink tells React
// where the no-JS result should render.

const emptyValues = { name: "", email: "", message: "" };

const inputClasses =
  "block min-h-11 w-full rounded-xl border bg-card px-4 py-3 text-base text-ink";

export function ContactForm({
  copy,
  email,
}: {
  copy: ContactCopy;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialContactState,
    "/#contact-form",
  );
  const formRef = useRef<HTMLFormElement>(null);

  const values = state.status === "error" ? state.values : emptyValues;
  const fieldErrors =
    state.status === "error" && state.kind === "invalid"
      ? state.fieldErrors
      : {};

  // After a rejected submit, move focus to the first field with a problem.
  useEffect(() => {
    if (state.status !== "error" || state.kind !== "invalid") return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  const withEmail = (text: string) => text.replaceAll("{email}", email);
  const prefixed = (text: string) => `${copy.errorPrefix} ${text}`;

  let status: string | null = null;
  if (state.status === "success") status = copy.success;
  else if (state.status === "error" && state.kind !== "invalid") {
    status = prefixed(withEmail(copy.errors[state.kind]));
  }

  function field(name: ContactField, label: string, hint?: string) {
    const code: FieldErrorCode | undefined = fieldErrors[name];
    const id = `contact-${name}`;
    const describedBy =
      [code && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") ||
      undefined;
    const shared = {
      id,
      name,
      defaultValue: values[name],
      "aria-required": true as const,
      "aria-invalid": code ? (true as const) : undefined,
      "aria-describedby": describedBy,
      className: cx(
        inputClasses,
        code ? "border-2 border-ink" : "border-muted",
      ),
    };
    return (
      <div>
        <label htmlFor={id} className="mb-2 block font-medium">
          {label}
        </label>
        {name === "message" ? (
          <textarea
            {...shared}
            rows={6}
            className={cx(shared.className, "resize-y")}
          />
        ) : (
          <input
            {...shared}
            type={name === "email" ? "email" : "text"}
            autoComplete={name === "email" ? "email" : "name"}
          />
        )}
        {hint && (
          <p id={`${id}-hint`} className="mt-2 text-[.8125rem] text-muted">
            {hint}
          </p>
        )}
        {code && (
          <p
            id={`${id}-error`}
            className="mt-2 text-[.9375rem] font-medium text-ink"
          >
            {prefixed(copy.fieldErrors[code])}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      id="contact-form"
      action={formAction}
      noValidate
      className="relative mb-8 grid max-w-[640px] gap-5"
    >
      {field("name", copy.labels.name)}
      {field("email", copy.labels.email)}
      {field("message", copy.labels.message, copy.messageHint)}

      {/* Honeypot: hidden from people and screen readers, filled in by bots. */}
      <div
        aria-hidden="true"
        className="absolute left-[-10000px] h-px w-px overflow-hidden"
      >
        <label>
          Leave this field empty
          <input
            type="text"
            name="reply_window"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button variant="primary" type="submit" arrow disabled={pending}>
          {pending ? copy.pending : copy.submit}
        </Button>
        <p className="text-[.8125rem] text-muted [overflow-wrap:anywhere]">
          {copy.privacy}
        </p>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="font-medium [overflow-wrap:anywhere]"
      >
        {status}
      </div>
    </form>
  );
}
