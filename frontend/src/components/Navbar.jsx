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
    <nav className="glass-panel border-b border-neutral-800/70 px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setCurrentTab('todos')}>
        <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-gradient-primary tracking-tight font-extrabold text-2xl font-sans">Momentum</span>
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-neutral-800/60 text-white shadow-inner border border-neutral-700/50' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-neutral-400'}`} />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-l border-neutral-800/80 pl-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900/40 rounded-lg transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 bg-neutral-900/40 border border-neutral-800/40 rounded-lg py-1 px-2.5">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-neutral-700" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-300 hidden md:inline">{user?.displayName}</span>
          </div>

          <button 
            onClick={onLogout} 
            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors" 
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}