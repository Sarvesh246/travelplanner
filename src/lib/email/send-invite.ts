import { render } from "@react-email/render";
import type { MemberRole } from "@prisma/client";
import { parseEmailAddress, sendTransactionalEmail } from "@/lib/email/client";
import { InviteEmail, invitePlainText } from "@/lib/email/templates/InviteEmail";

export interface SendInviteEmailInput {
  to: string;
  inviteLink: string;
  tripName: string;
  senderName: string;
  role: MemberRole;
  expiresAt: Date;
}

function safeSubjectSnippet(tripName: string): string {
  return tripName.replace(/\s+/g, " ").trim().slice(0, 180) || "a trip";
}

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  const props = {
    tripName: input.tripName,
    senderName: input.senderName,
    role: input.role,
    inviteLink: input.inviteLink,
    expiresAt: input.expiresAt,
  };

  let html: string;
  try {
    html = await render(InviteEmail(props));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sendInviteEmail] react-email render failed:", msg);
    throw new Error(`Could not build invite email HTML: ${msg}`);
  }

  const subject = `You're invited to ${safeSubjectSnippet(input.tripName)}`;

  try {
    await sendTransactionalEmail({
      from: parseEmailAddress(from),
      to: { address: input.to },
      subject,
      html,
      plain: invitePlainText(props),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendInviteEmail] Resend API error:", message);
    throw new Error(message);
  }
}
