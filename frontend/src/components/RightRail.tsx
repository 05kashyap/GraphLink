import { ArrowRight, Github } from "lucide-react";
import { Link } from "react-router-dom";

import { communityColor } from "@/lib/palette";
import { useGraph, useMe, useRecommendations } from "@/lib/queries";
import { useTheme } from "@/lib/theme";
import { FollowBackRow, SuggestionRow } from "./Suggestions";
import { Badge, buttonClass, SectionTitle, Skeleton } from "./ui";

function SuggestionsCard() {
  const { data, isLoading } = useRecommendations(true);
  const items = data?.suggestions.slice(0, 4) ?? [];
  const followBack = data?.follow_back.slice(0, 2) ?? [];

  return (
    <section className="card p-4">
      <SectionTitle action={data && <Badge>Case {data.case}</Badge>}>Suggested for you</SectionTitle>
      {data && <p className="muted mt-1 text-xs">{data.case_label}</p>}
      <div className="mt-4 space-y-4">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        {items.map((suggestion) => (
          <SuggestionRow key={suggestion.user.id} suggestion={suggestion} />
        ))}
        {followBack.map((user) => (
          <FollowBackRow key={user.id} user={user} />
        ))}
        {data && items.length === 0 && followBack.length === 0 && (
          <p className="muted text-sm">You're connected to everyone the recommender would suggest.</p>
        )}
      </div>
      <Link
        to="/graph"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:underline dark:text-accent-400"
      >
        See why in Graph Lab <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function NetworkCard() {
  const { data } = useGraph();
  const { isDark } = useTheme();
  if (!data) return null;

  const sizes = new Map<number, number>();
  for (const node of data.nodes) sizes.set(node.community, (sizes.get(node.community) ?? 0) + 1);
  const total = data.nodes.length || 1;

  return (
    <section className="card p-4">
      <SectionTitle>The network</SectionTitle>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["People", data.stats.nodes],
          ["Follows", data.stats.edges],
          ["Communities", data.stats.communities],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/50">
            <dd className="text-lg font-semibold tabular-nums">{value}</dd>
            <dt className="muted text-[11px]">{label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full" aria-label="Community sizes">
        {[...sizes.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([community, size]) => (
            <span
              key={community}
              title={`Community ${community + 1}: ${size} people`}
              style={{ width: `${(size / total) * 100}%`, background: communityColor(community, isDark) }}
              className="border-r-2 border-white last:border-r-0 dark:border-zinc-900"
            />
          ))}
      </div>
      <p className="muted mt-2 text-xs">Community sizes found by greedy modularity clustering.</p>
    </section>
  );
}

export function RightRail() {
  const { data: me } = useMe();
  return (
    <div className="sticky top-6 space-y-4 py-6">
      {me ? (
        <SuggestionsCard />
      ) : (
        <section className="card p-4">
          <SectionTitle>Recommendations, explained</SectionTitle>
          <p className="muted mt-1 text-sm">
            Sign up and GraphLink will suggest people to follow and tell you which graph algorithm picked them.
          </p>
          <Link to="/register" className={buttonClass("primary", "sm", "mt-3 w-full")}>
            Create an account
          </Link>
        </section>
      )}
      <NetworkCard />
      <footer className="muted space-y-1 px-1 text-xs">
        <p>A discrete mathematics course project demonstrating graph-based recommendations.</p>
        <a
          href="https://github.com/05kashyap/GraphLink"
          className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="h-3.5 w-3.5" /> Source on GitHub
        </a>
      </footer>
    </div>
  );
}
