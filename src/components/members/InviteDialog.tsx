"use client";

import { useCallback, useEffect, useState } from "react";
import { inviteMember } from "@/actions/members";
import { toast } from "sonner";
import { X, Copy, Mail, Check, Loader2, AlertTriangle } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useLoading } from "@/hooks/useLoading";
import { createPortal } from "react-dom";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}

export function InviteDialog({ open, onOpenChange, tripId }: InviteDialogProps) {
  const { startLoading, stopLoading } = useLoading();
  const online = useNetworkStatus();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  const closeDialog = useCallback(() => {
    setEmailSent(null);
    setInviteLink(null);
    setCopied(false);
    setLoading(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const requestClose = useCallback(() => {
    if (inviteLink) {
      closeDialog();
      return;
    }
    if (email.trim().length > 0 && !loading && !inviteLink) {
      if (typeof window !== "undefined" && !window.confirm("Discard unsent invite draft?")) {
        return;
      }
    }
    closeDialog();
  }, [inviteLink, email, loading, closeDialog]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDialog, open, requestClose]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!online) {
      toast.error("You are offline right now.", {
        description: "Reconnect before sending an invite.",
      });
      return;
    }
    setLoading(true);
    startLoading("Sending invite...");
    const to = email.trim();
    try {
      const result = await inviteMember(tripId, to, role);
      setInviteLink(result.inviteLink);
      setEmailSent(result.emailSent);
      if (result.emailSent) {
        toast.success(`Invite emailed to ${to}`);
      } else {
        toast.message("Invite created", {
          description:
            "Email is not available right now. Copy the invite link and send it directly.",
        });
      }
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send this invite. Please try again.");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  if (!portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => requestClose()} />
      <div className="relative mt-auto flex max-h-[min(94dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl sm:mt-0 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
          <h2 className="font-semibold text-base">Invite members</h2>
          <button
            onClick={() => requestClose()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[min(76dvh,30rem)] overflow-y-auto p-5 sm:p-6 space-y-4">
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="MEMBER">Member — can view and contribute</option>
                <option value="VIEWER">Viewer — read-only access</option>
                <option value="ADMIN">Admin — can manage members and settings</option>
              </select>
            </div>

              <button
                type="submit"
              disabled={loading || !email.trim() || !online}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {online ? "Send invite" : "Reconnect to invite"}
            </button>
          </form>

          {inviteLink && emailSent === false && (
            <div
              className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
              role="status"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Email is not available right now. Your invite link is ready below - copy
                it and send it directly.
              </span>
            </div>
          )}

          {inviteLink && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Share invite link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-xs text-muted-foreground truncate"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
        {inviteLink ? (
          <div className="border-t border-border px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={closeDialog}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    portalTarget
  );
}
