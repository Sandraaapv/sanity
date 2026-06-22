import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, StickyNote, CalendarDays, Settings, Sparkles, LogOut } from "lucide-react";
import { ThemeProvider } from "@/components/hub/theme";
import { TasksPanel } from "@/components/hub/TasksPanel";
import { NotesPanel } from "@/components/hub/NotesPanel";
import { AgendaPanel } from "@/components/hub/AgendaPanel";
import { ProfilePanel } from "@/components/hub/ProfilePanel";
import { CommandBar } from "@/components/hub/CommandBar";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "SANITY — Tasks, Notes, Agenda" },
      {
        name: "description",
        content:
          "A luxury, ultra-modern productivity workspace: tasks, notes, agenda, and workspace settings.",
      },
    ],
  }),
  component: Index,
});

const tabs = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "profile", label: "Workspace", icon: Settings },
] as const;
type TabId = (typeof tabs)[number]["id"];

function Index() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>("tasks");
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <CommandBar />
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.08 310 / 0.4), transparent 60%)",
        }}
      />

      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl font-black tracking-widest uppercase">SANITY</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-border bg-card/40 p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition ${
                    active ? "text-[#1a1a1a]" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { backgroundImage: "var(--gradient-accent)" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">
              {new Date().toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <div className="md:hidden border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto scrollbar-thin">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                    active ? "text-[#1a1a1a]" : "text-muted-foreground"
                  }`}
                  style={active ? { backgroundImage: "var(--gradient-accent)" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="gradient-text">{titleFor(tab)}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitleFor(tab)}</p>
          </div>
        </div>

        {tab === "tasks" && <TasksPanel />}
        {tab === "notes" && <NotesPanel />}
        {tab === "agenda" && <AgendaPanel />}
        {tab === "profile" && <ProfilePanel />}
      </main>
    </div>
  );
}

function titleFor(t: TabId) {
  return {
    tasks: "Today's focus.",
    notes: "Captured thoughts.",
    agenda: "On the horizon.",
    profile: "Workspace settings.",
  }[t];
}
function subtitleFor(t: TabId) {
  return {
    tasks: "before you lose the rest of your sanity",
    notes: "Because you definitely won't remember this in five minutes",
    agenda: "Things you have to do eventually",
    profile: "Personalize identity, timezone, alerts, and visual mode.",
  }[t];
}
