import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CheckCircle2,
  Trash2,
  Calendar,
  Flag,
  Plus,
  Clock,
  AlertTriangle,
  Repeat,
  MoreVertical,
  RotateCcw,
  Palette,
  Square,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ArrowLeftRight
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "./theme";

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
  due_date?: string | null;
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-lavender/15 text-foreground border-lavender/30",
  high: "bg-rose-gold/15 text-foreground border-rose-gold/40",
};

const categoryPalette = ["#e8b4b8", "#c4b5fd", "#a7f3d0", "#fcd34d", "#93c5fd", "#fda4af"];

// Timezone date helpers
const toLocalMidnightISO = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date.toISOString();
};

const toLocalDateInputString = (isoString: string | null) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDays = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday...
  const sunday = new Date(current);
  sunday.setDate(current.getDate() - day);
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }
  return days;
};

export function TasksPanel() {
  const { theme, setTheme } = useTheme();
  
  // Tasks and categories states
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date and calendar navigation
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = useMemo(() => toDateStr(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Modal & draft states for adding tasks / categories
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<"task" | "category">("task");
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    categoryId: "",
    priority: "medium" as Priority,
    dueDate: toDateStr(new Date()),
  });
  const [newCat, setNewCat] = useState({ name: "", deadline: "" });

  // Popover menus state
  const [activeMenuCatId, setActiveMenuCatId] = useState<string | null>(null);

  // Pomodoro Focus Mode states
  const [focusMode, setFocusMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync taskDraft dueDate with selectedDate when selectedDate changes
  useEffect(() => {
    setTaskDraft((p) => ({ ...p, dueDate: selectedDateStr }));
  }, [selectedDateStr]);

  // Pomodoro timer interval
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

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("infra");
    else setTheme("dark");
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
  }, []);

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const color = categoryPalette[categories.length % categoryPalette.length];
    try {
      const { data } = await api.post("/task-categories", {
        name: newCat.name.trim(),
        color,
        deadline: toLocalMidnightISO(newCat.deadline),
      });
      setCategories((p) => [...p, data as Category]);
      setNewCat({ name: "", deadline: "" });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/task-categories/${id}`);
      setCategories((p) => p.filter((c) => c.id !== id));
      setTasks((p) => p.filter((t) => t.category_id !== id));
      setActiveMenuCatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Task Actions
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskDraft.title.trim()) return;
    
    const catId = taskDraft.categoryId || (categories.length > 0 ? categories[0].id : null);
    try {
      const { data } = await api.post("/tasks", {
        categoryId: catId,
        title: taskDraft.title.trim(),
        priority: taskDraft.priority,
        dueDate: taskDraft.dueDate,
      });
      setTasks((p) => [...p, data as Task]);
      setTaskDraft((p) => ({ ...p, title: "" }));
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddTaskForCategory = (catId: string) => {
    setTaskDraft((p) => ({ ...p, categoryId: catId, title: "", dueDate: selectedDateStr }));
    setModalTab("task");
    setShowAddModal(true);
  };

  const toggleTaskCompleted = async (t: Task) => {
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

  // Filter tasks for selected date
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date === selectedDateStr);
  }, [tasks, selectedDateStr]);

  const isTodaySelected = useMemo(() => {
    return selectedDateStr === toDateStr(new Date());
  }, [selectedDateStr]);

  const tasksCountText = useMemo(() => {
    const count = selectedDateTasks.length;
    return `${count} task${count === 1 ? "" : "s"} ${isTodaySelected ? "for today" : "scheduled"}`;
  }, [selectedDateTasks, isTodaySelected]);

  return (
    <div className="relative min-h-[500px]">
      {/* ---------------- NORMAL CALENDAR MODE ---------------- */}
      {!focusMode ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* HEADER ROW */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {selectedDate.toLocaleDateString([], { month: "long" })}
                </h2>
                <div className="flex items-center gap-1 ml-1 text-muted-foreground">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(selectedDate.getDate() - 7);
                      setSelectedDate(prev);
                    }}
                    className="p-1 rounded-md hover:bg-card/60 transition"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const next = new Date(selectedDate);
                      next.setDate(selectedDate.getDate() + 7);
                      setSelectedDate(next);
                    }}
                    className="p-1 rounded-md hover:bg-card/60 transition"
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 lowercase">
                {tasksCountText}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(new Date())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-xs font-semibold text-foreground transition"
              >
                <RotateCcw className="w-3 h-3" /> Today
              </button>
              <button
                onClick={() => setFocusMode(true)}
                className="p-2 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-foreground transition"
                aria-label="Focus mode"
                title="Focus Mode"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={cycleTheme}
                className="p-2 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-foreground transition"
                aria-label="Toggle theme"
                title="Cycle Themes"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* WEEKLY DATE STRIP */}
          <div className="glass rounded-2xl p-4">
            <div className="grid grid-cols-7 text-center gap-1">
              {weekDays.map((d, idx) => {
                const dayName = d.toLocaleDateString([], { weekday: "short" });
                const dateNum = d.getDate();
                const isSelected = toDateStr(d) === selectedDateStr;
                const isToday = toDateStr(d) === toDateStr(new Date());

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(d)}
                    className="flex flex-col items-center py-2 rounded-xl hover:bg-accent/20 transition relative group"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {dayName}
                    </span>
                    <span
                      className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-full transition-all ${
                        isSelected
                          ? "bg-rose-gold text-background shadow-lg scale-105"
                          : "text-foreground group-hover:text-rose-gold"
                      }`}
                    >
                      {dateNum}
                    </span>
                    {isToday && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-destructive" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORIES SECTIONS */}
          <div className="space-y-6 pt-2 pb-16">
            {categories.map((c) => {
              const catTasks = selectedDateTasks.filter((t) => t.category_id === c.id);
              return (
                <div key={c.id} className="space-y-2">
                  
                  {/* Category Title & Actions Row */}
                  <div className="flex items-center justify-between relative">
                    <h4 className="text-sm font-bold lowercase tracking-wider flex items-center gap-2 text-foreground">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                        title="Recurring"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openAddTaskForCategory(c.id)}
                        className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                        title="Add task to this category"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Three-dot dropdown trigger */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuCatId(activeMenuCatId === c.id ? null : c.id)}
                          className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                          title="Category options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuCatId === c.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuCatId(null)} />
                            <div className="absolute right-0 mt-1 w-32 glass rounded-lg py-1 shadow-xl z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                onClick={() => deleteCategory(c.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition"
                              >
                                Delete Category
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="border-t border-border/40" />

                  {/* Tasks Checklist */}
                  <div className="pl-1.5 space-y-1">
                    {catTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-2 group hover:bg-card/20 px-2 rounded-xl transition"
                      >
                        <button
                          onClick={() => toggleTaskCompleted(t)}
                          className="text-muted-foreground hover:text-rose-gold transition shrink-0"
                          aria-label="Toggle completed"
                        >
                          {t.completed ? (
                            <CheckSquare className="w-4 h-4 text-rose-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`text-sm select-none break-all transition-all duration-300 ${
                            t.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </span>
                        
                        {/* Optional priority badge */}
                        <span className={`ml-auto text-[8px] uppercase tracking-wider border rounded-full px-1.5 py-0.2 shrink-0 ${priorityStyles[t.priority]}`}>
                          {t.priority}
                        </span>

                        <button
                          onClick={() => removeTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {catTasks.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground/50 italic select-none">
                        No tasks yet.. Tap to add some :)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && categories.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center space-y-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">No categories yet</h4>
                  <p className="text-xs text-muted-foreground">
                    To start scheduling tasks, you must create a category context first.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalTab("category");
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/80 transition"
                >
                  Create category
                </button>
              </div>
            )}
          </div>

          {/* FLOATING ACTION PLUS BUTTON */}
          <button
            onClick={() => {
              setTaskDraft((p) => ({
                ...p,
                categoryId: categories[0]?.id || "",
                title: "",
                dueDate: selectedDateStr
              }));
              setModalTab("task");
              setShowAddModal(true);
            }}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-[#1a1a1a] transition-transform hover:scale-105 active:scale-95 z-40"
            style={{ backgroundImage: "var(--gradient-accent)" }}
            aria-label="Add task or category"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      ) : (
        /* ---------------- FOCUS TIMER MODE ---------------- */
        <div className="max-w-4xl mx-auto glass rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row items-stretch min-h-[480px]">
            
            {/* Focus Tasks checklist */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-gold" /> focus zone
                  </h3>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setFocusMode(false);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-white border border-border rounded-lg px-2.5 py-1 transition"
                  >
                    <X className="w-3 h-3" /> Exit Focus
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Check off items as you focus on them today:
                </p>

                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {selectedDateTasks.map((t) => (
                    <li
                      key={t.id}
                      className={`rounded-xl border border-border/40 bg-card/20 p-3 transition ${
                        t.completed ? "opacity-50" : "bg-card/45"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskCompleted(t)}
                          className="text-muted-foreground hover:text-rose-gold transition"
                        >
                          {t.completed ? (
                            <CheckSquare className="w-4 h-4 text-rose-gold" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <p
                          className={`text-sm break-all ${
                            t.completed ? "line-through text-muted-foreground" : "text-white"
                          }`}
                        >
                          {t.title}
                        </p>
                      </div>
                    </li>
                  ))}
                  {selectedDateTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No tasks scheduled for this day. Exit focus to add some!
                    </div>
                  )}
                </ul>
              </div>

              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 text-center pt-6">
                Sanity Focus Zone · Keep breathing, keep moving
              </div>
            </div>

            {/* Pomodoro Timer Section */}
            <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l border-border/60 bg-card/10 backdrop-blur-lg p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className={`absolute w-60 h-60 rounded-full opacity-20 blur-3xl transition-all duration-1000 ${
                  timerRunning ? "scale-125 bg-rose-gold" : "bg-purple-900"
                }`}
              />

              <div className="relative z-10 text-center space-y-6 w-full max-w-xs">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
                  {timerRunning ? "Focus Session Active" : "Session Paused"}
                </p>

                <div className="text-6xl md:text-7xl font-black text-white tracking-widest font-mono">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs text-[#1a1a1a] transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundImage: "var(--gradient-accent)" }}
                  >
                    {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(1500);
                    }}
                    className="px-4 py-2.5 rounded-full border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white bg-card/40 transition"
                  >
                    RESET
                  </button>
                </div>

                <div className="flex justify-center gap-1.5 pt-2">
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
                      className={`px-2.5 py-1.5 rounded-lg border text-[9px] uppercase tracking-wider transition ${
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
        </div>
      )}

      {/* ---------------- ADD TASK / CATEGORY MODAL ---------------- */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Tab Selection */}
            <div className="flex border-b border-border/40 pb-2">
              <button
                onClick={() => setModalTab("task")}
                className={`flex-1 text-center py-1 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  modalTab === "task"
                    ? "border-rose-gold text-rose-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                New Task
              </button>
              <button
                onClick={() => setModalTab("category")}
                className={`flex-1 text-center py-1 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
                  modalTab === "category"
                    ? "border-rose-gold text-rose-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                New Category
              </button>
            </div>

            {/* TAB CONTENT: TASK CREATE */}
            {modalTab === "task" ? (
              <form onSubmit={handleAddTask} className="space-y-4">
                {categories.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Please create a category first to create tasks.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Task title
                      </label>
                      <input
                        required
                        value={taskDraft.title}
                        onChange={(e) => setTaskDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Start DSA, Clean desk"
                        className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Category
                        </label>
                        <select
                          value={taskDraft.categoryId}
                          onChange={(e) => setTaskDraft((p) => ({ ...p, categoryId: e.target.value }))}
                          className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id} className="bg-card text-foreground">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Priority
                        </label>
                        <select
                          value={taskDraft.priority}
                          onChange={(e) => setTaskDraft((p) => ({ ...p, priority: e.target.value as Priority }))}
                          className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                        >
                          <option value="low" className="bg-card text-foreground">Low</option>
                          <option value="medium" className="bg-card text-foreground">Medium</option>
                          <option value="high" className="bg-card text-foreground">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required
                        value={taskDraft.dueDate}
                        onChange={(e) => setTaskDraft((p) => ({ ...p, dueDate: e.target.value }))}
                        className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60 text-foreground"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-lg py-2 text-xs font-semibold text-[#1a1a1a] transition-all"
                        style={{ backgroundImage: "var(--gradient-accent)" }}
                      >
                        Create Task
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              /* TAB CONTENT: CATEGORY CREATE */
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Category Name
                  </label>
                  <input
                    required
                    value={newCat.name}
                    onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Studies, Work, Personal"
                    className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={newCat.deadline}
                    onChange={(e) => setNewCat((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60 text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg py-2 text-xs font-semibold text-[#1a1a1a] transition-all"
                    style={{ backgroundImage: "var(--gradient-accent)" }}
                  >
                    Create Category
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
