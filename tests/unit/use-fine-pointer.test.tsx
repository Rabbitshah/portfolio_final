import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useFinePointer } from "@/hooks/useFinePointer";

function Probe() {
  return <span data-testid="fine">{String(useFinePointer())}</span>;
}

// A matchMedia stand-in whose answer can be changed, firing "change" like a real one.
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
  return {
    set(value: boolean) {
      matches = value;
      listeners.forEach((listener) => listener());
    },
    listeners,
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("is false in server-rendered HTML", () => {
  mockMatchMedia(true);
  expect(renderToString(<Probe />)).toContain(">false<");
});

it("reads the media query in the browser and follows its changes", () => {
  const media = mockMatchMedia(true);
  const { unmount } = render(<Probe />);
  expect(screen.getByTestId("fine").textContent).toBe("true");
  expect(window.matchMedia).toHaveBeenCalledWith(
    "(hover: hover) and (pointer: fine)",
  );

  act(() => media.set(false));
  expect(screen.getByTestId("fine").textContent).toBe("false");

  unmount();
  expect(media.listeners.size).toBe(0);
});
