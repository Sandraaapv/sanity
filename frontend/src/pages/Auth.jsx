import React, { useState } from 'react';
import api from '../api';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
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
        // Form field errors object map directly caught from GlobalExceptionHandler
        setErrors(typeof err.response.data === 'object' ? err.response.data : { global: 'Authentication failed.' });
      } else {
        setErrors({ global: 'Network connection error.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800 dark:text-white">
          {isLogin ? 'Sign In to Hub' : 'Create Account'}
        </h2>

        {errors.error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{errors.error}</div>}
        {errors.global && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{errors.global}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input
              type="text" required
              className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            {errors.username && <span className="text-xs text-red-500">{errors.username}</span>}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email" required
                  className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password" required
              className="w-full border rounded-lg p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-2">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-blue-600 hover:underline font-medium">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}