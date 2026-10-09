"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";

// A decorative ring that follows the mouse. The real cursor is never hidden or changed, so the
// operating system's pointer size and color, the I-beam over text fields and the click hotspot
// all stay exactly as they are (and nothing in the CSS may ever set `cursor: none`).
//
// Rendered once, from the root layout, and only after hydration on a device with a mouse or
// trackpad and without a reduced-motion preference. It is one fixed element:
//   - the pointer listeners only store a point; they never touch React state or read layout;
//   - one requestAnimationFrame loop eases the ring toward that point and writes the individual
//     CSS `translate` property (so only the compositor moves it). The loop stops when the ring
//     has caught up, so an idle pointer costs nothing;
//   - the look (size, fill, hidden) is CSS, switched by `data-state` and `data-pressed`;
//   - over an interactive element inside something marked `data-cursor="word"`, that word is shown
//     inside the ring (`data-labelled`). Written when the state changes, never per frame.
// See `.cursor-ring` in globals.css.

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// true on the server, so the ring is never part of the HTML.
function useReducedMotionQuery(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

// Text fields keep the native I-beam, so the ring steps aside over them.
const FIELD =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const INTERACTIVE = 'a[href], button, summary, [role="button"], label';

// The ring covers 20% of the remaining distance per 1/60 s. The step is computed from the real
// time between frames, so it feels the same at 60, 120 and 144 Hz.
const EASE = 0.2;
const FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 100; // after a stalled frame, do not jump
const SNAP_PX = 0.1;

export function CursorRing() {
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotionQuery();
  const active = finePointer && !reducedMotion;
  const ring = useRef<HTMLDivElement>(null);
  const labelText = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ring.current;
    const labelElement = labelText.current;
    if (!active || !element || !labelElement) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let lastFrame = 0;
    let frame = 0;

    // Why the ring would be hidden or highlighted, tracked here instead of in React state.
    let seen = false; // a mouse has moved at least once
    let inside = true; // the pointer is inside the window
    let touched = false; // the last input was touch or pen
    let overField = false;
    let overInteractive = false;
    let label = ""; // the data-cursor word of the thing under the pointer, if it is interactive
    let pressed = false;
    let state = "hidden";

    const apply = () => {
      const next =
        !seen || !inside || touched || overField
          ? "hidden"
          : overInteractive
            ? "interactive"
            : "default";
      if (next !== state) {
        state = next;
        element.dataset.state = next;
      }
      element.toggleAttribute("data-pressed", pressed && next !== "hidden");
      // The old word stays in place while the label fades out.
      const word = next === "interactive" ? label : "";
      if (word && labelElement.textContent !== word)
        labelElement.textContent = word;
      element.toggleAttribute("data-labelled", word !== "");
    };

    const classify = (target: EventTarget | null) => {
      const node = target instanceof Element ? target : null;
      overField = node !== null && node.closest(FIELD) !== null;
      overInteractive = node !== null && node.closest(INTERACTIVE) !== null;
      label = overInteractive
        ? (node?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "")
        : "";
    };

    const draw = () => {
      element.style.translate = `${x}px ${y}px`;
    };

    const step = (now: number) => {
      frame = 0;
      const elapsed = Math.min(Math.max(now - lastFrame, 0), MAX_FRAME_MS);
      lastFrame = now;
      const ease = 1 - Math.pow(1 - EASE, elapsed / FRAME_MS);
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      if (Math.abs(targetX - x) < SNAP_PX && Math.abs(targetY - y) < SNAP_PX) {
        x = targetX;
        y = targetY;
      } else {
        frame = requestAnimationFrame(step);
      }
      draw();
    };

    // Touch and pen input is not ours to follow: hide until the mouse moves again.
    const isMouse = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return true;
      touched = true;
      pressed = false;
      apply();
      return false;
    };

    const onMove = (event: PointerEvent) => {
      if (!isMouse(event)) return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!seen || touched || !inside) {
        // First move, or back after touch or leaving: pick up what is under the pointer.
        classify(event.target);
        if (!seen) {
          x = targetX;
          y = targetY;
          draw();
        }
        seen = true;
        touched = false;
        inside = true;
        apply();
      }
      if (!frame && (x !== targetX || y !== targetY)) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(step);
      }
    };

    const onOver = (event: PointerEvent) => {
      if (!isMouse(event)) return;
      classify(event.target);
      apply();
    };

    const onDown = (event: PointerEvent) => {
      if (!isMouse(event)) return;
      pressed = event.button === 0;
      apply();
    };

    const onUp = () => {
      pressed = false;
      apply();
    };

    const onLeave = (event: MouseEvent) => {
      if (event.relatedTarget !== null) return;
      inside = false;
      pressed = false;
      apply();
    };

    const onVisibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const options = { passive: true } as const;
    document.addEventListener("pointermove", onMove, options);
    document.addEventListener("pointerover", onOver, options);
    document.addEventListener("pointerdown", onDown, options);
    document.addEventListener("pointerup", onUp, options);
    document.addEventListener("pointercancel", onUp, options);
    document.addEventListener("mouseout", onLeave, options);
    document.addEventListener("visibilitychange", onVisibility, options);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("mouseout", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
      element.dataset.state = "hidden";
      element.removeAttribute("data-pressed");
      element.removeAttribute("data-labelled");
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={ring}
      aria-hidden="true"
      data-cursor-ring=""
      data-state="hidden"
      className="cursor-ring"
    >
      <span ref={labelText} className="cursor-ring-label" />
    </div>
  );
}
