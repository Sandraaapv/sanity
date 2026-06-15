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
        setErrors({ global: 'Network connection error. Check if the backend is running.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-3 animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gradient-primary tracking-tight font-extrabold text-4xl mb-2">Momentum</h1>
          <p className="text-neutral-400 text-sm font-medium">Streamline your thoughts, schedules, and workflows.</p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel-glow p-8 rounded-2xl border border-neutral-800/80">
          <h2 className="text-xl font-bold mb-6 text-white text-center">
            {isLogin ? 'Welcome back' : 'Create your workspace'}
          </h2>

          {errors.error && <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg">{errors.error}</div>}
          {errors.global && <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg">{errors.global}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  type="text" required
                  placeholder="john_doe"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm"
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
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      type="email" required
                      placeholder="you@example.com"
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Display Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  type="password" required
                  placeholder="••••••••"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm"
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
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 mt-6 flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Workspace')}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer toggle */}
          <div className="mt-6 text-center text-sm text-neutral-400 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }} 
              className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}