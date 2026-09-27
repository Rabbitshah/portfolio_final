"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

// Same distance, duration and easing as the template's .reveal.
const HIDDEN = { opacity: "0", transform: "translateY(28px)" };
const SHOWN = { opacity: "1", transform: "none" };
const TIMING: KeyframeAnimationOptions = {
  duration: 900,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * The server HTML and the first render are the plain, visible content, so nothing is hidden
 * without JavaScript. After mount, only a block that is still below the screen is hidden,
 * then revealed when it comes into view. A block already on screen (or above it) is never
 * touched, and nothing is hidden under reduced motion.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (reduceMotion !== false || !element) return;
    if (element.getBoundingClientRect().top <= window.innerHeight) return;

    Object.assign(element.style, HIDDEN);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        Object.assign(element.style, SHOWN);
        element.animate([HIDDEN, SHOWN], TIMING);
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      Object.assign(element.style, SHOWN);
    };
  }, [reduceMotion]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
