"use server";

import { headers } from "next/headers";
import { getContactServices } from "@/services/contact";
import { clientIp } from "./hash";
import { logContact } from "./logger";
import { handleSubmission, type ContactState } from "./submit";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// Server Action for the contact form. There is no /api/contact route. Only this function may
// call headers(), so the home page itself stays statically generated.
export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    message: field(formData, "message"),
  };

  const services = getContactServices();
  if (!services.ok) {
    logContact("not_configured", { missing: services.missing });
    return { status: "error", kind: "unavailable", values };
  }

  return handleSubmission(services.deps, {
    ...values,
    honeypot: field(formData, "reply_window"),
    ip: clientIp(await headers()),
  });
}
