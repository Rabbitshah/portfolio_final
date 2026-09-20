import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "@/app/page";

it("renders exactly one h1", () => {
  render(<Home />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
