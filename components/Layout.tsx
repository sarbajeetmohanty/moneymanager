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
  const { refreshAll, setTransactionMode } = useApp();

  const themeColors: Record<string, string> = {
    indigo: 'bg-indigo-600', rose: 'bg-rose-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600', 
    violet: 'bg-violet-600', sky: 'bg-sky-500', cyan: 'bg-cyan-500', fuchsia: 'bg-fuchsia-600',
    pink: 'bg-pink-500', orange: 'bg-orange-500', lime: 'bg-lime-500', teal: 'bg-teal-500',
    slate: 'bg-slate-600', zinc: 'bg-zinc-700', neutral: 'bg-neutral-800'
  };

  const handleRefreshClick = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // This triggers the global context refreshKey which Dashboards/Transactions listen to
    refreshAll();
    if (onRefresh) onRefresh();
    
    // Provide visual spin feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const handlePlusClick = () => {
    setTransactionMode('Add');
    setActiveTab('transactions');
  };

  const currentThemeColor = themeColors[user.theme || 'indigo'];

  return (
    <div className="flex flex-col h-full relative no-scrollbar transition-colors duration-500 overflow-hidden">
      {/* Optimized Header for Mobile */}
      <header className="flex items-center justify-between px-4 xs:px-6 py-4 xs:py-5 z-[100] sticky top-0 flex-shrink-0 backdrop-blur-3xl border-b border-black/5 dark:border-white/5 transition-all">
        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-shrink">
          <div 
            onClick={() => setActiveTab('home')}
            className={`w-9 h-9 xs:w-11 xs:h-11 ${currentThemeColor} rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-lg active:scale-90 transition-all cursor-pointer`}
          >
            F
          </div>
          <div className="truncate">
            <h1 className="text-lg xs:text-xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
              FinanceFlow
            </h1>
            <p className="text-[7px] xs:text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 opacity-80">Wealth OS</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 xs:gap-2.5 flex-shrink-0">
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className={`w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-slate-900 dark:text-slate-400 active:scale-75 transition-all ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
          >
            <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-9 h-9 xs:w-10 xs:h-10 rounded-2xl shadow-md flex items-center justify-center overflow-hidden active:scale-75 transition-all ${activeTab === 'profile' ? 'ring-2 ring-indigo-500' : 'bg-white dark:bg-slate-900'}`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="Me" />
            ) : (
              <div className={`w-full h-full ${currentThemeColor} flex items-center justify-center text-white font-black text-xs`}>
                {user.username[0].toUpperCase()}
              </div>
            )}
          </button>

          <button 
            onClick={onLogout} 
            className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center active:scale-75 transition-all"
          >
            <i className="fa-solid fa-power-off text-[11px]"></i>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-1 pt-2">
        <div className="max-w-2xl mx-auto w-full h-full pb-32">
          {children}
        </div>
      </main>

      {/* Modern Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 xs:h-22 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-around items-center z-[110] transition-all px-4 pb-6 border-t border-slate-100 dark:border-white/5">
        <NavButton icon="fa-house" active={activeTab === 'home'} onClick={() => setActiveTab('home')} themeColor={user.theme} />
        <NavButton icon="fa-layer-group" active={activeTab === 'transactions'} onClick={() => { setTransactionMode('History'); setActiveTab('transactions'); }} themeColor={user.theme} />
        
        <div className="relative -top-9 xs:-top-11">
           <button 
             onClick={handlePlusClick} 
             className={`w-14 h-14 xs:w-16 xs:h-16 ${currentThemeColor} text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all active:scale-75 border-4 border-white dark:border-slate-950`}
           >
            <i className="fa-solid fa-plus text-xl xs:text-2xl"></i>
           </button>
        </div>

        <NavButton icon="fa-user-group" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} themeColor={user.theme} />
        <NavButton icon="fa-bell" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} themeColor={user.theme} />
      </nav>
    </div>
  );
};

const NavButton = ({ icon, active, onClick, themeColor }: any) => {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-600', rose: 'text-rose-600', emerald: 'text-emerald-600', amber: 'text-amber-600', 
    violet: 'text-violet-600', sky: 'text-sky-500', cyan: 'text-cyan-500', fuchsia: 'text-fuchsia-600'
  };
  const activeColor = colors[themeColor || 'indigo'] || 'text-indigo-600';
  return (
    <button onClick={onClick} className={`text-xl xs:text-2xl transition-all transform active-scale px-3 xs:px-4 ${active ? `${activeColor} scale-110 -translate-y-1` : 'text-slate-300 dark:text-slate-700 hover:text-slate-500'}`}>
      <i className={`fa-solid ${icon}`}></i>
    </button>
  );
};
