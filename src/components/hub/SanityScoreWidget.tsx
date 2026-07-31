import { useEffect, useState } from "react";
import { Sparkles, Activity } from "lucide-react";

interface SanityScoreProps {
  tasksCompleted?: number;
  tasksPlanned?: number;
  studyMinutes?: number;
  streakDays?: number;
  hasMissedDeadlines?: boolean;
}

export function SanityScoreWidget({
  tasksCompleted = 3,
  tasksPlanned = 5,
  studyMinutes = 45,
  streakDays = 4,
  hasMissedDeadlines = false,
}: SanityScoreProps) {
  // Calculate Sanity Score Formula
  const taskPart = (tasksCompleted / Math.max(tasksPlanned, 1)) * 40;
  const studyPart = Math.min(studyMinutes / 120, 1) * 30;
  const streakPart = Math.min(streakDays / 7, 1) * 20;
  const deadlinePart = hasMissedDeadlines ? 0 : 10;

  const rawScore = Math.min(100, Math.round(taskPart + studyPart + streakPart + deadlinePart));

  const [displayScore, setDisplayScore] = useState(0);

  // Animated Count Up
  useEffect(() => {
    let current = 0;
    const increment = Math.max(1, Math.ceil(rawScore / 30));
    const timer = setInterval(() => {
      current += increment;
      if (current >= rawScore) {
        setDisplayScore(rawScore);
        clearInterval(timer);
      } else {
        setDisplayScore(current);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [rawScore]);

  // Determine Tier Color and Status Label
  let strokeColor = "#F9A8D4"; // 0-30 SANITY Pink
  let statusText = "You're losing it.";
  let glowStyle = ""; // Completely flat & clean on dark background — no red shadow

  if (displayScore >= 86) {
    strokeColor = "#F9A8D4"; // 86-100 Soft Pink Glow
    statusText = "Full sanity restored.";
    glowStyle = "shadow-[0_0_30px_rgba(249,168,212,0.3)] border-pink-400/50";
  } else if (displayScore >= 61) {
    strokeColor = "#F9A8D4"; // 61-85 SANITY Baby Pink
    statusText = "In the flow.";
    glowStyle = "";
  } else if (displayScore >= 31) {
    strokeColor = "#F9A8D4"; // 31-60 SANITY Baby Pink
    statusText = "Holding on.";
    glowStyle = "";
  }

  // SVG Circular Math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={`glass rounded-2xl p-5 border transition-all duration-500 relative overflow-hidden flex items-center justify-between gap-6 ${glowStyle}`}>
      {/* Ambient background glow */}
      <div
        className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: strokeColor }}
      />

      <div className="flex items-center gap-4">
        {/* Animated SVG Progress Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Track Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-border"
              strokeWidth="7"
              fill="none"
            />
            {/* Animated Score Ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={strokeColor}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Score Value */}
          <div className="absolute flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-black tabular-nums text-foreground">{displayScore}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">/100</span>
          </div>
        </div>

        {/* Text Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Sanity Score
            </h3>
          </div>
          <p className="text-lg font-extrabold text-foreground tracking-tight">{statusText}</p>
          <p className="text-[11px] text-muted-foreground">
            {tasksCompleted}/{tasksPlanned} tasks done • {studyMinutes}m focus • {streakDays}d streak
          </p>
        </div>
      </div>

      {/* Decorative Sparkles Icon */}
      <div className="hidden sm:flex p-3 rounded-xl border border-border bg-card/40 text-foreground/80">
        <Sparkles className="w-5 h-5 text-accent" />
      </div>
    </div>
  );
}
