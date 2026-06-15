import React, { useState } from 'react';
import api from '../api';
import { Camera, Save, User } from 'lucide-react';

export default function Profile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    themePreference: user?.themePreference || 'dark',
    accentColor: user?.accentColor || '#8B7CF6',
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
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-xl">
          <User className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">Workspace Settings</h1>
          <p className="text-neutral-400 text-xs mt-0.5">Customize your profile preferences and background mail alerts.</p>
        </div>
      </div>

      {status && (
        <div className="p-3.5 bg-blue-950/30 border border-blue-900/40 text-blue-400 text-xs font-semibold rounded-xl animate-fadeIn">
          {status}
        </div>
      )}

      {/* Avatar Card */}
      <div className="bg-[#141625] border border-white/5 p-6 rounded-2xl flex items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="relative group">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-neutral-900 border border-white/10 text-white p-2 rounded-full cursor-pointer hover:scale-105 transition-transform shadow">
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-neutral-100 tracking-wide capitalize">{user?.displayName}</h2>
          <p className="text-xs text-neutral-500 font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleProfileSave} className="bg-[#141625] border border-white/5 p-6 rounded-2xl space-y-4 shadow-2xl">
        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Display Name</label>
          <input
            type="text" required
            placeholder="Display Name"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
            value={profile.displayName} 
            onChange={e => setProfile({ ...profile, displayName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Theme Selection</label>
          <select
            className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-bold"
            value={profile.themePreference} 
            onChange={e => setProfile({ ...profile, themePreference: e.target.value })}
          >
            <option value="dark">Dark Mode (Sleek SaaS)</option>
            <option value="light">Light Mode (Minimalist)</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 py-2">
          <input
            type="checkbox" id="reminders" 
            className="rounded border-white/5 bg-neutral-900 text-purple-600 focus:ring-offset-neutral-950 focus:ring-purple-500"
            checked={profile.emailRemindersEnabled} 
            onChange={e => setProfile({ ...profile, emailRemindersEnabled: e.target.checked })}
          />
          <label htmlFor="reminders" className="text-xs font-bold text-neutral-300 select-none cursor-pointer">
            Receive email alerts for scheduled calendar tasks
          </label>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-purple-gradient bg-purple-gradient-hover text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/10 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-purple-200" /> 
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}