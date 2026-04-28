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

export function parseEmailAddress(raw: string): EmailAddress {
  const value = raw.trim();
  const namedMatch = value.match(/^(.*?)<([^>]+)>$/);
  if (namedMatch) {
    const [, name, address] = namedMatch;
    return {
      address: address.trim(),
      name: name.trim().replace(/^"|"$/g, "") || undefined,
    };
  }

  return { address: value };
}

/** Resend `from` field: `"Name <addr@domain>"` or bare address. */
export function formatFromHeader(addr: EmailAddress): string {
  if (addr.name?.trim()) {
    return `${addr.name.trim()} <${addr.address}>`;
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
