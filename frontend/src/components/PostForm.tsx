import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { Alert, Button, Input, Textarea } from "./ui";

interface PostFormProps {
  initial?: { title: string; content: string };
  submitLabel: string;
  onSubmit: (values: { title: string; content: string }) => Promise<unknown>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function PostForm({ initial, submitLabel, onSubmit, onCancel, autoFocus }: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title, content });
      if (!initial) {
        setTitle("");
        setContent("");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Couldn't save your post."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        aria-label="Title"
        placeholder="Title"
        value={title}
        maxLength={100}
        onChange={(event) => setTitle(event.target.value)}
        invalid={!!error?.fields.title}
        autoFocus={autoFocus}
        required
        className="font-medium"
      />
      <Textarea
        aria-label="Post"
        placeholder="What's on your mind?"
        rows={4}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        invalid={!!error?.fields.content}
        required
      />
      {error && <Alert>{error.fields.title?.[0] ?? error.fields.content?.[0] ?? error.message}</Alert>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={saving} disabled={!title.trim() || !content.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
