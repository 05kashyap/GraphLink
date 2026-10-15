import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { UserSummary } from "@/lib/types";
import { Avatar } from "./Avatar";

interface UserRowProps {
  user: UserSummary;
  community?: number | null;
  subtitle?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md";
}

export function UserRow({ user, community, subtitle, action, size = "md" }: UserRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Link to={`/u/${user.username}`} className="rounded-full">
        <Avatar user={user} size={size} community={community} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${user.username}`} className="block truncate text-sm font-medium hover:underline">
          {user.username}
        </Link>
        {subtitle && <div className="muted mt-0.5 text-xs">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
