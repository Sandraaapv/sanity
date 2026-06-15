import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, CheckCircle, Circle, Folder, Tag, ListTodo } from 'lucide-react';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium', dueDate: '', category: 'General' });
  const [customCategory, setCustomCategory] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed

  const defaultCategories = ['General', 'Study', 'Shopping', 'Work', 'Personal'];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await api.get('/api/todos');
      setTodos(res.data);
    } catch (err) {
      console.error("Error pulling todos", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    const finalCategory = newTodo.category === 'Custom' 
      ? (customCategory.trim() || 'General') 
      : newTodo.category;

    try {
      const payload = {
        ...newTodo,
        category: finalCategory,
        dueDate: newTodo.dueDate ? `${newTodo.dueDate}T00:00:00` : null
      };
      const res = await api.post('/api/todos', payload);
      setTodos([...todos, res.data]);
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', category: 'General' });
      setCustomCategory('');
    } catch (err) {
      console.error(err);
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

  // Get list of all categories present (union of defaults + any unique categories from existing todos)
  const allCategories = Array.from(new Set([
    'All',
    ...defaultCategories,
    ...todos.map(t => t.category).filter(Boolean)
  ]));

  // Filtering Logic
  const filteredTodos = todos.filter(t => {
    // 1. Category Filter
    if (activeCategory !== 'All') {
      const categoryMatch = (t.category || 'General').toLowerCase() === activeCategory.toLowerCase();
      if (!categoryMatch) return false;
    }
    // 2. Status Filter
    if (statusFilter === 'active') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    return true;
  });

  const getTodoCountForCategory = (cat) => {
    if (cat === 'All') {
      return todos.filter(t => !t.completed).length;
    }
    return todos.filter(t => (t.category || 'General').toLowerCase() === cat.toLowerCase() && !t.completed).length;
  };

  const getPriorityBadgeColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
        return 'border-red-500/30 bg-red-950/20 text-red-400';
      case 'medium':
        return 'border-amber-500/30 bg-amber-950/20 text-amber-400';
      default:
        return 'border-blue-500/30 bg-blue-950/20 text-blue-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Page Title */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
          <ListTodo className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Task Lists</h1>
          <p className="text-neutral-400 text-sm mt-0.5">Organize and filter your task schedules by categories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-neutral-800/80">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Categories</span>
            </h2>
            <div className="space-y-1">
              {allCategories.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                const pendingCount = getTodoCountForCategory(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-blue-500/30 text-white' 
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {pendingCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks List and Creation Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Create Task Glass Form */}
          <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-neutral-800/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Task Title</label>
                <input
                  type="text" placeholder="What needs to be done?" required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={newTodo.title} 
                  onChange={e => setNewTodo({ ...newTodo, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text" placeholder="Add some notes..."
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={newTodo.description} 
                  onChange={e => setNewTodo({ ...newTodo, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={newTodo.category}
                  onChange={e => setNewTodo({ ...newTodo, category: e.target.value })}
                >
                  {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Custom">Create Custom...</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Priority</label>
                <select
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={newTodo.priority} 
                  onChange={e => setNewTodo({ ...newTodo, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Due Date</label>
                <input
                  type="date"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={newTodo.dueDate} 
                  onChange={e => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Custom Category Input Option */}
            {newTodo.category === 'Custom' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Enter Custom Category Name</label>
                <input
                  type="text" placeholder="e.g. Study, Shopping" required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                  value={customCategory} 
                  onChange={e => setCustomCategory(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Create Task
              </button>
            </div>
          </form>

          {/* Filtering Tabs & Tasks List */}
          <div className="space-y-4">
            {/* Status Filter Tab Buttons */}
            <div className="flex gap-2">
              {['all', 'active', 'completed'].map((f) => (
                <button
                  key={f} onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    statusFilter === f 
                      ? 'bg-neutral-800 text-white border-neutral-700' 
                      : 'glass-panel text-neutral-400 border-transparent hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Tasks Container */}
            <div className="space-y-2">
              {filteredTodos.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl border border-neutral-800/80 text-center">
                  <p className="text-neutral-500 text-sm font-medium">No tasks found in this view.</p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className="glass-panel p-4 rounded-xl border border-neutral-800/70 hover:border-neutral-700/80 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox toggler */}
                      <button onClick={() => handleToggle(todo)} className="text-neutral-500 hover:text-blue-400 transition-colors">
                        {todo.completed 
                          ? <CheckCircle className="w-5 h-5 text-green-400" /> 
                          : <Circle className="w-5 h-5 text-neutral-500" />
                        }
                      </button>
                      
                      <div>
                        {/* Title */}
                        <p className={`text-sm font-bold text-neutral-100 ${todo.completed ? 'line-through text-neutral-500' : ''}`}>
                          {todo.title}
                        </p>
                        
                        {/* Description */}
                        {todo.description && (
                          <p className="text-xs text-neutral-400 mt-0.5">{todo.description}</p>
                        )}
                        
                        {/* Badges */}
                        <div className="flex gap-1.5 mt-2">
                          {/* Priority */}
                          <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 border rounded ${getTodoCountForCategory(todo.category)} ${getPriorityBadgeColor(todo.priority)}`}>
                            {todo.priority}
                          </span>
                          
                          {/* Category Tag */}
                          <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-blue-400" />
                            {todo.category || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button 
                      onClick={() => handleDelete(todo.id)} 
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                      title="Delete Task"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}