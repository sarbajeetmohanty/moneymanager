import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

// --- TYPES & CONSTANTS ---
type PaymentMode = 'Cash' | 'Online';
type TransactionType = 'Income' | 'Expense' | 'Money Given' | 'Money Taken' | 'He Paid Back' | 'I Paid Back' | 'Split';
type TransactionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Paid';
type AppMode = 'light' | 'dark';

interface User {
  id: string; username: string; email: string; photoURL?: string; 
  phoneNumber?: string; upiId?: string; isVerified: boolean; 
  budget: number; theme: string; mode: AppMode; stylePreset: string;
}

interface Friend {
  id: string; name: string; balance: number; status: string; isManual: boolean;
}

interface Notification {
  id: string; targetUserId: string; senderName: string; type: string; 
  message: string; amount?: number; remainingAmount?: number; isResolved: boolean; transactionId?: string;
}

const API_URL = 'https://script.google.com/macros/s/AKfycbzqQgyhJr90wsY1w0rNDrqnytRNC_ETqA7CAnAxAXX_6eg-I0iPu-wx91HaHmb_rrvl/exec';

// --- API SERVICE ---
const api = {
  async request(action: string, data: any = {}) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...data }),
      });
      return await response.json();
    } catch (error) {
      console.error(error);
      return { success: false, error: 'Connection failure' };
    }
  },
  login: (u: string, p: string) => api.request('login', { usernameOrEmail: u, password: p }),
  signup: (d: any) => api.request('signup', d),
  updateProfile: (id: string, updates: any, p?: string) => api.request('updateProfile', { userId: id, updates, currentPassword: p }),
  saveTransaction: (id: string, t: any) => api.request('saveTransaction', { userId: id, transaction: t }),
  fetchDashboard: (id: string) => api.request('fetchDashboardData', { userId: id }),
  fetchFriends: (id: string) => api.request('fetchFriends', { userId: id }),
  fetchNotifications: (id: string) => api.request('fetchNotifications', { userId: id }),
  fetchTransactionHistory: (id: string) => api.request('fetchTransactionHistory', { userId: id }),
  handleAction: (id: string, nId: string, act: string, tId: string, amount?: number) => api.request('handleAction', { userId: id, notificationId: nId, action: act, transactionId: tId, amount }),
  removeFriend: (id: string, fId: string) => api.request('removeFriend', { userId: id, friendId: fId }),
  sendFriendRequest: (userId: string, targetUsername: string) => api.request('sendFriendRequest', { userId, targetUsername })
};

// --- APP CONTEXT ---
const AppContext = createContext<any>(null);
const useApp = () => useContext(AppContext);

// --- COMPONENTS ---

const Auth: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
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
    const res = isLogin ? await api.login(email || username, password) : await api.signup({ username, email, password });
    if (res.success) onLogin(res.user);
    else setError(res.error || "Action failed. Check details.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-white dark:text-slate-900 text-4xl font-black mx-auto mb-6 transform -rotate-6">F</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{isLogin ? 'Welcome Back' : 'Join Us'}</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">{isLogin ? 'Secure access to your nodes' : 'Initialize your financial stack'}</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 font-bold dark:text-white" placeholder="Username" required />}
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 font-bold dark:text-white" placeholder="Email or Username" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-5 px-6 font-bold dark:text-white" placeholder="••••••••" required />
          <button disabled={loading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all mt-4 text-[11px] uppercase tracking-widest">
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>
        <div className="text-center mt-8">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isLogin ? "New here? Sign Up" : "Have account? Log In"}</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState({ cash: 0, online: 0, pending: 0, incoming: 0, outgoing: 0, moneyGiven: 0, moneyTaken: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('7D');

  useEffect(() => {
    Promise.all([api.fetchDashboard(user.id), api.fetchTransactionHistory(user.id)]).then(([d, h]) => {
      if (d.success) setStats(d.data);
      if (h.success) setHistory(h.history);
    });
  }, [user.id]);

  const chartData = useMemo(() => {
    const daily: Record<string, any> = {};
    history.forEach(t => {
      const d = new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!daily[d]) daily[d] = { date: d, val: 0 };
      daily[d].val += t.amount;
    });
    return Object.values(daily).slice(-7);
  }, [history]);

  return (
    <div className="space-y-8 pb-48 animate-in fade-in duration-1000">
      <div className="card-ui p-12 bg-slate-900 dark:bg-black text-white relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em] mb-4">Total Liquid Assets</p>
          <h2 className="text-7xl font-black tracking-tighter mb-12">₹{(stats.cash + stats.online).toLocaleString()}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-6 rounded-[2.25rem]">
              <p className="text-[8px] text-white/30 font-black uppercase mb-2">Cash</p>
              <p className="text-lg font-black text-emerald-400">₹{stats.cash.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.25rem]">
              <p className="text-[8px] text-white/30 font-black uppercase mb-2">Online</p>
              <p className="text-lg font-black text-indigo-400">₹{stats.online.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.25rem]">
              <p className="text-[8px] text-white/30 font-black uppercase mb-2">Pending</p>
              <p className="text-lg font-black text-amber-400">₹{stats.pending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming</p>
          <p className="text-xl font-black text-green-600">₹{stats.incoming.toLocaleString()}</p>
        </div>
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Outgoing</p>
          <p className="text-xl font-black text-red-600">₹{stats.outgoing.toLocaleString()}</p>
        </div>
      </div>
      <div className="card-ui bg-white dark:bg-slate-900 p-10 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <Tooltip />
            <Area type="monotone" dataKey="val" stroke="#6366f1" fill="#6366f122" strokeWidth={4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Transactions: React.FC<{ user: User }> = ({ user }) => {
  const { refreshAll, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'History' | 'Add'>('History');
  const [type, setType] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');
  const [cat, setCat] = useState('General');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'History') api.fetchTransactionHistory(user.id).then(res => res.success && setHistory(res.history));
  }, [user.id, activeTab]);

  const handleSave = async () => {
    if (type.includes('Money') || type === 'Split') {
      if (!confirm("Step 1/2: This is a shared transaction. Proceed?")) return;
      if (!confirm("Step 2/2: Confirm total and details?")) return;
    }
    const res = await api.saveTransaction(user.id, { type, amount: parseFloat(amount), mode, category: cat, timestamp: new Date().toISOString() });
    if (res.success) {
      showToast("Transaction Logged", "success");
      setActiveTab('History');
      setAmount('');
      refreshAll();
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl p-1.5 rounded-[2.5rem] shadow-2xl sticky top-2 z-50">
        <button onClick={() => setActiveTab('History')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full ${activeTab === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-400'}`}>Activity</button>
        <button onClick={() => setActiveTab('Add')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full ${activeTab === 'Add' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-400'}`}>New Record</button>
      </div>
      <div className="flex-grow overflow-y-auto no-scrollbar pb-40">
        {activeTab === 'History' ? (
          <div className="space-y-4">
            {history.map(t => (
              <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${t.type.includes('In') || t.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <i className={`fa-solid ${t.type.includes('In') || t.type === 'Income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.category}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${t.type.includes('In') || t.type === 'Income' ? 'text-green-600' : 'text-red-500'}`}>₹{t.amount.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-300 font-black uppercase">{new Date(t.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-ui bg-white dark:bg-slate-900 p-10 space-y-10 shadow-2xl">
            <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-full">
              {['Income', 'Expense', 'Split', 'Money Given'].map(o => (
                <button key={o} onClick={() => setType(o as any)} className={`flex-1 py-4 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${type === o ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>{o}</button>
              ))}
            </div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white" />
            <div className="grid grid-cols-2 gap-4">
              {['Online', 'Cash'].map(m => (
                <button key={m} onClick={() => setMode(m as any)} className={`p-8 rounded-[2.5rem] border-4 transition-all ${mode === m ? 'bg-indigo-600 border-indigo-200 text-white' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-400 opacity-60'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                </button>
              ))}
            </div>
            <button disabled={!amount} onClick={handleSave} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20">Save Record</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Friends: React.FC<{ user: User }> = ({ user }) => {
  const { showToast, refreshKey } = useApp();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [connectUsername, setConnectUsername] = useState('');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => res.success && setFriends(res.friends));
  }, [user.id, refreshKey]);

  const handleConnect = async () => {
    const res = await api.sendFriendRequest(user.id, connectUsername);
    if (res.success) { showToast("Request Dispatched", "success"); setConnectUsername(''); }
  };

  const removeFriend = async (fId: string, bal: number) => {
    if (Math.abs(bal) > 0.1) return alert(`BLOCKED: Balance is ₹${bal}. Settle first!`);
    if (confirm("Remove friend?")) {
      const res = await api.removeFriend(user.id, fId);
      if (res.success) { showToast("Friend Removed", "info"); api.fetchFriends(user.id).then(r => r.success && setFriends(r.friends)); }
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
        <input type="text" placeholder="Username..." className="flex-1 bg-transparent dark:text-white" value={connectUsername} onChange={e => setConnectUsername(e.target.value)} />
        <button onClick={handleConnect} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase">Add</button>
      </div>
      <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pb-32">
        {friends.map(f => (
          <div key={f.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xl">{f.name[0]}</div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{f.name}</h4>
                <p className={`text-[10px] font-black uppercase ${f.balance > 0 ? 'text-green-600' : f.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  {f.balance === 0 ? 'Settled' : f.balance > 0 ? `Will pay: ₹${f.balance}` : `You owe: ₹${Math.abs(f.balance)}`}
                </p>
              </div>
            </div>
            <button onClick={() => removeFriend(f.id, f.balance)} className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:scale-75 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Notifications: React.FC<{ user: User }> = ({ user }) => {
  const { refreshAll, showToast } = useApp();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const fetchNotifs = () => api.fetchNotifications(user.id).then(res => res.success && setNotifs(res.notifications));
  useEffect(() => { fetchNotifs(); const i = setInterval(fetchNotifs, 10000); return () => clearInterval(i); }, [user.id]);

  const handleAction = async (n: Notification, act: string) => {
    if (act === 'pay_now') return window.open(`upi://pay?pa=${user.upiId}&am=${n.amount}`, '_blank');
    const res = await api.handleAction(user.id, n.id, act, n.transactionId || '', n.amount);
    if (res.success) { showToast("Action Dispatched", "success"); refreshAll(); fetchNotifs(); }
  };

  return (
    <div className="space-y-4 h-full flex flex-col pb-32 overflow-y-auto no-scrollbar">
      {notifs.map(n => (
        <div key={n.id} className={`card-ui bg-white dark:bg-slate-900 p-6 shadow-sm border-l-4 ${n.isResolved ? 'border-slate-100 opacity-50' : 'border-indigo-600'}`}>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-indigo-600">{n.senderName[0]}</div>
            <div className="flex-1">
              <p className="text-[11px] font-black dark:text-white leading-tight">{n.senderName} <span className="font-bold text-slate-400">{n.message}</span></p>
              {n.amount && <p className="text-xl font-black text-indigo-600 mt-1">₹{n.amount.toLocaleString()}</p>}
              {!n.isResolved && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleAction(n, 'approve')} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3 rounded-xl text-[9px] uppercase">Accept</button>
                  <button onClick={() => handleAction(n, 'reject')} className="flex-1 bg-slate-100 text-slate-400 font-black py-3 rounded-xl text-[9px] uppercase">Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Profile: React.FC<{ user: User, setUser: any }> = ({ user, setUser }) => {
  const { showToast } = useApp();
  const [mode, setMode] = useState(user.mode);

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    setUser({ ...user, mode: next });
    api.updateProfile(user.id, { mode: next });
    document.documentElement.classList.toggle('dark');
  };

  const handleUpdate = async (f: string, p: string, sensitive = false) => {
    const val = window.prompt(p, (user as any)[f] || '');
    if (!val) return;
    const confirmPass = sensitive ? window.prompt("Confirm Password:") : "dummy";
    const res = await api.updateProfile(user.id, { [f]: val }, confirmPass);
    if (res.success) { setUser({ ...user, [f]: val }); showToast("Profile Updated", "success"); }
  };

  return (
    <div className="space-y-8 pb-48 animate-in fade-in">
      <div className="card-ui bg-white dark:bg-slate-900 p-12 text-center shadow-xl">
        <div className="w-40 h-40 mx-auto mb-6 rounded-[3.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-5xl text-slate-300">
          {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-[3.5rem]" /> : user.username[0].toUpperCase()}
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{user.username}</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">{user.email}</p>
        <button onClick={toggleMode} className="w-full py-5 rounded-3xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase">Switch to {mode === 'dark' ? 'Light' : 'Dark'}</button>
      </div>
      <div className="card-ui bg-white dark:bg-slate-900 p-8 space-y-4 shadow-xl">
        <div onClick={() => handleUpdate('username', 'New display name:')} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase">Username</p>
          <p className="text-sm font-black dark:text-white">{user.username}</p>
        </div>
        <div onClick={() => handleUpdate('phoneNumber', 'New 10-digit number:', true)} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
          <p className="text-sm font-black dark:text-white">{user.phoneNumber || 'Not Set'}</p>
        </div>
        <div onClick={() => handleUpdate('upiId', 'New UPI ID:')} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase">UPI</p>
          <p className="text-sm font-black dark:text-white">{user.upiId || 'Add Link'}</p>
        </div>
      </div>
    </div>
  );
};

const VerificationModal: React.FC<{ user: User, onDone: any }> = ({ user, onDone }) => {
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [upi, setUpi] = useState(user.upiId || '');
  const [step, setStep] = useState(0);

  const handleSubmit = async () => {
    if (phone.length !== 10) return alert("Enter 10 digits");
    if (!upi.includes('@')) return alert("Enter valid UPI ID");
    if (step < 2) { setStep(s => s + 1); return; }
    const res = await api.updateProfile(user.id, { phoneNumber: phone, upiId: upi, isVerified: true }, "dummy");
    if (res.success) onDone({ ...user, phoneNumber: phone, upiId: upi, isVerified: true });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-12 text-center animate-in zoom-in-95">
        <div className={`w-20 h-20 ${step === 0 ? 'bg-indigo-600' : 'bg-red-500'} text-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
          <i className={`fa-solid ${step === 0 ? 'fa-id-card' : 'fa-triangle-exclamation'} text-3xl`}></i>
        </div>
        <h2 className="text-2xl font-black dark:text-white mb-2">{step === 0 ? 'Verify Profile' : `Warning ${step}/2`}</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase mb-8">{step === 0 ? 'Link Payment Identity' : 'Double check every digit!'}</p>
        {step === 0 ? (
          <div className="space-y-4 mb-10">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl font-black dark:text-white" placeholder="Phone Number" />
            <input type="text" value={upi} onChange={e => setUpi(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl font-black dark:text-white" placeholder="UPI ID (name@bank)" />
          </div>
        ) : <p className="text-slate-500 text-xs font-bold leading-relaxed mb-10">Incorrect details will lock you out of payments. Continue?</p>}
        <button onClick={handleSubmit} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px]">
          {step === 0 ? 'Initialize Node' : 'Confirm Accuracy'}
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<any>(null);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ff_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      if (!u.isVerified || !u.phoneNumber) setShowVerify(true);
    }
  }, []);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ff_user', JSON.stringify(u));
    if (!u.isVerified) setShowVerify(true);
  };

  const logout = () => { if (confirm("Log out?")) { setUser(null); localStorage.removeItem('ff_user'); setTab('home'); } };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <AppContext.Provider value={{ refreshAll: () => setRefreshKey(k => k + 1), showToast, refreshKey }}>
      <div className={`flex flex-col h-screen overflow-hidden ${user.mode === 'dark' ? 'dark' : ''}`}>
        <header className="flex items-center justify-between px-8 py-8 sticky top-0 bg-transparent z-50">
          <div className="flex items-center gap-5">
            <div onClick={() => setTab('home')} className="w-14 h-14 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-xl active:scale-90 transition-all cursor-pointer">F</div>
            <div className="hidden xs:block">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">FinanceFlow</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-40">Pocket Wealth OS</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRefreshKey(k => k + 1)} className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center text-slate-400 active:scale-75 transition-all"><i className="fa-solid fa-sync-alt"></i></button>
            <button onClick={logout} className="w-12 h-12 rounded-[1.25rem] bg-red-500/10 text-red-500 flex items-center justify-center active:scale-75 transition-all shadow-sm"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar px-6 max-w-2xl mx-auto w-full">
          {tab === 'home' && <Dashboard user={user} key={`d-${refreshKey}`} />}
          {tab === 'transactions' && <Transactions user={user} key={`t-${refreshKey}`} />}
          {tab === 'friends' && <Friends user={user} key={`f-${refreshKey}`} />}
          {tab === 'notifications' && <Notifications user={user} key={`n-${refreshKey}`} />}
          {tab === 'profile' && <Profile user={user} setUser={setUser} key={`p-${refreshKey}`} />}
        </main>
        <nav className="fixed bottom-10 left-8 right-8 h-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl flex justify-around items-center z-[100]">
          {['home', 'transactions', 'friends', 'notifications'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`text-3xl transition-all ${tab === t ? 'text-indigo-600 scale-125 -translate-y-2' : 'text-slate-200 dark:text-slate-800'}`}>
              <i className={`fa-solid ${t === 'home' ? 'fa-house' : t === 'transactions' ? 'fa-layer-group' : t === 'friends' ? 'fa-user-group' : 'fa-bell'}`}></i>
            </button>
          ))}
          <button onClick={() => setTab('profile')} className={`w-12 h-12 rounded-2xl overflow-hidden shadow-lg ${tab === 'profile' ? 'ring-4 ring-indigo-500' : ''}`}>
             {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-black">{user.username[0]}</div>}
          </button>
        </nav>
        {showVerify && <VerificationModal user={user} onDone={(u: any) => { setUser(u); localStorage.setItem('ff_user', JSON.stringify(u)); setShowVerify(false); }} />}
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-12">
            <div className="px-8 py-5 rounded-[2.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-2xl">{toast.msg}</div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
