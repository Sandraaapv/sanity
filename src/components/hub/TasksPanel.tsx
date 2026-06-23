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
  AlertTriangle,
  Timer,
  CalendarDays,
  CheckCircle2,
  BarChart2
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

type Subject = {
  id: string;
  name: string;
  color: string;
};

type Session = {
  id: string;
  subjectId: string;
  subjectName: string;
  durationSeconds: number;
  startTime: string; // ISO string
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

  // Study states for Minimized Timer & Metrics
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [timerMode, setTimerMode] = useState<"countdown" | "stopwatch">("countdown");
  const [countdownDuration, setCountdownDuration] = useState(1500); // 25m default
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerRunningStudy, setTimerRunningStudy] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // UX interactive states
  const [selectedDeadlineCatId, setSelectedDeadlineCatId] = useState<string | null>(null);
  const [showAddDailyFormInline, setShowAddDailyFormInline] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddCatId, setQuickAddCatId] = useState("");

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
  const [showAddDeadlineForm, setShowAddDeadlineForm] = useState(false);

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

  // Minimized Study Timer ticking
  useEffect(() => {
    let interval: any = null;
    if (timerRunningStudy) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "countdown") {
            if (prev <= 1) {
              setTimerRunningStudy(false);
              handleCompleteStudySession(countdownDuration);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunningStudy, timerMode, countdownDuration]);

  const handleCompleteStudySession = async (durationSecs: number) => {
    if (!activeSubject || durationSecs <= 0) return;
    try {
      const startTimeVal = sessionStartTime || new Date(Date.now() - durationSecs * 1000).toISOString();
      const { data } = await api.post("/study/sessions", {
        subjectId: activeSubject.id,
        durationSeconds: durationSecs,
        startTime: startTimeVal,
      });
      setSessions((p) => [...p, data as Session]);
      setActiveSubject(null);
      setTimerRunningStudy(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopStudySessionEarly = () => {
    if (!activeSubject) return;
    const elapsed = timerMode === "countdown" 
      ? countdownDuration - timerSeconds 
      : timerSeconds;
    if (elapsed > 0) {
      handleCompleteStudySession(elapsed);
    } else {
      setActiveSubject(null);
      setTimerRunningStudy(false);
    }
  };

  const handleSelectSubject = (sub: Subject) => {
    setActiveSubject(sub);
    setTimerRunningStudy(false);
    setSessionStartTime(new Date().toISOString());
    if (timerMode === "countdown") {
      setTimerSeconds(countdownDuration);
    } else {
      setTimerSeconds(0);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: ts }, { data: subs }, { data: sess }] = await Promise.all([
        api.get("/task-categories"),
        api.get("/tasks"),
        api.get("/study/subjects"),
        api.get("/study/sessions"),
      ]);
      setCategories((cats ?? []) as Category[]);
      setTasks((ts ?? []) as Task[]);
      setSubjects((subs ?? []) as Subject[]);
      setSessions((sess ?? []) as Session[]);
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
      setShowAddDailyFormInline(false);
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
      setShowAddDeadlineForm(false);
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

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim() || !quickAddCatId) return;
    const isDeadlineCat = categories.some(c => c.id === quickAddCatId && c.deadline);
    try {
      const { data } = await api.post("/tasks", {
        categoryId: quickAddCatId,
        title: quickAddTitle.trim(),
        priority: "medium",
        dueDate: isDeadlineCat ? null : selectedDateStr,
      });
      setTasks((p) => [...p, data as Task]);
      setQuickAddTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  // Memoized metrics for Bento Grid
  const totalStudySecondsToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sessions
      .filter((s) => new Date(s.startTime).toDateString() === todayStr)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [sessions]);

  const closestDeadline = useMemo(() => {
    const now = Date.now();
    const activeDeadlines = categories
      .filter((c) => c.deadline)
      .map((c) => {
        const ms = new Date(c.deadline!).getTime() - now;
        return { c, ms, days: Math.round(ms / 86400000) };
      })
      .filter((item) => item.days >= 0)
      .sort((a, b) => a.ms - b.ms);
    return activeDeadlines[0] || null;
  }, [categories]);

  const totalPendingTasksCount = useMemo(() => {
    return tasks.filter((t) => !t.completed).length;
  }, [tasks]);

  // Weekly study minutes per day calculations for bottom row wave-graph
  const weeklyStudyDataPoints = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekdays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

    const minutesPerDay = weekdays.map((date) => {
      const dateStr = date.toDateString();
      const daySeconds = sessions
        .filter((s) => new Date(s.startTime).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.durationSeconds, 0);
      return daySeconds / 60;
    });

    const maxMinutes = Math.max(...minutesPerDay, 60);

    const points = weekdays.map((_, i) => {
      const x = 30 + (i / 6) * 240;
      const y = 90 - (minutesPerDay[i] / maxMinutes) * 70;
      return { x, y, minutes: minutesPerDay[i], label: dayLabels[i] };
    });

    let splineD = "";
    if (points.length > 0) {
      splineD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p1.x - (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        splineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    return { points, splineD, maxMinutes };
  }, [sessions]);

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
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] w-full items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* LEFT COLUMN: MAIN STAGE (70%) */}
          <div className="space-y-8 flex-1 w-full">
            
            {/* BENTO TOP ROW: GLANCE METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Metric 1: Pending Tasks */}
              <div className="glass rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Pending Tasks
                  </p>
                  <h4 className="text-3xl font-black text-foreground">
                    {totalPendingTasksCount}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">across all boards</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-lavender/10 border border-lavender/30 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-lavender" />
                </div>
              </div>

              {/* Metric 2: Active Study Time Today */}
              <div className="glass rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Study Time Today
                  </p>
                  <h4 className="text-3xl font-black text-foreground">
                    {Math.round(totalStudySecondsToday / 60)}m
                  </h4>
                  <p className="text-[10px] text-muted-foreground">focused sessions</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-gold/10 border border-rose-gold/30 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-rose-gold" />
                </div>
              </div>

              {/* Metric 3: Closest Upcoming Deadline */}
              <div className="glass rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Next Deadline
                  </p>
                  <h4 className="text-lg font-bold text-foreground truncate max-w-[150px]">
                    {closestDeadline ? closestDeadline.c.name : "None"}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    {closestDeadline ? (
                      closestDeadline.days === 0 ? (
                        <span className="text-destructive font-bold">due today</span>
                      ) : (
                        `${closestDeadline.days}d remaining`
                      )
                    ) : (
                      "no active deadlines"
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blush/10 border border-blush/30 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-blush" />
                </div>
              </div>
            </div>

            {/* BENTO MIDDLE ROW: ACTIVE BOARDS & DEADLINES */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
              
              {/* LEFT COLUMN: ACTIVE TASK BOARDS */}
              <div className="glass rounded-3xl p-6 space-y-6">
                
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight text-foreground">
                        {selectedDate.toLocaleDateString([], { month: "long" })}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground">
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
                    <p className="text-[10px] text-muted-foreground mt-0.5 lowercase font-medium">
                      {tasksCountText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-[10px] font-semibold text-foreground transition"
                    >
                      <RotateCcw className="w-3 h-3" /> Today
                    </button>
                    <button
                      onClick={() => setFocusMode(true)}
                      className="p-1.5 rounded-xl border border-border bg-card/40 hover:bg-accent/40 text-foreground transition"
                      aria-label="Focus mode"
                      title="Focus Mode"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date strip */}
                <div className="grid grid-cols-7 text-center gap-1 p-2 bg-card/10 rounded-2xl border border-border/20">
                  {weekDays.map((d, idx) => {
                    const dayName = d.toLocaleDateString([], { weekday: "short" });
                    const dateNum = d.getDate();
                    const isSelected = toDateStr(d) === selectedDateStr;
                    const isToday = toDateStr(d) === toDateStr(new Date());

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(d)}
                        className="flex flex-col items-center py-1.5 rounded-lg hover:bg-accent/10 transition relative group"
                      >
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          {dayName.slice(0, 1)}
                        </span>
                        <span
                          className={`w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-full transition-all ${
                            isSelected
                              ? "bg-lavender text-[#1a1a1a] shadow-md scale-105 font-bold"
                              : "text-foreground group-hover:text-lavender"
                          }`}
                        >
                          {dateNum}
                        </span>
                        {isToday && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Daily Categories Boards list */}
                <div className="space-y-6 pt-2">
                  {dailyCategories.map((c) => {
                    const catTasks = selectedDateTasks.filter((t) => t.category_id === c.id);
                    const isAdding = inlineAddCatId === c.id;

                    return (
                      <div key={c.id} className="space-y-2">
                        
                        <div className="flex items-center justify-between relative">
                          <h4 className="text-xs font-bold lowercase tracking-wider flex items-center gap-2 text-foreground">
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

                        <hr className="border-t border-border/20" />

                        {isAdding && (
                          <div className="relative mt-2 p-1 animate-in slide-in-from-top-2 duration-200">
                            <label className="absolute -top-2 left-3 px-1 text-[8px] font-bold text-lavender bg-background z-10">
                              New Task
                            </label>
                            <div className="flex items-center gap-2 border border-lavender/40 rounded-xl px-2.5 py-1.5 bg-input/10">
                              <input
                                autoFocus
                                value={inlineAddTitle}
                                onChange={(e) => setInlineAddTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddTaskInline(c.id, false);
                                  }
                                }}
                                placeholder="Type and press Enter..."
                                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
                              />
                              <button
                                onClick={() => {
                                  setInlineAddTitle("");
                                  setInlineAddCatId(null);
                                }}
                                className="p-1 rounded hover:bg-card/45 text-muted-foreground hover:text-foreground transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="pl-1.5 space-y-0.5">
                          {catTasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-2.5 py-1.5 group hover:bg-card/10 px-2 rounded-xl transition"
                            >
                              <button
                                onClick={() => toggleTaskCompleted(t)}
                                className="text-muted-foreground hover:text-lavender transition shrink-0"
                                aria-label="Toggle completed"
                              >
                                {t.completed ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-lavender" />
                                ) : (
                                  <Square className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span
                                className={`text-xs select-none break-all transition-all duration-300 ${
                                  t.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {t.title}
                              </span>
                              
                              <span className={`ml-auto text-[7px] uppercase tracking-wider border rounded-full px-1.5 py-0.2 shrink-0 ${priorityStyles[t.priority]}`}>
                                {t.priority}
                              </span>

                              <button
                                onClick={() => removeTask(t.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition shrink-0"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {catTasks.length === 0 && !isAdding && (
                            <div className="text-center py-2 text-[10px] text-muted-foreground/40 italic select-none">
                              No tasks scheduled yet
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline daily category creator */}
                  {showAddDailyFormInline ? (
                    <form onSubmit={handleAddDailyCategory} className="bg-card/25 border border-border/20 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          New Daily Category
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAddDailyFormInline(false)}
                          className="p-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        required
                        autoFocus
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
                        Create Category
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddDailyFormInline(true)}
                      className="w-full py-3 rounded-2xl border border-dashed border-border/60 hover:border-foreground/30 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      + New Category
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: DEADLINE BOARDS */}
              <div className="glass rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black uppercase tracking-wider text-muted-foreground/80">
                    Deadlines
                  </h3>
                  {!showAddDeadlineForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddDeadlineForm(true);
                        setNewDeadlineCat({ name: "", deadline: "" });
                      }}
                      className="p-1 rounded-full hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all duration-200"
                      aria-label="Add deadline category"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Inline deadline creation */}
                {showAddDeadlineForm && (
                  <form onSubmit={handleAddDeadlineCategory} className="bg-card/25 border border-border/20 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        New Deadline
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddDeadlineForm(false)}
                        className="p-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          Category Name
                        </label>
                        <input
                          required
                          autoFocus
                          value={newDeadlineCat.name}
                          onChange={(e) => setNewDeadlineCat((p) => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. Exams, Projects"
                          className="w-full bg-input/40 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-lavender/60 text-foreground"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          Deadline Date
                        </label>
                        <input
                          type="date"
                          required
                          value={newDeadlineCat.deadline}
                          onChange={(e) => setNewDeadlineCat((p) => ({ ...p, deadline: e.target.value }))}
                          className="w-full bg-input/40 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-lavender/60 text-foreground text-left"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl text-xs font-semibold text-[#1a1a1a] shadow-md transition hover:scale-[1.01]"
                        style={{ backgroundImage: "var(--gradient-accent)" }}
                      >
                        Create Deadline
                      </button>
                    </div>
                  </form>
                )}

                {/* Deadlines Accordion Panels */}
                <div className="space-y-3">
                  {deadlineCategories.map((c) => {
                    const catTasks = tasks.filter((t) => t.category_id === c.id);
                    const isAdding = inlineAddCatId === c.id;
                    const dm = deadlineMeta(c.deadline);
                    const isExpanded = selectedDeadlineCatId === c.id;

                    return (
                      <div 
                        key={c.id} 
                        className={`rounded-2xl border transition-all duration-200 ${
                          isExpanded ? "border-lavender/40 bg-card/25" : "border-border/40 bg-card/10"
                        }`}
                      >
                        {/* Header Accordion Button */}
                        <div 
                          onClick={() => setSelectedDeadlineCatId(isExpanded ? null : c.id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-card/20 rounded-t-2xl transition"
                        >
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="font-bold text-xs truncate lowercase">{c.name}</span>
                          </div>

                          {c.deadline && (
                            <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              dm?.overdue 
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-lavender/30 bg-lavender/10 text-lavender"
                            }`}>
                              {dm?.overdue 
                                ? `overdue` 
                                : dm?.days === 0 
                                ? "today" 
                                : `${dm?.days}d left`}
                            </span>
                          )}
                        </div>

                        {/* Sliding Expandable Content Panel */}
                        <div 
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? "max-h-[380px] p-4 border-t border-border/20" : "max-h-0"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">Tasks</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineAddCatId(isAdding ? null : c.id);
                                  setInlineAddTitle("");
                                }}
                                className="p-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition"
                                title="Add task inline"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCategory(c.id);
                                  setSelectedDeadlineCatId(null);
                                }}
                                className="p-1 rounded hover:bg-destructive/15 text-destructive hover:scale-105 transition"
                                title="Delete deadline category"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {isAdding && (
                            <div className="relative mb-3 animate-in slide-in-from-top-1 duration-150">
                              <div className="flex items-center gap-2 border border-lavender/40 rounded-xl px-2.5 py-1.5 bg-input/10">
                                <input
                                  autoFocus
                                  value={inlineAddTitle}
                                  onChange={(e) => setInlineAddTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddTaskInline(c.id, true);
                                    }
                                  }}
                                  placeholder="New task..."
                                  className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/60 text-foreground"
                                />
                                <button
                                  onClick={() => {
                                    setInlineAddTitle("");
                                    setInlineAddCatId(null);
                                  }}
                                  className="p-1 rounded hover:bg-card/45 text-muted-foreground hover:text-foreground transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                            {catTasks.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-2 py-1 group hover:bg-card/10 px-2 rounded-lg transition text-xs"
                              >
                                <button
                                  onClick={() => toggleTaskCompleted(t)}
                                  className="text-muted-foreground hover:text-lavender transition shrink-0"
                                >
                                  {t.completed ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-lavender" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className={`truncate select-none max-w-[120px] ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {t.title}
                                </span>
                                <button
                                  onClick={() => removeTask(t.id)}
                                  className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 text-muted-foreground hover:text-destructive transition shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {catTasks.length === 0 && !isAdding && (
                              <p className="text-center text-[10px] text-muted-foreground/45 italic py-2">No tasks added</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {deadlineCategories.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground/50 italic border border-dashed border-border/40 rounded-2xl select-none">
                      No active deadlines
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BENTO BOTTOM ROW: STUDY TIMER & WEEKLY ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT CARD: MINIMIZED STUDY TIMER */}
              <div className="glass rounded-3xl p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden shadow-sm">
                
                {/* Visual Glow */}
                {activeSubject && (
                  <div
                    className="absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl opacity-15"
                    style={{ backgroundColor: activeSubject.color }}
                  />
                )}

                <div className="flex items-center justify-between border-b border-border/20 pb-3 z-10">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-lavender" /> Minimized Focus
                  </h4>

                  {activeSubject && (
                    <button
                      onClick={handleStopStudySessionEarly}
                      className="text-[9px] font-bold text-muted-foreground hover:text-foreground transition border border-border/20 rounded-lg px-2 py-1 bg-card/25"
                    >
                      Stop
                    </button>
                  )}
                </div>

                {!activeSubject ? (
                  /* Subject Selection state */
                  <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-3 z-10">
                    <p className="text-[10px] text-muted-foreground/80 max-w-[200px] text-center">
                      Select a study subject to start tracking a focus session:
                    </p>
                    <select
                      onChange={(e) => {
                        const sub = subjects.find(s => s.id === e.target.value);
                        if (sub) handleSelectSubject(sub);
                      }}
                      value=""
                      className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-lavender/60 outline-none w-48 font-semibold"
                    >
                      <option value="" disabled>Choose Subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* Active Focus Ticking State */
                  <div className="flex-1 flex items-center justify-between py-4 z-10">
                    <div className="space-y-2 max-w-[50%]">
                      <span
                        className="text-[9px] font-black tracking-widest uppercase border px-2.5 py-1 rounded-full inline-block"
                        style={{
                          backgroundColor: activeSubject.color + "15",
                          color: activeSubject.color,
                          borderColor: activeSubject.color + "30",
                        }}
                      >
                        {activeSubject.name}
                      </span>
                      <div className="text-2xl font-black text-white font-mono tracking-wider tabular-nums">
                        {formatTime(timerSeconds)}
                      </div>
                      
                      {/* Presets */}
                      {timerMode === "countdown" && !timerRunningStudy && (
                        <div className="flex gap-1">
                          {[15, 25, 45].map((m) => (
                            <button
                              key={m}
                              onClick={() => {
                                setCountdownDuration(m * 60);
                                setTimerSeconds(m * 60);
                              }}
                              className={`text-[8px] px-2 py-1 border rounded-lg transition ${
                                countdownDuration === m * 60
                                  ? "bg-white/10 text-white border-white/20"
                                  : "border-border/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Circular visual progress and button */}
                    <div className="relative flex justify-center items-center select-none mr-2">
                      <svg width="100" height="100" className="transform -rotate-90">
                        <circle
                          stroke="rgba(255,255,255,0.03)"
                          fill="transparent"
                          strokeWidth="4"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          stroke={activeSubject.color}
                          fill="transparent"
                          strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                          style={{
                            strokeDashoffset: 2 * Math.PI * 40 - (
                              (timerMode === "countdown" 
                                ? (timerSeconds / countdownDuration) * 100 
                                : ((timerSeconds % 60) / 60) * 100
                              ) / 100
                            ) * (2 * Math.PI * 40)
                          }}
                          strokeLinecap="round"
                          r="40"
                          cx="50"
                          cy="50"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      
                      <button
                        onClick={() => setTimerRunningStudy(!timerRunningStudy)}
                        className="absolute w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition"
                        title={timerRunningStudy ? "Pause" : "Play"}
                      >
                        {timerRunningStudy ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT CARD: WEEKLY STUDY WAVE GRAPH */}
              <div className="glass rounded-3xl p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-border/20 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-lavender" /> Weekly Activity
                  </h4>
                  <span className="text-[9px] font-bold text-muted-foreground">Mon - Sun</span>
                </div>

                <div className="flex-1 py-4 flex items-center justify-center">
                  <div className="w-full max-w-[270px]">
                    <svg viewBox="0 0 300 110" className="w-full overflow-visible">
                      <line x1="30" y1="20" x2="270" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                      <line x1="30" y1="55" x2="270" y2="55" stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                      <line x1="30" y1="90" x2="270" y2="90" stroke="rgba(255,255,255,0.08)" />

                      {/* Wave Fill Gradient Area */}
                      {weeklyStudyDataPoints.splineD && (
                        <>
                          <defs>
                            <linearGradient id="waveGradientMin" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`${weeklyStudyDataPoints.splineD} L 270 90 L 30 90 Z`}
                            fill="url(#waveGradientMin)"
                          />
                          <path
                            d={weeklyStudyDataPoints.splineD}
                            fill="none"
                            stroke="#c4b5fd"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {/* Dots on points */}
                      {weeklyStudyDataPoints.points.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="3"
                            fill="#14121f"
                            stroke="#c4b5fd"
                            strokeWidth="1.8"
                            className="hover:scale-150 transition cursor-pointer"
                          />
                          {pt.minutes > 0 && (
                            <text
                              x={pt.x}
                              y={pt.y - 7}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="6"
                              fontWeight="bold"
                              className="font-mono"
                            >
                              {Math.round(pt.minutes)}m
                            </text>
                          )}
                          <text
                            x={pt.x}
                            y="102"
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.3)"
                            fontSize="7"
                            fontWeight="bold"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SIDEBAR CONTEXT PANEL (30%) */}
          <div className="space-y-6 w-full lg:max-w-[340px]">
            {/* Side Calendar Widget */}
            <MonthlyCalendar selectedDate={selectedDate} onChange={setSelectedDate} tasks={tasks} />

            {/* Unified Quick Add Task Widget */}
            <div className="glass rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-lavender" /> Quick Add Task
              </h4>
              <form onSubmit={handleQuickAddTask} className="space-y-3">
                <input
                  required
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-lavender/60 text-foreground"
                />
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Category
                  </label>
                  <select
                    required
                    value={quickAddCatId}
                    onChange={(e) => setQuickAddCatId(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-lavender/60 outline-none font-semibold"
                  >
                    <option value="" disabled>Choose Category...</option>
                    <optgroup label="Daily Lists">
                      {dailyCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Deadlines">
                      {deadlineCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl text-xs font-semibold text-[#1a1a1a] shadow-md transition hover:scale-[1.01]"
                  style={{ backgroundImage: "var(--gradient-accent)" }}
                >
                  Add Task
                </button>
              </form>
            </div>
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
