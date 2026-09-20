"use client";

import Link from "next/link";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BarPill } from "@/components/primitives/BarPill";
import { Button } from "@/components/primitives/Button";
import { ThemeToggle } from "./ThemeToggle";

interface MobileMenuProps {
  brand: ReactNode;
  items: { label: string; href: string }[];
  email: string;
  github: string;
  linkedin: string;
}

export function MobileMenu({
  brand,
  items,
  email,
  github,
  linkedin,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // The menu is for narrow screens only: close it if the window grows to 760px or wider.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 760px)");
    const closeIfWide = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", closeIfWide);
    return () => wide.removeEventListener("change", closeIfWide);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="icon-btn min-[760px]:hidden"
        aria-label="Open menu"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 8h16M4 16h16" />
        </svg>
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* z-[60] sits above the bar (z-50). Radix makes everything outside the dialog inert, so the sheet carries its own copy of the bar with a close button. */}
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            firstLink.current?.focus();
          }}
          className="fixed inset-0 z-[60] flex flex-col justify-between gap-7 overflow-auto overscroll-contain bg-bg pb-[calc(env(safe-area-inset-bottom,0px)+28px)] pl-[max(24px,env(safe-area-inset-left,0px))] pr-[max(24px,env(safe-area-inset-right,0px))] pt-[calc(env(safe-area-inset-top,0px)+96px)] min-[760px]:hidden"
        >
          <Dialog.Title className="sr-only">Site menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Links to the sections of this page.
          </Dialog.Description>
          <BarPill>
            {brand}
            <Dialog.Close className="icon-btn" aria-label="Close menu">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Dialog.Close>
          </BarPill>
          <nav aria-label="Mobile">
            <ul>
              {items.map((item, index) => (
                <li key={item.label}>
                  <Dialog.Close asChild>
                    <Link
                      ref={index === 0 ? firstLink : undefined}
                      href={item.href}
                      className="flex min-h-[60px] items-baseline gap-4 border-b border-line py-2 font-serif text-[clamp(2rem,9vw,2.8rem)] leading-[1.1] transition-[color,padding] duration-300 active:pl-2 active:text-accent-text"
                    >
                      <span className="w-[2.4ch] font-mono text-[.75rem] text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </Link>
                  </Dialog.Close>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" href={`mailto:${email}`}>
              Email me
            </Button>
            <Button href={github} external>
              GitHub ↗
            </Button>
            <Button href={linkedin} external>
              LinkedIn ↗
            </Button>
            <ThemeToggle />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
