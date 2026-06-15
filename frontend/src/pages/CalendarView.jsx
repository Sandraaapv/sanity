import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Bell, MapPin } from 'lucide-react';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startTime: '', endTime: '', color: '#3B82F6', location: '', reminderEnabled: false, reminderMinutesBefore: 15 });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      setEvents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Maps standard ISO formats to backend LocalDateTime constraints
      const payload = {
        ...newEvent,
        startTime: newEvent.startTime ? `${newEvent.startTime}:00` : null,
        endTime: newEvent.endTime ? `${newEvent.endTime}:00` : null
      };
      const res = await api.post('/api/events', payload);
      setEvents([...events, res.data]);
      setNewEvent({ title: '', description: '', startTime: '', endTime: '', color: '#3B82F6', location: '', reminderEnabled: false, reminderMinutesBefore: 15 });
    } catch (err) { console.error(err); }
  };

  const formatDateTime = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm h-fit">
        <h2 className="text-lg font-bold mb-4 dark:text-white">Create Event</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Event Title</label>
            <input type="text" required className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Start Date & Time</label>
            <input type="datetime-local" required className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">End Date & Time</label>
            <input type="datetime-local" required className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Location</label>
            <input type="text" className="w-full border rounded-lg p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
          </div>
          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="remind" className="rounded" checked={newEvent.reminderEnabled} onChange={e => setNewEvent({...newEvent, reminderEnabled: e.target.checked})} />
            <label htmlFor="remind" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Enable Email Alert Notification</label>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg font-medium hover:bg-blue-700 text-sm flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Save Schedule
          </button>
        </form>
      </div>

      <div className="md:col-span-2 space-y-3">
        <h2 className="text-xl font-bold dark:text-white mb-4">Agenda Timeline</h2>
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm">No scheduled tasks or meetings recorded yet.</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex border-l-4" style={{ borderLeftColor: event.color }}>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white">{event.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}</p>
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <MapPin className="w-3.5 h-3.5" /> <span>{event.location}</span>
                  </div>
                )}
              </div>
              {event.reminderEnabled && (
                <div className="text-blue-500" title="Email trigger armed">
                  <Bell className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}