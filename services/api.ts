import React, { useState, useEffect, createContext, useContext } from 'react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Friends } from './components/Friends';
import { Notifications } from './components/Notifications';
import { Profile } from './components/Profile';
import { VerificationModal } from './components/VerificationModal';
import { User } from './types';
import { api } from './services/api';

const AppContext = createContext<{
  refreshAll: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  refreshKey: number;
}>({ refreshAll: () => {}, showToast: () => {}, refreshKey: 0 });

export const useApp = () => useContext(AppContext);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'friends' | 'notifications' | 'profile'>('home');
  const [showVerification, setShowVerification] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ff_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (!parsedUser.isVerified || !parsedUser.phoneNumber || !parsedUser.upiId) {
          setShowVerification(true);
        }
      } catch (e) {
        localStorage.removeItem('ff_user');
      }
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (user?.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.mode]);

  const refreshAll = () => setRefreshKey(prev => prev + 1);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ff_user', JSON.stringify(userData));
    if (!userData.isVerified || !userData.phoneNumber || !userData.upiId) {
      setShowVerification(true);
    }
    showToast(`Welcome back, ${userData.username}!`, 'success');
  };

  const confirmLogout = () => {
    setUser(null);
    localStorage.removeItem('ff_user');
    setShowLogoutModal(false);
    showToast("Session Terminated", "info");
    setActiveTab('home');
  };

  if (isInitializing) {
    return (
      <div className="h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-[1.5rem] animate-bounce shadow-2xl"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Syncing Engine...</p>
      </div>
    );
  }

  if (!user) return <Auth onLogin={handleLogin} />;

  const presetClass = user.stylePreset ? `style-${user.stylePreset}` : 'style-modern';

  return (
    <AppContext.Provider value={{ refreshAll, showToast, refreshKey }}>
      <div className={`flex flex-col h-screen overflow-hidden transition-all duration-700 ${presetClass}`}>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => setShowLogoutModal(true)}
          onRefresh={refreshAll}
          user={user}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar pb-40 pt-2 px-4">
            {activeTab === 'home' && <Dashboard user={user} key={`dash-${refreshKey}`} />}
            {activeTab === 'transactions' && <Transactions user={user} key={`trans-${refreshKey}`} />}
            {activeTab === 'friends' && <Friends user={user} key={`friends-${refreshKey}`} />}
            {activeTab === 'notifications' && <Notifications user={user} key={`notif-${refreshKey}`} />}
            {activeTab === 'profile' && <Profile user={user} setUser={setUser} key={`prof-${refreshKey}`} />}
          </div>
        </Layout>

        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-12 fade-in">
            <div className={`px-8 py-5 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex items-center gap-4 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 
              toast.type === 'info' ? 'bg-indigo-600 text-white' : 
              'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
            }`}>
              <i className={`fa-solid ${toast.type === 'error' ? 'fa-bolt' : 'fa-check-double'} text-lg`}></i>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.msg}</p>
            </div>
          </div>
        )}

        {showLogoutModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-12 shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-[2.2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                <i className="fa-solid fa-power-off text-3xl"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Confirm Logout</h2>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-10 px-4">
                Are you sure you want to log out? All your pending transactions will stay safe.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowLogoutModal(false)} className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                <button onClick={confirmLogout} className="bg-red-600 text-white py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest">Logout</button>
              </div>
            </div>
          </div>
        )}

        {showVerification && (
          <VerificationModal 
            user={user} 
            onVerified={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('ff_user', JSON.stringify(updatedUser));
              setShowVerification(false);
              showToast("Identity Linked Successfully", "success");
            }} 
          />
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
