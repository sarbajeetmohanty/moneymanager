import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../App';

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
  const { refreshAll } = useApp();

  const themeColors: Record<string, string> = {
    indigo: 'bg-indigo-600', rose: 'bg-rose-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', 
    violet: 'bg-violet-600', sky: 'bg-sky-500', cyan: 'bg-cyan-500', fuchsia: 'bg-fuchsia-600',
    pink: 'bg-pink-500', orange: 'bg-orange-500', lime: 'bg-lime-500', teal: 'bg-teal-500',
    slate: 'bg-slate-600', zinc: 'bg-zinc-700', neutral: 'bg-neutral-800'
  };

  const handleRefreshClick = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshAll();
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const currentThemeColor = themeColors[user.theme || 'indigo'];

  return (
    <div className="flex flex-col h-full relative no-scrollbar transition-colors duration-500 overflow-hidden">
      <header className="flex items-center justify-between px-6 xs:px-8 py-6 xs:py-8 bg-transparent z-30 sticky top-0 flex-shrink-0 transition-all">
        <div className="flex items-center gap-4 xs:gap-5">
          <div 
            onClick={() => setActiveTab('home')}
            className={`w-12 h-12 xs:w-14 xs:h-14 ${currentThemeColor} rounded-[2rem] flex items-center justify-center text-white font-black text-xl xs:text-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.2)] transform active:scale-90 transition-all cursor-pointer`}
          >
            F
          </div>
          <div className="hidden xs:block">
            <h1 className="text-xl xs:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">FinanceFlow</h1>
            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.4em] mt-1.5 opacity-100">Wealth Tracker</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 xs:gap-3">
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className={`w-11 h-11 xs:w-12 xs:h-12 rounded-full bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center text-slate-800 dark:text-slate-400 transition-all active:scale-75 ${isRefreshing ? 'animate-spin-slow text-indigo-600' : ''}`}
          >
            <i className="fa-solid fa-sync-alt text-sm"></i>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-11 h-11 xs:w-12 xs:h-12 rounded-[1.25rem] shadow-lg flex items-center justify-center overflow-hidden transition-all active:scale-75 ${activeTab === 'profile' ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-950' : 'bg-white dark:bg-slate-900'}`}
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
            className="w-11 h-11 xs:w-12 xs:h-12 rounded-[1.25rem] bg-red-500/10 text-red-600 flex items-center justify-center active:scale-75 transition-all shadow-sm"
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

      {/* FULL WIDTH FLUSH NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/98 dark:bg-slate-900/98 backdrop-blur-[50px] rounded-t-[3.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.15)] flex justify-around items-center z-[100] transition-all px-6 pb-6 border-t border-slate-100 dark:border-slate-800">
        <NavButton icon="fa-house" active={activeTab === 'home'} onClick={() => setActiveTab('home')} themeColor={user.theme} />
        <NavButton icon="fa-layer-group" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} themeColor={user.theme} />
        
        <div className="relative -top-14">
           <button 
             onClick={() => setActiveTab('transactions')} 
             className={`w-20 h-20 xs:w-24 xs:h-24 ${currentThemeColor} text-white rounded-full shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] flex items-center justify-center transform transition-all active:scale-75 active:rotate-45 active-scale shadow-2xl`}
           >
            <i className="fa-solid fa-plus text-3xl xs:text-4xl"></i>
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
    slate: 'text-slate-900', zinc: 'text-zinc-900', neutral: 'text-neutral-900'
  };
  const currentActiveColor = activeColors[themeColor || 'indigo'];
  return (
    <button onClick={onClick} className={`text-2xl xs:text-3xl transition-all duration-700 transform active-scale px-3 xs:px-4 ${active ? `${currentActiveColor} scale-110 -translate-y-2` : 'text-slate-400 dark:text-slate-600 hover:text-slate-900'}`}>
      <i className={`fa-solid ${icon}`}></i>
    </button>
  );
};
