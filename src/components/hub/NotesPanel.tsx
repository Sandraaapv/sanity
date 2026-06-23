import { useEffect, useMemo, useState } from "react";
import { Pin, PinOff, Plus, Search, Trash2, Pencil, Star, X } from "lucide-react";
import { api } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt?: string;
};

const NOTE_COLORS = [
  { name: "Yellow", value: "#ffc97a", text: "#3c2f17" },
  { name: "Orange", value: "#ff9b73", text: "#4a2312" },
  { name: "Green", value: "#e4f9b4", text: "#2e3a14" },
  { name: "Lavender", value: "#c4b5fd", text: "#281745" },
  { name: "Blue", value: "#a5d8ff", text: "#162e45" },
];

function getNoteStyle(colorVal: string) {
  // Gracefully map legacy oklch colors or empty values to the new pastel colors
  const val = (colorVal || "").toLowerCase();
  if (val.includes("264")) return { bg: "#ffc97a", text: "#3c2f17" }; // Charcoal mapped to Yellow
  if (val.includes("65")) return { bg: "#ff9b73", text: "#4a2312" };  // Amber mapped to Orange
  if (val.includes("305")) return { bg: "#c4b5fd", text: "#281745" }; // Lavender mapped to Lavender
  if (val.includes("20")) return { bg: "#ff9b73", text: "#4a2312" };  // Rose mapped to Orange
  if (val.includes("150")) return { bg: "#e4f9b4", text: "#2e3a14" }; // Sage mapped to Green

  // Match custom Hex colors
  const mapped = NOTE_COLORS.find((c) => c.value.toLowerCase() === val);
  if (mapped) return { bg: mapped.value, text: mapped.text };

  // Fallback to Yellow if invalid
  if (!colorVal || !colorVal.startsWith("#")) {
    return { bg: "#ffc97a", text: "#3c2f17" };
  }

  return { bg: colorVal, text: "#1a1a1a" };
}

const formatDate = (isoStr?: string) => {
  if (!isoStr) {
    // Return today's date formatted if createdAt is missing
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ title: "", content: "", color: NOTE_COLORS[0].value });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

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
    return notes.filter(
      (n) =>
        !s ||
        n.title.toLowerCase().includes(s) ||
        n.content.toLowerCase().includes(s)
    );
  }, [notes, q]);

  const pinned = useMemo(() => filtered.filter((n) => n.pinned), [filtered]);
  const others = useMemo(() => filtered.filter((n) => !n.pinned), [filtered]);

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
      setDraft({ title: "", content: "", color: NOTE_COLORS[0].value });
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const update = async () => {
    if (!editingNote) return;
    try {
      const { data } = await api.put(`/notes/${editingNote.id}`, {
        title: editingNote.title.trim() || "Untitled",
        content: editingNote.content,
        color: editingNote.color,
        pinned: editingNote.pinned,
      });
      setNotes((p) => p.map((n) => (n.id === editingNote.id ? (data as Note) : n)));
      setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening editing modal
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

  const renderNoteCard = (n: Note) => {
    const style = getNoteStyle(n.color);
    return (
      <div
        key={n.id}
        onClick={() => setEditingNote(n)}
        style={{ backgroundColor: style.bg }}
        className="relative rounded-3xl p-6 min-h-[190px] aspect-square flex flex-col justify-between shadow-sm border border-black/5 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer select-none"
      >
        {/* Star Pin Button */}
        <button
          onClick={(e) => togglePin(n.id, e)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="pin note"
        >
          <Star
            className={`w-3.5 h-3.5 ${
              n.pinned ? "text-amber-400 fill-amber-400" : "text-white"
            }`}
          />
        </button>

        {/* Note Body */}
        <div className="pr-4 pt-2">
          <h4
            style={{ color: style.text }}
            className="font-black text-sm/snug tracking-tight mb-2 line-clamp-2"
          >
            {n.title}
          </h4>
          <p
            style={{ color: style.text, opacity: 0.85 }}
            className="text-xs/relaxed line-clamp-4 font-semibold"
          >
            {n.content}
          </p>
        </div>

        {/* Footer info: Date & Edit Button */}
        <div className="flex items-center justify-between mt-4">
          <span
            style={{ color: style.text, opacity: 0.6 }}
            className="text-[10px] font-bold tracking-wider"
          >
            {formatDate(n.createdAt)}
          </span>
          <div
            className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <Pencil className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 min-h-[500px]">
      {/* LEFT SIDEBAR PANEL */}
      <div className="flex md:flex-col items-center justify-between md:justify-start md:py-4 gap-6 md:w-20 md:border-r border-border/40 shrink-0">
        <div className="flex md:flex-col items-center gap-4">
          <button
            onClick={() => {
              setDraft({ title: "", content: "", color: NOTE_COLORS[0].value });
              setIsCreateModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
            title="Create new note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-8">
        {/* TOP SEARCH & HEADING ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Notes
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm outline-none focus:border-lavender/60 transition-all text-foreground"
            />
          </div>
        </div>

        {/* NOTES GRID SECTIONS */}
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Pinned</p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pinned.map((n) => renderNoteCard(n))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">
              {pinned.length ? "Others" : "All notes"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {others.map((n) => renderNoteCard(n))}
              {others.length === 0 && pinned.length === 0 && (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground/60 italic select-none">
                  No notes yet. Tap the '+' button in the sidebar to create one!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NOTE MODAL */}
      {isCreateModalOpen && (
        <NoteModal
          title="Create Note"
          note={draft}
          onChange={(updates) => setDraft((p) => ({ ...p, ...updates }))}
          onSave={add}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <NoteModal
          title="Edit Note"
          note={editingNote}
          onChange={(updates) => setEditingNote((p) => (p ? { ...p, ...updates } : null))}
          onSave={update}
          onClose={() => setEditingNote(null)}
          onDelete={() => {
            remove(editingNote.id);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

interface NoteModalProps {
  title: string;
  note: { title: string; content: string; color: string };
  onChange: (updates: Partial<{ title: string; content: string; color: string }>) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

function NoteModal({ title, note, onChange, onSave, onClose, onDelete }: NoteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#14121f] border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col gap-4 text-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="font-extrabold tracking-tight text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-card/60 text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Title
            </label>
            <input
              required
              value={note.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Shopping List, Study schedule"
              className="w-full bg-input/20 border border-border/40 rounded-2xl px-4 py-2.5 outline-none focus:border-lavender/60 text-foreground text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Content
            </label>
            <textarea
              required
              value={note.content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="Write your note contents here..."
              className="w-full bg-input/20 border border-border/40 rounded-2xl px-4 py-3 outline-none focus:border-lavender/60 text-foreground text-sm h-32 resize-none"
            />
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {NOTE_COLORS.map((c) => {
                const isSelected = note.color.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onChange({ color: c.value })}
                    style={{ backgroundColor: c.value }}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      isSelected ? "border-white scale-110 shadow-md" : "border-transparent hover:scale-105"
                    }`}
                    title={c.name}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 border-t border-border/40 pt-4">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}

          <button
            onClick={onSave}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#1a1a1a] shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-200 ml-auto"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
