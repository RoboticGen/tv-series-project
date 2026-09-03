"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/comments";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
}

interface CommentSectionProps {
  projectId: string;
  comments: Comment[];
  viewerId?: string;
  viewerCanModerate: boolean;
}

export function CommentSection({
  projectId,
  comments,
  viewerId,
  viewerCanModerate,
}: CommentSectionProps) {
  const [body, setBody] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

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

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
    });
  }

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
        Comments ({comments.length})
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
          <Link href="/landing" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
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
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                    className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-pretty text-foreground">{comment.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
