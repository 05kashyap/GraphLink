import { ArrowRight, Github, Sprout, Users, Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonClass, Spinner } from "@/components/ui";
import { NetworkCanvas } from "@/graph/NetworkCanvas";
import { useGraph } from "@/lib/queries";

const CASES: { icon: ReactNode; title: string; body: string; algorithms: string }[] = [
  {
    icon: <Sprout className="h-5 w-5" />,
    title: "Cold start",
    body: "A brand-new user has no edges, so there's nothing local to learn from. Start with the people the whole network listens to.",
    algorithms: "",//Eigenvector centrality · Articulation points
  },
  {
    icon: <Waypoints className="h-5 w-5" />,
    title: "You're a bridge",
    body: "If removing you would split the graph, you sit between communities. Connect with each community's hub and with other bridges.",
    algorithms: "", //Greedy modularity communities · Articulation points
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Growing your circle",
    body: "With a few connections, look two hops out: people your follows follow, plus the network's most influential users.",
    algorithms: "",//"Friends of friends · Eigenvector centrality",
  },
];

const AUTHORS = [
  ["kashyap05", "https://github.com/05kashyap"],
  ["adya2004", "https://github.com/adya2004"],
  ["Vijayvkb007", "https://github.com/Vijayvkb007"],
];

function LivePreview() {
  const { data, isLoading } = useGraph();
  return (
    <figure className="card dot-grid relative overflow-hidden">
      <div className="h-[320px] sm:h-[380px]">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        )}
        {data && <NetworkCanvas data={data} interactive={false} className="h-full w-full" />}
      </div>
      {data && (
        <figcaption className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white/80 px-4 py-2.5 text-xs text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live network
          </span>
          <span className="tabular-nums">
            {data.stats.nodes} people · {data.stats.edges} follows · {data.stats.communities} communities
          </span>
        </figcaption>
      )}
    </figure>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link to="/explore" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
            Explore
          </Link>
          <Link to="/graph" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
            Graph Lab
          </Link>
          <ThemeToggle />
          <Link to="/login" className={buttonClass("secondary", "sm")}>
            Log in
          </Link>
          <Link to="/register" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div>
            <p className="text-sm font-medium text-accent-600 dark:text-accent-400">A graph-theory based recommender system</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              A social network that shows its working.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              GraphLink models every follow as an edge in a directed graph. It suggests who to follow using friends of
              friends, eigenvector centrality, articulation points and community detection, and it tells you which
              one picked each person.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className={buttonClass("primary", "md")}>
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/graph" className={buttonClass("secondary", "md")}>
                Explore the graph
              </Link>
            </div>
          </div>
          <LivePreview />
        </section>

        <section className="border-y border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Three cases, three strategies</h2>
            <p className="muted mt-2 max-w-2xl">
              Where you sit in the graph decides how you get recommendations. GraphLink checks your degree and whether
              you're a cut vertex, then picks a strategy.
            </p>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {CASES.map((item, index) => (
                <li key={item.title} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-400">
                      {item.icon}
                    </span>
                    <span className="muted text-xs font-medium">Case {index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.body}</p>
                  {item.algorithms && <p className="mt-4 text-xs font-medium text-zinc-500">{item.algorithms}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>

      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="muted mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            A discrete mathematics course project by{" "}
            {AUTHORS.map(([name, url], i) => (
              <span key={name}>
                <a href={url} className="font-medium text-zinc-700 hover:underline dark:text-zinc-300" target="_blank" rel="noreferrer">
                  {name}
                </a>
                {i < AUTHORS.length - 2 ? ", " : i === AUTHORS.length - 2 ? " and " : "."}
              </span>
            ))}
          </p>
          <a
            href="https://github.com/05kashyap/GraphLink"
            className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" /> View source
          </a>
        </div>
      </footer>
    </div>
  );
}
