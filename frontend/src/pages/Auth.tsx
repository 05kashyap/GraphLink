import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, Button, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useLogin, useMe, useRegister } from "@/lib/queries";

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="dot-grid relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <Link to="/" className="mx-auto mb-6 flex w-fit items-center gap-2 font-semibold">
          <LogoMark className="h-8 w-8" />
          <span className="text-lg tracking-tight">GraphLink</span>
        </Link>
        <div className="card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
        {footer && <p className="muted mt-4 text-center text-sm">{footer}</p>}
      </div>
    </div>
  );
}

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-400";

export function Login() {
  const { data: me } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (me && !login.isSuccess) return <Navigate to={from} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ username, password }, { onSuccess: () => navigate(from, { replace: true }) });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see who the graph recommends for you."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Username" htmlFor="username">
          <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {login.error && <Alert>{login.error.message}</Alert>}
        <Button type="submit" className="w-full" loading={login.isPending}>
          Log in
        </Button>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className={linkClass}>
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { data: me } = useMe();
  const register = useRegister();
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: "", email: "", password1: "", password2: "" });
  const errors = register.error?.fields ?? {};

  if (me && !register.isSuccess) return <Navigate to="/" replace />;

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate(values, { onSuccess: () => navigate("/graph", { replace: true }) });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You'll start as a new node with no edges. See what the recommender does with that."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Username" htmlFor="username" error={errors.username}>
          <Input id="username" autoComplete="username" value={values.username} onChange={set("username")} invalid={!!errors.username} required autoFocus />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} invalid={!!errors.email} required />
        </Field>
        <Field label="Password" htmlFor="password1" error={errors.password1}>
          <Input id="password1" type="password" autoComplete="new-password" value={values.password1} onChange={set("password1")} invalid={!!errors.password1} required />
        </Field>
        <Field label="Confirm password" htmlFor="password2" error={errors.password2}>
          <Input id="password2" type="password" autoComplete="new-password" value={values.password2} onChange={set("password2")} invalid={!!errors.password2} required />
        </Field>
        {register.error && !Object.keys(errors).length && <Alert>{register.error.message}</Alert>}
        <Button type="submit" className="w-full" loading={register.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      await api("auth/password-reset", { method: "POST", body: { email } });
      setState("sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send the email.");
      setState("idle");
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
      footer={
        <Link to="/login" className={linkClass}>
          Back to log in
        </Link>
      }
    >
      {state === "sent" ? (
        <Alert tone="success">If an account uses {email}, a reset link is on its way. Check your inbox.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" className="w-full" loading={state === "sending"}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { uid = "", token = "" } = useParams();
  const [values, setValues] = useState({ new_password1: "", new_password2: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("saving");
    setError(null);
    try {
      await api("auth/password-reset/confirm", { method: "POST", body: { uid, token, ...values } });
      setState("done");
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Couldn't reset your password."));
      setState("idle");
    }
  };

  const fields = error?.fields ?? {};

  return (
    <AuthLayout title="Choose a new password">
      {state === "done" ? (
        <div className="space-y-4">
          <Alert tone="success">Your password has been changed.</Alert>
          <Link to="/login" className={linkClass}>
            Log in with your new password
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" htmlFor="new_password1" error={fields.new_password1}>
            <Input
              id="new_password1"
              type="password"
              autoComplete="new-password"
              value={values.new_password1}
              onChange={(e) => setValues((v) => ({ ...v, new_password1: e.target.value }))}
              invalid={!!fields.new_password1}
              required
              autoFocus
            />
          </Field>
          <Field label="Confirm new password" htmlFor="new_password2" error={fields.new_password2}>
            <Input
              id="new_password2"
              type="password"
              autoComplete="new-password"
              value={values.new_password2}
              onChange={(e) => setValues((v) => ({ ...v, new_password2: e.target.value }))}
              invalid={!!fields.new_password2}
              required
            />
          </Field>
          {error && !Object.keys(fields).length && <Alert>{error.message}</Alert>}
          <Button type="submit" className="w-full" loading={state === "saving"}>
            Set new password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
