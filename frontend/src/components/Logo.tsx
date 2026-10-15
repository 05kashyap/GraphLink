import { Link } from "react-router-dom";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent-600 dark:fill-accent-500" />
      <g stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round">
        <line x1="10" y1="11" x2="21" y2="9" />
        <line x1="10" y1="11" x2="13" y2="22" />
        <line x1="21" y1="9" x2="13" y2="22" />
        <line x1="21" y1="9" x2="23" y2="20" />
      </g>
      <g fill="#fff">
        <circle cx="10" cy="11" r="3" />
        <circle cx="21" cy="9" r="3" />
        <circle cx="13" cy="22" r="3" />
        <circle cx="23" cy="20" r="2.2" />
      </g>
    </svg>
  );
}

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight">
      <LogoMark />
      <span className="text-[17px]">GraphLink</span>
    </Link>
  );
}
