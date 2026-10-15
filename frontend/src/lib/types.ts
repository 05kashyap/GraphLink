export interface UserSummary {
  id: number;
  username: string;
  avatar: string | null;
}

export interface UserProfile extends UserSummary {
  date_joined: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  likes_received: number;
  is_me: boolean;
  is_following: boolean;
  follows_you: boolean;
}

export interface Me extends UserProfile {
  email: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  date_posted: string;
  author: UserSummary;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  is_mine: boolean;
}

export interface Comment {
  id: number;
  body: string;
  created_on: string;
  author: UserSummary | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface GraphNode {
  id: string;
  community: number;
  degree: number;
  in_degree: number;
  out_degree: number;
  eigenvector: number;
  is_articulation: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphStats {
  nodes: number;
  edges: number;
  communities: number;
  density: number;
  average_degree: number;
  reciprocal_pairs: number;
  articulation_points: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: GraphStats;
}

export type ReasonKey = "friend_of_friend" | "influential" | "bridge" | "community_hub";

export interface Reason {
  key: ReasonKey;
  label: string;
}

export interface SuggestedUser extends UserSummary {
  community: number | null;
  follower_count: number;
}

export interface Suggestion {
  user: SuggestedUser;
  reasons: Reason[];
  via: string[];
}

export interface Recommendations {
  case: 1 | 2 | 3;
  case_label: string;
  explanation: string;
  me: {
    username: string;
    community: number | null;
    degree: number;
    followers: number;
    following: number;
  };
  suggestions: Suggestion[];
  follow_back: SuggestedUser[];
}
