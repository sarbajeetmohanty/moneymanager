
import React, { useState, useEffect, useMemo } from 'react';
import { User, TransactionType, PaymentMode, Category, Friend } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface TransactionsProps {
  user: User;
}

export const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const { refreshAll, showToast, refreshKey } = useApp();
  const [activeMode, setActiveMode] = useState<'History' | 'Add'>('History');
  const [formType, setFormType] = useState<'Simple' | 'Friend' | 'Split'>('Simple');
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const res = await api.fetchTransactionHistory(user.id);
    if (res.success) setHistory(res.history);
  };

  useEffect(() => {
    if (activeMode === 'History') fetchHistory();
  }, [activeMode, user.id, refreshKey]);

  const handleSave = async (payload: any) => {
    if (formType === 'Friend' || formType === 'Split') {
      const c1 = window.confirm("Transaction Security: This will create a pending record and notify involved parties. Continue?");
      if (!c1) return;
    }

    const res = await api.saveTransaction(user.id, payload);
    if (res.success) {
      showToast("Transaction Logged", "success");
      setActiveMode('History');
      refreshAll();
    } else {
      showToast(res.error || "Failed to save", "error");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl p-1.5 rounded-[2.5rem] shadow-2xl sticky top-2 z-50 mx-2">
        <button onClick={() => setActiveMode('History')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>Activity</button>
        <button onClick={() => setActiveMode('Add')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'Add' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>New Record</button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pb-40 px-2">
        {activeMode === 'History' ? (
          <TransactionList history={history} user={user} />
        ) : (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="flex justify-around bg-slate-200/30 dark:bg-slate-800/30 p-1.5 rounded-full shadow-inner">
              {['Simple', 'Friend', 'Split'].map((t) => (
                <button key={t} onClick={() => setFormType(t as any)} className={`flex-1 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${formType === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>
            
            <div className="animate-in slide-in-from-bottom-8 duration-700">
              {formType === 'Simple' && <SimpleForm onSave={handleSave} user={user} />}
              {formType === 'Friend' && <FriendForm onSave={handleSave} user={user} />}
              {formType === 'Split' && <SplitForm onSave={handleSave} user={user} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModeSelector = ({ mode, setMode }: { mode: PaymentMode, setMode: (m: PaymentMode) => void }) => (
  <div className="grid grid-cols-2 gap-4">
    <button 
      onClick={() => setMode('Online')} 
      className={`relative group flex flex-col items-center gap-3 p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === 'Online' ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-900 shadow-2xl scale-[1.05]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}
    >
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${mode === 'Online' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
          <i className="fa-solid fa-globe"></i>
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Online' ? 'text-white' : 'text-slate-400'}`}>Online</span>
       {mode === 'Online' && <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full"></div>}
    </button>
    <button 
      onClick={() => setMode('Cash')} 
      className={`relative group flex flex-col items-center gap-3 p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === 'Cash' ? 'bg-emerald-600 border-emerald-200 dark:border-emerald-900 shadow-2xl scale-[1.05]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}
    >
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${mode === 'Cash' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
          <i className="fa-solid fa-money-bill-wave"></i>
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Cash' ? 'text-white' : 'text-slate-400'}`}>Cash</span>
       {mode === 'Cash' && <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full"></div>}
    </button>
  </div>
);

const TransactionList = ({ history, user }: { history: any[], user: User }) => {
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense' | 'Pending'>('All');

  const filteredHistory = useMemo(() => {
    if (filter === 'All') return history;
    if (filter === 'Pending') return history.filter(t => t.status === 'Pending' || t.status === 'Paid');
    return history.filter(t => t.type === filter);
  }, [history, filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {['All', 'Income', 'Expense', 'Pending'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f as any)} 
            className={`px-8 py-3.5 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'bg-white dark:bg-slate-900 text-slate-400'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm active:scale-95 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${t.type === 'Income' || t.type === 'Money Taken' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} transition-all group-hover:rotate-12`}>
                <i className={`fa-solid ${t.type === 'Income' || t.type === 'Money Taken' ? 'fa-plus' : 'fa-minus'}`}></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{t.category}</p>
                  {(t.status === 'Pending' || t.status === 'Paid') && <span className="bg-amber-400 text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Pending</span>}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[140px] opacity-70">{t.notes || t.subcategory || 'Transaction'}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 relative z-10">
              <p className={`text-lg font-black ${t.type === 'Income' || t.type === 'Money Taken' ? 'text-green-600' : 'text-red-500'}`}>
                ₹{(t.amount || 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-tighter">{new Date(t.timestamp).toLocaleDateString()}</p>
            </div>
            <div className={`absolute left-0 top-0 w-1 h-full ${t.type === 'Income' ? 'bg-green-500' : 'bg-red-500'} opacity-30`}></div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="py-24 text-center opacity-30">
            <i className="fa-solid fa-ghost text-5xl mb-6 block text-slate-200"></i>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nothing recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SimpleForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');
  const [selectedCat, setSelectedCat] = useState<number>(-1);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [notes, setNotes] = useState('');

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10 border border-slate-50 dark:border-slate-800">
      <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setType('Income')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Income' ? 'bg-green-500 text-white shadow-xl' : 'text-slate-400'}`}>Money In</button>
        <button onClick={() => setType('Expense')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Expense' ? 'bg-red-500 text-white shadow-xl' : 'text-slate-400'}`}>Money Out</button>
      </div>
      
      <div className="text-center py-4 relative group">
        <span className="absolute -top-6 left-0 right-0 text-[10px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-[0.5em] group-focus-within:text-indigo-500 transition-colors">Amount</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-8xl font-black text-slate-900 dark:text-white placeholder:text-slate-50 dark:placeholder:text-slate-800 focus:ring-0" />
      </div>

      <ModeSelector mode={mode} setMode={setMode} />

      <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Classification</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {user.categories.map((c, i) => (
            <button key={i} onClick={() => { setSelectedCat(i); setSelectedSub(''); }} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${selectedCat === i ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{c.name}</button>
          ))}
        </div>
        {selectedCat !== -1 && user.categories[selectedCat].subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem]">
            {user.categories[selectedCat].subcategories.map(sub => (
              <button key={sub} onClick={() => setSelectedSub(sub)} className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${selectedSub === sub ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border-transparent shadow-sm'}`}>{sub}</button>
            ))}
          </div>
        )}
      </div>

      <div className="relative group">
        <i className="fa-solid fa-pen-fancy absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold dark:text-white shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all" />
      </div>
      
      <button 
        disabled={!amount || selectedCat === -1}
        onClick={() => onSave({ type, amount: parseFloat(amount), mode, category: user.categories[selectedCat].name, subcategory: selectedSub, notes, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-6"
      >
        Confirm Transaction
      </button>
    </div>
  );
};

const FriendForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [option, setOption] = useState<TransactionType>('Money Given');
  const [amount, setAmount] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => res.success && setFriends(res.friends));
  }, [user.id]);

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10 border border-slate-50 dark:border-slate-800">
      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-[2rem] shadow-inner">
        {['Money Given', 'Money Taken', 'He Paid Back', 'I Paid Back'].map(o => (
          <button key={o} onClick={() => setOption(o as any)} className={`py-4 rounded-full text-[8px] font-black uppercase tracking-tight transition-all duration-300 ${option === o ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>{o}</button>
        ))}
      </div>
      
      <div className="text-center py-4">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-8xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>
      
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Select Friend</p>
        <div className="flex gap-6 overflow-x-auto no-scrollbar px-2 py-4">
          {friends.map(f => (
            <button key={f.id} onClick={() => setSelectedFriend(f.id)} className={`flex flex-col items-center gap-3 transition-all duration-300 ${selectedFriend === f.id ? 'scale-110 active:scale-95' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}>
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center font-black text-xl shadow-2xl transition-all ${selectedFriend === f.id ? 'bg-indigo-600 text-white shadow-indigo-500/50 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-sm'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-16 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
          {friends.length === 0 && <p className="text-[10px] text-slate-300 italic p-4 text-center w-full">No active connections</p>}
        </div>
      </div>

      <ModeSelector mode={mode} setMode={setMode} />

      <div className="relative group">
        <i className="fa-solid fa-message absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a short reason..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 pl-16 pr-8 text-sm font-bold dark:text-white shadow-inner" />
      </div>
      
      <button 
        disabled={!selectedFriend || !amount}
        onClick={() => onSave({ type: option, amount: parseFloat(amount), friendId: selectedFriend, category: 'Personal', notes, mode, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-6"
      >
        Lock Record
      </button>
    </div>
  );
};

const SplitForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [total, setTotal] = useState('');
  const [splitType, setSplitType] = useState<'Equal' | 'Custom'>('Equal');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set([user.id]));
  const [shares, setShares] = useState<Record<string, number>>({});
  const [locks, setLocks] = useState<Set<string>>(new Set());
  const [payerId, setPayerId] = useState(user.id);
  const [selectedCat, setSelectedCat] = useState<number>(-1);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => {
      if(res.success) {
        const list = [{ id: user.id, name: 'Me' }, ...res.friends];
        setParticipants(list);
      }
    });
  }, [user.id]);

  const toggleParticipant = (id: string) => {
    if (id === user.id) return; // Keep self included
    const next = new Set(selectedParticipants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedParticipants(next);
    setLocks(new Set()); // Reset locks
  };

  const calculateShares = (billTotal: number, ids: string[], type: 'Equal' | 'Custom', activeLocks: Set<string>, currentShares: Record<string, number>) => {
    if (ids.length === 0) return {};
    const s: any = { ...currentShares };

    if (type === 'Equal') {
      const share = billTotal / ids.length;
      ids.forEach(id => s[id] = parseFloat(share.toFixed(2)));
    } else {
      const selectedIds = Array.from(ids);
      const nonLocked = selectedIds.filter(x => !activeLocks.has(x));
      const sumLocked = selectedIds.filter(x => activeLocks.has(x)).reduce((acc, x) => acc + (currentShares[x] || 0), 0);
      
      if (nonLocked.length > 0) {
        const remaining = billTotal - sumLocked;
        const perPerson = Math.max(0, remaining / nonLocked.length);
        nonLocked.forEach(x => s[x] = parseFloat(perPerson.toFixed(2)));
      }
    }
    return s;
  };

  useEffect(() => {
    const t = parseFloat(total) || 0;
    const ids = Array.from(selectedParticipants);
    setShares(calculateShares(t, ids, splitType, locks, shares));
  }, [total, selectedParticipants, splitType]);

  const handleCustomChange = (id: string, val: string) => {
    const numeric = parseFloat(val) || 0;
    const t = parseFloat(total) || 0;
    const nextShares = { ...shares, [id]: numeric };
    const nextLocks = new Set(locks);
    nextLocks.add(id);
    
    const selectedIds = Array.from(selectedParticipants);
    if (nextLocks.size >= selectedIds.length) {
       const first = Array.from(nextLocks)[0];
       nextLocks.delete(first);
    }
    
    setLocks(nextLocks);
    setShares(calculateShares(t, selectedIds, 'Custom', nextLocks, nextShares));
  };

  const currentSum = Array.from(selectedParticipants).reduce((acc, id) => acc + (shares[id] || 0), 0);
  const isBalanced = Math.abs(currentSum - (parseFloat(total) || 0)) < 0.5;

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10 border border-slate-50 dark:border-slate-800">
      <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setSplitType('Equal')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${splitType === 'Equal' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Split Fairly</button>
        <button onClick={() => setSplitType('Custom')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${splitType === 'Custom' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Custom Shares</button>
      </div>

      <div className="text-center py-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Total Bill Amount</p>
        <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-8xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>

      <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Participants</p>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-2 py-4">
          {participants.map(f => (
            <button key={f.id} onClick={() => toggleParticipant(f.id)} className={`flex flex-col items-center gap-3 transition-all duration-300 ${selectedParticipants.has(f.id) ? 'scale-110' : 'opacity-30 grayscale'}`}>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg shadow-xl transition-all ${selectedParticipants.has(f.id) ? 'bg-indigo-600 text-white shadow-indigo-500/40 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-14 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
           <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Calculated Dues</p>
           {total && !isBalanced && <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">Out of Sync</span>}
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-1 pb-6">
          {Array.from(selectedParticipants).map(id => {
            const p = participants.find(x => x.id === id);
            const isLocked = locks.has(id);
            return (
              <div key={id} className={`flex items-center justify-between p-7 rounded-[2.5rem] transition-all duration-300 border-2 ${isLocked ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-all ${isLocked ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                    {isLocked ? <i className="fa-solid fa-lock"></i> : p?.name[0]}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{p?.name}</span>
                    {isLocked && <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1 animate-in fade-in">Locked</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-black text-sm">₹</span>
                  <input 
                    type="number" 
                    readOnly={splitType === 'Equal'}
                    value={shares[id] || 0} 
                    onChange={(e) => handleCustomChange(id, e.target.value)}
                    onFocus={() => splitType === 'Equal' && setSplitType('Custom')}
                    className={`w-28 bg-transparent border-none text-right font-black p-0 focus:ring-0 text-2xl dark:text-white transition-opacity ${splitType === 'Equal' ? 'opacity-40' : 'opacity-100'}`} 
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center px-8 py-5 bg-slate-900 dark:bg-white rounded-[2.5rem] shadow-2xl">
           <p className="text-[10px] font-black text-white/50 dark:text-slate-400 uppercase tracking-widest">Total Dues Sum</p>
           <p className="text-2xl font-black text-white dark:text-slate-900">₹{currentSum.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Who Paid?</p>
          <div className="relative">
            <select value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 px-8 font-black text-[10px] uppercase tracking-widest dark:text-white appearance-none text-center shadow-inner">
               {participants.filter(p => selectedParticipants.has(p.id)).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[8px]"></i>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Payment Mode</p>
          <div className="relative">
            <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 px-8 font-black text-[10px] uppercase tracking-widest dark:text-white appearance-none text-center shadow-inner">
               <option value="Online">Online</option>
               <option value="Cash">Cash</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[8px]"></i>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Category</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {user.categories.map((c, i) => (
            <button key={i} onClick={() => { setSelectedCat(i); setSelectedSub(''); }} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${selectedCat === i ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="relative group">
        <i className="fa-solid fa-note-sticky absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add split notes..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] py-7 pl-16 pr-8 text-sm font-bold dark:text-white shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all" />
      </div>

      <button 
        disabled={!total || !isBalanced || selectedCat === -1}
        onClick={() => onSave({ type: 'Split', amount: parseFloat(total), payerId, participants: Array.from(selectedParticipants).map(id => ({ userId: id, share: shares[id] })), category: user.categories[selectedCat].name, subcategory: selectedSub, notes, mode, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-8"
      >
        Blast Split Request
      </button>
    </div>
  );
};
