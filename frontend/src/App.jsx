import React, { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Todos from './pages/Todos';
import Notes from './pages/Notes';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';
import Landing from './pages/Landing';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('todos');
  const [theme, setTheme] = useState('dark');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
      api.patch('/api/user/profile', { ...user, themePreference: nextTheme }).then(res => setUser(res.data));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If user is guest, show landing page.
  // Click actions toggle floating Auth dialog.
  if (!user) {
    return (
      <div className="relative">
        <Landing onGetStarted={() => setIsAuthOpen(true)} />
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="relative w-full max-w-md">
              {/* Close Button */}
              <button 
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-900 border border-white/10 z-[110]"
              >
                ✕
              </button>
              <Auth onAuthSuccess={(authenticatedUser) => { 
                setUser(authenticatedUser); 
                applyTheme(authenticatedUser.themePreference || 'dark');
                setIsAuthOpen(false);
              }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg transition-colors duration-200">
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onLogout={handleLogout} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="py-8 px-4 max-w-7xl mx-auto">
        {currentTab === 'todos' && <Todos />}
        {currentTab === 'notes' && <Notes />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'profile' && <Profile user={user} onUserUpdate={(updated) => setUser(updated)} />}
      </main>
    </div>
  );
}