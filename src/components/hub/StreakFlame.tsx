import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface StreakData {
  lastActiveDate: string;
  count: number;
}

export function StreakFlame() {
  const [streak, setStreak] = useState<number>(1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayStr = new Date().toISOString().split("T")[0];
    const saved = localStorage.getItem("sanity_streak");

    if (saved) {
      try {
        const parsed: StreakData = JSON.parse(saved);
        const lastDate = new Date(parsed.lastActiveDate);
        const todayDate = new Date(todayStr);

        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Continuous streak
          setStreak(parsed.count);
        } else if (diffDays === 0) {
          // Same day
          setStreak(parsed.count);
        } else {
          // Streak broken
          setStreak(1);
          localStorage.setItem(
            "sanity_streak",
            JSON.stringify({ lastActiveDate: todayStr, count: 1 })
          );
        }
      } catch {
        setStreak(1);
      }
    } else {
      localStorage.setItem(
        "sanity_streak",
        JSON.stringify({ lastActiveDate: todayStr, count: 1 })
      );
      setStreak(1);
    }
  }, []);

  // Flame Intensity Level: 0 = extinguished, 1-6 = gentle, 7-13 = medium, 14+ = intense
  const isExtinguished = streak === 0;
  const isGentle = streak >= 1 && streak <= 6;
  const isMedium = streak >= 7 && streak <= 13;
  const isIntense = streak >= 14;

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-md shadow-sm transition hover:scale-105 select-none"
      title={`Current Streak: ${streak} days`}
    >
      {isExtinguished ? (
        <div className="relative flex items-center justify-center">
          <Flame className="w-4 h-4 text-muted-foreground opacity-40" />
          <span className="absolute -top-1 w-1 h-3 bg-muted-foreground/30 rounded-full blur-[1px] animate-pulse" />
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Animated SVG Layered Flame */}
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isGentle ? "scale-90 animate-pulse" : isMedium ? "scale-105" : "scale-125"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            {/* Outer Glow Path */}
            <path
              d="M12 2C10.5 4 8 7 8 11C8 16 11 20 16 21C18.5 19.5 20 16.5 20 13.5C20 9 16 5 12 2Z"
              fill="#F9A8D4"
              className="animate-pulse"
            />
            {/* Mid Flame */}
            <path
              d="M12 6C11 7.5 9.5 9.5 9.5 12.5C9.5 16 11.5 18.5 15 19C16.5 18 17.5 16 17.5 14C17.5 11 14.5 8 12 6Z"
              fill="#E9D5FF"
            />
            {/* Inner Core */}
            <path
              d="M12 11C11.5 12 10.8 13.2 10.8 14.8C10.8 16.8 12 18.2 14 18.5C14.8 17.8 15.2 16.8 15.2 15.6C15.2 13.8 13.5 12.2 12 11Z"
              fill="#ffffff"
            />
          </svg>

          {/* Floating Embers for Intense Streak (14+ days) */}
          {isIntense && (
            <>
              <span className="absolute -top-2 left-1 w-1 h-1 rounded-full bg-amber-300 animate-ember" />
              <span
                className="absolute -top-3 right-1 w-1 h-1 rounded-full bg-orange-400 animate-ember"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}
        </div>
      )}

      <div className="flex flex-col leading-none">
        <span className="text-xs font-black text-foreground tabular-nums">{streak}d</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
          Streak
        </span>
      </div>
    </div>
  );
}
