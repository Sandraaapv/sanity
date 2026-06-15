import React, { useState } from 'react';
import api from '../api';
import { Zap, Mail, User as UserIcon, Lock, ArrowRight } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { username: formData.username, password: formData.password }
      : formData;

    try {
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      onAuthSuccess(res.data.user);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors(typeof err.response.data === 'object' ? err.response.data : { global: 'Authentication failed.' });
      } else {
        setErrors({ global: 'Network connection error.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* Decorative glows */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Auth Glass Card */}
      <div className="glass-panel-glow p-8 rounded-2xl border border-white/10 relative z-10 w-full bg-[#141625]/90">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg mb-2">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-gradient-lavender tracking-tight font-extrabold text-2xl">
            {isLogin ? 'Sign In to Momentum' : 'Create Workspace'}
          </h2>
          <p className="text-neutral-400 text-xs mt-1">Access your unified productivity dashboard</p>
        </div>

        {errors.error && <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/40 text-red-400 text-xs rounded-xl">{errors.error}</div>}
        {errors.global && <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/40 text-red-400 text-xs rounded-xl">{errors.global}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
              <input
                type="text" required
                placeholder="username"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            {errors.username && <span className="text-xs text-red-400 mt-1 block">{errors.username}</span>}
          </div>

          {/* Registration specific fields */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
                  <input
                    type="email" required
                    placeholder="you@domain.com"
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Display Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
              <input
                type="password" required
                placeholder="••••••••"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password}</span>}
          </div>

          {/* Action button */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-purple-gradient bg-purple-gradient-hover text-white py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 mt-6 flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10 disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Workspace')}
            {!submitting && <ArrowRight className="w-4 h-4 text-purple-200" />}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="mt-6 text-center text-xs text-neutral-400 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrors({}); }} 
            className="text-purple-400 hover:text-purple-300 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}