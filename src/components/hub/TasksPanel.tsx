import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Calendar,
  Plus,
  Clock,
  ArrowLeftRight,
  MoreVertical,
  RotateCcw,
  Square,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  FolderOpen,
  AlertTriangle
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
  const day = current.getDay();
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
  // Tasks and categories states
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date and calendar navigation
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = useMemo(() => toDateStr(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Inline task adding states (tracks category ID being edited)
  const [inlineAddCatId, setInlineAddCatId] = useState<string | null>(null);
  const [inlineAddTitle, setInlineAddTitle] = useState("");

  // New category creation states
  const [newDailyCatName, setNewDailyCatName] = useState("");
  const [newDeadlineCat, setNewDeadlineCat] = useState({ name: "", deadline: "" });

  // Popover options menus state
  const [activeMenuCatId, setActiveMenuCatId] = useState<string | null>(null);

  // Pomodoro Focus Mode states
  const [focusMode, setFocusMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(false);

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
  const handleAddDailyCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyCatName.trim()) return;
    const color = categoryPalette[categories.length % categoryPalette.length];
    try {
      const { data } = await api.post("/task-categories", {
        name: newDailyCatName.trim(),
        color,
        deadline: null,
      });
      setCategories((p) => [...p, data as Category]);
      setNewDailyCatName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDeadlineCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadlineCat.name.trim() || !newDeadlineCat.deadline) return;
    const color = categoryPalette[categories.length % categoryPalette.length];
    try {
      const { data } = await api.post("/task-categories", {
        name: newDeadlineCat.name.trim(),
        color,
        deadline: toLocalMidnightISO(newDeadlineCat.deadline),
      });
      setCategories((p) => [...p, data as Category]);
      setNewDeadlineCat({ name: "", deadline: "" });
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

  // Inline Task Adding Actions
  const handleAddTaskInline = async (catId: string, isDeadlineCat: boolean) => {
    if (!inlineAddTitle.trim()) return;
    try {
      const { data } = await api.post("/tasks", {
        categoryId: catId,
        title: inlineAddTitle.trim(),
        priority: "medium",
        // Deadline categories have static tasks (due_date is null), daily categories are scheduled
        dueDate: isDeadlineCat ? null : selectedDateStr,
      });
      setTasks((p) => [...p, data as Task]);
      setInlineAddTitle("");
      setInlineAddCatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveIncompleteTasksToNextDay = async (catId: string) => {
    const incompleteTasks = tasks.filter(t => t.category_id === catId && t.due_date === selectedDateStr && !t.completed);
    if (incompleteTasks.length === 0) return;
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    const nextDayStr = toDateStr(nextDay);
    
    // Update local state instantly for responsiveness
    setTasks(p => p.map(t => {
      if (t.category_id === catId && t.due_date === selectedDateStr && !t.completed) {
        return { ...t, due_date: nextDayStr };
      }
      return t;
    }));
    
    // Update database
    try {
      await Promise.all(incompleteTasks.map(t => 
        api.put(`/tasks/${t.id}`, { dueDate: nextDayStr })
      ));
    } catch (err) {
      console.error(err);
      load();
    }
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

  // Filter categories
  const dailyCategories = useMemo(() => categories.filter(c => !c.deadline), [categories]);
  const deadlineCategories = useMemo(() => categories.filter(c => c.deadline), [categories]);

  // Filter tasks for selected date (only for daily categories)
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

  const deadlineMeta = (iso: string | null) => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    const days = Math.round(ms / 86400000);
    const overdue = ms < 0;
    return { days, overdue };
  };

  return (
    <div className="relative min-h-[500px]">
      {/* ---------------- NORMAL CALENDAR MODE ---------------- */}
      {!focusMode ? (
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1fr_300px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* LEFT COLUMN: Daily planner categories, breakline, and static deadlines */}
          <div className="space-y-6">
            
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
                <p className="text-xs text-muted-foreground mt-0.5 lowercase font-medium">
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
                            ? "bg-lavender text-[#1a1a1a] shadow-lg scale-105 font-bold"
                            : "text-foreground group-hover:text-lavender"
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

            {/* DAILY TO DO CATEGORIES */}
            <div className="space-y-6 pt-2">
              {dailyCategories.map((c) => {
                const catTasks = selectedDateTasks.filter((t) => t.category_id === c.id);
                const isAdding = inlineAddCatId === c.id;

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
                          onClick={() => handleMoveIncompleteTasksToNextDay(c.id)}
                          className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                          title="Defer incomplete tasks to tomorrow"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setInlineAddCatId(isAdding ? null : c.id);
                            setInlineAddTitle("");
                          }}
                          className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                          title="Add task inline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        
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

                    {/* Inline Task Add Field */}
                    {isAdding && (
                      <div className="relative mt-2 p-1">
                        <label className="absolute -top-2 left-3 px-1 text-[9px] font-bold text-lavender bg-background z-10">
                          New Task
                        </label>
                        <div className="flex items-center gap-2 border border-lavender/50 rounded-xl px-3 py-2 bg-input/10">
                          <input
                            autoFocus
                            value={inlineAddTitle}
                            onChange={(e) => setInlineAddTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddTaskInline(c.id, false);
                              }
                            }}
                            placeholder="Type a task name and press Enter..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
                          />
                          <button
                            onClick={() => {
                              setInlineAddTitle("");
                              setInlineAddCatId(null);
                            }}
                            className="p-1 rounded hover:bg-card/40 text-muted-foreground hover:text-foreground transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tasks Checklist */}
                    <div className="pl-1.5 space-y-1">
                      {catTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 py-2 group hover:bg-card/20 px-2 rounded-xl transition"
                        >
                          <button
                            onClick={() => toggleTaskCompleted(t)}
                            className="text-muted-foreground hover:text-lavender transition shrink-0"
                            aria-label="Toggle completed"
                          >
                            {t.completed ? (
                              <CheckSquare className="w-4 h-4 text-lavender" />
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
                      {catTasks.length === 0 && !isAdding && (
                        <div className="text-center py-4 text-xs text-muted-foreground/50 italic select-none">
                          No tasks yet.. Tap to add some :)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {!loading && dailyCategories.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center space-y-2">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">No daily categories yet</h4>
                    <p className="text-xs text-muted-foreground">
                      Use the "New Daily Category" form on the side to create one.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* BREAKLINE DIVIDER */}
            <hr className="border-t border-border/80 my-10" />

            {/* DEADLINES SECTION (STATIC REGARDLESS OF CALENDAR SELECTION) */}
            <div className="space-y-6 pb-20">
              <h3 className="text-lg font-black uppercase tracking-wider text-muted-foreground/80">
                Deadlines
              </h3>

              {deadlineCategories.map((c) => {
                // Deadline categories show all tasks assigned to them (not date specific)
                const catTasks = tasks.filter((t) => t.category_id === c.id);
                const isAdding = inlineAddCatId === c.id;
                const dm = deadlineMeta(c.deadline);

                return (
                  <div key={c.id} className="space-y-2">
                    
                    {/* Category Title & Actions Row */}
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold lowercase tracking-wider flex items-center gap-2 text-foreground">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </h4>
                        
                        {c.deadline && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            dm?.overdue 
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-lavender/30 bg-lavender/10 text-lavender"
                          }`}>
                            {dm?.overdue 
                              ? `overdue by ${Math.abs(dm.days)}d` 
                              : dm?.days === 0 
                              ? "due today" 
                              : `${dm?.days}d left`}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInlineAddCatId(isAdding ? null : c.id);
                            setInlineAddTitle("");
                          }}
                          className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
                          title="Add task inline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        
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

                    {/* Inline Task Add Field */}
                    {isAdding && (
                      <div className="relative mt-2 p-1">
                        <label className="absolute -top-2 left-3 px-1 text-[9px] font-bold text-lavender bg-background z-10">
                          New Task
                        </label>
                        <div className="flex items-center gap-2 border border-lavender/50 rounded-xl px-3 py-2 bg-input/10">
                          <input
                            autoFocus
                            value={inlineAddTitle}
                            onChange={(e) => setInlineAddTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddTaskInline(c.id, true);
                              }
                            }}
                            placeholder="Type a task name and press Enter..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
                          />
                          <button
                            onClick={() => {
                              setInlineAddTitle("");
                              setInlineAddCatId(null);
                            }}
                            className="p-1 rounded hover:bg-card/40 text-muted-foreground hover:text-foreground transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tasks Checklist */}
                    <div className="pl-1.5 space-y-1">
                      {catTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 py-2 group hover:bg-card/20 px-2 rounded-xl transition"
                        >
                          <button
                            onClick={() => toggleTaskCompleted(t)}
                            className="text-muted-foreground hover:text-lavender transition shrink-0"
                            aria-label="Toggle completed"
                          >
                            {t.completed ? (
                              <CheckSquare className="w-4 h-4 text-lavender" />
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
                      {catTasks.length === 0 && !isAdding && (
                        <div className="text-center py-4 text-xs text-muted-foreground/50 italic select-none">
                          No tasks yet.. Tap to add some :)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* NEW DEADLINE CATEGORY CARD */}
              <form onSubmit={handleAddDeadlineCategory} className="glass rounded-3xl p-6 max-w-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  New Category
                </h4>
                <div className="space-y-1">
                  <input
                    required
                    value={newDeadlineCat.name}
                    onChange={(e) => setNewDeadlineCat((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Studies, Work, Personal"
                    className="w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-lavender/60 text-foreground"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    required
                    value={newDeadlineCat.deadline}
                    onChange={(e) => setNewDeadlineCat((p) => ({ ...p, deadline: e.target.value }))}
                    className="bg-input/40 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-lavender/60 text-foreground flex-1"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-[#1a1a1a] shadow-md transition hover:scale-105 active:scale-95 shrink-0"
                    style={{ backgroundImage: "var(--gradient-accent)" }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: Side Monthly Calendar & Daily Category creator */}
          <div className="space-y-6">
            <MonthlyCalendar selectedDate={selectedDate} onChange={setSelectedDate} tasks={tasks} />
            
            {/* NEW DAILY CATEGORY CREATOR */}
            <form onSubmit={handleAddDailyCategory} className="glass rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New Daily Category
              </h4>
              <input
                required
                value={newDailyCatName}
                onChange={(e) => setNewDailyCatName(e.target.value)}
                placeholder="e.g. Studies, Work, Personal"
                className="w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-lavender/60 text-foreground"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg text-xs font-semibold text-[#1a1a1a]"
                style={{ backgroundImage: "var(--gradient-accent)" }}
              >
                Create Daily Category
              </button>
            </form>
          </div>

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
                    <Clock className="w-4 h-4 text-lavender" /> focus zone
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
                          className="text-muted-foreground hover:text-lavender transition"
                        >
                          {t.completed ? (
                            <CheckSquare className="w-4 h-4 text-lavender" />
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
                  timerRunning ? "scale-125 bg-lavender" : "bg-purple-900"
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
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs text-[#1a1a1a] transition-all hover:scale-105 active:scale-95 animate-pulse"
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
                          ? "border-lavender text-lavender bg-lavender/10"
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
    </div>
  );
}

// ---------------- MINI MONTHLY CALENDAR COMPONENT ----------------
function MonthlyCalendar({
  selectedDate,
  onChange,
  tasks
}: {
  selectedDate: Date;
  onChange: (d: Date) => void;
  tasks: Task[];
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selectedDate));
  
  // Update view month when selected date changes from outside
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  // Empty cell placeholders for alignments
  for (let i = 0; i < startingDay; i++) {
    daysArray.push(null);
  }
  // Populate the days of month
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const weekHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      {/* Month Year navigation */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">
          {currentMonth.toLocaleDateString([], { month: "short", year: "numeric" })}
        </h4>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-card/60 transition" aria-label="Previous Month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-card/60 transition" aria-label="Next Month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week headings grid */}
      <div className="grid grid-cols-7 text-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
        {weekHeaders.map(h => <span key={h}>{h.slice(0, 1)}</span>)}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 text-center gap-1">
        {daysArray.map((day, idx) => {
          if (!day) return <span key={`empty-${idx}`} />;
          
          const isSelected = toDateStr(day) === toDateStr(selectedDate);
          const isToday = toDateStr(day) === toDateStr(new Date());
          const dateStr = toDateStr(day);
          
          // Tasks count for day indicator (daily tasks only)
          const dayTasks = tasks.filter(t => t.due_date === dateStr);
          const hasTasks = dayTasks.length > 0;
          const completedAll = hasTasks && dayTasks.every(t => t.completed);

          return (
            <button
              key={idx}
              onClick={() => onChange(day)}
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-accent/20 transition relative group"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-full transition-all ${
                  isSelected
                    ? "bg-foreground text-background font-black scale-105"
                    : isToday
                    ? "border border-lavender text-foreground"
                    : "text-foreground group-hover:text-lavender"
                }`}
              >
                {day.getDate()}
              </span>
              {hasTasks && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${completedAll ? "bg-muted-foreground/45" : "bg-lavender"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
