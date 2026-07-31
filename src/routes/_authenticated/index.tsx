import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  CheckSquare,
  StickyNote,
  CalendarDays,
  Settings,
  Timer,
  LogOut,
  Palette,
  Command,
  User,
  Quote,
  Sparkles,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/hub/theme";
import { TasksPanel } from "@/components/hub/TasksPanel";
import { NotesPanel } from "@/components/hub/NotesPanel";
import { AgendaPanel } from "@/components/hub/AgendaPanel";
import { ProfilePanel } from "@/components/hub/ProfilePanel";
import { CommandBar } from "@/components/hub/CommandBar";
import { StudyTimerPanel } from "@/components/hub/StudyTimerPanel";
import { StreakFlame } from "@/components/hub/StreakFlame";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "SANITY — Unified Modern Workspace" },
      {
        name: "description",
        content:
          "A luxury, ultra-modern workspace: tasks, notes, agenda, study timer, and workspace settings.",
      },
    ],
  }),
  component: Index,
});

const tabs = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "profile", label: "Workspace", icon: Settings },
] as const;
type TabId = (typeof tabs)[number]["id"];

const MOTIVATIONAL_QUOTES = [
  { quote: "Desire is a contract you make with yourself to be unhappy until you get what you want.", author: "Naval Ravikant" },
  { quote: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { quote: "Study hard what interests you most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
];

function Index() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>("tasks");
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const lastScrollY = useRef(0);

  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const { theme, setTheme } = useTheme();

  // Scroll detection to auto-hide dock on scroll down, show on scroll up
  useEffect(() => {
    const mainContainer = document.querySelector("main");
    if (!mainContainer) return;

    const handleScroll = () => {
      const currentScrollY = mainContainer.scrollTop;
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        setIsDockVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsDockVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainContainer.addEventListener("scroll", handleScroll);
    return () => mainContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const cycleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    navigate({ to: "/auth", replace: true });
  };

  const initials = (user?.email ?? "User").slice(0, 2).toUpperCase();

  // End of Day Wrap check (after 9 PM)
  const hour = new Date().getHours();
  const isPost9PM = hour >= 21;
  const quoteObj = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-background text-foreground flex flex-col ${
        isPost9PM ? "sepia-[0.10] opacity-95" : ""
      }`}
    >
      <CommandBar />

      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.25), transparent 60%)",
        }}
      />

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="w-full h-16 border-b border-border/40 bg-card/30 backdrop-blur-xl px-6 flex items-center justify-between z-40 shrink-0">
        {/* SANITY Logo top-left */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-widest uppercase text-foreground select-none">
            SANITY
          </span>
        </div>

        {/* Top Right Controls: Flame, Avatar menu */}
        <div className="flex items-center gap-4">
          {/* Live Streak Flame */}
          <StreakFlame />

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className="w-9 h-9 rounded-full border-2 border-border/80 bg-accent/20 hover:border-accent flex items-center justify-center font-bold text-xs text-foreground transition transform hover:scale-105 shadow-md"
            >
              {initials}
            </button>

            {/* Avatar Dropdown */}
            {isAvatarDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAvatarDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 glass rounded-2xl p-2 border border-border/60 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-border/40 mb-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user?.email ?? "User Account"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Active Workspace
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setTab("profile");
                      setIsAvatarDropdownOpen(false);
                    }}
                    className="w-full inline-flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent/20 transition"
                  >
                    <User className="w-4 h-4 text-accent" /> Settings
                  </button>

                  <button
                    onClick={() => {
                      cycleTheme();
                      setIsAvatarDropdownOpen(false);
                    }}
                    className="w-full inline-flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent/20 transition"
                  >
                    <Palette className="w-4 h-4 text-accent" /> Toggle {theme === "dark" ? "Light" : "Dark"}
                  </button>

                  <div className="border-t border-border/40 mt-1 pt-1">
                    <button
                      onClick={signOut}
                      className="w-full inline-flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN FULL-WIDTH CANVAS */}
      <main className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 pb-28">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Title & Subtitle */}
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#F9A8D4]">
                {isPost9PM ? "Today's recap." : titleFor(tab)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {isPost9PM ? "Winding down after 9 PM." : subtitleFor(tab)}
              </p>
            </div>

            {/* Post 9 PM Motivational Quote & Wrap Banner */}
            {isPost9PM && (
              <div className="glass rounded-2xl p-4 border border-accent/30 max-w-lg space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-accent">
                  <Quote className="w-4 h-4" /> Evening Reflection
                </div>
                <p className="text-xs italic text-foreground">"{quoteObj.quote}"</p>
                <p className="text-[10px] text-muted-foreground font-semibold text-right">
                  — {quoteObj.author}
                </p>
              </div>
            )}
          </div>

          {/* Active Tab Content */}
          {tab === "tasks" && <TasksPanel />}
          {tab === "notes" && <NotesPanel />}
          {tab === "timer" && <StudyTimerPanel />}
          {tab === "agenda" && <AgendaPanel />}
          {tab === "profile" && <ProfilePanel />}
        </div>
      </main>

      {/* FLOATING BOTTOM DOCK (Mobile-First Glassmorphism Navigation) */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          isDockVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <div className="glass-dock rounded-full p-2 flex items-center gap-1.5 sm:gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative group inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                  active
                    ? "text-[#1a1a1a] font-bold shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { backgroundImage: "var(--gradient-accent)" } : {}}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? "text-[#1a1a1a]" : ""}`} />
                {active && (
                  <span className="text-xs uppercase tracking-wider animate-in fade-in slide-in-from-left-2 duration-300">
                    {t.label}
                  </span>
                )}

                {/* Soft Glow Underneath on Hover */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>
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
