"use client";

import { useState } from "react";
import { inviteMember } from "@/actions/members";
import { toast } from "sonner";
import { X, Copy, Mail, Check, Loader2 } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useLoading } from "@/hooks/useLoading";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
}

export function InviteDialog({ open, onOpenChange, tripId }: InviteDialogProps) {
  const { startLoading, stopLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    startLoading("Sending invite...");
    try {
      const result = await inviteMember(tripId, email.trim(), role);
      setInviteLink(result.inviteLink);
      toast.success(`Invite sent to ${email}`);
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-base">Invite members</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
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
                <option value="ADMIN">Admin — can edit everything</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send invite
            </button>
          </form>

          {inviteLink && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Or share invite link</p>
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
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
