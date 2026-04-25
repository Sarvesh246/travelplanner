import { render } from "@react-email/render";
import type { MemberRole } from "@prisma/client";
import { getResend } from "@/lib/email/client";
import { InviteEmail } from "@/lib/email/templates/InviteEmail";

export interface SendInviteEmailInput {
  to: string;
  inviteLink: string;
  tripName: string;
  senderName: string;
  role: MemberRole;
  expiresAt: Date;
}

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  const resend = getResend();
  const html = await render(
    InviteEmail({
      tripName: input.tripName,
      senderName: input.senderName,
      role: input.role,
      inviteLink: input.inviteLink,
      expiresAt: input.expiresAt,
    })
  );

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `You're invited to ${input.tripName}`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
