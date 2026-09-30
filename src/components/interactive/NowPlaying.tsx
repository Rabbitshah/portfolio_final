"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const EVERY_MS = 4200;
const FADE_MS = 300;

// The template's rotating facts chip, 1320 px and up. Decorative (aria-hidden).
// Every fact is laid out in one grid cell, all but the current one invisible, so the chip is as
// wide as the longest fact and the bar does not shift when the text changes. The max-width and
// the ellipsis are only a last resort: shorten the fact in content/site.ts instead of raising them.
export function NowPlaying({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  const text = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = text.current;
    if (reduceMotion !== false || items.length < 2 || !element) return;
    let swap: number | undefined;
    const tick = window.setInterval(() => {
      if (document.hidden || element.offsetWidth === 0) return;
      element.style.opacity = "0";
      element.style.transform = "translateY(6px)";
      swap = window.setTimeout(() => {
        setIndex((current) => (current + 1) % items.length);
        element.style.opacity = "";
        element.style.transform = "";
      }, FADE_MS);
    }, EVERY_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(swap);
    };
  }, [reduceMotion, items.length]);

  return (
    <div
      aria-hidden="true"
      className="hidden min-h-7 w-max max-w-[22rem] items-center gap-2.5 overflow-hidden border-x border-line px-3.5 font-mono text-[.72rem] text-muted min-[1320px]:flex"
    >
      <span className="flex h-3 shrink-0 items-end gap-0.5">
        <i className="eq-bar" />
        <i className="eq-bar [animation-delay:.2s]" />
        <i className="eq-bar [animation-delay:.4s]" />
      </span>
      <span className="grid min-w-0">
        {items.map((item) => (
          <span
            key={item}
            className="invisible col-start-1 row-start-1 truncate"
          >
            {item}
          </span>
        ))}
        <span
          ref={text}
          className="col-start-1 row-start-1 truncate transition-[opacity,transform] duration-300"
        >
          {items[index]}
        </span>
      </span>
    </div>
  );
}
