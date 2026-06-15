import React, { useState, useEffect } from 'react';
import api from '../api';
import { ChevronDown, ChevronUp, Edit3, Trash, Plus, ListTodo, PlusCircle, Check, X, Tag } from 'lucide-react';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  
  // Inline task inputs mapped by category name
  const [inlineInputs, setInlineInputs] = useState({});
  
  // Editing Category name state
  const [editingCat, setEditingCat] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  const defaultCategories = ['General', 'Study', 'Shopping', 'Work', 'Personal'];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await api.get('/api/todos');
      setTodos(res.data);
      
      // Auto-expand all categories on load
      const cats = Array.from(new Set(res.data.map(t => t.category || 'General')));
      const initialExpanded = {};
      cats.forEach(c => { initialExpanded[c] = true; });
      setExpandedCats(initialExpanded);
    } catch (err) {
      console.error("Error pulling todos", err);
    }
  };

  const handleToggle = async (todo) => {
    try {
      const updated = { ...todo, completed: !todo.completed };
      const res = await api.put(`/api/todos/${todo.id}`, updated);
      setTodos(todos.map(t => t.id === todo.id ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Create task directly inside a category
  const handleInlineCreate = async (e, categoryName) => {
    e.preventDefault();
    const taskTitle = inlineInputs[categoryName];
    if (!taskTitle || !taskTitle.trim()) return;

    try {
      const payload = {
        title: taskTitle.trim(),
        description: '',
        priority: 'medium',
        dueDate: null,
        category: categoryName,
        completed: false
      };
      const res = await api.post('/api/todos', payload);
      setTodos([...todos, res.data]);
      setInlineInputs({ ...inlineInputs, [categoryName]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  // Create a brand new Category List
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = newCatName.trim();
    setExpandedCats({ ...expandedCats, [cat]: true });
    setNewCatName('');
    setIsCreatingCat(false);
  };

  // Group todos by category
  const categoriesMap = todos.reduce((acc, todo) => {
    const cat = todo.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(todo);
    return acc;
  }, {});

  // Make sure default empty categories are displayed if the user wants to see them
  defaultCategories.forEach(cat => {
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
  });

  const toggleExpand = (cat) => {
    setExpandedCats({ ...expandedCats, [cat]: !expandedCats[cat] });
  };

  // Rename a category
  const renameCategory = async (oldCatName) => {
    if (!editingCatName.trim() || oldCatName === editingCatName.trim()) {
      setEditingCat(null);
      return;
    }
    
    const newName = editingCatName.trim();
    // Update all local todos under old category name
    const todosToUpdate = todos.filter(t => (t.category || 'General') === oldCatName);
    
    try {
      const updatedTodos = await Promise.all(todosToUpdate.map(async (todo) => {
        const payload = { ...todo, category: newName };
        const res = await api.put(`/api/todos/${todo.id}`, payload);
        return res.data;
      }));

      // Merge results
      setTodos(todos.map(t => {
        const updated = updatedTodos.find(ut => ut.id === t.id);
        return updated ? updated : t;
      }));

      // Adjust expanded state
      const nextExpanded = { ...expandedCats };
      delete nextExpanded[oldCatName];
      nextExpanded[newName] = true;
      setExpandedCats(nextExpanded);
      setEditingCat(null);
    } catch (err) {
      console.error("Failed to rename category", err);
    }
  };

  // Color dots mapping for category list cards (mocking user layout screenshots)
  const categoryDots = {
    skills: 'bg-pink-500',
    study: 'bg-purple-500',
    shopping: 'bg-amber-500',
    work: 'bg-blue-500',
    personal: 'bg-emerald-500',
    general: 'bg-lavender-500'
  };

  const getDotColor = (catName) => {
    return categoryDots[catName.toLowerCase()] || 'bg-purple-400';
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-xl">
            <ListTodo className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">To-Do Lists</h1>
            <p className="text-neutral-400 text-xs mt-0.5">Track and group tasks within collapsible lists.</p>
          </div>
        </div>

        {/* Add Category List Trigger */}
        <button
          onClick={() => setIsCreatingCat(!isCreatingCat)}
          className="border border-white/5 bg-[#141625] hover:bg-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4 text-purple-400" />
          Add List
        </button>
      </div>

      {/* Inline category creator popup/form */}
      {isCreatingCat && (
        <form onSubmit={handleCreateCategory} className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-2 animate-fadeIn">
          <input
            type="text" placeholder="Enter Category List Name (e.g. skills, homework)..." required
            className="w-full glass-input rounded-xl px-4 py-2 text-xs"
            value={newCatName} onChange={e => setNewCatName(e.target.value)}
          />
          <button type="submit" className="bg-purple-gradient text-white text-xs font-bold px-4 py-2 rounded-xl">
            Add
          </button>
          <button type="button" onClick={() => setIsCreatingCat(false)} className="border border-white/10 text-neutral-400 px-3 py-2 rounded-xl text-xs">
            ✕
          </button>
        </form>
      )}

      {/* Lists Container (Collapsible Panels) */}
      <div className="space-y-4">
        {Object.entries(categoriesMap).map(([catName, listTodos]) => {
          const isExpanded = expandedCats[catName] ?? true;
          const completedCount = listTodos.filter(t => t.completed).length;
          const totalCount = listTodos.length;
          const isEditing = editingCat === catName;

          return (
            <div key={catName} className="bg-[#141625] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              {/* List Header */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(catName)}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Mock category dot */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDotColor(catName)}`} />
                  
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          className="glass-input rounded-lg px-2 py-0.5 text-xs text-white max-w-[120px]"
                          value={editingCatName}
                          onChange={e => setEditingCatName(e.target.value)}
                        />
                        <button onClick={() => renameCategory(catName)} className="p-1 text-green-400 hover:text-green-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingCat(null)} className="p-1 text-red-400 hover:text-red-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-extrabold text-white text-sm tracking-wide capitalize truncate">{catName}</h3>
                    )}
                    <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                      {completedCount} of {totalCount} completed
                    </span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => { setEditingCat(catName); setEditingCatName(catName); }}
                    className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-lg hover:bg-neutral-800/40 transition-colors"
                    title="Rename list"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => toggleExpand(catName)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/40 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-neutral-950/20 space-y-3.5 animate-fadeIn">
                  {/* Task list items */}
                  <div className="space-y-2.5">
                    {listTodos.map(todo => (
                      <div key={todo.id} className="flex items-center justify-between group py-1">
                        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => handleToggle(todo)}>
                          {/* Mock custom checkbox layout */}
                          <div className={`custom-checkbox ${todo.completed ? 'checked' : ''}`}>
                            {todo.completed && <Check className="w-3.5 h-3.5 text-purple-400 stroke-[3px]" />}
                          </div>
                          <span className={`text-xs font-semibold text-neutral-200 tracking-wide transition-all ${
                            todo.completed ? 'line-through text-neutral-500 font-normal' : ''
                          }`}>
                            {todo.title}
                          </span>
                        </div>

                        {/* Trash action */}
                        <button 
                          onClick={() => handleDelete(todo.id)}
                          className="p-1 text-neutral-600 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {listTodos.length === 0 && (
                      <p className="text-[11px] text-neutral-500 font-medium py-1">No items in this list yet.</p>
                    )}
                  </div>

                  {/* Inline creation input form (mocking mockup lists action) */}
                  <form onSubmit={(e) => handleInlineCreate(e, catName)} className="pt-2">
                    <div className="relative">
                      <input
                        type="text" placeholder="Create note / Add item..."
                        className="w-full glass-input rounded-xl pl-3 pr-10 py-2 text-xs placeholder-neutral-500 font-medium"
                        value={inlineInputs[catName] || ''}
                        onChange={e => setInlineInputs({ ...inlineInputs, [catName]: e.target.value })}
                      />
                      <button 
                        type="submit"
                        className="absolute right-2.5 top-1.5 p-1 bg-neutral-800 text-purple-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}