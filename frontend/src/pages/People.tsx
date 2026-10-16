import { Search, Users } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { Badge, EmptyState, Input, LoadMore, Skeleton } from "@/components/ui";
import { plural } from "@/lib/format";
import { useGraph, useUsers } from "@/lib/queries";

export default function People() {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const users = useUsers(query);
  const { data: graph } = useGraph();
  const nodes = new Map(graph?.nodes.map((node) => [node.id, node]));
  const items = users.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">People</h1>
        <p className="muted mt-1 text-sm">Everyone in the network. The ring colour shows each person's community.</p>
      </header>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="search"
          placeholder="Search by username"
          aria-label="Search people"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {users.isLoading &&
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card flex items-center gap-3 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        {items.map((user) => {
          const node = nodes.get(user.username);
          return (
            <div key={user.id} className="card flex items-center gap-3 p-4">
              <Link to={`/u/${user.username}`} className="rounded-full">
                <Avatar user={user} size="lg" community={node?.community ?? null} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Link to={`/u/${user.username}`} className="truncate text-sm font-semibold hover:underline">
                    {user.username}
                  </Link>
                  {user.is_me && <Badge>You</Badge>}
                </div>
                <p className="muted mt-0.5 text-xs">
                  {plural(user.follower_count, "follower")} · {plural(user.post_count, "post")}
                </p>
                {user.follows_you && !user.is_me && <p className="muted mt-0.5 text-xs">Follows you</p>}
              </div>
              <FollowButton username={user.username} following={user.is_following} followsYou={user.follows_you} />
            </div>
          );
        })}
      </div>
      {users.isSuccess && items.length === 0 && (
        <div className="card">
          <EmptyState icon={<Users className="h-5 w-5" />} title="No one matches that search" />
        </div>
      )}
      <LoadMore hasNextPage={users.hasNextPage} isFetchingNextPage={users.isFetchingNextPage} fetchNextPage={users.fetchNextPage} />
    </div>
  );
}
