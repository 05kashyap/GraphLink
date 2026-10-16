import clsx from "clsx";

import { communityColor } from "@/lib/palette";
import { useTheme } from "@/lib/theme";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl",
};

interface AvatarProps {
  user: { username: string; avatar: string | null };
  size?: keyof typeof SIZES;
  /** When given, a thin ring in the community's colour links the avatar to the graph. */
  community?: number | null;
  className?: string;
}

export function Avatar({ user, size = "md", community, className }: AvatarProps) {
  const { isDark } = useTheme();
  const ring =
    community !== undefined
      ? { boxShadow: `0 0 0 2px ${isDark ? "#18181b" : "#ffffff"}, 0 0 0 4px ${communityColor(community, isDark)}` }
      : undefined;

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-zinc-200 font-semibold uppercase text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200",
        SIZES[size],
        className,
      )}
      style={ring}
    >
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        user.username.slice(0, 2)
      )}
    </span>
  );
}
