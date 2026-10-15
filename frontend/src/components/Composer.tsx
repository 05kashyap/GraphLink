import { useState } from "react";
import { Link } from "react-router-dom";

import { useCreatePost, useMe } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { PostForm } from "./PostForm";
import { buttonClass } from "./ui";

export function Composer() {
  const { data: me } = useMe();
  const create = useCreatePost();
  const [open, setOpen] = useState(false);

  if (!me) {
    return (
      <div className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Join the network</p>
          <p className="muted text-sm">Post, follow people and see who the graph recommends for you.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className={buttonClass("secondary", "sm")}>
            Log in
          </Link>
          <Link to="/register" className={buttonClass("primary", "sm")}>
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      {open ? (
        <PostForm
          submitLabel="Post"
          autoFocus
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 text-left">
          <Avatar user={me} size="md" />
          <span className="flex h-10 min-w-0 flex-1 items-center truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700">
            Share something with your network…
          </span>
        </button>
      )}
    </div>
  );
}
