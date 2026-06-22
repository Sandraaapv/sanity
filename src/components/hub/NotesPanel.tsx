import { useEffect, useMemo, useState } from "react";
import { Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type Note = { id: string; title: string; content: string; color: string; pinned: boolean };

const palette = [
  { name: "Charcoal", value: "oklch(0.16 0.005 264)" },
  { name: "Amber", value: "oklch(0.32 0.05 65)" },
  { name: "Lavender", value: "oklch(0.32 0.05 305)" },
  { name: "Rose", value: "oklch(0.32 0.06 20)" },
  { name: "Sage", value: "oklch(0.3 0.04 150)" },
];

export function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ title: "", content: "", color: palette[0].value });

  const load = async () => {
    try {
      const { data } = await api.get("/notes");
      setNotes((data ?? []) as Note[]);
    } catch (err) {
      console.error(err);
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

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return notes.filter((n) => !s || n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s));
  }, [notes, q]);
  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  const add = async () => {
    if (!draft.title.trim() && !draft.content.trim()) return;
    try {
      const { data } = await api.post("/notes", {
        title: draft.title.trim() || "Untitled",
        content: draft.content.trim(),
        color: draft.color,
        pinned: false,
      });
      setNotes((p) => [data as Note, ...p]);
      setDraft({ title: "", content: "", color: draft.color });
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const nextPinned = !note.pinned;
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, pinned: nextPinned } : n)));
    try {
      await api.put(`/notes/${id}`, { pinned: nextPinned });
    } catch (err) {
      setNotes((p) => p.map((n) => (n.id === id ? { ...n, pinned: note.pinned } : n)));
    }
  };

  const remove = async (id: string) => {
    setNotes((p) => p.filter((n) => n.id !== id));
    try {
      await api.delete(`/notes/${id}`);
    } catch (err) {
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
        <div className="glass rounded-2xl p-4 flex-1 space-y-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
            placeholder="Take a note..."
            rows={2}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {palette.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setDraft((p) => ({ ...p, color: c.value }))}
                  className={`w-5 h-5 rounded-full border transition ${draft.color === c.value ? "ring-2 ring-rose-gold ring-offset-2 ring-offset-background" : "border-border"}`}
                  style={{ background: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
            <button onClick={add} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-rose-gold/60">
              <Plus className="w-3.5 h-3.5" /> Add note
            </button>
          </div>
        </div>
        <div className="relative lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm outline-none focus:border-rose-gold/60"
          />
        </div>
      </div>

      {pinned.length > 0 && (
        <Section label="Pinned" notes={pinned} onPin={togglePin} onRemove={remove} />
      )}
      <Section label={pinned.length ? "Others" : "All notes"} notes={others} onPin={togglePin} onRemove={remove} />
    </div>
  );
}

function Section({ label, notes, onPin, onRemove }: { label: string; notes: Note[]; onPin: (id: string) => void; onRemove: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {notes.map((n) => (
          <div
            key={n.id}
            className="group relative rounded-2xl p-4 border border-border text-sm transition hover:-translate-y-0.5 hover:border-foreground/20"
            style={{ background: n.color, color: "oklch(0.95 0 0)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{n.title}</p>
              <button onClick={() => onPin(n.id)} className="text-white/60 hover:text-white" aria-label="pin">
                {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs/relaxed text-white/75">{n.content}</p>
            <button
              onClick={() => onRemove(n.id)}
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition text-white/60 hover:text-white"
              aria-label="delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {notes.length === 0 && <div className="col-span-full text-xs text-muted-foreground">No notes.</div>}
      </div>
    </div>
  );
}
