import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonClass, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="Page not found"
        action={
          <Link to="/" className={buttonClass("primary", "sm")}>
            Go home
          </Link>
        }
      >
        This node isn't connected to anything.
      </EmptyState>
    </div>
  );
}
