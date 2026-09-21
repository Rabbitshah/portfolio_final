// TODO(content): all wording in this file is a draft written for Phase 4. Review it.
// Copy for the contact form. `{email}` is replaced with the public contact address.
// Every error is shown with `errorPrefix` in front so it never relies on colour alone.

export type ContactCopy = {
  labels: { name: string; email: string; message: string };
  messageHint?: string;
  submit: string;
  pending: string;
  // TODO(content): decide how long messages are kept and say it here (no deletion job exists yet).
  privacy: string;
  success: string;
  errorPrefix: string;
  fieldErrors: {
    nameRequired: string;
    nameTooLong: string;
    emailRequired: string;
    emailInvalid: string;
    messageTooShort: string;
    messageTooLong: string;
  };
  errors: {
    failed: string;
    unavailable: string;
    limited: string;
  };
};

export const contact: ContactCopy = {
  labels: { name: "Your name", email: "Your email", message: "Message" },
  messageHint: "A few lines about what you have in mind.",
  submit: "Send message",
  pending: "Sending…",
  privacy:
    "I use your name and email only to reply. Your message is stored so I can answer it.",
  success: "Thanks. Your message is on its way. I will reply by email.",
  errorPrefix: "Error:",
  fieldErrors: {
    nameRequired: "Please enter your name.",
    nameTooLong: "Please use 100 characters or fewer.",
    emailRequired: "Please enter your email.",
    emailInvalid: "Please enter a valid email address.",
    messageTooShort: "Please write at least 10 characters.",
    messageTooLong: "Please use 4000 characters or fewer.",
  },
  errors: {
    failed:
      "Your message could not be sent. Please try again, or email me at {email}.",
    unavailable:
      "The contact form is not available right now. Please email me at {email}.",
    limited:
      "Too many messages right now. Please email me directly at {email}.",
  },
};
