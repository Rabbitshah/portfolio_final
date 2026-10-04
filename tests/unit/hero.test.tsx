import { site } from "@/lib/content";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Hero } from "@/components/sections/Hero";

afterEach(cleanup);

it("gives assistive tech the exact headline once, and the visible words are hidden from it", () => {
  render(<Hero />);
  const h1 = screen.getByRole("heading", { level: 1 });
  const readable = h1.querySelector(".sr-only");
  const visible = h1.querySelector('[aria-hidden="true"]');
  expect(readable?.textContent).toBe(site.headline);
  // The visible words, joined as they are on screen, are the same sentence.
  expect(visible?.textContent).toBe(site.headline);
  // So the accessible name is the sentence once, not twice.
  expect(screen.getByRole("heading", { level: 1, name: site.headline })).toBe(
    h1,
  );
});

it("splits the headline into words that fit the delay classes, and they cannot be selected", () => {
  render(<Hero />);
  const words = document.querySelectorAll("h1 .hero-word");
  expect(words.length).toBe(site.headline.split(" ").length);
  expect(words.length).toBeLessThanOrEqual(12);
  expect(
    document.querySelector('h1 [aria-hidden="true"]')?.className,
  ).toContain("select-none");
  for (const word of words) expect(word.className).toContain("animation-delay");
});

it('keeps the comma after "ship" plain, and "hold up." together in one emphasis', () => {
  render(<Hero />);
  const ems = [...document.querySelectorAll("h1 em")];
  expect(ems.map((em) => em.textContent)).toEqual(["ship", "hold up."]);
  expect(ems[0]?.parentElement?.textContent).toBe("ship,");
  expect(ems[1]?.querySelectorAll(".hero-word").length).toBe(2);
});

it("keeps the emphasized words inside the headline text", () => {
  render(<Hero />);
  const emphasized = [...document.querySelectorAll("h1 em")].map(
    (em) => em.textContent,
  );
  expect(emphasized.length).toBeGreaterThan(0);
  for (const text of emphasized) expect(site.headline).toContain(text);
});
