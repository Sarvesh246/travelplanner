"use client";

import { useState } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { createComment, deleteComment } from "@/actions/comments";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import { CommentableType } from "@prisma/client";

export interface CommentSerialized {
  id: string;
  body: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
  editedAt: string | null;
}

interface CommentThreadProps {
  entityType: CommentableType;
  entityId: string;
  comments: CommentSerialized[];
  compact?: boolean;
}

export function CommentThread({ entityType, entityId, comments, compact }: CommentThreadProps) {
  const { currentUser, canEdit } = useTripContext();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createComment({ entityType, entityId, body: body.trim() });
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
    try {
      await deleteComment(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {comments.length > 0 && (
        <div className={compact ? "space-y-1.5" : "space-y-2"}>
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group">
              <UserAvatar name={c.author.name} avatarUrl={c.author.avatarUrl} size="xs" />
              <div className="flex-1 min-w-0 bg-muted/40 rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{c.author.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(c.createdAt)}
                    {c.editedAt && " · edited"}
                  </span>
                </div>
                <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
              {(c.authorId === currentUser.id || canEdit) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pendingDelete === c.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete comment"
                >
                  {pendingDelete === c.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="xs" />
        <div className="flex-1 flex items-center gap-2 bg-muted/40 rounded-xl pl-3 pr-1.5 py-1">
          <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="w-6 h-6 rounded-md flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
            aria-label="Post comment"
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </button>
        </div>
      </form>
    </div>
  );
}
