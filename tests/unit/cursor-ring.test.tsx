import { act, cleanup, render } from "@testing-library/react";
import { Profiler } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CursorRing } from "@/components/interactive/CursorRing";

// The ring is a Client Component driven by pointer events and requestAnimationFrame. These tests
// use a fake frame clock so the frame rate is under our control.

// ---- matchMedia, with a way to flip a query mid-session
let media = { fine: true, reduced: false };
let changeListeners: (() => void)[] = [];

function stubMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        if (query.includes("pointer: fine")) return media.fine;
        if (query.includes("prefers-reduced-motion")) return media.reduced;
        return false;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => {
        changeListeners.push(listener);
      },
      removeEventListener: (_: string, listener: () => void) => {
        changeListeners = changeListeners.filter((item) => item !== listener);
      },
      addListener() {},
      removeListener() {},
    })),
  );
}

// ---- a frame clock: requestAnimationFrame and performance.now follow `now`
let now = 0;
let queue = new Map<number, FrameRequestCallback>();
let nextId = 1;

function stubFrames() {
  now = 0;
  queue = new Map();
  nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    queue.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id);
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
}

/** Runs frames at `hz` for `ms` milliseconds. */
function advance(ms: number, hz: number) {
  const frame = 1000 / hz;
  const frames = Math.round(ms / frame);
  act(() => {
    for (let i = 0; i < frames; i++) {
      now += frame;
      const due = [...queue.values()];
      queue.clear();
      for (const callback of due) callback(now);
    }
  });
}

// ---- events
function pointer(
  type: string,
  init: {
    x?: number;
    y?: number;
    pointerType?: string;
    button?: number;
    relatedTarget?: EventTarget | null;
  } = {},
  target: EventTarget = document,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: init.button ?? 0,
    relatedTarget: init.relatedTarget ?? null,
  });
  Object.defineProperty(event, "pointerType", {
    value: init.pointerType ?? "mouse",
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

const ringElement = () =>
  document.querySelector<HTMLElement>("[data-cursor-ring]");
const state = () => ringElement()?.dataset.state;
const position = () => {
  const match = /^(-?[\d.]+)px (-?[\d.]+)px$/.exec(
    ringElement()?.style.translate ?? "",
  );
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
};

beforeEach(() => {
  media = { fine: true, reduced: false };
  changeListeners = [];
  stubMedia();
  stubFrames();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------- when it exists

it("is not rendered without a fine pointer (touch screens)", () => {
  media.fine = false;
  render(<CursorRing />);
  expect(ringElement()).toBeNull();
});

it("is not rendered with reduced motion, and goes away if the setting changes mid-session", () => {
  media.reduced = true;
  render(<CursorRing />);
  expect(ringElement()).toBeNull();

  media.reduced = false;
  act(() => changeListeners.forEach((listener) => listener()));
  expect(ringElement()).not.toBeNull();

  media.reduced = true;
  act(() => changeListeners.forEach((listener) => listener()));
  expect(ringElement()).toBeNull();
});

it("is decorative and hidden until the mouse first moves", () => {
  render(<CursorRing />);
  const ring = ringElement();
  expect(ring?.getAttribute("aria-hidden")).toBe("true");
  expect(state()).toBe("hidden");
  pointer("pointermove", { x: 120, y: 80 });
  expect(state()).toBe("default");
  // The first move puts it straight under the pointer, with no travel from the corner.
  expect(position()).toEqual({ x: 120, y: 80 });
});

// ---------------------------------------------------------------- states

function over(html: string, selector: string) {
  document.body.innerHTML = html;
  render(<CursorRing />);
  pointer("pointermove", { x: 10, y: 10 });
  const target = document.querySelector(selector) as Element;
  pointer("pointerover", {}, target);
  return state();
}

it("is interactive over links, buttons, summaries, role=button and labels", () => {
  expect(over('<p><a href="/x">go</a></p>', "a")).toBe("interactive");
  cleanup();
  expect(over("<button><span>go</span></button>", "span")).toBe("interactive");
  cleanup();
  expect(over("<details><summary>more</summary></details>", "summary")).toBe(
    "interactive",
  );
  cleanup();
  expect(over('<div role="button"><b>go</b></div>', "b")).toBe("interactive");
  cleanup();
  expect(over("<label>name</label>", "label")).toBe("interactive");
});

it("is interactive over a link inside a list item, even over an element inside the link", () => {
  expect(
    over('<ul><li><a href="/work"><span>Work</span></a></li></ul>', "span"),
  ).toBe("interactive");
});

it("is the default over ordinary content, and over a link without an href", () => {
  expect(over("<div><p>text</p></div>", "p")).toBe("default");
  cleanup();
  expect(over("<a>not a link</a>", "a")).toBe("default");
});

it("hides over text fields, selects and editable areas (the native I-beam stays)", () => {
  expect(over("<input />", "input")).toBe("hidden");
  cleanup();
  expect(over("<textarea></textarea>", "textarea")).toBe("hidden");
  cleanup();
  expect(over("<select><option>a</option></select>", "select")).toBe("hidden");
  cleanup();
  expect(over('<div contenteditable="true"><b>x</b></div>', "b")).toBe(
    "hidden",
  );
  cleanup();
  // A field wins over the label around it.
  expect(over("<label>Name <input /></label>", "input")).toBe("hidden");
});

it("shows a pressed look while the primary button is down, and not for other buttons", () => {
  render(<CursorRing />);
  pointer("pointermove", { x: 5, y: 5 });
  pointer("pointerdown", { button: 0 });
  expect(ringElement()?.hasAttribute("data-pressed")).toBe(true);
  pointer("pointerup");
  expect(ringElement()?.hasAttribute("data-pressed")).toBe(false);
  pointer("pointerdown", { button: 2 });
  expect(ringElement()?.hasAttribute("data-pressed")).toBe(false);
});

it("hides when the pointer leaves the window and returns on the next move", () => {
  render(<CursorRing />);
  pointer("pointermove", { x: 5, y: 5 });
  expect(state()).toBe("default");
  pointer("mouseout", { relatedTarget: null });
  expect(state()).toBe("hidden");
  // Moving between elements inside the page is not leaving it.
  pointer("pointermove", { x: 9, y: 9 });
  expect(state()).toBe("default");
  pointer("mouseout", { relatedTarget: document.body });
  expect(state()).toBe("default");
});

it("ignores touch and pen: hides, does not move, and comes back for the mouse", () => {
  render(<CursorRing />);
  pointer("pointermove", { x: 50, y: 60 });
  advance(500, 60);
  expect(position()).toEqual({ x: 50, y: 60 });

  pointer("pointermove", { x: 300, y: 300, pointerType: "touch" });
  expect(state()).toBe("hidden");
  pointer("pointermove", { x: 400, y: 400, pointerType: "pen" });
  advance(500, 60);
  expect(position()).toEqual({ x: 50, y: 60 });

  pointer("pointermove", { x: 200, y: 100 });
  expect(state()).toBe("default");
  advance(1000, 60);
  expect(position()).toEqual({ x: 200, y: 100 });
});

// ---------------------------------------------------------------- performance rules

it("never re-renders React while the mouse moves", () => {
  const onRender = vi.fn();
  render(
    <Profiler id="ring" onRender={onRender}>
      <CursorRing />
    </Profiler>,
  );
  const afterMount = onRender.mock.calls.length;
  for (let i = 0; i < 200; i++) {
    pointer("pointermove", { x: i, y: i * 2 });
    pointer("pointerover", {}, document.body);
    advance(16, 60);
  }
  pointer("pointerdown");
  pointer("pointerup");
  expect(onRender.mock.calls.length).toBe(afterMount);
});

it("reads no layout while moving", () => {
  render(<CursorRing />);
  const reads = {
    rect: vi.spyOn(Element.prototype, "getBoundingClientRect"),
    rects: vi.spyOn(Element.prototype, "getClientRects"),
    style: vi.spyOn(window, "getComputedStyle"),
    width: vi.spyOn(HTMLElement.prototype, "offsetWidth", "get"),
    height: vi.spyOn(HTMLElement.prototype, "offsetHeight", "get"),
  };
  for (let i = 0; i < 100; i++) {
    pointer("pointermove", { x: i * 3, y: i });
    pointer("pointerover", {}, document.body);
    advance(16, 60);
  }
  advance(1000, 60);
  for (const [name, spy] of Object.entries(reads)) {
    expect(spy, name).not.toHaveBeenCalled();
  }
});

it("stops asking for frames once the ring has caught up, and starts again on the next move", () => {
  render(<CursorRing />);
  pointer("pointermove", { x: 0, y: 0 });
  // The first move needs no frame at all.
  expect(queue.size).toBe(0);

  pointer("pointermove", { x: 300, y: 200 });
  expect(queue.size).toBe(1);
  advance(2000, 60);
  expect(position()).toEqual({ x: 300, y: 200 });
  expect(queue.size).toBe(0);

  advance(1000, 60);
  expect(queue.size).toBe(0);

  pointer("pointermove", { x: 10, y: 10 });
  expect(queue.size).toBe(1);
});

it("covers the same distance in the same time at 60, 120 and 144 Hz", () => {
  const remaining: number[] = [];
  for (const hz of [60, 120, 144]) {
    cleanup();
    now = 0;
    queue.clear();
    render(<CursorRing />);
    pointer("pointermove", { x: 0, y: 0 });
    pointer("pointermove", { x: 400, y: 0 });
    advance(250, hz);
    remaining.push(400 - (position()?.x ?? 0));
  }
  // 250 ms is a whole number of frames at all three rates. Still well short of the target,
  // so this measures the easing and not the final snap.
  expect(remaining[0]).toBeGreaterThan(5);
  expect(Math.abs((remaining[1] ?? 0) - (remaining[0] ?? 0))).toBeLessThan(0.5);
  expect(Math.abs((remaining[2] ?? 0) - (remaining[0] ?? 0))).toBeLessThan(0.5);
});

it("removes its listeners and pending frame when it goes away", () => {
  const { unmount } = render(<CursorRing />);
  pointer("pointermove", { x: 0, y: 0 });
  pointer("pointermove", { x: 100, y: 100 });
  expect(queue.size).toBe(1);
  unmount();
  expect(queue.size).toBe(0);
  pointer("pointermove", { x: 5, y: 5 });
  expect(queue.size).toBe(0);
});
