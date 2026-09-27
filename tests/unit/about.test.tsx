import { experience, papers, visibleProjects } from "@/lib/content";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { About } from "@/components/sections/About";
import { Highlights } from "@/components/sections/Highlights";
import { deriveStats } from "@/lib/stats";

afterEach(cleanup);

const stats = deriveStats({ experience, projects: visibleProjects, papers });

it("shows the newest role in the Latest role card", () => {
  render(<About />);
  const newest = [...experience].sort((a, b) =>
    b.start.localeCompare(a.start),
  )[0]!;
  const card = screen.getByText("Latest role").closest("article")!;
  expect(
    within(card).getByRole("heading", { name: newest.orgShort ?? newest.org }),
  ).toBeTruthy();
  expect(newest.summary).toBeTruthy();
  expect(within(card).getByText(newest.summary!)).toBeTruthy();
  expect(within(card).getByText(/Jul 2026 – Present/)).toBeTruthy();
});

it("shows the derived counts, not hard-coded ones", () => {
  render(<About />);
  const card = screen.getByText("By the numbers").closest("article")!;
  const value = (label: string) =>
    // The screen-reader copy holds the final number; the visible digits may be mid-count.
    within(card)
      .getByText(label)
      .previousElementSibling?.querySelector(".sr-only")?.textContent;
  expect(value("roles & internships")).toBe(String(stats.roles));
  expect(value("projects")).toBe(String(stats.projects));
  expect(value("published papers")).toBe(String(stats.papers));
});

it("uses the same derived counts in the highlights strip", () => {
  render(<Highlights />);
  const list = screen.getByRole("list", { name: "Highlights" });
  expect(within(list).getByText("roles and internships").textContent).toContain(
    String(stats.roles),
  );
  expect(within(list).getByText("projects").textContent).toContain(
    String(stats.projects),
  );
});
