import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFollow, useMe } from "@/lib/queries";
import { Button } from "./ui";

interface FollowButtonProps {
  username: string;
  following: boolean;
  followsYou?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function FollowButton({ username, following, followsYou, size = "sm", className }: FollowButtonProps) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const follow = useFollow();
  // Optimistic local state; the server response then refreshes every list.
  const [isFollowing, setIsFollowing] = useState(following);
  const [hover, setHover] = useState(false);

  useEffect(() => setIsFollowing(following), [following]);

  if (me && me.username === username) return null;

  const onClick = () => {
    if (!me) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    follow.mutate({ username, follow: next }, { onError: () => setIsFollowing(!next) });
  };

  const label = isFollowing ? (hover ? "Unfollow" : "Following") : followsYou ? "Follow back" : "Follow";

  return (
    <Button
      size={size}
      variant={isFollowing ? "secondary" : "primary"}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`min-w-[5.5rem] ${isFollowing && hover ? "!text-red-600 dark:!text-red-400" : ""} ${className ?? ""}`}
      aria-pressed={isFollowing}
      aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${username}`}
    >
      {label}
    </Button>
  );
}
