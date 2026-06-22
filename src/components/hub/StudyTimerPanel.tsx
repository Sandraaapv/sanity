import { useEffect, useMemo, useState } from "react";
import { Play, Pause, RotateCcw, Plus, X, BarChart2, Clock, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

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

const SUBJECT_PALETTE = ["#c4b5fd", "#fda4af", "#a7f3d0", "#ffd15c", "#93c5fd", "#e8b4b8"];

export function StudyTimerPanel() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Focus Timer State
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [timerMode, setTimerMode] = useState<"countdown" | "stopwatch">("countdown");
  const [countdownDuration, setCountdownDuration] = useState(1500); // 25 minutes default
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Subjects Management
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_PALETTE[0]);

  // Analytics State
  const [analyticsTab, setAnalyticsTab] = useState<"day" | "week" | "month">("day");

  // Load subjects and sessions from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: subs }, { data: sess }] = await Promise.all([
        api.get("/study/subjects"),
        api.get("/study/sessions"),
      ]);
      setSubjects((subs ?? []) as Subject[]);
      setSessions((sess ?? []) as Session[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update timer ticks
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "countdown") {
            if (prev <= 1) {
              setTimerRunning(false);
              // Complete session trigger
              handleCompleteSession(countdownDuration);
              return 0;
            }
            return prev - 1;
          } else {
            // Count up stopwatch mode
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
  }, [timerRunning, timerMode, countdownDuration]);

  // Start timer on subject selection
  const handleSelectSubject = (sub: Subject) => {
    setActiveSubject(sub);
    setTimerRunning(false);
    setSessionStartTime(new Date().toISOString());
    if (timerMode === "countdown") {
      setTimerSeconds(countdownDuration);
    } else {
      setTimerSeconds(0);
    }
  };

  // Add a new subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const { data } = await api.post("/study/subjects", {
        name: newSubjectName.trim(),
        color: newSubjectColor,
      });
      setSubjects((p) => [...p, data as Subject]);
      setNewSubjectName("");
      setShowAddSubject(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a subject
  const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the subject card
    try {
      await api.delete(`/study/subjects/${id}`);
      setSubjects((p) => p.filter((s) => s.id !== id));
      if (activeSubject?.id === id) {
        setActiveSubject(null);
        setTimerRunning(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log session to backend
  const handleCompleteSession = async (durationSecs: number) => {
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
      setTimerRunning(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Skip/Stop early & save whatever has been logged so far
  const handleStopSessionEarly = () => {
    if (!activeSubject) return;
    const elapsed = timerMode === "countdown" 
      ? countdownDuration - timerSeconds 
      : timerSeconds;
    if (elapsed > 0) {
      handleCompleteSession(elapsed);
    } else {
      setActiveSubject(null);
      setTimerRunning(false);
    }
  };

  // helper to format seconds -> e.g. "25:00"
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rSecs).padStart(2, "0")}`;
  };

  // Get total logged focus seconds today for each subject
  const loggedTodayMap = useMemo(() => {
    const map: Record<string, number> = {};
    const todayStr = new Date().toDateString();
    
    sessions.forEach((s) => {
      const sessDate = new Date(s.startTime).toDateString();
      if (sessDate === todayStr) {
        map[s.subjectId] = (map[s.subjectId] || 0) + s.durationSeconds;
      }
    });
    return map;
  }, [sessions]);

  // Total logged focus time today overall (all subjects combined)
  const totalSecondsToday = useMemo(() => {
    return Object.values(loggedTodayMap).reduce((a, b) => a + b, 0);
  }, [loggedTodayMap]);

  // SVG Circular progress params
  const progressPercent = useMemo(() => {
    if (timerMode === "countdown") {
      return (timerSeconds / countdownDuration) * 100;
    } else {
      return ((timerSeconds % 60) / 60) * 100;
    }
  }, [timerSeconds, countdownDuration, timerMode]);

  const circleStrokeDash = useMemo(() => {
    const radius = 100;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    return { circumference, strokeDashoffset, normalizedRadius };
  }, [progressPercent]);

  // Analytics Helpers & Views
  
  // Segmented Donut Chart data (Daily View)
  const dailyDonutSegments = useMemo(() => {
    if (totalSecondsToday === 0) return [];
    let cumulativePercent = 0;
    return subjects.map((sub) => {
      const seconds = loggedTodayMap[sub.id] || 0;
      const percent = (seconds / totalSecondsToday) * 100;
      const segment = {
        subject: sub,
        seconds,
        percent,
        cumulativePercent,
      };
      cumulativePercent += percent;
      return segment;
    }).filter(s => s.seconds > 0);
  }, [subjects, loggedTodayMap, totalSecondsToday]);

  // Weekly Spline Chart data (Weekly View - Mon to Sun)
  const weeklyDataPoints = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon...
    const startOfWeek = new Date(now);
    // Find Monday of the current week
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekdays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const minutesPerDay = weekdays.map((date) => {
      const dateStr = date.toDateString();
      const daySeconds = sessions
        .filter((s) => new Date(s.startTime).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.durationSeconds, 0);
      return daySeconds / 60; // minutes focused
    });

    const maxMinutes = Math.max(...minutesPerDay, 60); // minimum scale: 1 hour (60 mins)

    // Map to SVG coordinates: width = 500, height = 180
    // Padding: x: 40 to 460, y: 30 to 150
    const points = weekdays.map((_, i) => {
      const x = 40 + (i / 6) * 420;
      const y = 150 - (minutesPerDay[i] / maxMinutes) * 110;
      return { x, y, minutes: minutesPerDay[i], label: dayLabels[i] };
    });

    // Generate SVG Bezier Path
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

  // Monthly Contribution Heatmap data (Monthly View - Grid of Days of current Month)
  const monthlyHeatmapData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(year, month, i + 1);
      const dateStr = d.toDateString();
      const seconds = sessions
        .filter((s) => new Date(s.startTime).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.durationSeconds, 0);
      return {
        dayNum: i + 1,
        date: d,
        minutes: seconds / 60,
      };
    });

    return days;
  }, [sessions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {activeSubject ? (
        /* ================= TIMER VIEW SCREEN ================= */
        <div className="max-w-xl mx-auto glass rounded-3xl p-8 text-center space-y-8 relative overflow-hidden">
          {/* Subtle Glow Backdrop */}
          <div
            className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: activeSubject.color }}
          />

          <div className="flex items-center justify-between relative z-10">
            <button
              onClick={handleStopSessionEarly}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition border border-border/60 rounded-xl px-3 py-1.5 bg-card/25"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Stop & Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (timerRunning) return;
                  setTimerMode(timerMode === "countdown" ? "stopwatch" : "countdown");
                  setTimerSeconds(timerMode === "countdown" ? 0 : countdownDuration);
                }}
                disabled={timerRunning}
                className="text-[10px] uppercase font-bold tracking-wider border border-border/40 hover:bg-card/45 px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition"
              >
                {timerMode}
              </button>
            </div>
          </div>

          <div className="space-y-2 relative z-10 flex flex-col items-center">
            {/* Pill badge displaying active subject name */}
            <span
              className="text-xs font-black tracking-widest uppercase border px-4 py-1.5 rounded-full select-none"
              style={{
                backgroundColor: activeSubject.color + "15",
                color: activeSubject.color,
                borderColor: activeSubject.color + "30",
              }}
            >
              {activeSubject.name}
            </span>
          </div>

          {/* SVG Circular progress ring & digital timer */}
          <div className="relative flex justify-center items-center py-6 select-none">
            <svg width="220" height="220" className="transform -rotate-90">
              {/* Outer Track Ring */}
              <circle
                stroke="rgba(255,255,255,0.04)"
                fill="transparent"
                strokeWidth="6"
                r={circleStrokeDash.normalizedRadius}
                cx="110"
                cy="110"
              />
              {/* Animated Progress Ring */}
              <circle
                stroke={activeSubject.color}
                fill="transparent"
                strokeWidth="8"
                strokeDasharray={`${circleStrokeDash.circumference} ${circleStrokeDash.circumference}`}
                style={{ strokeDashoffset: circleStrokeDash.strokeDashoffset }}
                strokeLinecap="round"
                r={circleStrokeDash.normalizedRadius}
                cx="110"
                cy="110"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Timer digits overlay */}
            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <span className="text-4xl font-extrabold tracking-tight text-white tabular-nums">
                {formatTime(timerSeconds)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">
                {timerRunning ? "Focusing..." : "Paused"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 relative z-10">
            {timerMode === "countdown" && (
              <button
                onClick={() => setTimerSeconds(countdownDuration)}
                className="p-3.5 rounded-full bg-card border border-border/60 hover:bg-card/85 text-muted-foreground hover:text-white transition shadow-md"
                title="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition shadow-lg flex items-center justify-center"
              style={{
                boxShadow: `0 8px 30px ${activeSubject.color}20`,
              }}
              title={timerRunning ? "Pause Focus" : "Start Focus"}
            >
              {timerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-[2px]" />}
            </button>

            <button
              onClick={() => handleCompleteSession(timerMode === "countdown" ? countdownDuration - timerSeconds : timerSeconds)}
              className="p-3.5 rounded-full bg-card border border-border/60 hover:bg-card/85 text-muted-foreground hover:text-white transition shadow-md"
              title="Complete Focus Session"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          {/* Quick preset selector (countdown only) */}
          {timerMode === "countdown" && !timerRunning && (
            <div className="flex justify-center gap-2 pt-2 relative z-10">
              {[15, 25, 45].map((mins) => {
                const secs = mins * 60;
                return (
                  <button
                    key={mins}
                    onClick={() => {
                      setCountdownDuration(secs);
                      setTimerSeconds(secs);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                      countdownDuration === secs
                        ? "bg-white/10 text-white border-white/20"
                        : "border-border/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= GENERAL VIEW SCREEN (SUBJECTS & ANALYTICS) ================= */
        <div className="grid gap-8 md:grid-cols-[1fr_360px]">
          {/* Left Column: Subjects Grid & Creation */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-lavender" /> Select Subject
              </h3>
              
              <div className="relative">
                <button
                  onClick={() => setShowAddSubject(!showAddSubject)}
                  className="p-2 rounded-full hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all duration-200"
                  aria-label="Add study subject"
                >
                  <Plus className="w-5 h-5" />
                </button>
                
                {/* Subject Creation Dropdown */}
                {showAddSubject && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowAddSubject(false)} />
                    <div className="absolute right-0 mt-2 z-40 w-72 glass rounded-3xl p-5 shadow-2xl border border-border/80 animate-in fade-in slide-in-from-top-2 duration-200">
                      <form onSubmit={handleCreateSubject} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            New Subject
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowAddSubject(false)}
                            className="p-1 rounded hover:bg-card/40 text-muted-foreground hover:text-foreground transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Subject Title
                            </label>
                            <input
                              required
                              autoFocus
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              placeholder="e.g. Data Structures"
                              className="w-full bg-input/40 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-lavender/60 text-foreground"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Color Accent
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {SUBJECT_PALETTE.map((col) => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => setNewSubjectColor(col)}
                                  style={{ backgroundColor: col }}
                                  className={`w-6 h-6 rounded-full border transition ${
                                    newSubjectColor === col ? "border-white scale-110" : "border-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 rounded-xl text-xs font-semibold text-[#1a1a1a] shadow-md transition hover:scale-[1.01]"
                            style={{ backgroundImage: "var(--gradient-accent)" }}
                          >
                            Create Subject
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subject Selection Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.map((sub) => {
                const loggedTodaySecs = loggedTodayMap[sub.id] || 0;
                const loggedTodayMins = Math.round(loggedTodaySecs / 60);
                
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub)}
                    className="group relative rounded-3xl p-5 border border-border/40 hover:border-border bg-card/20 hover:bg-card/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 w-1.5 h-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-base tracking-tight text-white line-clamp-2">
                        {sub.name}
                      </h4>
                      
                      <button
                        onClick={(e) => handleDeleteSubject(sub.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete Subject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-4">
                      <span className="text-muted-foreground font-semibold">Today:</span>
                      <span className="font-extrabold text-white">
                        {loggedTodayMins > 0 ? `${loggedTodayMins}m` : "0m"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!loading && subjects.length === 0 && (
                <div className="col-span-full border border-dashed border-border/60 rounded-3xl p-8 text-center text-muted-foreground/60 select-none">
                  No subjects defined yet. Click the '+' button in the corner to add subjects like "Data Structures" or "Smart Cities".
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Productivity Analytics Dashboard */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-lavender" /> Analytics
              </h3>
              
              {/* Granularity Toggle Control */}
              <div className="flex bg-card border border-border/40 rounded-xl p-0.5 text-xs">
                {(["day", "week", "month"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAnalyticsTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                      analyticsTab === tab
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Contents based on Tab */}
            <div className="glass rounded-3xl p-6 space-y-6">
              
              {analyticsTab === "day" && (
                /* ================= DAILY VIEW ================= */
                <div className="space-y-6">
                  {/* Daily total card */}
                  <div className="bg-card/45 border border-border/40 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">
                        Today's Focus
                      </p>
                      <h4 className="text-2xl font-black text-white mt-1">
                        {Math.round(totalSecondsToday / 60)}m
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-lavender/10 border border-lavender/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-lavender" />
                    </div>
                  </div>

                  {/* Segmented Donut Chart */}
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground text-center">
                      Subject Breakdown
                    </p>
                    
                    {totalSecondsToday > 0 ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-40 h-40">
                          {/* Pure SVG Concentric/Segmented Donut */}
                          <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                            {/* Base track */}
                            <circle
                              stroke="rgba(255,255,255,0.03)"
                              strokeWidth="16"
                              fill="transparent"
                              r="55"
                              cx="80"
                              cy="80"
                            />
                            
                            {dailyDonutSegments.map((seg, idx) => {
                              const r = 55;
                              const circumference = 2 * Math.PI * r;
                              const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
                              const strokeDashoffset = -((seg.cumulativePercent / 100) * circumference);
                              
                              return (
                                <circle
                                  key={seg.subject.id}
                                  stroke={seg.subject.color}
                                  strokeWidth="16"
                                  fill="transparent"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  r={r}
                                  cx="80"
                                  cy="80"
                                  className="transition-all duration-500"
                                />
                              );
                            })}
                          </svg>
                          
                          {/* Middle label */}
                          <div className="absolute inset-0 flex flex-col justify-center items-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-black">Logged</span>
                            <span className="text-lg font-bold text-white">
                              {Math.round(totalSecondsToday / 3600)}h {Math.round((totalSecondsToday % 3600) / 60)}m
                            </span>
                          </div>
                        </div>

                        {/* Legend list */}
                        <div className="w-full space-y-2 text-xs">
                          {dailyDonutSegments.map((seg) => (
                            <div key={seg.subject.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: seg.subject.color }}
                                />
                                <span className="font-semibold text-white truncate max-w-[150px]">
                                  {seg.subject.name}
                                </span>
                              </div>
                              <span className="text-muted-foreground font-mono">
                                {Math.round(seg.seconds / 60)}m ({Math.round(seg.percent)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground/60 italic">
                        No study sessions logged today. Select a subject above to begin!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analyticsTab === "week" && (
                /* ================= WEEKLY VIEW ================= */
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">
                      This Week's Focus Time
                    </p>
                    <h4 className="text-xl font-bold text-white mt-1">
                      {Math.round(
                        weeklyDataPoints.points.reduce((sum, p) => sum + p.minutes, 0)
                      )}m logged
                    </h4>
                  </div>

                  {/* Bezier wave line chart */}
                  <div className="relative py-2">
                    <svg viewBox="0 0 500 180" className="w-full overflow-visible">
                      {/* Grid Lines (Subtle horizontal references only) */}
                      <line x1="40" y1="30" x2="460" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <line x1="40" y1="90" x2="460" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <line x1="40" y1="150" x2="460" y2="150" stroke="rgba(255,255,255,0.08)" />

                      {/* Wave Fill Gradient Area */}
                      {weeklyDataPoints.splineD && (
                        <>
                          <defs>
                            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`${weeklyDataPoints.splineD} L 460 150 L 40 150 Z`}
                            fill="url(#waveGradient)"
                          />
                          {/* Wave Stroke Line */}
                          <path
                            d={weeklyDataPoints.splineD}
                            fill="none"
                            stroke="#c4b5fd"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {/* Dots on points & labels */}
                      {weeklyDataPoints.points.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            fill="#14121f"
                            stroke="#c4b5fd"
                            strokeWidth="2.5"
                            className="hover:scale-150 transition cursor-pointer"
                          />
                          {pt.minutes > 0 && (
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="8"
                              fontWeight="bold"
                              className="font-mono"
                            >
                              {Math.round(pt.minutes)}m
                            </text>
                          )}
                          <text
                            x={pt.x}
                            y="168"
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              {analyticsTab === "month" && (
                /* ================= MONTHLY VIEW ================= */
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">
                      Monthly Consistency
                    </p>
                    <h4 className="text-xs text-muted-foreground mt-1">
                      Contribution graph of study logs for the current month
                    </h4>
                  </div>

                  {/* GitHub contribution heatmap grid */}
                  <div className="pt-2 flex flex-col items-center">
                    <div className="grid grid-cols-7 gap-2.5 max-w-[280px]">
                      {/* Grid cells */}
                      {monthlyHeatmapData.map((d) => {
                        // Decide level of color shade
                        let bgClass = "bg-white/5 border border-white/5";
                        let style = {};

                        if (d.minutes > 0 && d.minutes < 15) {
                          style = { backgroundColor: "rgba(196, 181, 253, 0.25)", borderColor: "rgba(196, 181, 253, 0.1)" };
                        } else if (d.minutes >= 15 && d.minutes < 45) {
                          style = { backgroundColor: "rgba(196, 181, 253, 0.5)", borderColor: "rgba(196, 181, 253, 0.2)" };
                        } else if (d.minutes >= 45 && d.minutes < 90) {
                          style = { backgroundColor: "rgba(196, 181, 253, 0.75)", borderColor: "rgba(196, 181, 253, 0.3)" };
                        } else if (d.minutes >= 90) {
                          style = { backgroundColor: "#c4b5fd", borderColor: "#c4b5fd" };
                        }

                        return (
                          <div
                            key={d.dayNum}
                            style={style}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white transition hover:scale-110 cursor-help ${
                              d.minutes === 0 ? bgClass : ""
                            }`}
                            title={`${d.date.toLocaleDateString()}: ${Math.round(d.minutes)} minutes logged`}
                          >
                            {d.dayNum}
                          </div>
                        );
                      })}
                    </div>

                    {/* Simple Heatmap Legend */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-[9px] text-muted-foreground">
                      <span>Less</span>
                      <div className="w-3.5 h-3.5 rounded bg-white/5 border border-white/5" />
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "rgba(196, 181, 253, 0.25)" }} />
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "rgba(196, 181, 253, 0.5)" }} />
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "rgba(196, 181, 253, 0.75)" }} />
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "#c4b5fd" }} />
                      <span>More</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
