import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type ButtonProps = {
  variant?: "primary" | "ghost";
  arrow?: boolean;
  className?: string;
  children: ReactNode;
} & (
  | { href: string; external?: boolean }
  | { href?: undefined; type?: "button" | "submit"; disabled?: boolean }
);

const base =
  "group inline-flex min-h-12 max-w-full items-center gap-2.5 rounded-full border px-6 font-medium [overflow-wrap:anywhere] transition-colors max-[380px]:px-[18px]";

const variants = {
  primary:
    "border-transparent bg-accent text-accent-ink hover:bg-ink hover:text-bg",
  ghost: "border-line-strong hover:border-ink hover:bg-ink hover:text-bg",
};

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 transition-transform duration-300 group-hover:translate-x-[3px]"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Button(props: ButtonProps) {
  const { variant = "ghost", arrow = false, className, children } = props;
  const classes = cx(base, variants[variant], className);
  const content = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  );

  if (props.href === undefined) {
    return (
      <button
        type={props.type ?? "button"}
        disabled={props.disabled}
        className={cx(classes, props.disabled && "opacity-50")}
      >
        {content}
      </button>
    );
  }

  if (props.href.startsWith("/")) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={props.href}
      className={classes}
      {...(props.external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {content}
    </a>
  );
}
