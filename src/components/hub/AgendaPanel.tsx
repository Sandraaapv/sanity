import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock } from "lucide-react";
import { api } from "@/lib/api";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day?: boolean;
  color: string;
};

const palette = ["#e8b4b8", "#c4b5fd", "#a7f3d0", "#fcd34d", "#93c5fd", "#fda4af"];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AgendaPanel() {
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<Date>(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    starts: "",
    ends: "",
    allDay: true,
    color: palette[1],
  });

  const load = async () => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 1).toISOString();
    try {
      const { data } = await api.get("/events", {
        params: { from, to }
      });
      setEvents((data ?? []) as EventRow[]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => {
    const handleRefresh = () => {
      load();
    };
    window.addEventListener("workspace-refresh", handleRefresh);
    return () => {
      window.removeEventListener("workspace-refresh", handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    events.forEach((e) => {
      const d = new Date(e.starts_at);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    });
    return map;
  }, [events]);

  const todayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const today = new Date();

  const openCreate = (d?: Date) => {
    const base = d ?? selected;
    const isoDate = (dd: Date) =>
      new Date(dd.getTime() - dd.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    setForm({
      title: "",
      description: "",
      starts: isoDate(base),
      ends: isoDate(base),
      allDay: true,
      color: palette[1],
    });
    if (d) setSelected(d);
    setShowCreate(true);
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.starts) return;
    try {
      let startsAtStr = "";
      let endsAtStr: string | null = null;

      if (form.allDay) {
        const [year, month, day] = form.starts.split("-").map(Number);
        startsAtStr = new Date(year, month - 1, day, 0, 0, 0).toISOString();
        if (form.ends) {
          const [ey, em, ed] = form.ends.split("-").map(Number);
          endsAtStr = new Date(ey, em - 1, ed, 23, 59, 59).toISOString();
        }
      } else {
        startsAtStr = new Date(form.starts).toISOString();
        endsAtStr = form.ends ? new Date(form.ends).toISOString() : null;
      }

      const { data } = await api.post("/events", {
        title: form.title.trim(),
        description: form.description.trim() || null,
        starts_at: startsAtStr,
        ends_at: endsAtStr,
        all_day: form.allDay,
        color: form.color,
      });
      setEvents((p) => [...p, data as EventRow]);
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      setEvents((p) => p.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEvents = (eventsByDay.get(todayKey(selected)) ?? []).sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* MONTHLY CALENDAR */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {cursor.toLocaleDateString([], { year: "numeric" })}
            </p>
            <h3 className="text-2xl font-semibold tracking-tight">
              {cursor.toLocaleDateString([], { month: "long" })}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="p-2 rounded-lg border border-border hover:border-foreground/30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="px-3 py-2 rounded-lg border border-border text-[11px] uppercase tracking-wider hover:border-foreground/30"
            >
              Today
            </button>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="p-2 rounded-lg border border-border hover:border-foreground/30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          {DOW.map((d) => (
            <div key={d} className="px-2 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = sameDay(d, today);
            const isSelected = sameDay(d, selected);
            const list = eventsByDay.get(todayKey(d)) ?? [];
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                onDoubleClick={() => openCreate(d)}
                className={`relative aspect-square sm:aspect-[1.1/1] rounded-xl border p-1.5 sm:p-2 text-left transition flex flex-col ${
                  isSelected
                    ? "border-rose-gold/60 bg-card gradient-border-glow"
                    : "border-border bg-card/40 hover:border-foreground/20"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                <span
                  className={`text-[11px] tabular-nums leading-none ${
                    isToday
                      ? "inline-grid place-items-center w-5 h-5 rounded-full text-[#1a1a1a] font-semibold"
                      : "text-foreground/80"
                  }`}
                  style={isToday ? { backgroundImage: "var(--gradient-accent)" } : {}}
                >
                  {d.getDate()}
                </span>
                <div className="mt-auto space-y-0.5 w-full overflow-hidden">
                  {list.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="text-[9px] sm:text-[10px] truncate rounded px-1 py-0.5"
                      style={{ background: `${e.color}33`, color: e.color }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {list.length > 2 && (
                    <div className="text-[9px] text-muted-foreground">+{list.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL: SELECTED DAY */}
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {selected.toLocaleDateString([], { weekday: "long" })}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-semibold tracking-tight">
              {selected.toLocaleDateString([], { month: "short", day: "numeric" })}
            </h3>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
            >
              <Plus className="w-3.5 h-3.5" /> Event
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {selectedEvents.map((e) => (
            <li
              key={e.id}
              className="group rounded-2xl border border-border bg-card p-4 relative overflow-hidden"
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: e.color }}
              />
              <div className="pl-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{e.title}</p>
                  <button
                    onClick={() => deleteEvent(e.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {!e.all_day && (
                  <div className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(e.starts_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {e.ends_at &&
                      ` – ${new Date(e.ends_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </div>
                )}
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-2">{e.description}</p>
                )}
              </div>
            </li>
          ))}
          {selectedEvents.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Nothing scheduled. Double-click any day to add.
            </li>
          )}
        </ul>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowCreate(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveEvent}
            className="glass rounded-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">New event</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Event title"
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Notes"
              rows={2}
              className="w-full bg-input/40 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-gold/60 resize-none"
            />
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="allDay"
                checked={form.allDay}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setForm((p) => {
                    let nextStarts = p.starts;
                    let nextEnds = p.ends;
                    if (isChecked) {
                      if (p.starts.includes("T")) nextStarts = p.starts.split("T")[0];
                      if (p.ends.includes("T")) nextEnds = p.ends.split("T")[0];
                    } else {
                      if (!p.starts.includes("T")) nextStarts = `${p.starts}T09:00`;
                      if (!p.ends.includes("T")) nextEnds = `${p.ends}T10:00`;
                    }
                    return { ...p, allDay: isChecked, starts: nextStarts, ends: nextEnds };
                  });
                }}
                className="w-4 h-4 rounded border-border bg-input/40 text-foreground cursor-pointer"
              />
              <label htmlFor="allDay" className="text-xs text-muted-foreground cursor-pointer select-none">
                All-day event (no specific time)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Starts
                </span>
                <input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.starts}
                  onChange={(e) => setForm((p) => ({ ...p, starts: e.target.value }))}
                  className="mt-1 w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ends
                </span>
                <input
                  type={form.allDay ? "date" : "datetime-local"}
                  value={form.ends}
                  onChange={(e) => setForm((p) => ({ ...p, ends: e.target.value }))}
                  className="mt-1 w-full bg-input/40 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-gold/60"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Color
              </span>
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={`w-5 h-5 rounded-full border ${
                    form.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground" : ""
                  }`}
                  style={{ background: c, borderColor: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundImage: "var(--gradient-accent)", color: "#1a1a1a" }}
            >
              Save event
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
