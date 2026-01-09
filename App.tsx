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
        else setError("Access Denied. Invalid credentials.");
      } else {
        const res = await api.signup({ username, email, password });
        if (res.success) onLogin(res.user);
        else setError("Registration failed. Data collision.");
      }
    } catch (err) {
      setError("Network unavailable. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-20%] right-[-10%] w-[100%] aspect-square bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[70%] aspect-square bg-violet-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] p-10 xs:p-12 relative z-10 border border-white/20 dark:border-white/5 animate-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 xs:w-20 xs:h-20 bg-slate-900 dark:bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-white dark:text-slate-900 text-3xl xs:text-4xl font-black mx-auto mb-8 transform -rotate-6">
            F
          </div>
          <h1 className="text-3xl xs:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {isLogin ? 'Welcome' : 'Join Us'}
          </h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.4em] mt-4 opacity-70">
            {isLogin ? 'FinanceFlow Pro Wealth OS' : 'Secure your digital asset future'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500 text-white rounded-3xl text-[9px] font-black uppercase tracking-widest text-center animate-in zoom-in-95 shadow-lg shadow-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Identifier</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-5 px-6 text-sm font-bold dark:text-white border-transparent focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-inner"
                placeholder="Unique Username"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Credential</label>
            <input 
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-5 px-6 text-sm font-bold dark:text-white border-transparent focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-inner"
              placeholder="Email or Username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-5 px-6 text-sm font-bold dark:text-white border-transparent focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-full shadow-2xl active:scale-95 transition-all mt-6 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em]"
          >
            {loading ? 'Initializing...' : (isLogin ? 'Access App' : 'Create Vault')}
          </button>
        </form>

        <div className="text-center mt-10">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors"
          >
            {isLogin ? "New user? Link Node" : "Existing user? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};
