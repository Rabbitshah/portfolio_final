import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { Marquee } from "@/components/primitives/Marquee";

afterEach(cleanup);

const items = [
  { key: "a", content: "One" },
  { key: "b", content: "Two" },
];

it("has a pause button that toggles aria-pressed and its label", () => {
  render(<Marquee label="Things" items={items} />);
  const button = screen.getByRole("button", { name: "Pause scrolling text" });
  expect(button.getAttribute("aria-pressed")).toBe("false");

  fireEvent.click(button);
  const resume = screen.getByRole("button", { name: "Resume scrolling text" });
  expect(resume.getAttribute("aria-pressed")).toBe("true");

  fireEvent.click(resume);
  expect(
    screen
      .getByRole("button", { name: "Pause scrolling text" })
      .getAttribute("aria-pressed"),
  ).toBe("false");
});

it("sits beside the track, not over it", () => {
  const { container } = render(<Marquee label="Things" items={items} />);
  const marquee = container.querySelector(".marquee");
  expect(marquee?.firstElementChild?.className).toBe("marquee-track");
  expect(marquee?.lastElementChild?.tagName).toBe("BUTTON");
});

it("is not in the server HTML, because it cannot work without JavaScript", () => {
  const html = renderToString(<Marquee label="Things" items={items} />);
  expect(html).not.toContain("<button");
});
