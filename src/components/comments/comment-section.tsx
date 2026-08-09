"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { postComment, deleteComment, editComment, reportComment } from "@/lib/actions/comments";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author_id: string;
  author: { full_name: string; username: string; avatar_url?: string | null } | null;
};

export function CommentSection({
  articleId,
  slug,
  initialComments,
}: {
  articleId: string;
  slug: string;
  initialComments: Comment[];
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, setPending] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  const topLevel = initialComments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => initialComments.filter((c) => c.parent_id === id);

  async function submitTopLevel() {
    if (!newComment.trim()) return;
    setPending(true);
    try {
      await postComment(articleId, slug, newComment);
      setNewComment("");
    } finally {
      setPending(false);
    }
  }

  async function submitReply(parentId: string) {
    if (!replyText.trim()) return;
    setPending(true);
    try {
      await postComment(articleId, slug, replyText, parentId);
      setReplyText("");
      setReplyTo(null);
    } finally {
      setPending(false);
    }
  }

  async function handleReport(commentId: string) {
    await reportComment(commentId, slug);
    setReportedIds((prev) => new Set(prev).add(commentId));
  }

  return (
    <div>
      {userId ? (
        <div className="flex flex-col gap-2 mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="input text-sm"
          />
          <button
            onClick={submitTopLevel}
            disabled={pending || !newComment.trim()}
            className="self-start text-xs px-4 py-2 rounded-full bg-ink text-paper font-medium disabled:opacity-50"
          >
            Post comment
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted mb-8">
          <Link href="/login" className="text-denim font-medium">Log in</Link> to join the discussion.
        </p>
      )}

      <ul className="flex flex-col gap-6">
        {topLevel.map((c) => (
          <li key={c.id}>
            <CommentRow
              comment={c}
              slug={slug}
              isOwn={c.author_id === userId}
              isLoggedIn={!!userId}
              reported={reportedIds.has(c.id)}
              onReport={() => handleReport(c.id)}
              onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
              showReply={!!userId}
            />

            {replyTo === c.id && (
              <div className="flex flex-col gap-2 mt-3 ml-8">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.author?.full_name ?? "this comment"}…`}
                  rows={2}
                  className="input text-sm"
                />
                <button
                  onClick={() => submitReply(c.id)}
                  disabled={pending || !replyText.trim()}
                  className="self-start text-xs px-3 py-1.5 rounded-full bg-ink text-paper font-medium disabled:opacity-50"
                >
                  Post reply
                </button>
              </div>
            )}

            {repliesOf(c.id).length > 0 && (
              <ul className="flex flex-col gap-4 mt-4 ml-8 border-l border-line pl-4">
                {repliesOf(c.id).map((r) => (
                  <li key={r.id}>
                    <CommentRow
                      comment={r}
                      slug={slug}
                      isOwn={r.author_id === userId}
                      isLoggedIn={!!userId}
                      reported={reportedIds.has(r.id)}
                      onReport={() => handleReport(r.id)}
                      showReply={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {topLevel.length === 0 && <p className="text-sm text-ink-muted">Be the first to comment.</p>}
    </div>
  );
}

function CommentRow({
  comment,
  slug,
  isOwn,
  isLoggedIn,
  reported,
  onReport,
  onReply,
  showReply,
}: {
  comment: Comment;
  slug: string;
  isOwn: boolean;
  isLoggedIn: boolean;
  reported: boolean;
  onReport: () => void;
  onReply?: () => void;
  showReply: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    await editComment(comment.id, slug, text);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex gap-3">
      <CommentAvatar name={comment.author?.full_name} url={comment.author?.avatar_url} />
      <div className="flex-1">
        <p className="byline mb-1">
          <span className="font-medium text-ink">{comment.author?.full_name}</span>
          <span className="byline-rule" />
          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
        </p>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="input text-sm" />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="text-xs px-3 py-1 rounded-full bg-ink text-paper">
                Save
              </button>
              <button onClick={() => { setEditing(false); setText(comment.content); }} className="text-xs text-ink-muted">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm">{comment.content}</p>
        )}

        <div className="flex gap-4 mt-1.5">
          {showReply && !editing && (
            <button onClick={onReply} className="text-xs text-ink-muted hover:text-denim-dark">Reply</button>
          )}
          {isOwn && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="text-xs text-ink-muted hover:text-denim-dark">Edit</button>
              <button onClick={() => deleteComment(comment.id, slug)} className="text-xs text-ink-muted hover:text-red-600">Delete</button>
            </>
          )}
          {!isOwn && isLoggedIn && !editing && (
            <button onClick={onReport} disabled={reported} className="text-xs text-ink-muted hover:text-red-600 disabled:opacity-50">
              {reported ? "Reported" : "Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentAvatar({ name, url }: { name?: string; url?: string | null }) {
  if (url) {
    return (
      <Image src={url} alt={name ?? ""} width={32} height={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-denim/15 text-denim-dark flex items-center justify-center text-xs font-medium flex-shrink-0">
      {name?.[0] ?? "?"}
    </div>
  );
}
