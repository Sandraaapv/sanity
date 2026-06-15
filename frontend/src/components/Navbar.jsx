import React from 'react';
import { CheckSquare, FileText, Calendar, User, LogOut, Moon, Sun } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, user, onLogout, theme, toggleTheme }) {
  const menuItems = [
    { id: 'todos', name: 'Todos', icon: CheckSquare },
    { id: 'notes', name: 'Notes', icon: FileText },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
        <CheckSquare className="w-6 h-6" />
        <span>ProductivityHub</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-4">
          <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-300 hover:text-blue-600">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-slate-300" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium dark:text-slate-200">{user?.displayName}</span>
          </div>

          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}