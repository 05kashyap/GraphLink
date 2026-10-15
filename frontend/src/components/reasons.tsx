import { Crown, Sparkles, UserCheck, Users, Waypoints } from "lucide-react";
import type { ReactNode } from "react";

import type { ReasonKey } from "@/lib/types";

export const REASONS: Record<ReasonKey | "follow_back", { label: string; icon: ReactNode; description: string }> = {
  friend_of_friend: {
    label: "Friend of friends",
    icon: <Users className="h-3 w-3" />,
    description: "Followed by people you follow: two hops away from you in the graph.",
  },
  influential: {
    label: "Influential",
    icon: <Sparkles className="h-3 w-3" />,
    description: "High eigenvector centrality: followed by people who are themselves well followed.",
  },
  bridge: {
    label: "Bridge user",
    icon: <Waypoints className="h-3 w-3" />,
    description: "An articulation point. Removing them would disconnect part of the network.",
  },
  community_hub: {
    label: "Community hub",
    icon: <Crown className="h-3 w-3" />,
    description: "The best-connected member of a community found by modularity clustering.",
  },
  follow_back: {
    label: "Follows you",
    icon: <UserCheck className="h-3 w-3" />,
    description: "Follows you, but you don't follow them back yet.",
  },
};
