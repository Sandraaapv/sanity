import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/hub/theme";
import { Auth3DScene } from "@/components/auth/Auth3DScene";
import { api } from "@/lib/api";
import axios from "axios";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — SANITY" },
      { name: "description", content: "Sign in or create your SANITY account." },
    ],
  }),
  component: () => (
    <ThemeProvider>
      <AuthPage />
    </ThemeProvider>
  ),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me")
        .then(() => navigate({ to: "/" }))
        .catch(() => localStorage.removeItem("token"));
    }
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data } = await api.post("/auth/signup", {
          email,
          password,
          displayName: displayName || email.split("@")[0],
        });
        localStorage.setItem("token", data.token);
      } else {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.token);
      }
      navigate({ to: "/" });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    const mockEmail = "google.user@example.com";
    const mockDisplayName = "Google User";
    try {
      setLoading(true);
      const { data } = await api.post("/auth/signup", {
        email: mockEmail,
        password: "google-oauth-mock-password",
        displayName: mockDisplayName,
      }).catch(async () => {
        return api.post("/auth/login", {
          email: mockEmail,
          password: "google-oauth-mock-password",
        });
      });
      localStorage.setItem("token", data.token);
      navigate({ to: "/" });
    } catch (err) {
      setError("Google integration failed.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground flex flex-col md:grid md:grid-cols-12 px-4 py-4 md:p-0 justify-center">
      {/* 3D Model Column (7 cols on desktop, compact header on mobile) */}
      <div className="relative w-full md:col-span-7 flex flex-col items-center justify-center select-none md:pointer-events-auto z-10 shrink-0 h-[150px] md:h-auto">
        <div
          className="absolute w-[200px] h-[200px] md:w-[500px] md:h-[500px] rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "var(--gradient-glow)" }}
        />
        
        <div className="relative w-full max-w-lg flex flex-col items-center text-center">
          {/* Canvas Wrapper */}
          <div className="w-full h-[150px] md:h-[500px]">
            <Auth3DScene />
          </div>
          
          {/* Subtle warm typography tagline (visible only on desktop/tablet) */}
          <div className="hidden md:block space-y-1.5 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-sm md:text-lg font-bold tracking-wider uppercase text-foreground">
              Restore order to your mind
            </h2>
            <p className="text-[10px] md:text-xs text-muted-foreground max-w-sm font-medium">
              Organize your tasks, draft elegant notes, schedule your agenda, and track focused study sessions in a unified dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card Column (5 cols on desktop, centered below 3D model on mobile) */}
      <div className="relative w-full max-w-md mx-auto md:my-0 lg:max-w-none md:col-span-5 md:min-h-screen md:flex md:flex-col md:items-center md:px-12 md:border-l md:border-border/30 bg-transparent z-20 shrink-0 mt-2 md:mt-0">
        <div
          className="pointer-events-none absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.08 310 / 0.4), transparent 60%)" }}
        />

        <div className="w-full max-w-sm md:my-auto py-6 md:py-12">
          <div className="text-center mb-3 md:mb-8">
            <h1 className="text-3xl md:text-5xl font-black tracking-wider uppercase text-foreground">
              SANITY
            </h1>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl border border-border/40">
            {/* Slider toggle */}
            <div className="relative grid grid-cols-2 rounded-2xl border border-border bg-card/50 p-1 mb-6">
              <span
                className="absolute top-1 bottom-1 left-1 rounded-xl transition-all duration-500 ease-out"
                style={{
                  width: "calc(50% - 4px)",
                  transform: isSignup ? "translateX(100%)" : "translateX(0)",
                  backgroundImage: "var(--gradient-accent)",
                }}
              />
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`relative z-10 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    mode === m ? "text-[#1a1a1a] font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {/* Sliding panels */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: isSignup ? "translateX(-100%)" : "translateX(0)" }}
              >
                {/* LOGIN */}
                <form onSubmit={submit} className="w-full shrink-0 space-y-3 pr-2">
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="current-password"
                  />
                  <SubmitButton loading={loading} disabled={isSignup}>
                    Sign in
                  </SubmitButton>
                </form>

                {/* SIGNUP */}
                <form onSubmit={submit} className="w-full shrink-0 space-y-3 pl-2">
                  <Field label="Display name" value={displayName} onChange={setDisplayName} />
                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                    autoComplete="new-password"
                    hint="At least 6 characters"
                  />
                  <SubmitButton loading={loading} disabled={!isSignup}>
                    Create account
                  </SubmitButton>
                </form>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={google}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-accent/40 transition py-2.5 text-sm font-medium"
            >
              <GoogleGlyph />
              Continue with Google
            </button>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              {isSignup ? "Already have an account?" : "New to SANITY?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isSignup ? "login" : "signup")}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60 transition"
      />
      {hint && <span className="text-[10px] text-muted-foreground mt-1 block">{hint}</span>}
    </label>
  );
}

function SubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 transition mt-2"
      style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Working…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.8 3.9 1.5l2.66-2.56C16.96 3.43 14.7 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.34 0-.5-.06-.88-.13-1.26H12z"
      />
    </svg>
  );
}
