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
            <div className="glass rounded-2xl p-5 flex flex-wrap items-end gap-4 justify-between">
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
                  onClick={() => deleteCategory(current.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive border border-border"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
    </div>
  );
}
