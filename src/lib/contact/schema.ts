import { z } from "zod";
import { multiLine, singleLine } from "./sanitize";

export type ContactField = "name" | "email" | "message";

// Codes, not sentences: the wording lives in content/contact.ts.
export type FieldErrorCode =
  | "nameRequired"
  | "nameTooLong"
  | "emailRequired"
  | "emailInvalid"
  | "messageTooShort"
  | "messageTooLong";

export type ContactInput = Record<ContactField, string>;
export type FieldErrors = Partial<Record<ContactField, FieldErrorCode>>;

const contactSchema = z.object({
  name: z
    .string()
    .transform(singleLine)
    .pipe(z.string().min(1, "nameRequired").max(100, "nameTooLong")),
  email: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "emailRequired")
        .max(254, "emailInvalid")
        .pipe(z.email("emailInvalid")),
    ),
  message: z
    .string()
    .transform(multiLine)
    .pipe(z.string().min(10, "messageTooShort").max(4000, "messageTooLong")),
});

export type ValidatedContact =
  { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors };

/** Cleans and validates the three fields. The first problem per field wins. */
export function validateContact(input: ContactInput): ValidatedContact {
  const result = contactSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === "name" || field === "email" || field === "message") {
      errors[field] ??= issue.message as FieldErrorCode;
    }
  }
  return { ok: false, errors };
}
