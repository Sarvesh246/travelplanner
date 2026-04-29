import { Resend } from "resend";

export interface EmailAddress {
  address: string;
  name?: string;
}

interface SendTransactionalEmailInput {
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  plain?: string;
}

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set. Add it to .env.local to send invite emails.");
  }
  return key;
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isValidEmailAddress(value: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function assertValidEmailAddress(address: string, source: string) {
  if (!isValidEmailAddress(address)) {
    throw new Error(
      `${source} must be an email address like email@example.com or Name <email@example.com>. Current address part is invalid.`
    );
  }
}

export function parseEmailAddress(raw: string): EmailAddress {
  const value = stripWrappingQuotes(raw)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    throw new Error("EMAIL_FROM is empty.");
  }

  const namedMatch = value.match(/^(.*?)<([^>]+)>$/);
  if (namedMatch) {
    const [, name, address] = namedMatch;
    const cleanedAddress = address.trim().replace(/^mailto:/i, "");
    assertValidEmailAddress(cleanedAddress, "EMAIL_FROM");
    return {
      address: cleanedAddress,
      name: stripWrappingQuotes(name).trim() || undefined,
    };
  }

  const bareAddress = value.replace(/^mailto:/i, "");
  assertValidEmailAddress(bareAddress, "EMAIL_FROM");
  return { address: bareAddress };
}

/** Resend `from` field: `"Name <addr@domain>"` or bare address. */
export function formatFromHeader(addr: EmailAddress): string {
  assertValidEmailAddress(addr.address, "Email sender");
  if (addr.name?.trim()) {
    const name = addr.name.trim().replace(/[\r\n<>]/g, "");
    return `${name} <${addr.address}>`;
  }
  return addr.address;
}

export async function sendTransactionalEmail({
  from,
  to,
  subject,
  html,
  plain,
}: SendTransactionalEmailInput) {
  const resend = new Resend(getResendApiKey());
  const toList = Array.isArray(to) ? to : [to];

  const htmlBody = html ?? "";
  const textBody = plain ?? "";
  if (!htmlBody && !textBody) {
    throw new Error("Email must include html and/or plain text body");
  }

  // Invite emails send both HTML + plaintext; Resend's typings require both fields as strings so TS
  // selects the HTML overload (not the React-template overload).
  const { data, error } = await resend.emails.send({
    from: formatFromHeader(from),
    to: toList.map((a) => a.address),
    subject,
    html: htmlBody,
    text: textBody,
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }

  return data;
}
