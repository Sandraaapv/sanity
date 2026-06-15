import React, { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Todos from './pages/Todos';
import Notes from './pages/Notes';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('todos');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Ensure dark mode is active on mount
    document.documentElement.classList.add('dark');
    checkLoggedSession();
  }, []);

  const checkLoggedSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/user/me');
      setUser(res.data);
      applyTheme(res.data.themePreference || 'dark');
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (mode) => {
    const activeMode = mode || 'dark';
    setTheme(activeMode);
    if (activeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    if (user) {
      // Async update theme properties quietly in the background
      api.patch('/api/user/profile', { ...user, themePreference: nextTheme }).then(res => setUser(res.data));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(authenticatedUser) => { setUser(authenticatedUser); applyTheme(authenticatedUser.themePreference); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onLogout={handleLogout} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="py-8 px-4">
        {currentTab === 'todos' && <Todos />}
        {currentTab === 'notes' && <Notes />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'profile' && <Profile user={user} onUserUpdate={(updated) => setUser(updated)} />}
      </main>
    </div>
  );
}