import { ArrowLeft, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { PostCard, PostSkeleton } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Alert, Button, EmptyState, Textarea } from "@/components/ui";
import { fullDate, timeAgo } from "@/lib/format";
import { useAddComment, useComments, useMe, usePost, useUpdatePost } from "@/lib/queries";

function CommentForm({ postId }: { postId: number }) {
  const { data: me } = useMe();
  const add = useAddComment(postId);
  const [body, setBody] = useState("");

  if (!me) {
    return (
      <p className="muted text-sm">
        <Link to="/login" state={{ from: `/p/${postId}` }} className="font-medium text-accent-600 hover:underline dark:text-accent-400">
          Log in
        </Link>{" "}
        to join the conversation.
      </p>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    add.mutate(body, { onSuccess: () => setBody("") });
  };

  return (
    <form onSubmit={submit} className="flex items-start gap-3">
      <Avatar user={me} size="sm" className="mt-1" />
      <div className="flex-1 space-y-2">
        <Textarea
          aria-label="Write a comment"
          placeholder="Write a comment…"
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(event);
          }}
        />
        {add.error && <Alert>{add.error.message}</Alert>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={add.isPending} disabled={!body.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </form>
  );
}

function Comments({ postId }: { postId: number }) {
  const { data: comments, isLoading } = useComments(postId);
  return (
    <section id="comments" className="card scroll-mt-20 p-4 sm:p-5" aria-label="Comments">
      <h2 className="text-sm font-semibold">Comments {comments && <span className="muted font-normal">· {comments.length}</span>}</h2>
      <div className="mt-4">
        <CommentForm postId={postId} />
      </div>
      <ul className="mt-5 space-y-4">
        {isLoading && <li className="muted text-sm">Loading comments…</li>}
        {comments?.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            {comment.author ? (
              <Link to={`/u/${comment.author.username}`} className="rounded-full">
                <Avatar user={comment.author} size="sm" />
              </Link>
            ) : (
              <Avatar user={{ username: "?", avatar: null }} size="sm" />
            )}
            <div className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
              <p className="text-xs">
                {comment.author ? (
                  <Link to={`/u/${comment.author.username}`} className="font-semibold hover:underline">
                    {comment.author.username}
                  </Link>
                ) : (
                  <span className="font-semibold">Deleted user</span>
                )}
                <span className="muted"> · </span>
                <time className="muted" dateTime={comment.created_on} title={fullDate(comment.created_on)}>
                  {timeAgo(comment.created_on)}
                </time>
              </p>
              <p className="mt-0.5 whitespace-pre-line break-words text-sm text-zinc-700 dark:text-zinc-300">{comment.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {comments?.length === 0 && (
        <EmptyState icon={<MessageCircle className="h-5 w-5" />} title="No comments yet" className="py-6" />
      )}
    </section>
  );
}

export default function PostDetail() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: post, isLoading, error } = usePost(id);
  const update = useUpdatePost(id);
  const editing = params.get("edit") === "1" && post?.is_mine;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      {isLoading && <PostSkeleton />}
      {error && <Alert>{error.message === "Not found." ? "This post doesn't exist or was deleted." : error.message}</Alert>}
      {post &&
        (editing ? (
          <div className="card p-4 sm:p-5">
            <h1 className="mb-3 text-sm font-semibold">Edit post</h1>
            <PostForm
              initial={post}
              submitLabel="Save"
              autoFocus
              onSubmit={async (values) => {
                await update.mutateAsync(values);
                setParams({});
              }}
              onCancel={() => setParams({})}
            />
          </div>
        ) : (
          <PostCard post={post} detail onEdit={() => setParams({ edit: "1" })} />
        ))}
      {post && <Comments postId={post.id} />}
    </div>
  );
}
