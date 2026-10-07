import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const { login, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const user = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(user.role === 'ADMIN' ? '/admin/overview' : '/member/record');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-emerald-400 shadow-xl border border-slate-700/60 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Srikainari Ulsavam 2026
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Expense &amp; Collection Management Portal
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-950/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
