import clsx from "clsx";
import { Compass, Home, LogOut, Network, PenSquare, Settings, User, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useLogout, useMe } from "@/lib/queries";
import type { Me } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { Menu } from "./Menu";
import { RightRail } from "./RightRail";
import { ThemeToggle } from "./ThemeToggle";
import { buttonClass } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

function navItems(me: Me | null | undefined): NavItem[] {
  const icon = "h-[18px] w-[18px]";
  if (!me) {
    return [
      { to: "/explore", label: "Explore", icon: <Compass className={icon} /> },
      { to: "/graph", label: "Graph Lab", icon: <Network className={icon} /> },
      { to: "/people", label: "People", icon: <Users className={icon} /> },
    ];
  }
  return [
    { to: "/", label: "Home", icon: <Home className={icon} />, end: true },
    { to: "/graph", label: "Graph Lab", icon: <Network className={icon} /> },
    { to: "/people", label: "People", icon: <Users className={icon} /> },
    { to: `/u/${me.username}`, label: "Profile", icon: <User className={icon} /> },
  ];
}

function SideNav({ me }: { me: Me | null | undefined }) {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen flex-col py-6 md:flex">
      <div className="px-3">
        <Logo />
      </div>
      <nav className="mt-8 space-y-1" aria-label="Main">
        {navItems(me).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-200/60 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white",
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {me ? (
        <Link to="/?compose=1" className={buttonClass("primary", "md", "mt-6 w-full")}>
          <PenSquare className="h-4 w-4" />
          New post
        </Link>
      ) : (
        <div className="mt-6 space-y-2">
          <Link to="/register" className={buttonClass("primary", "md", "w-full")}>
            Sign up
          </Link>
          <Link to="/login" className={buttonClass("secondary", "md", "w-full")}>
            Log in
          </Link>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {me ? (
          <>
            <Link to={`/u/${me.username}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <Avatar user={me} size="sm" />
              <span className="truncate text-sm font-medium">{me.username}</span>
            </Link>
            <ThemeToggle />
            <Menu
              label="Account"
              items={[
                { label: "Settings", icon: <Settings className="h-4 w-4" />, onSelect: () => navigate("/settings") },
                {
                  label: "Log out",
                  icon: <LogOut className="h-4 w-4" />,
                  onSelect: () => logout.mutate(undefined, { onSuccess: () => navigate("/") }),
                },
              ]}
            />
          </>
        ) : (
          <>
            <span className="muted flex-1 px-1 text-xs">Theme</span>
            <ThemeToggle />
          </>
        )}
      </div>
    </aside>
  );
}

function MobileHeader({ me }: { me: Me | null | undefined }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {me ? (
          <Link to="/settings" aria-label="Settings" className="ml-1 rounded-full">
            <Avatar user={me} size="sm" />
          </Link>
        ) : (
          <Link to="/login" className={buttonClass("primary", "sm", "ml-1")}>
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

function MobileTabBar({ me }: { me: Me | null | undefined }) {
  const items = navItems(me);
  if (me) items.splice(2, 0, { to: "/?compose=1", label: "Post", icon: <PenSquare className="h-5 w-5" /> });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? item.to.includes("?")}
          className={({ isActive }) =>
            clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive && !item.to.includes("?") ? "text-accent-600 dark:text-accent-400" : "text-zinc-500 dark:text-zinc-400",
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Pages that need the full width (the graph) drop the right rail. */
const WIDE_ROUTES = ["/graph"];

export function AppShell() {
  const { data: me } = useMe();
  const { pathname } = useLocation();
  const wide = WIDE_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen">
      <MobileHeader me={me} />
      <div
        className={clsx(
          "mx-auto grid max-w-[1280px] gap-8 px-4 md:grid-cols-[200px_minmax(0,1fr)] md:px-6",
          !wide && "md:max-w-[960px] xl:max-w-[1280px] xl:grid-cols-[220px_minmax(0,1fr)_320px]",
          wide && "lg:grid-cols-[220px_minmax(0,1fr)]",
        )}
      >
        <SideNav me={me} />
        <main className="min-w-0 pb-24 pt-4 md:py-6">
          <Outlet />
        </main>
        {!wide && (
          <div className="hidden xl:block">
            <RightRail />
          </div>
        )}
      </div>
      <MobileTabBar me={me} />
    </div>
  );
}
