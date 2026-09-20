import { site } from "@/lib/content";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Hero } from "@/components/sections/Hero";

afterEach(cleanup);

it("renders the h1 text exactly equal to site.headline", () => {
  render(<Hero />);
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(h1.textContent).toBe(site.headline);
});

it("keeps the emphasized words inside the headline text", () => {
  render(<Hero />);
  const emphasized = [...document.querySelectorAll("h1 em")].map(
    (em) => em.textContent,
  );
  expect(emphasized.length).toBeGreaterThan(0);
  for (const text of emphasized) expect(site.headline).toContain(text);
});
