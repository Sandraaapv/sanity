import { useEffect, useState, useMemo, useRef } from "react";
import { Search, Plus, StickyNote, Calendar, Folder, Command, CheckSquare } from "lucide-react";
import { api } from "@/lib/api";

type Category = { id: string; name: string; color: string };
type Task = { id: string; title: string; completed: boolean; category_id: string | null };
type Note = { id: string; title: string; content: string; color: string };
type EventRow = { id: string; title: string; starts_at: string; color: string };

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load all items for search index
  const loadIndex = async () => {
    try {
      const [
        { data: cats },
        { data: ts },
        { data: ns },
        { data: evs }
      ] = await Promise.all([
        api.get("/task-categories"),
        api.get("/tasks"),
        api.get("/notes"),
        api.get("/events?from=" + new Date(Date.now() - 30 * 86400000).toISOString() + "&to=" + new Date(Date.now() + 30 * 86400000).toISOString())
      ]);
      setCategories((cats ?? []) as Category[]);
      setTasks((ts ?? []) as Task[]);
      setNotes((ns ?? []) as Note[]);
      setEvents((evs ?? []) as EventRow[]);
    } catch (e) {
      console.error("Failed to load search index", e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setInput("");
        setActiveIndex(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      loadIndex();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const isCommand = input.startsWith("/");

  // Filter items based on non-command search query
  const searchResults = useMemo(() => {
    if (isCommand || !input.trim()) return [];
    const query = input.toLowerCase().trim();
    
    const matchedCats = categories
      .filter((c) => c.name.toLowerCase().includes(query))
      .map((c) => ({ type: "category" as const, id: c.id, label: c.name, subtitle: "Category", color: c.color }));
      
    const matchedTasks = tasks
      .filter((t) => t.title.toLowerCase().includes(query))
      .map((t) => ({ type: "task" as const, id: t.id, label: t.title, subtitle: t.completed ? "Completed Task" : "Active Task", task: t }));

    const matchedNotes = notes
      .filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
      .map((n) => ({ type: "note" as const, id: n.id, label: n.title, subtitle: n.content }));

    const matchedEvents = events
      .filter((ev) => ev.title.toLowerCase().includes(query))
      .map((ev) => ({ type: "event" as const, id: ev.id, label: ev.title, subtitle: new Date(ev.starts_at).toLocaleDateString() }));

    return [...matchedCats, ...matchedTasks, ...matchedNotes, ...matchedEvents].slice(0, 8);
  }, [categories, tasks, notes, events, input, isCommand]);

  // Commands list preview
  const commandPreviews = useMemo(() => {
    if (!isCommand) return [];
    const lower = input.toLowerCase();
    
    const list = [
      { cmd: "/task ", label: "Create task", placeholder: "/task Buy milk", icon: CheckSquare },
      { cmd: "/category ", label: "Create category", placeholder: "/category Personal", icon: Folder },
      { cmd: "/note ", label: "Create quick note", placeholder: "/note Call client", icon: StickyNote },
      { cmd: "/event ", label: "Create agenda event", placeholder: "/event Team sync", icon: Calendar }
    ];

    return list.filter(item => item.cmd.startsWith(lower) || lower.startsWith(item.cmd));
  }, [input, isCommand]);

  const totalItems = isCommand ? commandPreviews.length : searchResults.length;

  const executeCommand = async (cmdItem: typeof commandPreviews[0]) => {
    const args = input.slice(cmdItem.cmd.length).trim();
    if (!args) return;

    try {
      if (cmdItem.cmd === "/task ") {
        let catId = categories[0]?.id;
        if (!catId) {
          // Create default Inbox category if none exist
          const { data: newCat } = await api.post("/task-categories", {
            name: "Inbox",
            color: "#c4b5fd"
          });
          catId = newCat.id;
        }
        await api.post("/tasks", {
          categoryId: catId,
          title: args,
          priority: "medium"
        });
      } else if (cmdItem.cmd === "/category ") {
        await api.post("/task-categories", {
          name: args,
          color: "#fda4af"
        });
      } else if (cmdItem.cmd === "/note ") {
        await api.post("/notes", {
          title: "Quick Note",
          content: args,
          color: "#ffc97a",
          pinned: false
        });
      } else if (cmdItem.cmd === "/event ") {
        const local = new Date();
        local.setHours(9, 0, 0, 0); // 9:00 AM default
        const endLocal = new Date(local.getTime() + 60 * 60 * 1000);
        await api.post("/events", {
          title: args,
          starts_at: local.toISOString(),
          ends_at: endLocal.toISOString(),
          color: "#c4b5fd"
        });
      }

      // Dispatch global refresh event
      window.dispatchEvent(new CustomEvent("workspace-refresh"));
      setOpen(false);
      setInput("");
    } catch (err) {
      console.error("Error executing command", err);
    }
  };

  const executeSearchResult = async (result: typeof searchResults[0]) => {
    if (result.type === "task" && result.task) {
      const nextCompleted = !result.task.completed;
      try {
        await api.put(`/tasks/${result.id}`, { completed: nextCompleted });
        window.dispatchEvent(new CustomEvent("workspace-refresh"));
        setOpen(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + (totalItems || 1)) % (totalItems || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isCommand && commandPreviews[activeIndex]) {
        executeCommand(commandPreviews[activeIndex]);
      } else if (!isCommand && searchResults[activeIndex]) {
        executeSearchResult(searchResults[activeIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-lg bg-[#14121f] border border-border/80 rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 bg-input/20 border border-border/40 rounded-2xl px-4 py-3 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command (e.g. /task Buy milk) or search workspace..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase border border-border/60 rounded px-1.5 py-0.5">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Action Panel / Results */}
        <div className="flex-1 overflow-y-auto max-h-[280px] space-y-1.5 pr-1 scrollbar-thin">
          {/* Command helper items */}
          {isCommand && (
            <>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 mb-1">
                Execute Command (Type text after space and press Enter)
              </div>
              {commandPreviews.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                const matchesExactly = input.startsWith(item.cmd);
                return (
                  <button
                    key={item.cmd}
                    onClick={() => executeCommand(item)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                      active ? "bg-card text-white border-l-2 border-rose-gold" : "text-muted-foreground hover:bg-card/45"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-rose-gold" />
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-muted-foreground/60">{item.placeholder}</span>
                    </div>
                    {matchesExactly && (
                      <span className="text-[10px] bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded px-1.5 py-0.5 font-bold uppercase">
                        Press Enter to Run
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Search results items */}
          {!isCommand && input.trim() && (
            <>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 mb-1">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={item.id + item.type}
                    onClick={() => executeSearchResult(item)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                      active ? "bg-card text-white border-l-2 border-rose-gold" : "text-muted-foreground hover:bg-card/45"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.type === "task" && <CheckSquare className="w-4 h-4 text-rose-gold shrink-0" />}
                      {item.type === "category" && <Folder className="w-4 h-4 text-rose-gold shrink-0" style={{ color: item.color }} />}
                      {item.type === "note" && <StickyNote className="w-4 h-4 text-rose-gold shrink-0" />}
                      {item.type === "event" && <Calendar className="w-4 h-4 text-rose-gold shrink-0" />}
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-white truncate block">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground/75 truncate block">{item.subtitle}</span>
                      </div>
                    </div>
                    {item.type === "task" && (
                      <span className="text-[9px] text-muted-foreground uppercase border border-border/40 rounded px-1 py-0.5 whitespace-nowrap">
                        Press Enter to Toggle
                      </span>
                    )}
                  </button>
                );
              })}
              {searchResults.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No matches found for "{input}"
                </div>
              )}
            </>
          )}

          {/* Initial landing state commands info list */}
          {!input.trim() && (
            <div className="p-2 space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Command Presets (Type "/" to list)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Create task", shortcut: "/task ", desc: "/task Buy bread" },
                  { label: "Create category", shortcut: "/category ", desc: "/category Personal" },
                  { label: "Create note", shortcut: "/note ", desc: "/note Remember ideas" },
                  { label: "Create event", shortcut: "/event ", desc: "/event Sync today" }
                ].map((item) => (
                  <button
                    key={item.shortcut}
                    onClick={() => {
                      setInput(item.shortcut);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="p-3 text-left rounded-xl border border-border bg-card/20 hover:border-rose-gold/60 transition group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-rose-gold">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
