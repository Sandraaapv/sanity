import React, { useState } from 'react';
import api from '../api';
import { Camera, Save, User } from 'lucide-react';

export default function Profile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    themePreference: user?.themePreference || 'dark',
    accentColor: user?.accentColor || '#3B82F6',
    timezone: user?.timezone || 'UTC',
    emailRemindersEnabled: user?.emailRemindersEnabled ?? true
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setStatus('');
    setSaving(true);
    try {
      const res = await api.patch('/api/user/profile', profile);
      onUserUpdate(res.data);
      setStatus('Profile properties successfully updated!');
    } catch (err) { 
      console.error(err); 
      setStatus('Failed to update fields.'); 
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUserUpdate(res.data);
      setStatus('Avatar icon changed successfully!');
    } catch (err) { 
      console.error(err); 
      setStatus('Failed to upload avatar image.'); 
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
          <User className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Profile Preferences</h1>
          <p className="text-neutral-400 text-sm mt-0.5">Customize your workspace appearance and notifications.</p>
        </div>
      </div>

      {status && (
        <div className="p-3.5 bg-blue-950/40 border border-blue-900/50 text-blue-400 text-xs font-semibold rounded-xl animate-fadeIn">
          {status}
        </div>
      )}

      {/* Avatar Card */}
      <div className="glass-panel p-6 rounded-2xl border border-neutral-800/80 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
        <div className="relative group">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700/80 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-105 transition-all">
            <Camera className="w-4 h-4 text-blue-400" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-neutral-100">{user?.displayName}</h2>
          <p className="text-sm text-neutral-400 font-medium mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Profile Fields Form */}
      <form onSubmit={handleProfileSave} className="glass-panel p-6 rounded-2xl border border-neutral-800/80 space-y-4 shadow-xl">
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Display Name</label>
          <input
            type="text" required
            placeholder="John Doe"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
            value={profile.displayName} 
            onChange={e => setProfile({ ...profile, displayName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Theme Selection</label>
          <select
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
            value={profile.themePreference} 
            onChange={e => setProfile({ ...profile, themePreference: e.target.value })}
          >
            <option value="dark">Dark Mode (Sleek)</option>
            <option value="light">Light Mode (Minimalist)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox" id="reminders" 
            className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-offset-neutral-950 focus:ring-blue-500"
            checked={profile.emailRemindersEnabled} 
            onChange={e => setProfile({ ...profile, emailRemindersEnabled: e.target.checked })}
          />
          <label htmlFor="reminders" className="text-xs font-bold text-neutral-300 select-none cursor-pointer">
            Receive email alert updates for scheduled calendar tasks
          </label>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> 
          {saving ? 'Saving Preferences...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}