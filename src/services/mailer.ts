import { Resend } from "resend";
import type { Mailer } from "@/lib/contact/types";

export function createResendMailer(apiKey: string): Mailer {
  const resend = new Resend(apiKey);
  return {
    async send(mail) {
      const { error } = await resend.emails.send(mail);
      if (error) {
        // Resend's error text can be long; the name is enough to tell what went wrong.
        const failure = new Error("Resend rejected the email");
        failure.name = `Resend_${error.name}`;
        throw failure;
      }
    },
  };
}
