import React from 'react';
import { CheckSquare, FileText, Calendar, User, LogOut, Moon, Sun, Zap } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, user, onLogout, theme, toggleTheme }) {
  const menuItems = [
    { id: 'todos', name: 'To-Do Lists', icon: CheckSquare },
    { id: 'notes', name: 'Notes', icon: FileText },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <nav className="glass-panel bg-[#141625]/50 border-b border-white/5 px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setCurrentTab('todos')}>
        <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-gradient-lavender tracking-tight font-extrabold text-2xl font-sans">Momentum</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active 
                    ? 'bg-[#141625] text-white border border-white/10 shadow-lg' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-neutral-400'}`} />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-l border-white/5 pl-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 bg-[#141625] border border-white/5 rounded-xl py-1 px-2.5">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-neutral-700" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-bold text-neutral-300 hidden md:inline">{user?.displayName}</span>
          </div>

          <button 
            onClick={onLogout} 
            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-colors" 
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}