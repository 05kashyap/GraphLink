import { Camera, LogOut } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useLogout, useMe, useUpdateMe } from "@/lib/queries";

export default function Settings() {
  const { data: me } = useMe();
  const update = useUpdateMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [username, setUsername] = useState(me?.username ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!image) return setPreview(null);
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  if (!me) return null;

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.files?.[0] ?? null);
    setSaved(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const form = new FormData();
    form.append("username", username);
    form.append("email", email);
    if (image) form.append("image", image);
    setSaved(false);
    update.mutate(form, {
      onSuccess: () => {
        setImage(null);
        setSaved(true);
      },
    });
  };

  const errors = update.error?.fields ?? {};

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="muted mt-1 text-sm">Update how you appear to other people.</p>
      </header>

      <form onSubmit={submit} className="card divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          <Avatar user={{ username: me.username, avatar: preview ?? me.avatar }} size="xl" />
          <div className="space-y-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
              <Camera className="h-4 w-4" />
              Change photo
              <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
            </label>
            <p className="muted text-xs">{image ? image.name : "JPG or PNG. Resized to 300×300."}</p>
            {errors.image?.map((message) => (
              <p key={message} className="text-xs text-red-600 dark:text-red-400">
                {message}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Field label="Username" htmlFor="username" error={errors.username}>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} invalid={!!errors.username} required />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email} hint="Used for password resets. Never shown publicly.">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} required />
          </Field>
          {update.error && !Object.keys(errors).length && <Alert>{update.error.message}</Alert>}
          {saved && <Alert tone="success">Your profile has been updated.</Alert>}
        </div>

        <div className="flex justify-end p-4 sm:px-5">
          <Button type="submit" loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="card flex items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-sm font-medium">Log out</p>
          <p className="muted text-sm">Signed in as {me.username}.</p>
        </div>
        <Button
          variant="secondary"
          loading={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
