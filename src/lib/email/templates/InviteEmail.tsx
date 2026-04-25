import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { MemberRole } from "@prisma/client";

const roleLabel: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer (read-only)",
};

export interface InviteEmailProps {
  tripName: string;
  senderName: string;
  role: MemberRole;
  inviteLink: string;
  expiresAt: Date;
}

export function InviteEmail({
  tripName,
  senderName,
  role,
  inviteLink,
  expiresAt,
}: InviteEmailProps) {
  const when = expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to join {tripName} on Beacon</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>Trip invite</Text>
          <Text style={paragraph}>
            <strong>{senderName}</strong> invited you to collaborate on{" "}
            <strong>{tripName}</strong> as <strong>{roleLabel[role]}</strong>.
          </Text>
          <Section style={btnSection}>
            <Button href={inviteLink} style={button}>
              Accept invite
            </Button>
          </Section>
          <Text style={small}>
            This link expires on {when}. If you did not expect this message, you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
};

const title = {
  fontSize: "20px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#3f3f46",
  margin: "0 0 24px",
};

const btnSection = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const small = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#71717a",
  margin: "0",
};
