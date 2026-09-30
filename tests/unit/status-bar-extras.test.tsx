import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Clock } from "@/components/interactive/Clock";
import { CopyEmail } from "@/components/interactive/CopyEmail";
import { NowPlaying } from "@/components/interactive/NowPlaying";

beforeEach(() => {
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
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("Clock: the server HTML holds no real time, so it cannot mismatch", () => {
  const html = renderToString(<Clock timeZone="Asia/Kolkata" label="IST" />);
  expect(html).toContain("invisible");
  expect(html).not.toMatch(/\d\d:\d\d(?<!00:00)/);
});

it("Clock: shows the time in the given zone, and moves on at the next minute", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T08:29:30Z")); // 13:59:30 in India (UTC+5:30)
  const { container } = render(<Clock timeZone="Asia/Kolkata" label="IST" />);
  expect(container.textContent).toContain("13:59");
  expect(container.textContent).toContain("IST");
  expect(container.firstElementChild?.className).not.toContain("invisible");

  act(() => {
    vi.advanceTimersByTime(30_000);
  });
  expect(container.textContent).toContain("14:00");
});

it("CopyEmail: not in the server HTML, because it needs JavaScript", () => {
  expect(renderToString(<CopyEmail email="a@b.co" />)).toBe("");
});

it("CopyEmail: copies the address, says so, then goes back after 1.6 s", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<CopyEmail email="a@b.co" />);

  fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
  await act(async () => {});
  expect(writeText).toHaveBeenCalledWith("a@b.co");
  expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  expect(document.querySelector("[aria-live]")?.textContent).toBe(
    "Email copied.",
  );

  act(() => {
    vi.advanceTimersByTime(1600);
  });
  expect(screen.getByRole("button", { name: "Copy email" })).toBeTruthy();
});

it("CopyEmail: when the clipboard is blocked, shows the address so it can be copied by hand", async () => {
  vi.stubGlobal("navigator", {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
  });
  render(<CopyEmail email="a@b.co" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
  await act(async () => {});
  expect(screen.getByRole("button", { name: "Copy failed" })).toBeTruthy();
  expect(document.querySelector("[aria-live]")?.textContent).toContain(
    "a@b.co",
  );
});

it("NowPlaying: is hidden from assistive tech and rotates through the facts", () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
  const { container } = render(<NowPlaying items={["one", "two"]} />);
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  expect(container.textContent).toContain("one");

  act(() => {
    vi.advanceTimersByTime(4200 + 300);
  });
  expect(container.textContent).toContain("two");
  act(() => {
    vi.advanceTimersByTime(4200 + 300);
  });
  expect(container.textContent).toContain("one");
});
