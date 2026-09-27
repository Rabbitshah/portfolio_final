import { Resend } from "resend";
import type { Mailer } from "@/lib/contact/types";

export function createResendMailer(apiKey: string): Mailer {
  const resend = new Resend(apiKey);
  return {
    async send(mail) {
      const { error } = await resend.emails.send(mail);
      if (error) {
        // Resend's error text can echo addresses; its fixed name and HTTP status are enough.
        const failure = Object.assign(new Error("Resend rejected the email"), {
          statusCode: error.statusCode,
        });
        failure.name = `Resend_${error.name}`;
        throw failure;
      }
    },
  };
}
