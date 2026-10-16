import clsx from "clsx";
import { CalendarDays, FileText, Users } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { PostCard, PostSkeleton } from "@/components/PostCard";
import { UserRow } from "@/components/UserRow";
import { Alert, Badge, buttonClass, EmptyState, LoadMore, Skeleton } from "@/components/ui";
import { fullDate } from "@/lib/format";
import { useConnections, useGraph, useUser, useUserPosts, type Relation } from "@/lib/queries";

type Tab = "posts" | Relation;

function Posts({ username }: { username: string }) {
  const posts = useUserPosts(username);
  const items = posts.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <div className="space-y-3">
      {posts.isLoading && <PostSkeleton />}
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.isSuccess && items.length === 0 && (
        <div className="card">
          <EmptyState icon={<FileText className="h-5 w-5" />} title="No posts yet" />
        </div>
      )}
      <LoadMore hasNextPage={posts.hasNextPage} isFetchingNextPage={posts.isFetchingNextPage} fetchNextPage={posts.fetchNextPage} />
    </div>
  );
}

function Connections({ username, relation }: { username: string; relation: Relation }) {
  const list = useConnections(username, relation);
  const users = list.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
      {users.map((user) => (
        <div key={user.id} className="p-3 sm:px-4">
          <UserRow user={user} />
        </div>
      ))}
      {list.isSuccess && users.length === 0 && (
        <EmptyState icon={<Users className="h-5 w-5" />} title={relation === "followers" ? "No followers yet" : "Not following anyone yet"} />
      )}
      {list.hasNextPage && (
        <div className="p-2">
          <LoadMore hasNextPage isFetchingNextPage={list.isFetchingNextPage} fetchNextPage={list.fetchNextPage} />
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const username = useParams().username!;
  const [params, setParams] = useSearchParams();
  const tab = (["posts", "followers", "following"].includes(params.get("tab") ?? "") ? params.get("tab") : "posts") as Tab;
  const { data: user, isLoading, error } = useUser(username);
  const { data: graph } = useGraph();
  const node = graph?.nodes.find((n) => n.id === username);

  if (error) return <Alert>{error.status === 404 ? `There's no user called “${username}”.` : error.message}</Alert>;

  const stats: { key: Tab | "likes"; label: string; value?: number }[] = [
    { key: "posts", label: "Posts", value: user?.post_count },
    { key: "followers", label: "Followers", value: user?.follower_count },
    { key: "following", label: "Following", value: user?.following_count },
    { key: "likes", label: "Likes", value: user?.likes_received },
  ];

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="dot-grid h-20 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50" />
        <div className="px-4 pb-4 sm:px-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            {user ? (
              <Avatar user={user} size="xl" community={node?.community ?? null} className="border-4 border-white dark:border-zinc-900" />
            ) : (
              <Skeleton className="h-24 w-24 rounded-full border-4 border-white dark:border-zinc-900" />
            )}
            {user &&
              (user.is_me ? (
                <Link to="/settings" className={buttonClass("secondary", "sm")}>
                  Edit profile
                </Link>
              ) : (
                <FollowButton username={user.username} following={user.is_following} followsYou={user.follows_you} size="md" />
              ))}
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{username}</h1>
              {user?.follows_you && <Badge>Follows you</Badge>}
              {node?.is_articulation && <Badge className="bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300">Bridge user</Badge>}
            </div>
            {user ? (
              <p className="muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Joined {fullDate(user.date_joined)}
                </span>
                {node && <span>Community {node.community + 1}</span>}
              </p>
            ) : (
              isLoading && <Skeleton className="mt-2 h-3 w-40" />
            )}
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2">
            {stats.map((stat) => {
              const clickable = stat.key !== "likes";
              const content = (
                <>
                  <dd className="text-base font-semibold tabular-nums">{stat.value ?? "–"}</dd>
                  <dt className="muted text-xs">{stat.label}</dt>
                </>
              );
              return clickable ? (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => setParams(stat.key === "posts" ? {} : { tab: stat.key })}
                  className={clsx(
                    "rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    tab === stat.key && "bg-zinc-100 dark:bg-zinc-800",
                  )}
                  aria-pressed={tab === stat.key}
                >
                  {content}
                </button>
              ) : (
                <div key={stat.key} className="px-2 py-2" title="Likes received on their posts">
                  {content}
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {tab === "posts" ? <Posts username={username} /> : <Connections username={username} relation={tab} />}
    </div>
  );
}
