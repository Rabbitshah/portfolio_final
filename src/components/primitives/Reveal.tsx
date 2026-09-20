import type { ReactNode } from "react";

// Passthrough for now: children are always visible. Motion whileInView replaces this in Phase 3.
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal className={className}>
      {children}
    </div>
  );
}
