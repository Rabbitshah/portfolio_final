import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { MobileMenu } from "@/components/interactive/MobileMenu";

beforeEach(() => {
  // jsdom has no matchMedia.
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
});

afterEach(cleanup);

function renderMenu() {
  render(
    <MobileMenu
      brand={<span>brand</span>}
      items={[
        { label: "About", href: "/#about" },
        { label: "Work", href: "/#work" },
      ]}
      email="a@example.com"
      github="https://example.com/gh"
      linkedin="https://example.com/li"
    />,
  );
}

it("opens from the trigger and lists the links", () => {
  renderMenu();
  expect(screen.queryByRole("dialog")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

  expect(screen.getByRole("dialog", { name: "Site menu" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /About/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Work/ })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Toggle light and dark theme" }),
  ).toBeTruthy();
});

it("closes on Escape", () => {
  renderMenu();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
  });
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("closes when a link is clicked", () => {
  renderMenu();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.click(screen.getByRole("link", { name: /Work/ }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
