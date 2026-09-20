import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ThemeToggle } from "@/components/interactive/ThemeToggle";

beforeEach(() => {
  document.documentElement.dataset.theme = "light";
  localStorage.clear();
});

afterEach(cleanup);

it("switches the theme and saves the choice", () => {
  render(<ThemeToggle />);
  const button = screen.getByRole("button", {
    name: "Toggle light and dark theme",
  });

  fireEvent.click(button);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("theme")).toBe("dark");

  fireEvent.click(button);
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("theme")).toBe("light");
});
