import clsx from "clsx";
import { Flame, Rss, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Composer } from "@/components/Composer";
import { PostCard, PostSkeleton } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";
import { Alert, buttonClass, EmptyState, LoadMore } from "@/components/ui";
import { useCreatePost, useFeatured, useFeed, useMe, type Feed } from "@/lib/queries";

function Tabs({ feed, onChange }: { feed: Feed; onChange: (feed: Feed) => void }) {
  const tabs: { key: Feed; label: string }[] = [
    { key: "latest", label: "Latest" },
    { key: "following", label: "Following" },
  ];
  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-900">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          type="button"
          aria-selected={feed === tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            feed === tab.key
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Featured() {
  const { data: post } = useFeatured();
  if (!post) return null;
  return (
    <section aria-labelledby="featured-title" className="space-y-2">
      <h2 id="featured-title" className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Flame className="h-3.5 w-3.5 text-orange-500" /> Most liked
      </h2>
      <PostCard post={post} />
    </section>
  );
}

function ComposeSheet({ onDone }: { onDone: () => void }) {
  const create = useCreatePost();
  return (
    <div className="card p-4">
      <PostForm
        submitLabel="Post"
        autoFocus
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          onDone();
        }}
        onCancel={onDone}
      />
    </div>
  );
}

export default function Home() {
  const { data: me } = useMe();
  const [params, setParams] = useSearchParams();
  const feed: Feed = me && params.get("feed") === "following" ? "following" : "latest";
  const composing = !!me && params.get("compose") === "1";
  const posts = useFeed(feed);

  useEffect(() => {
    if (composing) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [composing]);

  const setFeed = (next: Feed) => setParams(next === "latest" ? {} : { feed: next });
  const items = posts.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Home</h1>
      {composing ? <ComposeSheet onDone={() => setParams(feed === "latest" ? {} : { feed })} /> : <Composer />}
      {me && <Tabs feed={feed} onChange={setFeed} />}
      {feed === "latest" && <Featured />}

      <section className="space-y-3" aria-label="Posts">
        {feed === "latest" && items.length > 0 && (
          <h2 className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Latest posts</h2>
        )}
        {posts.isLoading && Array.from({ length: 3 }, (_, i) => <PostSkeleton key={i} />)}
        {posts.isError && <Alert>{posts.error.message}</Alert>}
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.isSuccess && items.length === 0 && (
          <div className="card">
            {feed === "following" ? (
              <EmptyState
                icon={<UserPlus className="h-5 w-5" />}
                title="Nothing from people you follow yet"
                action={
                  <Link to="/graph" className={buttonClass("primary", "sm")}>
                    Find people to follow
                  </Link>
                }
              >
                Follow a few people and their posts will show up here.
              </EmptyState>
            ) : (
              <EmptyState icon={<Rss className="h-5 w-5" />} title="No posts yet">
                Be the first to share something.
              </EmptyState>
            )}
          </div>
        )}
        <LoadMore
          hasNextPage={posts.hasNextPage}
          isFetchingNextPage={posts.isFetchingNextPage}
          fetchNextPage={posts.fetchNextPage}
        />
      </section>
    </div>
  );
}
