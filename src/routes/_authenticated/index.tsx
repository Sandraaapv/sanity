import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, StickyNote, CalendarDays, Settings, Sparkles, LogOut, Palette, Timer } from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/hub/theme";
import { TasksPanel } from "@/components/hub/TasksPanel";
import { NotesPanel } from "@/components/hub/NotesPanel";
import { AgendaPanel } from "@/components/hub/AgendaPanel";
import { ProfilePanel } from "@/components/hub/ProfilePanel";
import { CommandBar } from "@/components/hub/CommandBar";
import { StudyTimerPanel } from "@/components/hub/StudyTimerPanel";

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
  { id: "timer", label: "Study Timer", icon: Timer },
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
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground flex flex-col md:flex-row md:h-screen">
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

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/40 bg-card/25 backdrop-blur-md flex flex-col justify-between shrink-0 z-40">
        <div className="flex flex-col">
          {/* Logo & Mobile controls */}
          <div className="px-6 py-4 flex items-center justify-between md:py-6 md:px-6">
            <span className="text-3xl font-black tracking-widest uppercase inline-block pt-1">SANITY</span>
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={cycleTheme}
                className="p-1.5 rounded-lg border border-border bg-card/40 hover:bg-accent/40 text-foreground transition"
                title="Toggle theme"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1.5 transition"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex flex-col gap-1 px-4 py-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full inline-flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition ${
                    active ? "text-[#1a1a1a]" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { backgroundImage: "var(--gradient-accent)" } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="uppercase tracking-wider font-bold">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Horizontal Navigation Scroll */}
          <div className="md:hidden border-t border-border overflow-x-auto scrollbar-none py-2 px-4 flex gap-1 bg-card/10">
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

        {/* Desktop Footer Actions */}
        <div className="hidden md:flex flex-col gap-4 p-6 border-t border-border/40">
          <div className="text-xs text-muted-foreground tabular-nums flex items-center justify-between">
            <span>Date</span>
            <span className="font-bold text-foreground">
              {new Date().toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cycleTheme}
              className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-foreground transition text-xs font-semibold"
              title="Toggle theme"
            >
              <Palette className="w-3.5 h-3.5" /> Theme
            </button>

            <button
              onClick={signOut}
              className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-destructive/10 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition text-xs font-semibold"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-7xl mx-auto">
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
          {tab === "timer" && <StudyTimerPanel />}
          {tab === "agenda" && <AgendaPanel />}
          {tab === "profile" && <ProfilePanel />}
        </div>
      </main>
    </div>
  );
}

function titleFor(t: TabId) {
  return {
    tasks: "Today's focus.",
    notes: "Captured thoughts.",
    timer: "Deep focus.",
    agenda: "On the horizon.",
    profile: "Workspace settings.",
  }[t];
}
function subtitleFor(t: TabId) {
  return {
    tasks: "before you lose the rest of your sanity",
    notes: "Because you definitely won't remember this in five minutes",
    timer: "Because looking at slides for five seconds doesn't count as studying",
    agenda: "Things you have to do eventually",
    profile: "Personalize identity, timezone, alerts, and visual mode.",
  }[t];
}
