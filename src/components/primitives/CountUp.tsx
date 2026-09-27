"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1100;

/**
 * Counts from 0 up to `value` the first time the number scrolls into view (the template's
 * 1.1 s ease-out). The server HTML and the first render show the final number, so it is
 * correct without JavaScript. A number already on screen after mount stays as it is, and
 * reduced motion never animates. Screen readers always get the final value.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (reduceMotion !== false || !element) return;
    if (element.getBoundingClientRect().top <= window.innerHeight) return;

    // Deferred to the next frame so it does not re-render in the middle of hydration.
    let frame = requestAnimationFrame(() => setShown(0));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          setShown(Math.round(value * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="select-none tabular-nums">
        {shown}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
