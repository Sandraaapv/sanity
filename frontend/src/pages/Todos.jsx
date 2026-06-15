import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash, CheckCircle, Circle, AlertCircle } from 'lucide-react';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const res = await api.get('/api/todos');
      setTodos(res.data);
    } catch (err) { console.error("Error pulling todos", err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    try {
      // Maps fields with target backend payload structures dynamically
      const payload = {
        ...newTodo,
        dueDate: newTodo.dueDate ? `${newTodo.dueDate}T00:00:00` : null
      };
      const res = await api.post('/api/todos', payload);
      setTodos([...todos, res.data]);
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '' });
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (todo) => {
    try {
      const updated = { ...todo, completed: !todo.completed };
      const res = await api.put(`/api/todos/${todo.id}`, updated);
      setTodos(todos.map(t => t.id === todo.id ? res.data : t));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Task Management</h1>

      <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Task Title</label>
          <input
            type="text" placeholder="What needs to be done?" required
            className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={newTodo.title} onChange={e => setNewTodo({ ...newTodo, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Priority</label>
          <select
            className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={newTodo.priority} onChange={e => setNewTodo({ ...newTodo, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </form>

      <div className="flex gap-2 mb-4">
        {['all', 'active', 'completed'].map((f) => (
          <button
            key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredTodos.map((todo) => (
          <div key={todo.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <button onClick={() => handleToggle(todo)} className="text-slate-400 hover:text-blue-600">
                {todo.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div>
                <p className={`text-sm font-semibold dark:text-white ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>{todo.title}</p>
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded mt-1 dark:bg-slate-700 dark:text-slate-300">
                  {todo.priority}
                </span>
              </div>
            </div>
            <button onClick={() => handleDelete(todo.id)} className="text-slate-400 hover:text-red-500">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}