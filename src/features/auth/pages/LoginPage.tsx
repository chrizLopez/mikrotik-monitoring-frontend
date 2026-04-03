import axios from "axios";
import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Admin email and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.message ?? "Authentication failed.");
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-line/80 bg-surface-soft shadow-panel lg:grid-cols-[1.2fr_0.8fr]">
        <section className="hidden bg-slate-950 px-10 py-12 text-slate-100 lg:block">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">MikroTik Monitoring</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">
            Track WAN health, user quotas, and throttling from one control surface.
          </h1>
          <div className="mt-10 grid gap-4">
            {[
              "Live throughput cards for Old Starlink, New Starlink, and SmartBro.",
              "Cycle-aware quota monitoring for Group A and Group B users.",
              "Export-friendly reporting for operations and billing checks.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <p className="text-xs uppercase tracking-[0.24em] text-text-soft">Admin Access</p>
          <h2 className="mt-3 text-3xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-text-soft">
            Authenticate against the Laravel API session before accessing the monitoring routes.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Admin email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border-line bg-surface px-4 py-3"
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border-line bg-surface px-4 py-3"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
