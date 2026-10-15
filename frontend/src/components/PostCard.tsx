import clsx from "clsx";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { fullDate, timeAgo } from "@/lib/format";
import { useDeletePost, useMe, useToggleLike } from "@/lib/queries";
import type { Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Menu } from "./Menu";

interface PostCardProps {
  post: Post;
  /** Detail view shows the full text and no link on the title. */
  detail?: boolean;
  onEdit?: () => void;
}

export function PostCard({ post, detail, onEdit }: PostCardProps) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const like = useToggleLike();
  const remove = useDeletePost();

  const onLike = () => {
    if (!me) return navigate("/login", { state: { from: location.pathname } });
    like.mutate(post);
  };

  const onDelete = () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    remove.mutate(post.id, { onSuccess: () => detail && navigate("/") });
  };

  return (
    <article className="card animate-fade-in p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <Link to={`/u/${post.author.username}`} className="rounded-full">
          <Avatar user={post.author} size="md" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link to={`/u/${post.author.username}`} className="text-sm font-semibold hover:underline">
            {post.author.username}
          </Link>
          <p className="muted text-xs">
            <time dateTime={post.date_posted} title={fullDate(post.date_posted)}>
              {timeAgo(post.date_posted)}
            </time>
          </p>
        </div>
        {post.is_mine && (
          <Menu
            items={[
              {
                label: "Edit",
                icon: <Pencil className="h-4 w-4" />,
                onSelect: () => (onEdit ? onEdit() : navigate(`/p/${post.id}?edit=1`)),
              },
              { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: onDelete, danger: true },
            ]}
          />
        )}
      </header>

      <div className="mt-3">
        {detail ? (
          <h1 className="text-lg font-semibold tracking-tight">{post.title}</h1>
        ) : (
          <h2 className="text-[15px] font-semibold tracking-tight">
            <Link to={`/p/${post.id}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
        )}
        <p
          className={clsx(
            "mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300",
            !detail && "line-clamp-6",
          )}
        >
          {post.content}
        </p>
      </div>

      <footer className="-ml-2 mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={post.liked_by_me}
          aria-label={post.liked_by_me ? "Unlike" : "Like"}
          className={clsx(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm transition-colors",
            post.liked_by_me
              ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
          )}
        >
          <Heart className={clsx("h-4 w-4", post.liked_by_me && "fill-current")} />
          <span className="tabular-nums">{post.like_count}</span>
        </button>
        <Link
          to={`/p/${post.id}#comments`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label={`${post.comment_count} comments`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.comment_count}</span>
        </Link>
      </footer>
    </article>
  );
}

export function PostSkeleton() {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
