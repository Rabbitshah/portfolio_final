import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full max-w-[75rem] pl-[max(clamp(20px,4vw,40px),env(safe-area-inset-left,0px))] pr-[max(clamp(20px,4vw,40px),env(safe-area-inset-right,0px))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
