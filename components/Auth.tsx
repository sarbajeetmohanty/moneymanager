
import React, { useState } from 'react';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const res = await api.login(email || username, password);
        if (res.success) onLogin(res.user);
        else setError("Wrong details. Check your password and try again.");
      } else {
        const res = await api.signup({ username, email, password });
        if (res.success) onLogin(res.user);
        else setError("Signup failed. This name or email is already taken.");
      }
    } catch (err) {
      setError("No internet connection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl p-10 relative overflow-hidden">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-white dark:text-slate-900 text-4xl font-black mx-auto mb-6 transform -rotate-6">
            F
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            {isLogin ? 'Manage your money easily' : 'Start tracking your pocket money today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Choose a Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 text-sm font-bold dark:text-white"
                placeholder="your name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email or Name</label>
            <input 
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 text-sm font-bold dark:text-white"
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 text-sm font-bold dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50 text-[11px] uppercase tracking-widest"
          >
            {loading ? 'Working...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center mt-8">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
          >
            {isLogin ? "New here? Create Account" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};
