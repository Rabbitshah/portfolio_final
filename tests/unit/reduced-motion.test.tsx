import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

// Reduced motion on. Set before Motion is imported, because it reads the setting once.
vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })),
);

const { CountUp } = await import("@/components/primitives/CountUp");
const { Reveal } = await import("@/components/primitives/Reveal");

const observe = vi.fn();

beforeEach(() => {
  observe.mockClear();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = observe;
      unobserve() {}
      disconnect() {}
    },
  );
  // Everything starts below the screen: the case where motion would normally hide or reset.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 5000,
  } as DOMRect);
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "performance"] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("CountUp shows the final number and never animates", () => {
  const { container } = render(<CountUp value={7} />);
  act(() => vi.advanceTimersByTime(2000));
  expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
    "7",
  );
  expect(observe).not.toHaveBeenCalled();
});

it("Reveal never hides its content", () => {
  const { container } = render(
    <Reveal>
      <p>Below the fold</p>
    </Reveal>,
  );
  act(() => vi.advanceTimersByTime(2000));
  expect((container.firstElementChild as HTMLElement).style.opacity).toBe("");
  expect(observe).not.toHaveBeenCalled();
});

it("NowPlaying: keeps showing the first fact and never rotates", async () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
  const { NowPlaying } = await import("@/components/interactive/NowPlaying");
  const { container } = render(<NowPlaying items={["one", "two"]} />);
  act(() => {
    vi.advanceTimersByTime(20_000);
  });
  expect(container.querySelector(".grid")?.lastElementChild?.textContent).toBe(
    "one",
  );
  expect(
    container.querySelector(".grid")?.lastElementChild?.textContent,
  ).not.toBe("two");
});
