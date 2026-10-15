import type { Suggestion, SuggestedUser } from "@/lib/types";
import { FollowButton } from "./FollowButton";
import { ReasonChip } from "./ReasonChip";
import { UserRow } from "./UserRow";

function viaText(via: string[]) {
  if (via.length === 0) return null;
  if (via.length === 1) return `Followed by ${via[0]}`;
  return `Followed by ${via[0]} and ${via.length - 1} other${via.length > 2 ? "s" : ""} you follow`;
}

export function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const via = viaText(suggestion.via);
  return (
    <UserRow
      user={suggestion.user}
      community={suggestion.user.community}
      subtitle={
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {suggestion.reasons.map((reason) => (
              <ReasonChip key={reason.key} reason={reason.key} />
            ))}
          </div>
          {via && <p className="truncate">{via}</p>}
        </div>
      }
      action={<FollowButton username={suggestion.user.username} following={false} />}
    />
  );
}

export function FollowBackRow({ user }: { user: SuggestedUser }) {
  return (
    <UserRow
      user={user}
      community={user.community}
      subtitle={<ReasonChip reason="follow_back" />}
      action={<FollowButton username={user.username} following={false} followsYou />}
    />
  );
}
