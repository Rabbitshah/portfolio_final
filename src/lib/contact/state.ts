import type { ContactInput, FieldErrors } from "./schema";

// What the form shows after a submit. Kept apart from submit.ts so the client bundle does not
// pull in server-only code.
export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      kind: "invalid";
      fieldErrors: FieldErrors;
      values: ContactInput;
    }
  | {
      status: "error";
      kind: "failed" | "unavailable" | "limited";
      values: ContactInput;
    };

export const initialContactState: ContactState = { status: "idle" };
