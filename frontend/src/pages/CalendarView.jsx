import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Bell, MapPin, ChevronLeft, ChevronRight, Calendar, X, Trash, Clock } from 'lucide-react';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [newEvent, setNewEvent] = useState({ 
    title: '', description: '', startTime: '', endTime: '', 
    color: '#8B7CF6', location: '', reminderEnabled: false, reminderMinutesBefore: 15 
  });
  
  // Event Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Filters mapped to custom theme palette
  const colors = [
    { value: '#8B7CF6', name: 'Meeting', bg: 'bg-purple-600/20 text-purple-300 border-purple-500/30' },
    { value: '#10B981', name: 'Work', bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' },
    { value: '#F59E0B', name: 'Personal', bg: 'bg-amber-600/20 text-amber-300 border-amber-500/30' },
    { value: '#EF4444', name: 'Urgent', bg: 'bg-red-600/20 text-red-300 border-red-500/30' },
  ];
  const [activeColorFilter, setActiveColorFilter] = useState('All');

  useEffect(() => { 
    fetchEvents(); 
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      setEvents(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newEvent,
        startTime: newEvent.startTime ? `${newEvent.startTime}:00` : null,
        endTime: newEvent.endTime ? `${newEvent.endTime}:00` : null
      };
      const res = await api.post('/api/events', payload);
      setEvents([...events, res.data]);
      setIsModalOpen(false);
      setNewEvent({ 
        title: '', description: '', startTime: '', endTime: '', 
        color: '#8B7CF6', location: '', reminderEnabled: false, reminderMinutesBefore: 15 
      });
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      setEvents(events.filter(event => event.id !== id));
      setSelectedEvent(null);
    } catch (err) { 
      console.error(err); 
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();
  
  const gridCells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridCells.push({
      day: totalDaysInPrevMonth - i,
      monthType: 'prev',
      date: new Date(year, month - 1, totalDaysInPrevMonth - i)
    });
  }

  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({
      day: i,
      monthType: 'current',
      date: new Date(year, month, i)
    });
  }

  const remainingSlots = 42 - gridCells.length;
  for (let i = 1; i <= remainingSlots; i++) {
    gridCells.push({
      day: i,
      monthType: 'next',
      date: new Date(year, month + 1, i)
    });
  }

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const formatTimeStr = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (date) => {
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleDayClick = (cellDate) => {
    const yyyy = cellDate.getFullYear();
    const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
    const dd = String(cellDate.getDate()).padStart(2, '0');
    const defaultTimeStart = `${yyyy}-${mm}-${dd}T09:00`;
    const defaultTimeEnd = `${yyyy}-${mm}-${dd}T10:00`;

    setSelectedDateStr(formatDateLabel(cellDate));
    setNewEvent({
      ...newEvent,
      startTime: defaultTimeStart,
      endTime: defaultTimeEnd
    });
    setIsModalOpen(true);
  };

  const getEventBadgeClass = (colorCode) => {
    const config = colors.find(c => c.value.toLowerCase() === colorCode.toLowerCase());
    return config ? config.bg : 'bg-purple-600/20 text-purple-300 border-purple-500/30';
  };

  const filteredEvents = events.filter(e => {
    if (activeColorFilter === 'All') return true;
    return e.color.toLowerCase() === activeColorFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-xl">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">Calendar</h1>
            <p className="text-neutral-400 text-xs mt-0.5">Manage and track your meetings, projects, and reminders.</p>
          </div>
        </div>

        <button 
          onClick={() => handleDayClick(new Date())}
          className="bg-purple-gradient bg-purple-gradient-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-[#141625]/60 shadow-xl">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Event Types</h2>
            <div className="space-y-1">
              <button
                onClick={() => setActiveColorFilter('All')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeColorFilter === 'All' 
                    ? 'bg-neutral-800 text-white border border-white/10' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white border border-neutral-600" />
                All Events
              </button>
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setActiveColorFilter(color.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeColorFilter.toLowerCase() === color.value.toLowerCase()
                      ? 'bg-neutral-800 text-white border border-white/10'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mini upcoming timeline */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-[#141625]/60 shadow-xl">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Upcoming events</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {events.slice(0, 5).map(event => (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className="bg-neutral-950/40 border border-white/5 rounded-xl p-3 cursor-pointer hover:border-purple-500/20 transition-all flex items-start gap-2.5"
                >
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-100 truncate">{event.title}</h4>
                    <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                      {new Date(event.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {formatTimeStr(event.startTime)}
                    </span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-xs text-neutral-500 font-medium">No events scheduled.</p>
              )}
            </div>
          </div>
        </div>

        {/* Month Calendar Grid Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Navigation Month Switcher */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-[#141625]/60 shadow-xl flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white font-sans tracking-tight">
              {monthNames[month]} <span className="text-purple-400 font-normal">{year}</span>
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-2 border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl bg-[#141625]/30">
            {/* Days of the Week Header */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-neutral-950/40 text-center py-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>

            {/* Days Cells Grid */}
            <div className="grid grid-cols-7 bg-neutral-950/10 gap-[1px]">
              {gridCells.map((cell, idx) => {
                const cellEvents = filteredEvents.filter(e => isSameDay(new Date(e.startTime), cell.date));
                const isCurrentMonth = cell.monthType === 'current';
                const isToday = isSameDay(new Date(), cell.date);

                return (
                  <div 
                    key={idx}
                    className={`min-h-[100px] p-2 flex flex-col justify-between transition-all duration-150 border-r border-b border-white/5 cursor-pointer relative ${
                      isCurrentMonth 
                        ? 'bg-neutral-900/10 hover:bg-neutral-900/30' 
                        : 'bg-neutral-950/30 opacity-20 hover:bg-neutral-950/40'
                    }`}
                    onClick={() => handleDayClick(cell.date)}
                  >
                    {/* Day Number */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold ${
                        isToday 
                          ? 'bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg shadow-purple-500/20' 
                          : isCurrentMonth ? 'text-neutral-300' : 'text-neutral-600'
                      }`}>
                        {cell.day}
                      </span>
                    </div>

                    {/* Day events badges list */}
                    <div className="space-y-1 mt-2 max-h-[75px] overflow-y-auto pr-0.5">
                      {cellEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`px-1.5 py-0.5 border text-[9px] font-bold rounded truncate flex items-center gap-1 transition-all hover:scale-[1.02] ${getEventBadgeClass(event.color)}`}
                          title={event.title}
                        >
                          <span className="w-1 h-1 rounded-full flex-shrink-0 bg-current" />
                          <span>{formatTimeStr(event.startTime)}</span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD EVENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-glow max-w-md w-full rounded-2xl border border-white/10 p-6 relative overflow-hidden animate-zoomIn bg-[#141625]">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white flex flex-col">
                <span>Add Calendar Event</span>
                <span className="text-[10px] text-neutral-400 font-semibold mt-0.5">{selectedDateStr}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Event Title</label>
                <input 
                  type="text" required placeholder="Weekly sync, Doctor..."
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs" 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Start Date & Time</label>
                  <input 
                    type="datetime-local" required 
                    className="w-full glass-input rounded-xl px-3 py-2 text-[10px]" 
                    value={newEvent.startTime} 
                    onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">End Date & Time</label>
                  <input 
                    type="datetime-local" required 
                    className="w-full glass-input rounded-xl px-3 py-2 text-[10px]" 
                    value={newEvent.endTime} 
                    onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input 
                    type="text" placeholder="Office, Zoom Link..."
                    className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs" 
                    value={newEvent.location} 
                    onChange={e => setNewEvent({...newEvent, location: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Category Color</label>
                  <select
                    className="w-full glass-input rounded-xl px-3 py-2 text-[10px] font-bold"
                    value={newEvent.color}
                    onChange={e => setNewEvent({...newEvent, color: e.target.value})}
                  >
                    {colors.map(col => <option key={col.value} value={col.value}>{col.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Alert</label>
                  <div className="flex items-center gap-2 h-full py-1">
                    <input 
                      type="checkbox" id="remind_modal" className="rounded border-white/5 bg-neutral-900 text-purple-600" 
                      checked={newEvent.reminderEnabled} 
                      onChange={e => setNewEvent({...newEvent, reminderEnabled: e.target.checked})} 
                    />
                    <label htmlFor="remind_modal" className="text-[10px] font-bold text-neutral-300">Email Notification</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  placeholder="Notes, agenda details..." rows="3"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs resize-none" 
                  value={newEvent.description} 
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                />
              </div>

              <div className="flex justify-end pt-3 gap-2">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-purple-gradient text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVENT DETAILS */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-glow max-w-sm w-full rounded-2xl border border-white/10 p-6 relative overflow-hidden animate-zoomIn bg-[#141625]">
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: selectedEvent.color }} />

            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-white">{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>
                  {new Date(selectedEvent.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                  {formatTimeStr(selectedEvent.startTime)} - {formatTimeStr(selectedEvent.endTime)}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-neutral-400 whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description}
                </div>
              )}

              {selectedEvent.reminderEnabled && (
                <div className="flex items-center gap-1.5 text-xs text-purple-400 mt-2 bg-purple-950/20 border border-purple-900/20 p-2.5 rounded-xl">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Email reminder triggers {selectedEvent.reminderMinutesBefore}m before</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-white/5">
              <button 
                onClick={() => handleDelete(selectedEvent.id)}
                className="bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 hover:border-red-800 text-red-400 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Trash className="w-3.5 h-3.5" /> Delete
              </button>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="bg-neutral-800 border border-white/10 hover:bg-neutral-700 text-neutral-200 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}