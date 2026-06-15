import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, Pin, Search, FileText, Settings, ListFilter, LayoutGrid, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#141026', category: 'General', isPinned: false });
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const defaultCategories = ['General', 'Hackathons', 'Ideas', 'Personal', 'Work'];

  useEffect(() => { 
    fetchNotes(); 
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/api/notes');
      setNotes(res.data);

      // Auto-expand all categories on load
      const cats = Array.from(new Set(res.data.map(n => n.category || 'General')));
      const initialExpanded = {};
      cats.forEach(c => { initialExpanded[c] = true; });
      setExpandedGroups(initialExpanded);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() && !newNote.content.trim()) return;

    try {
      const payload = {
        ...newNote,
        category: newNote.category.trim() || 'General'
      };
      const res = await api.post('/api/notes', payload);
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '', color: '#141026', category: 'General', isPinned: false });
      setNewCatName('');
      setIsCreatingCat(false);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const updated = { ...note, isPinned: !note.isPinned };
      const res = await api.put(`/api/notes/${note.id}`, updated);
      setNotes(notes.map(n => n.id === note.id ? res.data : n));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) { 
      console.error(err); 
    }
  };

  const toggleGroupExpand = (cat) => {
    setExpandedGroups({ ...expandedGroups, [cat]: !expandedGroups[cat] });
  };

  const formatNoteDate = (createdAtStr) => {
    if (!createdAtStr) return 'Recently';
    const date = new Date(createdAtStr);
    const day = date.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} • ${hours}:${minutes}`;
  };

  // Grouping Logic
  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const notesMap = filteredNotes.reduce((acc, note) => {
    const cat = note.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(note);
    return acc;
  }, {});

  // Make sure default empty categories are initialized
  defaultCategories.forEach(cat => {
    if (!notesMap[cat]) {
      notesMap[cat] = [];
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Rebuilt Mockup Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
            Notes <ChevronDown className="w-5 h-5 text-neutral-400 stroke-[3px]" />
          </h1>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          <button className="p-1 hover:text-white transition-colors" title="Sort notes"><ListFilter className="w-5 h-5" /></button>
          <button className="p-1 hover:text-white transition-colors" title="Grid/List view"><LayoutGrid className="w-5 h-5" /></button>
          <button className="p-1 hover:text-white transition-colors" title="Note settings"><Settings className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Search notes mockup box */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-4 top-3.5 text-neutral-500" />
        <input
          type="text" placeholder="Search notes..."
          className="w-full bg-theme-surface border border-white/5 pl-11 pr-4 py-3 rounded-xl text-xs placeholder-neutral-500 text-neutral-200 focus:outline-none focus:border-theme-purple/50"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Note Creator editor form */}
      <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 max-w-xl mx-auto shadow-xl">
        <input
          type="text" placeholder="Title"
          className="w-full font-extrabold focus:outline-none bg-transparent text-white text-sm placeholder-neutral-500"
          value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })}
        />
        <textarea
          placeholder="Take a note..." rows="3"
          className="w-full text-xs focus:outline-none resize-none bg-transparent text-neutral-300 placeholder-neutral-500 leading-relaxed"
          value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-white/5">
          <div className="flex gap-2 items-center">
            {/* Category selection */}
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Folder</span>
            <select
              className="glass-input rounded-xl px-2 py-1 text-[11px] font-bold"
              value={newNote.category}
              onChange={e => setNewNote({ ...newNote, category: e.target.value })}
            >
              {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              <option value="Custom">Create Custom...</option>
            </select>
          </div>

          {/* Custom Category Input Option */}
          {newNote.category === 'Custom' && (
            <input
              type="text" placeholder="Custom category name..." required
              className="glass-input rounded-xl px-3 py-1 text-xs"
              value={newCatName}
              onChange={e => {
                setNewCatName(e.target.value);
                setNewNote({ ...newNote, category: e.target.value });
              }}
            />
          )}

          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setNewNote({ ...newNote, isPinned: !newNote.isPinned })}
              className={`p-2 border rounded-xl text-xs font-semibold ${newNote.isPinned ? 'bg-theme-purple/10 text-theme-purple border-theme-purple/20' : 'border-white/5 text-neutral-400 hover:text-white'}`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button 
              type="submit" 
              className="bg-purple-gradient text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Save Note
            </button>
          </div>
        </div>
      </form>

      {/* Grouped lists of notes (mocking user layout screenshots) */}
      <div className="space-y-6 pt-4">
        {Object.entries(notesMap).map(([groupName, groupNotes]) => {
          const isExpanded = expandedGroups[groupName] ?? true;
          const noteCount = groupNotes.length;

          return (
            <div key={groupName} className="space-y-3">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between cursor-pointer select-none group/header"
                onClick={() => toggleGroupExpand(groupName)}
              >
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-black uppercase tracking-wider text-theme-purple/90 font-sans">
                    {groupName} <span className="text-neutral-500">({noteCount})</span>
                  </h2>
                  <span className="text-neutral-500 text-xs">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </div>
                
                <button className="text-neutral-500 hover:text-neutral-300 opacity-0 group-hover/header:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Note Cards */}
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
                  {groupNotes.map(note => (
                    <div 
                      key={note.id}
                      className="bg-theme-surface border border-white/5 hover:border-theme-purple/25 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl hover:shadow-theme-purple/5 transition-all duration-200 group relative"
                    >
                      {/* Pinned Indicator / Trigger */}
                      <button 
                        onClick={() => handleTogglePin(note)}
                        className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                          note.isPinned 
                            ? 'text-theme-purple bg-theme-purple/10' 
                            : 'text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100'
                        }`}
                        title={note.isPinned ? "Unpin note" : "Pin note"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-2.5">
                        {/* Modified Date */}
                        <div className="text-[10px] text-neutral-500 font-bold tracking-wide">
                          {formatNoteDate(note.createdAt)}
                        </div>
                        
                        {/* Title */}
                        {note.title && (
                          <h3 className="font-extrabold text-white text-sm tracking-wide leading-tight">
                            {note.title}
                          </h3>
                        )}
                        
                        {/* Content body */}
                        <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>

                      {/* Trash action */}
                      <div className="flex justify-end mt-4 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete Note"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {groupNotes.length === 0 && (
                    <p className="text-[11px] text-neutral-500 font-medium py-1 col-span-full">No notes in this folder yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}