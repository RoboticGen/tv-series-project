"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, Reply as ReplyIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/comments";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface CommentEntry {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
}

interface Comment extends CommentEntry {
  replies: CommentEntry[];
}

interface CommentSectionProps {
  projectId: string;
  comments: Comment[];
  viewerId?: string;
  viewerCanModerate: boolean;
}

function CommentRow({
  comment,
  isPending,
  viewerId,
  viewerCanModerate,
  onDelete,
  replyForm,
}: {
  comment: CommentEntry;
  isPending: boolean;
  viewerId?: string;
  viewerCanModerate: boolean;
  onDelete: (commentId: string) => void;
  replyForm?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <Avatar size="sm">
        <AvatarImage src={comment.authorAvatarUrl ?? undefined} alt={comment.authorName} />
        <AvatarFallback>{comment.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {dateFormatter.format(comment.createdAt)}
          </span>
          {viewerId === comment.userId || viewerCanModerate ? (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              disabled={isPending}
              className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Delete comment"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-pretty text-foreground">{comment.body}</p>
        {replyForm}
      </div>
    </li>
  );
}

export function CommentSection({
  projectId,
  comments,
  viewerId,
  viewerCanModerate,
}: CommentSectionProps) {
  const [body, setBody] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyBody, setReplyBody] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!viewerId || isPending || !body.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addComment(projectId, body);
        setBody("");
      } catch {
        setError("Couldn't post your comment. Try again.");
      }
    });
  }

  function handleReplySubmit(event: React.FormEvent, parentCommentId: string) {
    event.preventDefault();
    if (!viewerId || isPending || !replyBody.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addComment(projectId, replyBody, parentCommentId);
        setReplyBody("");
        setReplyingTo(null);
      } catch {
        setError("Couldn't post your reply. Try again.");
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
    });
  }

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="font-heading text-lg font-bold text-foreground">
        Comments ({totalCount})
      </h2>

      {viewerId ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your thoughts on this project..."
            disabled={isPending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            isPending={isPending}
            viewerId={viewerId}
            viewerCanModerate={viewerCanModerate}
            onDelete={handleDelete}
            replyForm={
              <div className="mt-2">
                {viewerId ? (
                  <button
                    type="button"
                    onClick={() =>
                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ReplyIcon className="size-3" />
                    Reply
                  </button>
                ) : null}

                {replyingTo === comment.id ? (
                  <form
                    onSubmit={(event) => handleReplySubmit(event, comment.id)}
                    className="mt-2 space-y-2"
                  >
                    <Textarea
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      placeholder={`Reply to ${comment.authorName}...`}
                      disabled={isPending}
                      className="min-h-12"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isPending || !replyBody.trim()}>
                        Post reply
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyBody("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : null}

                {comment.replies.length > 0 ? (
                  <ul className="mt-3 space-y-3 border-l pl-4">
                    {comment.replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        isPending={isPending}
                        viewerId={viewerId}
                        viewerCanModerate={viewerCanModerate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            }
          />
        ))}
      </ul>
    </div>
  );
}
