import { useEffect, useState } from "react";
import { Sparkles, Sun, Moon, Sunset, Check } from "lucide-react";

interface MorningIntentProps {
  userName?: string;
}

export function MorningIntentModal({ userName = "Friend" }: MorningIntentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [intentInput, setIntentInput] = useState("");
  const [savedIntent, setSavedIntent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayStr = new Date().toISOString().split("T")[0];
    const savedDate = localStorage.getItem("sanity_intent_date");
    const storedIntent = localStorage.getItem("sanity_daily_intent");

    if (storedIntent && savedDate === todayStr) {
      setSavedIntent(storedIntent);
    } else if (savedDate !== todayStr) {
      // First open of the day!
      setIsOpen(true);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentInput.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("sanity_daily_intent", intentInput.trim());
    localStorage.setItem("sanity_intent_date", todayStr);

    setSavedIntent(intentInput.trim());
    setIsOpen(false);
  };

  // Time of day greeting calculation
  const hour = new Date().getHours();
  let timeGreeting = "Good morning";
  let TimeIcon = Sun;

  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
    TimeIcon = Sunset;
  } else if (hour >= 17) {
    timeGreeting = "Good evening";
    TimeIcon = Moon;
  }

  return (
    <>
      {/* Pinned Dashboard Intention Banner */}
      {savedIntent && (
        <div className="glass rounded-xl px-4 py-2.5 mb-6 border border-accent/30 bg-accent/5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs text-foreground">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
              Today's Intention:
            </span>
            <span className="font-semibold italic">"{savedIntent}"</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-2 transition"
          >
            Edit
          </button>
        </div>
      )}

      {/* Full-Screen Morning Prompt Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl glass rounded-3xl p-8 sm:p-10 border border-border shadow-2xl relative text-center space-y-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl border border-border bg-card/60 text-accent mb-2">
              <TimeIcon className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {timeGreeting}, {userName}.
              </h2>
              <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
                What's the one thing that would make today a win?
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pt-4">
              <input
                type="text"
                autoFocus
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                placeholder="e.g. Finish the API specification..."
                className="w-full bg-transparent border-b-2 border-border focus:border-accent text-lg sm:text-xl font-bold py-2 text-center text-foreground outline-none transition placeholder:text-muted-foreground/40 placeholder:font-normal"
              />

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={!intentInput.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg disabled:opacity-40 hover:opacity-90 transition inline-flex items-center gap-2"
                  style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
                >
                  Set Intention <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
