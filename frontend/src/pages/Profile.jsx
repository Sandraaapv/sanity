import React, { useState } from 'react';
import api from '../api';
import { Camera, Save } from 'lucide-react';

export default function Profile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    themePreference: user?.themePreference || 'light',
    accentColor: user?.accentColor || '#3B82F6',
    timezone: user?.timezone || 'UTC',
    emailRemindersEnabled: user?.emailRemindersEnabled ?? true
  });
  const [status, setStatus] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await api.patch('/api/user/profile', profile);
      onUserUpdate(res.data);
      setStatus('Profile properties successfully updated!');
    } catch (err) { console.error(err); setStatus('Failed to update fields.'); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('');

    // Form data multi-part architecture alignment with Spring Boot MultipartFile configurations
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUserUpdate(res.data);
      setStatus('Avatar icon changed successfully!');
    } catch (err) { console.error(err); setStatus('Failed to compile file attachment structure.'); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Workspace Preferences</h1>

      {status && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">{status}</div>}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-slate-300" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full cursor-pointer shadow hover:bg-slate-700">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">{user?.displayName}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
          <input
            type="text" className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Theme Selection</label>
          <select
            className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={profile.themePreference} onChange={e => setProfile({ ...profile, themePreference: e.target.value })}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox" id="reminders" className="rounded"
            checked={profile.emailRemindersEnabled} onChange={e => setProfile({ ...profile, emailRemindersEnabled: e.target.checked })}
          />
          <label htmlFor="reminders" className="text-sm font-medium text-slate-700 dark:text-slate-300">Global background mail updates enabled</label>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
          <Save className="w-4 h-4" /> Save System Properties
        </button>
      </form>
    </div>
  );
}