import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { Button } from "@/components/primitives/Button";
import { RollText } from "@/components/primitives/RollText";

afterEach(cleanup);

it("RollText puts the label in the DOM once, and keeps it in data-label for the CSS copy", () => {
  const html = renderToString(<RollText>Work</RollText>);
  expect(html.match(/Work/g)).toHaveLength(2); // once as text, once in data-label
  expect(html).toContain('data-label="Work"');
  const { container } = render(<RollText>Work</RollText>);
  expect(container.textContent).toBe("Work");
  expect(container.querySelectorAll(".roll-text")).toHaveLength(1);
});

it("a Button with a text label rolls, and its name is still the label", () => {
  const { getByRole } = render(
    <Button href="/#work" arrow>
      See projects
    </Button>,
  );
  const link = getByRole("link", { name: "See projects" });
  expect(link.className).toContain("roll-host");
  expect(link.querySelector(".roll")?.getAttribute("data-label")).toBe(
    "See projects",
  );
  // The arrow is still there, outside the rolling label.
  expect(link.querySelector("svg")).not.toBeNull();
  expect(link.querySelector(".roll svg")).toBeNull();
});

it("a Button with roll={false}, or with anything but a text label, does not roll", () => {
  const off = render(
    <Button href="/x" roll={false}>
      Plain
    </Button>,
  );
  expect(off.container.querySelector(".roll, .roll-host")).toBeNull();
  cleanup();
  const node = render(
    <Button href="/x">
      <span>Not text</span>
    </Button>,
  );
  expect(node.container.querySelector(".roll, .roll-host")).toBeNull();
});

it("a button element rolls too", () => {
  const { getByRole } = render(<Button type="submit">Send message</Button>);
  const button = getByRole("button", { name: "Send message" });
  expect(button.className).toContain("roll-host");
  expect(button.querySelector(".roll")?.getAttribute("data-label")).toBe(
    "Send message",
  );
});
