import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
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

/** Theme-aligned hex — mirrors `globals.css` light outdoors palette (email clients cannot use CSS variables). */
const colors = {
  canvas: "#F4F6F2",
  card: "#FFFFFF",
  border: "#E2E8E1",
  forest: "#2F5D50",
  forestHover: "#3E7C66",
  sageMuted: "#7A8F82",
  text: "#1F2933",
  muted: "#6B7280",
  subtleBg: "#EEF4EF",
};

export interface InviteEmailProps {
  tripName: string;
  senderName: string;
  role: MemberRole;
  inviteLink: string;
  expiresAt: Date;
}

export function invitePlainText(props: InviteEmailProps): string {
  const when = props.expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines = [
    `You're invited to "${props.tripName}" on Beacon.`,
    "",
    `${props.senderName} invited you to collaborate as ${roleLabel[props.role]}.`,
    "",
    `Accept invite: ${props.inviteLink}`,
    "",
    `This link expires on ${when}.`,
    "",
    "If you didn't expect this email, you can ignore it safely.",
  ];
  return lines.join("\n");
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
      <Preview>
        {senderName} invited you to {tripName} on Beacon — accept before it expires.
      </Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Card */}
          <Section style={card}>
            <Section style={accentBar} />

            <Section style={cardInner}>
              <Text style={brand}>Beacon</Text>

              <Heading as="h1" style={headline}>
                Join your trip
              </Heading>

              <Text style={tripTitle}>{tripName}</Text>

              <Section style={badgeWrap}>
                <span style={badge}>{roleLabel[role]}</span>
              </Section>

              <Text style={paragraph}>
                <strong style={{ color: colors.text }}>{senderName}</strong> invited you to plan and
                collaborate on this trip. Tap the button below to accept — you&apos;ll need the same
                email address this invite was sent to.
              </Text>

              <Section style={btnSection}>
                <Button href={inviteLink} style={button}>
                  Accept invite
                </Button>
              </Section>

              <Text style={footnote}>
                Link expires{" "}
                <strong style={{ color: colors.text }}>{when}</strong>. If the button doesn&apos;t
                work, copy and paste this URL into your browser:
              </Text>

              <Section style={linkBox}>
                <Link href={inviteLink} style={linkPlain}>
                  {inviteLink}
                </Link>
              </Section>

              <Hr style={divider} />

              <Text style={finePrint}>
                You received this because someone added your email to a Beacon trip. If this
                wasn&apos;t you, you can ignore this message — no account will be created until you
                accept.
              </Text>
            </Section>
          </Section>

          <Text style={footerBrand}>Beacon · Trip planning for the trail ahead</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: colors.canvas,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: 0,
  padding: "36px 16px 48px",
};

const outer = {
  margin: "0 auto",
  maxWidth: "520px",
};

const card = {
  backgroundColor: colors.card,
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  overflow: "hidden" as const,
  boxShadow: "0 1px 3px rgba(31, 41, 51, 0.06), 0 12px 28px rgba(47, 93, 80, 0.06)",
};

const accentBar = {
  height: "4px",
  backgroundColor: colors.forest,
  backgroundImage: `linear-gradient(90deg, ${colors.forest} 0%, ${colors.forestHover} 55%, ${colors.forest} 100%)`,
};

const cardInner = {
  padding: "28px 28px 32px",
};

const brand = {
  margin: "0 0 20px",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  color: colors.sageMuted,
};

const headline = {
  margin: "0 0 8px",
  fontSize: "22px",
  lineHeight: "1.25",
  fontWeight: "600",
  color: colors.text,
};

const tripTitle = {
  margin: "0 0 18px",
  fontSize: "17px",
  lineHeight: "1.35",
  fontWeight: "600",
  color: colors.forest,
};

const badgeWrap = {
  margin: "0 0 22px",
};

const badge = {
  display: "inline-block",
  backgroundColor: colors.subtleBg,
  color: colors.forest,
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.02em",
  padding: "6px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.65",
  color: colors.muted,
  margin: "0 0 28px",
};

const btnSection = {
  textAlign: "center" as const,
  margin: "0 0 28px",
};

const button = {
  backgroundColor: colors.forest,
  borderRadius: "10px",
  color: "#F7FAF8",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  border: `1px solid ${colors.forest}`,
};

const footnote = {
  fontSize: "13px",
  lineHeight: "1.55",
  color: colors.muted,
  margin: "0 0 12px",
};

const linkBox = {
  backgroundColor: colors.subtleBg,
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  padding: "12px 14px",
  margin: "0 0 24px",
  wordBreak: "break-all" as const,
};

const linkPlain = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: colors.forestHover,
  textDecoration: "underline",
};

const divider = {
  borderColor: colors.border,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "0 0 20px",
};

const finePrint = {
  fontSize: "12px",
  lineHeight: "1.55",
  color: "#9CA3AF",
  margin: "0",
};

const footerBrand = {
  margin: "24px 0 0",
  fontSize: "11px",
  textAlign: "center" as const,
  color: "#9CA3AF",
  letterSpacing: "0.02em",
};
