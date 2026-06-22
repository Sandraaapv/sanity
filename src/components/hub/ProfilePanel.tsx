import { useEffect, useRef, useState } from "react";
import { Camera, Upload, User } from "lucide-react";
import { useTheme, type Theme } from "./theme";
import { api, buildFileFormData, parseFieldErrors } from "@/lib/api";

const timezones = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore"];

export function ProfilePanel() {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ displayName: "", timezone: "America/Los_Angeles", mailAlerts: true });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/profile");
      setForm({
        displayName: data.displayName || "",
        timezone: data.timezone || "America/Los_Angeles",
        mailAlerts: data.mailAlerts ?? true,
      });
      if (data.avatarUrl) {
        setAvatar(data.avatarUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFile = async (file: File) => {
    const fd = buildFileFormData(file);
    try {
      const { data } = await api.post("/profile/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatar(data.avatarUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      setErrors({ displayName: "Display name is required" });
      return;
    }
    setErrors({});
    try {
      await api.put("/profile", {
        displayName: form.displayName.trim(),
        timezone: form.timezone,
        mailAlerts: form.mailAlerts,
      });
    } catch (err) {
      setErrors(parseFieldErrors(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border bg-card grid place-items-center">
            {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-muted-foreground" />}
            <span className="absolute inset-0 rounded-full ring-1 ring-rose-gold/40 pointer-events-none" />
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`flex-1 rounded-xl border border-dashed p-5 text-center cursor-pointer transition ${
              dragOver ? "border-rose-gold bg-rose-gold/5" : "border-border hover:border-rose-gold/50"
            }`}
          >
            <div className="inline-flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-rose-gold" />
              <span className="font-medium">Drop avatar</span>
              <span className="text-muted-foreground">or click to upload</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Upload className="w-3 h-3" /> multipart/form-data — field "file"
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Display name" error={errors.displayName}>
            <input
              value={form.displayName}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
            />
          </Field>
          <Field label="Timezone">
            <select
              value={form.timezone}
              onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
            >
              {timezones.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer text-sm">
            <span>Background mail alerts</span>
            <input
              type="checkbox"
              checked={form.mailAlerts}
              onChange={(e) => setForm((p) => ({ ...p, mailAlerts: e.target.checked }))}
              className="accent-rose-gold w-4 h-4"
            />
          </label>
          <button type="submit" className="rounded-lg py-2.5 px-4 text-sm font-medium" style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}>
            Save preferences
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Appearance</h3>
        <Field label="Theme">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="infra">Infrastructure View</option>
          </select>
        </Field>

        {theme === "infra" ? <InfraView /> : <AppearancePreview />}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function AppearancePreview() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <p className="text-xs text-muted-foreground">Preview</p>
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-md" style={{ backgroundImage: "var(--gradient-accent)" }} />
        <div className="h-10 flex-1 rounded-md bg-card border border-border" />
        <div className="h-10 flex-1 rounded-md bg-muted" />
      </div>
      <p className="text-sm">Headline text · <span className="text-muted-foreground">body copy</span></p>
    </div>
  );
}

function InfraView() {
  const stats = [
    { label: "uptime", value: "99.982%" },
    { label: "p95 latency", value: "84ms" },
    { label: "rps", value: "1,248" },
    { label: "payload avg", value: "12.4 KB" },
    { label: "5xx / hr", value: "0" },
    { label: "queue depth", value: "3" },
  ];
  const logs = [
    "200 GET  /api/tasks                  41ms  2.1KB",
    "201 POST /api/notes                  88ms  0.8KB",
    "200 GET  /api/agenda?range=today     63ms  6.7KB",
    "204 PUT  /api/profile                72ms  0.0KB",
    "200 POST /api/avatar  multipart/form 312ms 184KB",
  ];
  return (
    <div className="rounded-xl border border-border bg-background p-4 font-mono text-xs space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-md p-2">
            <p className="text-muted-foreground">{s.label}</p>
            <p className="text-foreground text-base">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="border border-border rounded-md p-3 space-y-1 text-muted-foreground">
        <p className="text-foreground">$ tail -f /var/log/hub/access.log</p>
        {logs.map((l, i) => <p key={i}>{l}</p>)}
        <p className="text-foreground animate-pulse">▍</p>
      </div>
    </div>
  );
}
