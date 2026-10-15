import clsx from "clsx";
import { Maximize2, Tag, Waypoints, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { ReasonChip } from "@/components/ReasonChip";
import { REASONS } from "@/components/reasons";
import { FollowBackRow, SuggestionRow } from "@/components/Suggestions";
import { Badge, buttonClass, EmptyState, SectionTitle, Skeleton, Spinner } from "@/components/ui";
import { NetworkCanvas } from "@/graph/NetworkCanvas";
import { plural } from "@/lib/format";
import { communityColor, PALETTE_SIZE } from "@/lib/palette";
import { useGraph, useMe, useRecommendations, useUser } from "@/lib/queries";
import { useTheme } from "@/lib/theme";
import type { GraphData, GraphNode, Recommendations } from "@/lib/types";

function Toggle({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium backdrop-blur transition-colors",
        on
          ? "border-accent-200 bg-accent-50/90 text-accent-700 dark:border-accent-800 dark:bg-accent-950/80 dark:text-accent-300"
          : "border-zinc-200 bg-white/90 text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:text-white",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Legend({ data, showRecommendations, me }: { data: GraphData; showRecommendations: boolean; me: boolean }) {
  const { isDark } = useTheme();
  const sizes = new Map<number, number>();
  for (const node of data.nodes) sizes.set(node.community, (sizes.get(node.community) ?? 0) + 1);
  const named = [...sizes.entries()].filter(([c]) => c < PALETTE_SIZE).sort((a, b) => a[0] - b[0]);
  const other = [...sizes.entries()].filter(([c]) => c >= PALETTE_SIZE).reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-[11px] text-zinc-600 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 sm:right-auto">
      {named.map(([community, size]) => (
        <span key={community} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: communityColor(community, isDark) }} />
          Community {community + 1} <span className="muted tabular-nums">({size})</span>
        </span>
      ))}
      {other > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: communityColor(null, isDark) }} />
          Other <span className="muted tabular-nums">({other})</span>
        </span>
      )}
      {me && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-zinc-800 dark:border-zinc-200" /> You
        </span>
      )}
      {showRecommendations && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-dashed border-accent-600 dark:border-accent-400" /> Suggested
        </span>
      )}
    </div>
  );
}

function SelectedNode({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { data: user } = useUser(node.id);
  return (
    <section className="card animate-fade-in p-4">
      <div className="flex items-start gap-3">
        {user ? <Avatar user={user} size="lg" community={node.community} /> : <Skeleton className="h-14 w-14 rounded-full" />}
        <div className="min-w-0 flex-1">
          <Link to={`/u/${node.id}`} className="block truncate font-semibold hover:underline">
            {node.id}
          </Link>
          <p className="muted text-xs">Community {node.community + 1}</p>
          <div className="mt-2 flex gap-2">
            {user && !user.is_me && (
              <FollowButton username={user.username} following={user.is_following} followsYou={user.follows_you} />
            )}
            <Link to={`/u/${node.id}`} className={buttonClass("secondary", "sm")}>
              Profile
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Clear selection"
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Stat label="Followers (in-degree)" value={node.in_degree} />
        <Stat label="Following (out-degree)" value={node.out_degree} />
        <Stat label="Eigenvector centrality" value={node.eigenvector.toFixed(3)} />
        <Stat label="Articulation point" value={node.is_articulation ? "Yes" : "No"} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="muted text-xs">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

const CASE_STEPS = [
  { case: 1, title: "Cold start", body: "No connections yet" },
  { case: 2, title: "Bridge", body: "You're an articulation point" },
  { case: 3, title: "Small network", body: "A few connections" },
];

function CaseCard({ recs }: { recs: Recommendations }) {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300">Case {recs.case}</Badge>
        <h2 className="text-sm font-semibold">{recs.case_label}</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{recs.explanation}</p>
      <ol className="mt-4 grid grid-cols-3 gap-1.5" aria-label="Recommendation cases">
        {CASE_STEPS.map((step) => (
          <li
            key={step.case}
            aria-current={step.case === recs.case ? "step" : undefined}
            className={clsx(
              "rounded-lg border px-2 py-1.5",
              step.case === recs.case
                ? "border-accent-300 bg-accent-50 dark:border-accent-700 dark:bg-accent-950/60"
                : "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <p className="text-[11px] font-semibold">
              {step.case}. {step.title}
            </p>
            <p className="muted text-[10px] leading-tight">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="muted mt-3 text-xs">
        You follow {recs.me.following} and have {plural(recs.me.followers, "follower")} (degree {recs.me.degree}).
      </p>
    </section>
  );
}

function RecommendationsPanel({ recs }: { recs: Recommendations }) {
  return (
    <section className="card p-4">
      <SectionTitle action={<span className="muted text-xs">{recs.suggestions.length}</span>}>Suggested for you</SectionTitle>
      <div className="mt-4 space-y-4">
        {recs.suggestions.map((suggestion) => (
          <SuggestionRow key={suggestion.user.id} suggestion={suggestion} />
        ))}
        {recs.suggestions.length === 0 && (
          <p className="muted text-sm">Nobody new to suggest: you already follow everyone this case would pick.</p>
        )}
      </div>
      {recs.follow_back.length > 0 && (
        <>
          <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />
          <SectionTitle action={<span className="muted text-xs">{recs.follow_back.length}</span>}>Follow back</SectionTitle>
          <div className="mt-4 space-y-4">
            {recs.follow_back.map((user) => (
              <FollowBackRow key={user.id} user={user} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function NetworkStats({ data }: { data: GraphData }) {
  const s = data.stats;
  return (
    <section className="card p-4">
      <SectionTitle>Network statistics</SectionTitle>
      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
        <Stat label="Nodes" value={s.nodes} />
        <Stat label="Edges" value={s.edges} />
        <Stat label="Communities" value={s.communities} />
        <Stat label="Density" value={s.density.toFixed(3)} />
        <Stat label="Avg. degree" value={s.average_degree} />
        <Stat label="Bridges" value={s.articulation_points} />
      </dl>
      <p className="muted mt-3 text-xs">{s.reciprocal_pairs} pairs follow each other.</p>
    </section>
  );
}

function Glossary() {
  return (
    <section className="card p-4">
      <SectionTitle>How suggestions are picked</SectionTitle>
      <ul className="mt-3 space-y-3">
        {(Object.keys(REASONS) as (keyof typeof REASONS)[]).map((key) => (
          <li key={key}>
            <ReasonChip reason={key} />
            <p className="muted mt-1 text-xs leading-relaxed">{REASONS[key].description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GraphLab() {
  const { data: me } = useMe();
  const graph = useGraph();
  const recs = useRecommendations(!!me);
  const [selected, setSelected] = useState<string | null>(null);
  const [showRecs, setShowRecs] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);

  const recommended = useMemo(
    () => [...(recs.data?.suggestions.map((s) => s.user.username) ?? []), ...(recs.data?.follow_back.map((u) => u.username) ?? [])],
    [recs.data],
  );
  const selectedNode = graph.data?.nodes.find((node) => node.id === selected) ?? null;

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Graph Lab</h1>
        <p className="muted mt-1 max-w-2xl text-sm">
          The live follow graph. Each dot is a person and each arrow is a follow; dot size grows with degree and colour
          marks the community. Click someone to inspect them.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card dot-grid relative h-[62vh] min-h-[380px] overflow-hidden lg:sticky lg:top-6 lg:h-[calc(100vh-9rem)]">
          {graph.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}
          {graph.isError && (
            <EmptyState icon={<Waypoints className="h-5 w-5" />} title="Couldn't load the graph" className="h-full justify-center">
              Make sure the Django API is running.
            </EmptyState>
          )}
          {graph.data && (
            <>
              <NetworkCanvas
                data={graph.data}
                me={me?.username}
                recommended={recommended}
                showRecommendations={!!me && showRecs}
                showLabels={showLabels}
                selected={selected}
                onSelect={setSelected}
                fitSignal={fitSignal}
                className="absolute inset-0"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {me && (
                  <Toggle on={showRecs} onClick={() => setShowRecs((v) => !v)} icon={<Waypoints className="h-3.5 w-3.5" />}>
                    My suggestions
                  </Toggle>
                )}
                <Toggle on={showLabels} onClick={() => setShowLabels((v) => !v)} icon={<Tag className="h-3.5 w-3.5" />}>
                  Labels
                </Toggle>
              </div>
              <button
                type="button"
                onClick={() => setFitSignal((n) => n + 1)}
                aria-label="Fit graph to view"
                title="Fit to view"
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 text-zinc-600 backdrop-blur hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <Legend data={graph.data} showRecommendations={!!me && showRecs} me={!!me} />
            </>
          )}
        </div>

        <aside className="space-y-4">
          {selectedNode && <SelectedNode node={selectedNode} onClose={() => setSelected(null)} />}
          {me ? (
            recs.data ? (
              <>
                <CaseCard recs={recs.data} />
                <RecommendationsPanel recs={recs.data} />
              </>
            ) : (
              <div className="card space-y-3 p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            )
          ) : (
            <section className="card p-4">
              <SectionTitle>See your own recommendations</SectionTitle>
              <p className="muted mt-1 text-sm">
                Log in to see where you sit in the graph, which case of the recommender applies to you, and why each
                person was suggested.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/register" className={buttonClass("primary", "sm")}>
                  Sign up
                </Link>
                <Link to="/login" state={{ from: "/graph" }} className={buttonClass("secondary", "sm")}>
                  Log in
                </Link>
              </div>
            </section>
          )}
          {graph.data && <NetworkStats data={graph.data} />}
          <Glossary />
        </aside>
      </div>
    </div>
  );
}
