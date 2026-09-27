// Contracts between the submission logic and the services in src/services/.

export type OutgoingMail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
};

export interface MessageStore {
  /** Stores the message and returns its id. */
  insert(message: {
    name: string;
    email: string;
    body: string;
    ipHash: string;
  }): Promise<string>;
  markNotified(id: string): Promise<void>;
}

export interface SubmissionLimiter {
  /** true when the caller may go ahead. Throws if the limiter cannot be reached. */
  allow(key: string): Promise<boolean>;
}

export interface Mailer {
  /** Throws if the mail was not accepted. */
  send(mail: OutgoingMail): Promise<void>;
}
