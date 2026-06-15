import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, Pin, Search, FileText } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#1E293B', isPinned: false });

  const colors = [
    { value: '#1E293B', label: 'Default', bg: 'rgba(30, 41, 59, 0.25)', border: 'border-neutral-800/80' },
    { value: '#EF4444', label: 'Red', bg: 'rgba(239, 68, 68, 0.12)', border: 'border-red-500/25' },
    { value: '#F97316', label: 'Orange', bg: 'rgba(249, 115, 22, 0.12)', border: 'border-orange-500/25' },
    { value: '#EAB308', label: 'Yellow', bg: 'rgba(234, 179, 8, 0.12)', border: 'border-yellow-500/25' },
    { value: '#22C55E', label: 'Green', bg: 'rgba(34, 197, 94, 0.12)', border: 'border-green-500/25' },
    { value: '#14B8A6', label: 'Teal', bg: 'rgba(20, 184, 166, 0.12)', border: 'border-teal-500/25' },
    { value: '#3B82F6', label: 'Blue', bg: 'rgba(59, 130, 246, 0.12)', border: 'border-blue-500/25' },
    { value: '#A855F7', label: 'Purple', bg: 'rgba(168, 85, 247, 0.12)', border: 'border-purple-500/25' },
  ];

  useEffect(() => { 
    fetchNotes(); 
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/api/notes');
      setNotes(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    try {
      const res = await api.post('/api/notes', newNote);
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '', color: '#1E293B', isPinned: false });
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

  const getCardStyle = (colorVal) => {
    const config = colors.find(c => c.value.toLowerCase() === colorVal.toLowerCase());
    return config ? { backgroundColor: config.bg, borderColor: config.border } : { backgroundColor: 'rgba(30, 41, 59, 0.25)', borderColor: 'border-neutral-800/80' };
  };

  const getCardBorderClass = (colorVal) => {
    const config = colors.find(c => c.value.toLowerCase() === colorVal.toLowerCase());
    return config ? config.border : 'border-neutral-800/80';
  };

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Notes</h1>
            <p className="text-neutral-400 text-sm mt-0.5">Capture your quick thoughts and pin important logs.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
          <input
            type="text" placeholder="Search notes..."
            className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-neutral-800/80 max-w-xl mx-auto mb-8 shadow-xl">
        <input
          type="text" placeholder="Title"
          className="w-full font-bold mb-2 focus:outline-none bg-transparent text-white text-base placeholder-neutral-500"
          value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })}
        />
        <textarea
          placeholder="Take a note..." rows="3"
          className="w-full text-sm focus:outline-none resize-none bg-transparent text-neutral-300 placeholder-neutral-500"
          value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })}
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-800/60">
          <div className="flex gap-1.5">
            {colors.map(c => (
              <button
                key={c.value} type="button" 
                onClick={() => setNewNote({ ...newNote, color: c.value })}
                className={`w-5 h-5 rounded-full border transition-all ${newNote.color === c.value ? 'border-white scale-110 shadow' : 'border-neutral-700/60 hover:scale-105'}`} 
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-500/10"
          >
            Save Note
          </button>
        </div>
      </form>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Pinned</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinnedNotes.map(n => (
              <NoteCard 
                key={n.id} note={n} 
                onTogglePin={handleTogglePin} 
                onDelete={handleDelete}
                getStyle={getCardStyle}
                getBorderClass={getCardBorderClass}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      <div className="space-y-3 pt-4">
        {pinnedNotes.length > 0 && <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Others</h2>}
        {filteredNotes.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-neutral-800/80 text-center max-w-xl mx-auto">
            <p className="text-neutral-500 text-sm font-medium">No notes recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherNotes.map(n => (
              <NoteCard 
                key={n.id} note={n} 
                onTogglePin={handleTogglePin} 
                onDelete={handleDelete}
                getStyle={getCardStyle}
                getBorderClass={getCardBorderClass}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onTogglePin, onDelete, getStyle, getBorderClass }) {
  const cardStyle = getStyle(note.color || '#1E293B');
  const borderClass = getBorderClass(note.color || '#1E293B');
  return (
    <div 
      className={`p-4 rounded-xl border relative flex flex-col justify-between group transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${borderClass}`}
      style={{ backgroundColor: cardStyle.backgroundColor }}
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-neutral-100">{note.title || 'Untitled'}</h3>
          <button 
            onClick={() => onTogglePin(note)} 
            className={`text-neutral-500 hover:text-white transition-colors ${note.isPinned ? 'text-blue-400 hover:text-blue-300' : ''}`}
            title={note.isPinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
      </div>
      <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button 
          onClick={() => onDelete(note.id)} 
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
          title="Delete Note"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}