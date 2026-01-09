
import React, { useState } from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  onRefresh: () => void;
  user: User;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, onRefresh, user }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Exact 15 colors for mapping
  const themeColors: Record<string, string> = {
    indigo: 'bg-indigo-600', rose: 'bg-rose-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', 
    violet: 'bg-violet-600', sky: 'bg-sky-500', cyan: 'bg-cyan-500', fuchsia: 'bg-fuchsia-600',
    pink: 'bg-pink-500', orange: 'bg-orange-500', lime: 'bg-lime-500', teal: 'bg-teal-500',
    slate: 'bg-slate-600', zinc: 'bg-zinc-700', neutral: 'bg-neutral-800'
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const currentThemeColor = themeColors[user.theme || 'indigo'];

  return (
    <div className="flex flex-col h-full relative no-scrollbar transition-colors duration-500">
      <header className="flex items-center justify-between px-8 py-8 bg-transparent z-30 sticky top-0 flex-shrink-0 transition-all">
        <div className="flex items-center gap-5">
          <div 
            onClick={() => setActiveTab('home')}
            className={`w-14 h-14 ${currentThemeColor} rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.2)] transform active:scale-90 transition-all cursor-pointer`}
          >
            F
          </div>
          <div className="hidden xs:block">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">FinanceFlow</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 opacity-40">Easy Money Tracker</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshClick}
            className={`w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center text-slate-400 transition-all active:scale-75 ${isRefreshing ? 'animate-spin-slow text-indigo-500' : ''}`}
          >
            <i className="fa-solid fa-sync-alt text-sm"></i>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-12 h-12 rounded-[1.25rem] shadow-lg flex items-center justify-center overflow-hidden transition-all active:scale-75 ${activeTab === 'profile' ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-950' : 'bg-white dark:bg-slate-900'}`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="Me" />
            ) : (
              <div className={`w-full h-full ${currentThemeColor} flex items-center justify-center text-white font-black text-lg`}>
                {user.username[0].toUpperCase()}
              </div>
            )}
          </button>

          <button 
            onClick={onLogout} 
            title="Log Out"
            className="w-12 h-12 rounded-[1.25rem] bg-red-500/10 text-red-500 flex items-center justify-center active:scale-75 transition-all shadow-sm"
          >
            <i className="fa-solid fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        <div className="max-w-2xl mx-auto w-full h-full">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-10 left-8 right-8 h-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[40px] rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] flex justify-around items-center z-[100] transition-all">
        <NavButton icon="fa-house" active={activeTab === 'home'} onClick={() => setActiveTab('home')} themeColor={user.theme} />
        <NavButton icon="fa-layer-group" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} themeColor={user.theme} />
        
        <div className="relative -top-12">
           <button 
             onClick={() => setActiveTab('transactions')} 
             className={`w-24 h-24 ${currentThemeColor} text-white rounded-full shadow-[0_25px_60px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center transform transition-all active:scale-75 active:rotate-45 active-scale shadow-2xl shadow-indigo-500/30`}
           >
            <i className="fa-solid fa-plus text-4xl"></i>
           </button>
        </div>

        <NavButton icon="fa-user-group" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} themeColor={user.theme} />
        <NavButton icon="fa-bell" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} themeColor={user.theme} />
      </nav>
    </div>
  );
};

const NavButton = ({ icon, active, onClick, themeColor }: any) => {
  const activeColors: Record<string, string> = {
    indigo: 'text-indigo-600', rose: 'text-rose-600', emerald: 'text-emerald-600', amber: 'text-amber-600', 
    violet: 'text-violet-600', sky: 'text-sky-500', cyan: 'text-cyan-500', fuchsia: 'text-fuchsia-600',
    pink: 'text-pink-500', orange: 'text-orange-500', lime: 'text-lime-500', teal: 'text-teal-500',
    slate: 'text-slate-600', zinc: 'text-zinc-700', neutral: 'text-neutral-800'
  };
  const currentActiveColor = activeColors[themeColor || 'indigo'];
  return (
    <button onClick={onClick} className={`text-3xl transition-all duration-700 transform active-scale ${active ? `${currentActiveColor} scale-125 -translate-y-2` : 'text-slate-200 dark:text-slate-800 hover:text-slate-400'}`}>
      <i className={`fa-solid ${icon}`}></i>
    </button>
  );
};
