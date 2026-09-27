import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ContactState } from "@/lib/contact/state";

// The form's state comes from useActionState; each test sets the state the server returned.
const stateMock = vi.hoisted(() => ({ value: { status: "idle" } as unknown }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [stateMock.value, () => {}, false],
}));
vi.mock("@/lib/contact/actions", () => ({ submitContact: vi.fn() }));

import { ContactForm } from "@/components/interactive/ContactForm";
import { contactCopy } from "@/lib/content";

afterEach(cleanup);

const values = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a project.",
};

it("when the database fails it shows the friendly Error: text with the email and keeps the typed values", () => {
  const failed: ContactState = { status: "error", kind: "failed", values };
  stateMock.value = failed;
  render(<ContactForm copy={contactCopy} email="me@example.com" />);

  expect(screen.getByRole("status").textContent).toBe(
    `${contactCopy.errorPrefix} ${contactCopy.errors.failed.replace("{email}", "me@example.com")}`,
  );
  const message = screen.getByLabelText(contactCopy.labels.message);
  expect((message as HTMLTextAreaElement).value).toBe(values.message);
});
