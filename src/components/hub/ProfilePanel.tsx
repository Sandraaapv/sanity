import { useState, useRef } from "react";
import {
  User as UserIcon,
  Palette,
  Bell,
  Lock,
  Database,
  Camera,
  Check,
  Download,
  Trash2,
  Moon,
  Sun,
  ShieldAlert,
} from "lucide-react";
import { useTheme, ACCENT_SWATCHES } from "./theme";

type SectionId = "profile" | "appearance" | "notifications" | "security" | "backup";

export function ProfilePanel() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  // Profile Form States
  const [displayName, setDisplayName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex@sanity.app");
  const [timezone, setTimezone] = useState("UTC-05:00 (Eastern Time)");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notification States
  const [mailAlerts, setMailAlerts] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [deadlineLead, setDeadlineLead] = useState("3 days");

  // Custom Hex Accent Input
  const [customHex, setCustomHex] = useState(accentColor);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSaveProfile = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const exportData = {
      user: { displayName, email, timezone },
      settings: { theme, accentColor, mailAlerts, reminderTime, deadlineLead },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sanity-workspace-backup.json";
    a.click();
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all workspace data? This action cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const navItems = [
    { id: "profile" as const, label: "Profile", icon: UserIcon },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Account & Security", icon: Lock },
    { id: "backup" as const, label: "Data & Backup", icon: Database },
  ];

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-8 items-start">
      {/* LEFT: Settings Navigation Menu (Sticky on Desktop) */}
      <div className="w-full md:col-span-4 sticky top-6 glass rounded-2xl p-4 border border-border/40 space-y-1">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold px-3 py-2">
          Settings Menu
        </h2>
        <nav className="flex md:flex-col gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full inline-flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition font-bold shrink-0 ${
                  active
                    ? "bg-accent/10 border border-accent/40 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-accent" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* RIGHT: Settings Content Panel */}
      <div className="w-full md:col-span-8 space-y-6">
        {/* 1. PROFILE SECTION */}
        {activeSection === "profile" && (
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Profile & Identity</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your public avatar, name, and regional timezone preferences.
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="flex items-center gap-6 pt-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full border-2 border-border/60 overflow-hidden bg-card/60 cursor-pointer group flex items-center justify-center shrink-0 shadow-lg"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-foreground uppercase">
                    {displayName.slice(0, 2)}
                  </span>
                )}
                <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="w-5 h-5 text-foreground" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent/20 text-xs font-semibold transition"
                >
                  Upload New Avatar
                </button>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>

            {/* Inline Editable Fields */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Display Name
                  </span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent transition"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent transition"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Timezone
                </span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent transition"
                >
                  <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                  <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                  <option value="UTC+00:00 (London)">UTC+00:00 (London)</option>
                  <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                  <option value="UTC+09:00 (Tokyo)">UTC+09:00 (Tokyo)</option>
                </select>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg transition inline-flex items-center gap-2"
                style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Saved!
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2. APPEARANCE SECTION */}
        {activeSection === "appearance" && (
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Visual Theme & Accent</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Customize your workspace design. Live preview updates the app instantly.
              </p>
            </div>

            {/* Visual Theme Cards (OLED Dark vs. Ivory Light) */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Theme Mode
              </span>
              <div className="grid grid-cols-2 gap-4">
                {/* OLED Dark Card */}
                <div
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-3 ${
                    theme === "dark"
                      ? "border-accent bg-black shadow-lg"
                      : "border-border/60 bg-card/40 hover:border-border"
                  }`}
                >
                  <div className="w-full h-20 rounded-xl bg-black border border-white/10 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 rounded bg-pink-500" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-3/4 h-1.5 rounded bg-white/30" />
                      <div className="w-1/2 h-1.5 rounded bg-white/20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Moon className="w-4 h-4 text-accent" /> OLED Dark
                  </div>
                </div>

                {/* Ivory Light Card */}
                <div
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-3 ${
                    theme === "light"
                      ? "border-accent bg-[#FAFAF7] shadow-lg"
                      : "border-border/60 bg-card/40 hover:border-border"
                  }`}
                >
                  <div className="w-full h-20 rounded-xl bg-[#FAFAF7] border border-[#E8E6DF] p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2 rounded bg-pink-500" />
                      <div className="w-3 h-3 rounded-full bg-black/20" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-3/4 h-1.5 rounded bg-black/30" />
                      <div className="w-1/2 h-1.5 rounded bg-black/20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Sun className="w-4 h-4 text-amber-500" /> Ivory Light
                  </div>
                </div>
              </div>
            </div>

            {/* 8 Preset Swatches + Hex Input */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Accent Color Swatches
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {ACCENT_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    onClick={() => {
                      setAccentColor(swatch.hex);
                      setCustomHex(swatch.hex);
                    }}
                    className={`w-9 h-9 rounded-full transition transform hover:scale-110 flex items-center justify-center border-2 ${
                      accentColor.toLowerCase() === swatch.hex.toLowerCase()
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                  >
                    {accentColor.toLowerCase() === swatch.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-black drop-shadow" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Hex Code Picker */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setAccentColor(e.target.value);
                    }
                  }}
                  placeholder="#F9A8D4"
                  className="bg-input/40 border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-accent w-32"
                />
                <span className="text-xs text-muted-foreground font-medium">Custom Hex Code</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS SECTION */}
        {activeSection === "notifications" && (
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Alerts & Notifications</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Configure when and how you receive daily productivity prompts.
              </p>
            </div>

            <div className="space-y-4">
              {/* Mail Alerts Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card/40">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Background Mail Digest</h4>
                  <p className="text-[11px] text-muted-foreground">Receive daily task summary emails.</p>
                </div>
                <button
                  onClick={() => setMailAlerts(!mailAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    mailAlerts ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      mailAlerts ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Daily Reminder Time */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card/40">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Daily Focus Prompt Time</h4>
                  <p className="text-[11px] text-muted-foreground">Time for the morning intention modal.</p>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-input/40 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-accent"
                />
              </div>

              {/* Deadline Warning Lead Time */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card/40">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Deadline Lead Time Warning</h4>
                  <p className="text-[11px] text-muted-foreground">Pre-alert before task due date.</p>
                </div>
                <select
                  value={deadlineLead}
                  onChange={(e) => setDeadlineLead(e.target.value)}
                  className="bg-input/40 border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-accent"
                >
                  <option value="1 day">1 day prior</option>
                  <option value="3 days">3 days prior</option>
                  <option value="1 week">1 week prior</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 4. SECURITY SECTION */}
        {activeSection === "security" && (
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Account & Security</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your password and session encryption settings.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Current Password
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent transition"
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  New Password
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-accent transition"
                />
              </label>
            </div>
          </div>
        )}

        {/* 5. BACKUP & DATA SECTION */}
        {activeSection === "backup" && (
          <div className="glass rounded-3xl p-6 sm:p-8 border border-border/40 space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">Data & Backup</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Export your workspace state or reset local databases.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-border/60 bg-card/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Export All Workspace Data</h4>
                  <p className="text-[11px] text-muted-foreground">Download JSON backup of tasks and notes.</p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent/20 text-xs font-bold transition inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-accent" /> Export JSON
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Danger Zone: Clear Workspace
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Reset local storage state and clear all preferences.
                  </p>
                </div>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
