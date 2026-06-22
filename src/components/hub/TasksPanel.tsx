import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CheckCircle2,
  Trash2,
  Calendar,
  Flag,
  Plus,
  FolderOpen,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

type Priority = "low" | "medium" | "high";

type Category = {
  id: string;
  name: string;
  color: string;
  deadline: string | null;
};

type Task = {
  id: string;
  category_id: string | null;
  title: string;
  priority: Priority;
  completed: boolean;
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-lavender/15 text-foreground border-lavender/30",
  high: "bg-rose-gold/15 text-foreground border-rose-gold/40",
};

const categoryPalette = ["#e8b4b8", "#c4b5fd", "#a7f3d0", "#fcd34d", "#93c5fd", "#fda4af"];

export function TasksPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", deadline: "" });
  const [newTask, setNewTask] = useState<{ title: string; priority: Priority }>({
    title: "",
    priority: "medium",
  });
  const [focusMode, setFocusMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      if (typeof window !== "undefined") {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          console.warn("Could not play beep", e);
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timeLeft]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: ts }] = await Promise.all([
        api.get("/task-categories"),
        api.get("/tasks"),
      ]);
      setCategories((cats ?? []) as Category[]);
      setTasks((ts ?? []) as Task[]);
      if (!activeCat && cats && cats.length > 0) setActiveCat(cats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleRefresh = () => {
      load();
    };
    window.addEventListener("workspace-refresh", handleRefresh);
    return () => {
      window.removeEventListener("workspace-refresh", handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const color = categoryPalette[categories.length % categoryPalette.length];
    try {
      const { data } = await api.post("/task-categories", {
        name: newCat.name.trim(),
        color,
        deadline: newCat.deadline ? new Date(newCat.deadline).toISOString() : null,
      });
      setCategories((p) => [...p, data as Category]);
      setActiveCat((data as Category).id);
      setNewCat({ name: "", deadline: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/task-categories/${id}`);
      setCategories((p) => p.filter((c) => c.id !== id));
      setTasks((p) => p.filter((t) => t.category_id !== id));
      if (activeCat === id) setActiveCat(null);
    } catch (err) {
      console.error(err);
    }
  };

  const updateDeadline = async (id: string, value: string) => {
    const iso = value ? new Date(value).toISOString() : null;
    setCategories((p) => p.map((c) => (c.id === id ? { ...c, deadline: iso } : c)));
    try {
      await api.put(`/task-categories/${id}`, { deadline: iso });
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !activeCat) return;
    try {
      const { data } = await api.post("/tasks", {
        categoryId: activeCat,
        title: newTask.title.trim(),
        priority: newTask.priority,
      });
      setTasks((p) => [...p, data as Task]);
      setNewTask({ title: "", priority: "medium" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggle = async (t: Task) => {
    const completed = !t.completed;
    setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, completed } : x)));
    try {
      await api.put(`/tasks/${t.id}`, { completed });
    } catch (err) {
      console.error(err);
    }
  };

  const removeTask = async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const current = useMemo(
    () => categories.find((c) => c.id === activeCat) ?? null,
    [categories, activeCat],
  );
  const currentTasks = useMemo(
    () => tasks.filter((t) => t.category_id === activeCat),
    [tasks, activeCat],
  );
  const totalTasks = currentTasks.length;
  const completedTasks = currentTasks.filter((t) => t.completed).length;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const deadlineMeta = (iso: string | null) => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    const days = Math.round(ms / 86400000);
    const overdue = ms < 0;
    return { days, overdue };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* CATEGORIES COLUMN */}
      <div className="space-y-4">
        <form onSubmit={addCategory} className="glass rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            New category
          </h3>
          <input
            value={newCat.name}
            onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Studies, Work, Personal"
            className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60 transition"
          />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Shared deadline (applies to all tasks inside)
            </label>
            <input
              type="datetime-local"
              value={newCat.deadline}
              onChange={(e) => setNewCat((p) => ({ ...p, deadline: e.target.value }))}
              className="mt-1 w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
            style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
          >
            <Plus className="w-4 h-4" /> Create category
          </button>
        </form>

        <div className="space-y-2">
          {categories.map((c) => {
            const dm = deadlineMeta(c.deadline);
            const active = c.id === activeCat;
            const count = tasks.filter((t) => t.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  active
                    ? "border-rose-gold/50 bg-card gradient-border-glow"
                    : "border-border bg-card/60 hover:border-foreground/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="font-medium text-sm flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
                {dm ? (
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
                      dm.overdue ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {dm.overdue ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {dm.overdue
                      ? `Overdue ${Math.abs(dm.days)}d`
                      : dm.days === 0
                        ? "Due today"
                        : `${dm.days}d left`}
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    No deadline set
                  </div>
                )}
              </button>
            );
          })}
          {!loading && categories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No categories yet. Create your first one above.
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE CATEGORY TASKS */}
      <div className="space-y-4">
        {current ? (
          <>
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-end gap-4 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <FolderOpen className="w-3 h-3" /> Category
                  </div>
                  <h3 className="text-xl font-semibold mt-1 truncate">{current.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      current.deadline
                        ? new Date(current.deadline).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => updateDeadline(current.id, e.target.value)}
                    className="bg-input/40 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-rose-gold/60"
                  />
                  <button
                    onClick={() => setFocusMode(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-gold border border-border bg-card/60 hover:bg-accent/40 transition"
                    aria-label="Focus mode"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Focus Mode</span>
                  </button>
                  <button
                    onClick={() => deleteCategory(current.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive border border-border"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {totalTasks > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Progress</span>
                    <span className="font-semibold text-rose-gold tabular-nums">
                      {completedTasks}/{totalTasks} tasks ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-input/40 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${percent}%`,
                        backgroundImage: "var(--gradient-accent)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={addTask}
              className="rounded-2xl border border-border bg-card/60 p-4 flex flex-wrap gap-3 items-center"
            >
              <input
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder={`Add a task to ${current.name}…`}
                className="flex-1 min-w-[200px] bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
              />
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, priority: e.target.value as Priority }))
                }
                className="bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <ul className="space-y-3">
              {currentTasks.map((t) => (
                <li
                  key={t.id}
                  className={`group rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20 ${
                    t.priority === "high" && !t.completed ? "gradient-border-glow" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggle(t)}
                      className="mt-1 text-muted-foreground hover:text-foreground transition"
                      aria-label="toggle"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-rose-gold" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-medium text-sm ${
                            t.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {t.title}
                        </p>
                        <span
                          className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 inline-flex items-center gap-1 ${priorityStyles[t.priority]}`}
                        >
                          <Flag className="w-2.5 h-2.5" /> {t.priority}
                        </span>
                      </div>
                      {current.deadline && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Inherits deadline ·{" "}
                          {new Date(current.deadline).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
              {currentTasks.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No tasks in this category yet.
                </li>
              )}
            </ul>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            {loading ? "Loading…" : "Select or create a category to begin."}
          </div>
        )}
      </div>
      {focusMode && current && (
        <div className="fixed inset-0 z-[100] bg-[#0c0a12]/98 backdrop-blur-md flex flex-col md:grid md:grid-cols-[1fr_420px] overflow-hidden animate-in fade-in duration-300">
          <div className="flex-1 p-6 md:p-12 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-rose-gold font-bold">
                    Focus Mode · {current.name}
                  </p>
                  <h2 className="text-3xl font-bold mt-1 text-white tracking-tight">Active Focus List</h2>
                </div>
                <button
                  onClick={() => {
                    setFocusMode(false);
                    setTimerRunning(false);
                  }}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-white border border-border rounded-xl bg-card/40 transition"
                >
                  Exit Focus
                </button>
              </div>

              {totalTasks > 0 && (
                <div className="mb-8 bg-card/30 border border-border/40 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Session Progress</span>
                    <span className="font-semibold text-rose-gold tabular-nums">
                      {completedTasks}/{totalTasks} tasks ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-input/40 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${percent}%`,
                        backgroundImage: "var(--gradient-accent)",
                      }}
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-3">
                {currentTasks.map((t) => (
                  <li
                    key={t.id}
                    className={`rounded-2xl border border-border/60 bg-card/40 p-4 transition ${
                      t.completed ? "opacity-50" : "gradient-border-glow bg-card/60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggle(t)}
                        className="text-muted-foreground hover:text-white transition"
                        aria-label="toggle"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-rose-gold" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <p
                        className={`font-semibold text-sm text-white ${
                          t.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      <span
                        className={`ml-auto text-[9px] uppercase tracking-wider border rounded-full px-2 py-0.5 inline-flex items-center gap-1 ${
                          priorityStyles[t.priority]
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </li>
                ))}
                {currentTasks.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    All focus tasks completed! Great work.
                  </div>
                )}
              </ul>
            </div>
            
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 text-center pt-8">
              Sanity Focus Zone · Keep breathing, keep moving
            </div>
          </div>

          <div className="w-full md:w-[420px] border-t md:border-t-0 md:border-l border-border/60 bg-card/10 backdrop-blur-lg p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            <div
              className={`absolute w-72 h-72 rounded-full opacity-20 blur-3xl transition-all duration-1000 ${
                timerRunning ? "scale-125 bg-rose-gold" : "bg-purple-900"
              }`}
            />
            
            <div className="relative z-10 text-center space-y-8 w-full max-w-xs">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {timerRunning ? "Focus Session Active" : "Session Paused"}
              </p>
              
              <div className="text-7xl md:text-8xl font-black text-white tracking-widest font-mono">
                {formatTime(timeLeft)}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="w-16 h-16 rounded-full grid place-items-center font-bold text-sm text-[#1a1a1a] transition-all hover:scale-105"
                  style={{ backgroundImage: "var(--gradient-accent)" }}
                >
                  {timerRunning ? "PAUSE" : "START"}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(1500);
                  }}
                  className="px-5 py-2.5 rounded-full border border-border text-xs uppercase tracking-wider text-muted-foreground hover:text-white bg-card/40 transition"
                >
                  RESET
                </button>
              </div>

              <div className="flex justify-center gap-2 pt-4">
                {[
                  { label: "15m", val: 900 },
                  { label: "25m", val: 1500 },
                  { label: "45m", val: 2700 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(preset.val);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider transition ${
                      timeLeft === preset.val
                        ? "border-rose-gold text-rose-gold bg-rose-gold/10"
                        : "border-border text-muted-foreground hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
