import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, Pin, Search } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#FFFFFF', isPinned: false });

  const colors = ['#FFFFFF', '#F28B82', '#FBBC04', '#FFF475', '#CCFF90', '#A7FFEB', '#CBF0F8', '#D7AEFB'];

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/api/notes');
      setNotes(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    try {
      const res = await api.post('/api/notes', newNote);
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '', color: '#FFFFFF', isPinned: false });
    } catch (err) { console.error(err); }
  };

  const handleTogglePin = async (note) => {
    try {
      const updated = { ...note, isPinned: !note.isPinned };
      const res = await api.put(`/api/notes/${note.id}`, updated);
      setNotes(notes.map(n => n.id === note.id ? res.data : n));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Google Keep Workspace</h1>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text" placeholder="Search notes..."
            className="w-full bg-white dark:bg-slate-800 pl-9 pr-4 py-2 border rounded-lg text-sm dark:text-white dark:border-slate-700"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm max-w-xl mx-auto mb-8 border border-slate-200 dark:border-slate-700">
        <input
          type="text" placeholder="Title"
          className="w-full font-semibold mb-2 focus:outline-none bg-transparent dark:text-white"
          value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })}
        />
        <textarea
          placeholder="Take a note..." rows="3"
          className="w-full text-sm focus:outline-none resize-none bg-transparent dark:text-white"
          value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })}
        />
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex gap-1.5">
            {colors.map(c => (
              <button
                key={c} type="button" onClick={() => setNewNote({ ...newNote, color: c })}
                className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700">
            Save
          </button>
        </div>
      </form>

      {pinnedNotes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pinned</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinnedNotes.map(n => <NoteCard key={n.id} note={n} onTogglePin={handleTogglePin} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      <div>
        {pinnedNotes.length > 0 && <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Others</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {otherNotes.map(n => <NoteCard key={n.id} note={n} onTogglePin={handleTogglePin} onDelete={handleDelete} />)}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, onTogglePin, onDelete }) {
  return (
    <div className="p-4 rounded-xl shadow-sm border relative flex flex-col justify-between group transition-shadow hover:shadow-md" style={{ backgroundColor: note.color || '#FFFFFF' }}>
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-slate-900">{note.title || 'Untitled'}</h3>
          <button onClick={() => onTogglePin(note)} className={`text-slate-400 hover:text-slate-900 ${note.isPinned ? 'text-blue-600' : ''}`}>
            <Pin className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
      </div>
      <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onDelete(note.id)} className="text-slate-400 hover:text-red-500">
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}