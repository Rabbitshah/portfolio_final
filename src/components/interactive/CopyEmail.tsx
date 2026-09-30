"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/primitives/Button";

const noop = () => () => {};
const LABELS = { idle: "Copy email", copied: "Copied", failed: "Copy failed" };

// The template's copyEmail(): clipboard write, "Copied" or "Copy failed" for 1.6 s. Only
// rendered once JavaScript runs, since the button cannot work without it.
export function CopyEmail({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [state, setState] = useState<keyof typeof LABELS>("idle");
  const reset = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reset.current), []);

  if (!hydrated) return null;

  function copy() {
    const done = (ok: boolean) => {
      setState(ok ? "copied" : "failed");
      window.clearTimeout(reset.current);
      reset.current = window.setTimeout(() => setState("idle"), 1600);
    };
    try {
      navigator.clipboard.writeText(email).then(
        () => done(true),
        () => done(false),
      );
    } catch {
      done(false);
    }
  }

  return (
    <>
      <Button onClick={copy} className={className}>
        {LABELS[state]}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied"
          ? "Email copied."
          : state === "failed"
            ? `Copy blocked. The email is ${email}.`
            : ""}
      </span>
    </>
  );
}
