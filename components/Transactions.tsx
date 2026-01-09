import React, { useState, useEffect, useMemo } from 'react';
import { User, TransactionType, PaymentMode, Friend } from '../types';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, TransactionType, PaymentMode, Category, Friend } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface TransactionsProps {
  user: User;
}

export const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  // Fix: Move refreshKey declaration above its usage in useEffect
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
    // Enforcement of 2-step warning for Friend/Split transactions as requested
    if (formType === 'Friend' || formType === 'Split') {
      const confirm1 = window.confirm("WARNING 1/2: Funds will be locked in PENDING until the other person approves. Correct?");
      if (!confirm1) return;
      const confirm2 = window.confirm("WARNING 2/2: Are you absolutely sure the amount and friend are correct?");
      if (!confirm2) return;
      const c1 = window.confirm("Split Confirmation: Notifications will be sent to all participants. Continue?");
      if (!c1) return;
    }

    const res = await api.saveTransaction(user.id, payload);
    if (res.success) {
      showToast("Record Securely Logged", "success");
      showToast("Transaction Recorded", "success");
      setActiveMode('History');
      refreshAll();
      fetchHistory();
    } else {
      showToast(res.error || "Save Failed", "error");
      showToast(res.error || "Save failed", "error");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl p-1.5 rounded-[2.5rem] shadow-2xl sticky top-2 z-50 mx-2">
        <button onClick={() => setActiveMode('History')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>Activity</button>
        <button onClick={() => setActiveMode('Add')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'Add' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>Create</button>
      <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-1.5 rounded-[2rem] shadow-xl sticky top-0 z-50 mx-2 mt-2">
        <button onClick={() => setActiveMode('History')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg' : 'text-slate-400'}`}>Activity Log</button>
        <button onClick={() => setActiveMode('Add')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'Add' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg' : 'text-slate-400'}`}>New Transaction</button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pb-40 px-2">
        {activeMode === 'History' ? (
          <TransactionList history={history} user={user} />
        ) : (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="flex justify-around bg-slate-200/30 dark:bg-slate-800/30 p-1.5 rounded-full shadow-inner">
              {['Simple', 'Friend', 'Split'].map((t) => (
                <button key={t} onClick={() => setFormType(t as any)} className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${formType === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>
            <div className="animate-in slide-in-from-bottom-8 duration-700">
            
            <div className="px-1 animate-in slide-in-from-bottom-6 duration-700">
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

const ModePicker = ({ mode, setMode }: { mode: PaymentMode, setMode: (m: PaymentMode) => void }) => (
  <div className="grid grid-cols-2 gap-4">
    {(['Online', 'Cash'] as PaymentMode[]).map(m => (
      <button key={m} onClick={() => setMode(m)} className={`relative group flex flex-col items-center gap-3 p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === m ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-900 shadow-2xl scale-[1.05]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}>
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${mode === m ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
            <i className={`fa-solid ${m === 'Online' ? 'fa-globe' : 'fa-money-bill-wave'}`}></i>
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest ${mode === m ? 'text-white' : 'text-slate-400'}`}>{m}</span>
      </button>
    ))}
    <button onClick={() => setMode('Online')} className={`group flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 ${mode === 'Online' ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-900 shadow-xl scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}>
       <i className={`fa-solid fa-globe text-2xl ${mode === 'Online' ? 'text-white' : 'text-slate-300'}`}></i>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Online' ? 'text-white' : 'text-slate-400'}`}>Online</span>
    </button>
    <button onClick={() => setMode('Cash')} className={`group flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 ${mode === 'Cash' ? 'bg-emerald-600 border-emerald-200 dark:border-emerald-900 shadow-xl scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}>
       <i className={`fa-solid fa-money-bill-wave text-2xl ${mode === 'Cash' ? 'text-white' : 'text-slate-300'}`}></i>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Cash' ? 'text-white' : 'text-slate-400'}`}>Cash</span>
    </button>
  </div>
);

const CategorySelector = ({ categories, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: any) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between px-2">
      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Classification</p>
      {selectedCat !== -1 && <span className="text-[8px] font-black text-indigo-500 uppercase">Selected</span>}
    </div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {categories.map((c: Category, i: number) => (
        <button key={i} onClick={() => { setSelectedCat(i); setSelectedSub(''); }} className={`px-8 py-4 rounded-[1.5rem] whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${selectedCat === i ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{c.name}</button>
      ))}
    </div>
    
    {selectedCat !== -1 && categories[selectedCat].subcategories.length > 0 && (
      <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
        {categories[selectedCat].subcategories.map((sub: string) => (
          <button key={sub} onClick={() => setSelectedSub(sub)} className={`px-5 py-2.5 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${selectedSub === sub ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border-transparent shadow-sm'}`}>{sub}</button>
        ))}
      </div>
    )}
  </div>
);

const TransactionList = ({ history, user }: { history: any[], user: User }) => {
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense' | 'Pending'>('All');
  const filteredHistory = useMemo(() => {
    if (filter === 'All') return history;
    if (filter === 'Pending') return history.filter(t => t.status === 'Pending');
    return history.filter(t => t.type === filter);
  }, [history, filter]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {['All', 'Income', 'Expense', 'Pending'].map(f => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-8 py-3.5 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'bg-white dark:bg-slate-900 text-slate-400'}`}>{f}</button>
          <button 
            key={f} 
            onClick={() => setFilter(f as any)} 
            className={`px-7 py-3 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-500'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm active:scale-95 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${t.type.includes('In') || t.type.includes('Taken') || t.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fa-solid ${t.type.includes('In') || t.type.includes('Taken') || t.type === 'Income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm active:scale-95 transition-all group border border-slate-50 dark:border-slate-800 relative overflow-hidden">
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${t.type === 'Income' || t.type === 'Money Taken' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} transition-all group-hover:rotate-6`}>
                <i className={`fa-solid ${t.type === 'Income' || t.type === 'Money Taken' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{t.category}</p>
                  {t.status === 'Pending' && <span className="bg-yellow-400 text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Locked</span>}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[140px] opacity-70">{t.notes || t.type}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 relative z-10">
              <p className={`text-lg font-black ${t.type.includes('In') || t.type.includes('Taken') || t.type === 'Income' ? 'text-green-600' : 'text-red-500'}`}>₹{(t.amount || 0).toLocaleString()}</p>
              <p className="text-[8px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-tighter">{new Date(t.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[140px] opacity-70">{t.notes || t.subcategory || 'Transaction'}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 relative z-10">
              <p className={`text-lg font-black ${t.type === 'Income' || t.type === 'Money Taken' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'Income' || t.type === 'Money Taken' ? '+' : '-'}₹{(t.amount || 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-slate-300 dark:text-slate-700 font-black uppercase tracking-tighter">{new Date(t.timestamp).toLocaleDateString()}</p>
            </div>
            <div className="absolute top-0 left-0 w-1 h-full opacity-30" style={{ backgroundColor: t.type === 'Income' ? '#10b981' : '#ef4444' }}></div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="py-24 text-center opacity-40">
            <i className="fa-solid fa-receipt text-5xl mb-6 block text-slate-100"></i>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Memory is empty</p>
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
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10">
      <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setType('Income')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${type === 'Income' ? 'bg-green-500 text-white shadow-xl' : 'text-slate-400'}`}>Money In</button>
        <button onClick={() => setType('Expense')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${type === 'Expense' ? 'bg-red-500 text-white shadow-xl' : 'text-slate-400'}`}>Money Out</button>
      </div>
      <div className="text-center py-4">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>
      <ModeSelector mode={mode} setMode={setMode} />
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Category</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {['Food', 'Leisure', 'Transport', 'Shopping', 'Utilities'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all ${category === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{cat}</button>
          ))}
        </div>
      </div>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 px-8 text-sm font-bold dark:text-white shadow-inner" />
      <button disabled={!amount || !category} onClick={() => onSave({ type, amount: parseFloat(amount), mode, category, notes, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Record Entry</button>
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-8">
      <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setType('Income')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Income' ? 'bg-green-500 text-white shadow-xl' : 'text-slate-400'}`}>Received</button>
        <button onClick={() => setType('Expense')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Expense' ? 'bg-red-500 text-white shadow-xl' : 'text-slate-400'}`}>Spent</button>
      </div>
      
      <div className="text-center py-4 relative">
        <span className="absolute left-0 right-0 top-0 text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] pointer-events-none">Enter Amount</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-8xl font-black text-slate-900 dark:text-white placeholder:text-slate-50 dark:placeholder:text-slate-800 focus:ring-0" />
      </div>

      <ModePicker mode={mode} setMode={setMode} />

      <CategorySelector categories={user.categories} selectedCat={selectedCat} setSelectedCat={setSelectedCat} selectedSub={selectedSub} setSelectedSub={setSelectedSub} />

      <div className="relative group">
        <i className="fa-solid fa-pen-nib absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-indigo-500 transition-colors"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's the story?" className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 pl-14 pr-6 text-sm font-bold dark:text-white shadow-inner focus:ring-2 focus:ring-indigo-500/10 transition-all" />
      </div>
      
      <button 
        disabled={!amount || selectedCat === -1}
        onClick={() => onSave({ type, amount: parseFloat(amount), mode, category: user.categories[selectedCat].name, subcategory: selectedSub, notes, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] uppercase tracking-[0.3em] text-[11px] disabled:opacity-30 active:scale-95 transition-all mt-4"
      >
        Save Transaction
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
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10">
      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-[2rem] shadow-inner">
        {['Money Given', 'Money Taken', 'He Paid Back', 'I Paid Back'].map(o => (
          <button key={o} onClick={() => setOption(o as any)} className={`py-4 rounded-full text-[8px] font-black uppercase tracking-tight transition-all ${option === o ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>{o}</button>
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-8">
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] shadow-inner">
        {['Money Given', 'Money Taken', 'He Paid Back', 'I Paid Back'].map(o => (
          <button key={o} onClick={() => setOption(o as any)} className={`py-4 rounded-full text-[8px] font-black uppercase tracking-tight transition-all duration-300 ${option === o ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400'}`}>{o}</button>
        ))}
      </div>
      <div className="text-center py-4">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Involved Partner</p>
        <div className="flex gap-6 overflow-x-auto no-scrollbar px-2 py-4">
          {friends.map(f => (
            <button key={f.id} onClick={() => setSelectedFriend(f.id)} className={`flex flex-col items-center gap-3 transition-all ${selectedFriend === f.id ? 'scale-110' : 'opacity-30 grayscale'}`}>
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center font-black text-xl shadow-2xl transition-all ${selectedFriend === f.id ? 'bg-indigo-600 text-white shadow-indigo-500/50 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-sm'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-16 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      <ModeSelector mode={mode} setMode={setMode} />
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add transaction note..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 px-8 text-sm font-bold dark:text-white shadow-inner" />
      <button disabled={!selectedFriend || !amount} onClick={() => onSave({ type: option, amount: parseFloat(amount), friendId: selectedFriend, category: 'Personal', notes, mode, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Submit Secure Entry</button>
        <div className="flex items-center justify-between px-2">
          <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Select Friend</p>
          <button className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">+ New Friend</button>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-1 py-4">
          {friends.map(f => (
            <button key={f.id} onClick={() => setSelectedFriend(f.id)} className={`flex flex-col items-center gap-3 transition-all duration-300 ${selectedFriend === f.id ? 'scale-110' : 'opacity-40 grayscale'}`}>
              <div className={`w-16 h-16 rounded-[2.25rem] flex items-center justify-center font-black text-xl shadow-2xl transition-all ${selectedFriend === f.id ? 'bg-indigo-600 text-white shadow-indigo-500/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-sm'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-16 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
          {friends.length === 0 && <p className="text-[9px] text-slate-300 italic p-4 text-center w-full">Connect with friends first</p>}
        </div>
      </div>

      <ModePicker mode={mode} setMode={setMode} />

      <div className="relative">
        <i className="fa-solid fa-message absolute left-6 top-1/2 -translate-y-1/2 text-slate-200"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief reason..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 pl-14 pr-6 text-sm font-bold dark:text-white shadow-inner" />
      </div>
      
      <button 
        disabled={!selectedFriend || !amount}
        onClick={() => onSave({ type: option, amount: parseFloat(amount), friendId: selectedFriend, category: 'Personal', notes, mode, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-4"
      >
        Lock Deal
      </button>
    </div>
  );
};

// ADVANCED SPLIT FORM WITH LOCKING LOGIC
const SplitForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [total, setTotal] = useState('');
  const [splitType, setSplitType] = useState<'Equal' | 'Custom'>('Equal');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set([user.id]));
  const [shares, setShares] = useState<Record<string, number>>({});
  const [payerId, setPayerId] = useState(user.id);
  const [mode, setMode] = useState<PaymentMode>('Online');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => {
      if(res.success) {
        setParticipants([{ id: user.id, name: 'Myself' }, ...res.friends]);
      }
    });
  }, [user.id]);

  useEffect(() => {
    const t = parseFloat(total) || 0;
    const ids = Array.from(selectedParticipants);
    if (splitType === 'Equal' && ids.length > 0) {
      const share = t / ids.length;
      const s: any = {};
      ids.forEach(id => s[id] = parseFloat(share.toFixed(2)));
      setShares(s);
    }
  }, [total, selectedParticipants, splitType]);

  const toggleParticipant = (id: string) => {
    if (id === user.id) return;
    if (id === user.id) return; // Always keep me in participants for now
    const next = new Set(selectedParticipants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedParticipants(next);
  };

  const handleCustomChange = (id: string, val: string) => {
    setShares(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
    setLocks(new Set()); // Reset locks when participant list changes
  };

  const calculateShares = (billTotal: number, ids: string[], type: 'Equal' | 'Custom', activeLocks: Set<string>, currentShares: Record<string, number>) => {
    if (ids.length === 0) return {};
    const s: any = { ...currentShares };

    if (type === 'Equal') {
      const share = billTotal / ids.length;
      ids.forEach(id => s[id] = parseFloat(share.toFixed(2)));
    } else {
      // Custom redistribution logic
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
    
    // Auto-lock the edited user
    const nextLocks = new Set(locks);
    nextLocks.add(id);
    
    // Don't lock the last person if possible to keep them as the auto-balancer
    const selectedIds = Array.from(selectedParticipants);
    if (nextLocks.size >= selectedIds.length) {
       // Unlock the first locked person if all are locked to allow rebalancing
       const first = Array.from(nextLocks)[0];
       nextLocks.delete(first);
    }
    
    setLocks(nextLocks);
    setShares(calculateShares(t, selectedIds, 'Custom', nextLocks, nextShares));
  };

  const currentSharesSum = Array.from(selectedParticipants).reduce((acc, id) => acc + (shares[id] || 0), 0);
  const isBalanced = Math.abs(currentSharesSum - (parseFloat(total) || 0)) < 0.5;

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10">
      <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setSplitType('Equal')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase transition-all ${splitType === 'Equal' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Equal</button>
        <button onClick={() => setSplitType('Custom')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase transition-all ${splitType === 'Custom' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Custom</button>
      </div>
      <div className="text-center py-4">
        <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Participants</p>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-2 py-4">
          {participants.map(f => (
            <button key={f.id} onClick={() => toggleParticipant(f.id)} className={`flex flex-col items-center gap-3 transition-all ${selectedParticipants.has(f.id) ? 'scale-110' : 'opacity-30 grayscale'}`}>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg shadow-xl transition-all ${selectedParticipants.has(f.id) ? 'bg-indigo-600 text-white shadow-indigo-500/40 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{f.name[0]}</div>
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-8">
      <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] shadow-inner">
        <button onClick={() => setSplitType('Equal')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${splitType === 'Equal' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Split Fairly</button>
        <button onClick={() => setSplitType('Custom')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${splitType === 'Custom' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Custom Shares</button>
      </div>

      <div className="text-center py-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Total Amount to Divide</p>
        <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-8xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>

      <div className="space-y-5">
        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Who's involved?</p>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-2 py-4">
          {participants.map(f => (
            <button key={f.id} onClick={() => toggleParticipant(f.id)} className={`flex flex-col items-center gap-3 transition-all duration-300 ${selectedParticipants.has(f.id) ? 'scale-110 active:scale-95' : 'opacity-30 grayscale hover:opacity-60'}`}>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl shadow-lg transition-all ${selectedParticipants.has(f.id) ? 'bg-indigo-600 text-white shadow-indigo-500/40 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-14 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      {splitType === 'Custom' && (
        <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {Array.from(selectedParticipants).map(id => (
            <div key={id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{participants.find(x => x.id === id)?.name}</span>
              <input type="number" value={shares[id] || 0} onChange={e => handleCustomChange(id, e.target.value)} className="w-24 bg-transparent border-none text-right font-black text-lg dark:text-white" />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Who Paid?</label>
          <select value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 font-black text-[10px] dark:text-white appearance-none text-center">
             {participants.filter(p => selectedParticipants.has(p.id)).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 font-black text-[10px] dark:text-white appearance-none text-center">
             <option value="Online">Online</option>
             <option value="Cash">Cash</option>
          </select>
        </div>
      </div>
      <button disabled={!total || !isBalanced} onClick={() => onSave({ type: 'Split', amount: parseFloat(total), payerId, participants: Array.from(selectedParticipants).map(id => ({ userId: id, share: shares[id] })), category: 'Split Bill', notes: 'Group expense', mode, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[3rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Blast Split Bill</button>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
           <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Calculated Shares</p>
           {total && !isBalanced && <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">Out of Sync</span>}
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1 pb-4">
          {Array.from(selectedParticipants).map(id => {
            const p = participants.find(x => x.id === id);
            const isLocked = locks.has(id);
            return (
              <div key={id} className={`flex items-center justify-between p-6 rounded-[2.25rem] transition-all duration-300 border-2 ${isLocked ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${isLocked ? 'bg-indigo-600 text-white animate-in zoom-in-50' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                    {isLocked ? <i className="fa-solid fa-lock"></i> : p?.name[0]}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{p?.name}</span>
                    {isLocked && <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Value Locked</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-black text-xs">₹</span>
                  <input 
                    type="number" 
                    readOnly={splitType === 'Equal'}
                    value={shares[id] || 0} 
                    onChange={(e) => handleCustomChange(id, e.target.value)}
                    onFocus={() => splitType === 'Equal' && setSplitType('Custom')}
                    className={`w-28 bg-transparent border-none text-right font-black p-0 focus:ring-0 text-xl dark:text-white transition-opacity ${splitType === 'Equal' ? 'opacity-50' : 'opacity-100'}`} 
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 dark:bg-white rounded-[2rem] shadow-2xl">
           <p className="text-[9px] font-black text-white/50 dark:text-slate-400 uppercase tracking-widest">Total of Shares</p>
           <p className="text-xl font-black text-white dark:text-slate-900">₹{currentSharesSum.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Who's Paying?</p>
          <div className="relative">
            <select value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] py-5 px-6 font-black text-[10px] uppercase tracking-widest dark:text-white appearance-none text-center shadow-inner">
               {participants.filter(p => selectedParticipants.has(p.id)).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[8px]"></i>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Mode</p>
          <div className="relative">
            <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] py-5 px-6 font-black text-[10px] uppercase tracking-widest dark:text-white appearance-none text-center shadow-inner">
               <option value="Online">Online</option>
               <option value="Cash">Cash</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[8px]"></i>
          </div>
        </div>
      </div>

      <CategorySelector categories={user.categories} selectedCat={selectedCat} setSelectedCat={setSelectedCat} selectedSub={selectedSub} setSelectedSub={setSelectedSub} />

      <div className="relative">
        <i className="fa-solid fa-note-sticky absolute left-6 top-1/2 -translate-y-1/2 text-slate-200"></i>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add specific notes for everyone..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 pl-14 pr-6 text-sm font-bold dark:text-white shadow-inner" />
      </div>

      <button 
        disabled={!total || !isBalanced || selectedCat === -1}
        onClick={() => onSave({ type: 'Split', amount: parseFloat(total), payerId, participants: Array.from(selectedParticipants).map(id => ({ userId: id, share: shares[id] })), category: user.categories[selectedCat].name, subcategory: selectedSub, notes, mode, timestamp: new Date().toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-[0_35px_70px_-15px_rgba(0,0,0,0.4)] uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-6"
      >
        Blast Split Request
      </button>
    </div>
  );
};
