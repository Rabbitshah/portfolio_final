import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CountUp } from "@/components/primitives/CountUp";
import { Reveal } from "@/components/primitives/Reveal";

// Motion allowed (matchMedia says no reduced motion). Reduced motion is in its own file,
// because Motion reads the setting once per module.
let observed: ((entries: { isIntersecting: boolean }[]) => void)[] = [];

beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        observed.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  // jsdom has no element.animate; one test adds a stand-in.
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("Reveal: the server HTML is visible content, with no opacity:0", () => {
  const html = renderToString(
    <Reveal className="head">
      <h2>Section title</h2>
    </Reveal>,
  );
  expect(html).toContain("Section title");
  expect(html).toContain("data-reveal");
  expect(html).not.toMatch(/opacity:\s*0[;"]/);
});

it("CountUp: the server HTML has the final number, for sighted and screen-reader users", () => {
  const html = renderToString(<CountUp value={7} />);
  expect(html).toContain('aria-hidden="true"');
  expect(html.match(/>7</g)).toHaveLength(2);
});

it("CountUp: a number already on screen after load keeps its final value", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "performance"] });
  const { container } = render(<CountUp value={7} />);
  act(() => vi.advanceTimersByTime(2000));
  expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
    "7",
  );
  expect(observed).toHaveLength(0);
});

it("CountUp: a number below the screen resets to 0, then counts up to the final value when seen", () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "performance"] });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 5000,
  } as DOMRect);
  const { container } = render(<CountUp value={7} />);
  const digits = () =>
    container.querySelector('[aria-hidden="true"]')?.textContent;

  act(() => vi.advanceTimersByTime(20));
  expect(digits()).toBe("0");
  expect(container.querySelector(".sr-only")?.textContent).toBe("7");

  act(() => observed[0]?.([{ isIntersecting: true }]));
  act(() => vi.advanceTimersByTime(500));
  const midway = Number(digits());
  expect(midway).toBeGreaterThan(0);
  expect(midway).toBeLessThan(7);

  act(() => vi.advanceTimersByTime(1000));
  expect(digits()).toBe("7");
});

it("Reveal: a block below the screen is hidden after load, then shown when seen", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 5000,
  } as DOMRect);
  const animate = vi.fn();
  HTMLElement.prototype.animate = animate;
  const { container } = render(
    <Reveal>
      <p>Below the fold</p>
    </Reveal>,
  );
  const block = container.firstElementChild as HTMLElement;
  expect(block.style.opacity).toBe("0");

  act(() => observed[0]?.([{ isIntersecting: true }]));
  expect(block.style.opacity).toBe("1");
  expect(animate).toHaveBeenCalledOnce();
});

it("Reveal: a block already on screen after load is never hidden", () => {
  const { container } = render(
    <Reveal>
      <p>On screen</p>
    </Reveal>,
  );
  expect((container.firstElementChild as HTMLElement).style.opacity).toBe("");
  expect(observed).toHaveLength(0);
});
