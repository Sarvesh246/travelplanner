import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set. Add it to .env.local to send invite emails.");
  }
  if (!resend) {
    resend = new Resend(key);
  }
  return resend;
}
