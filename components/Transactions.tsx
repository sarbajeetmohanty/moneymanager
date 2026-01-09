import React, { useState, useEffect, useMemo } from 'react';
import { User, TransactionType, PaymentMode, Friend } from '../types';
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
    // Enforcement of 2-step warning for non-simple transactions
    if (formType === 'Friend' || formType === 'Split') {
      const confirm1 = window.confirm("WARNING 1/2: This transaction will lock funds in a PENDING STATE. Please verify amount and mode.");
      if (!confirm1) return;
      const confirm2 = window.confirm("FINAL WARNING 2/2: Once saved, involved users will be notified to approve. Proceed?");
      if (!confirm2) return;
    }

    const res = await api.saveTransaction(user.id, payload);
    if (res.success) {
      showToast("Transaction logged successfully", "success");
      setActiveMode('History');
      refreshAll();
    } else {
      showToast(res.error || "Failed to save", "error");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl p-1.5 rounded-[2.5rem] shadow-2xl sticky top-2 z-50 mx-2">
        <button onClick={() => setActiveMode('History')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${activeMode === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>Transaction Feed</button>
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
    {(['Online', 'Cash'] as PaymentMode[]).map(m => (
      <button key={m} onClick={() => setMode(m)} className={`relative group flex flex-col items-center gap-3 p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === m ? 'bg-indigo-600 border-indigo-200 dark:border-indigo-900 shadow-2xl scale-[1.05]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}>
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${mode === m ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
            <i className={`fa-solid ${m === 'Online' ? 'fa-globe' : 'fa-money-bill-wave'}`}></i>
         </div>
         <span className={`text-[10px] font-black uppercase tracking-widest ${mode === m ? 'text-white' : 'text-slate-400'}`}>{m}</span>
      </button>
    ))}
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
          <button key={f} onClick={() => setFilter(f as any)} className={`px-8 py-3.5 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'bg-white dark:bg-slate-900 text-slate-400'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm active:scale-95 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${t.type.includes('In') || t.type.includes('Taken') || t.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fa-solid ${t.type.includes('In') || t.type.includes('Taken') || t.type === 'Income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{t.category}</p>
                  {(t.status === 'Pending' || t.status === 'Paid') && <span className="bg-amber-400 text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Pending</span>}
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
      </div>
    </div>
  );
};

const SimpleForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');
  const [selectedCat, setSelectedCat] = useState<string>('');
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
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Select Category</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {(user.categories && user.categories.length > 0 ? user.categories : [{name: 'Food'}, {name: 'Travel'}, {name: 'Rent'}]).map((c, i) => (
            <button key={i} onClick={() => setSelectedCat(c.name)} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all ${selectedCat === c.name ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add note..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 px-8 text-sm font-bold dark:text-white shadow-inner" />
      <button disabled={!amount || !selectedCat} onClick={() => onSave({ type, amount: parseFloat(amount), mode, category: selectedCat, notes, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Save Transaction</button>
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
  const [category, setCategory] = useState('Personal');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => res.success && setFriends(res.friends));
  }, [user.id]);

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl space-y-10">
      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-[2rem] shadow-inner">
        {['Money Given', 'Money Taken', 'He Paid Back', 'I Paid Back'].map(o => (
          <button key={o} onClick={() => setOption(o as any)} className={`py-4 rounded-full text-[8px] font-black uppercase tracking-tight transition-all ${option === o ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>{o}</button>
        ))}
      </div>
      <div className="text-center py-4">
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white focus:ring-0" />
      </div>
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Select Friend Profile</p>
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
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest ml-4">Category</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {['Personal', 'Lunch', 'Borrow', 'Loan'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${category === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{cat}</button>
          ))}
        </div>
      </div>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add note..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl py-6 px-8 text-sm font-bold dark:text-white shadow-inner" />
      <button disabled={!selectedFriend || !amount} onClick={() => onSave({ type: option, amount: parseFloat(amount), friendId: selectedFriend, category, notes, mode, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Record Activity</button>
    </div>
  );
};

const SplitForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [total, setTotal] = useState('');
  const [splitType, setSplitType] = useState<'Equal' | 'Custom'>('Equal');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set([user.id]));
  const [shares, setShares] = useState<Record<string, number>>({});
  const [payerId, setPayerId] = useState(user.id);
  const [mode, setMode] = useState<PaymentMode>('Online');
  const [category, setCategory] = useState('Split');

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
    const next = new Set(selectedParticipants);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedParticipants(next);
  };

  const handleCustomChange = (id: string, val: string) => {
    setShares(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const currentSum = Array.from(selectedParticipants).reduce((acc, id) => acc + (shares[id] || 0), 0);
  const isBalanced = Math.abs(currentSum - (parseFloat(total) || 0)) < 0.5;

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
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Involved Participants</p>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-2 py-4">
          {participants.map(f => (
            <button key={f.id} onClick={() => toggleParticipant(f.id)} className={`flex flex-col items-center gap-3 transition-all ${selectedParticipants.has(f.id) ? 'scale-110' : 'opacity-30 grayscale'}`}>
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg shadow-xl transition-all ${selectedParticipants.has(f.id) ? 'bg-indigo-600 text-white shadow-indigo-500/40 rotate-6' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{f.name[0]}</div>
              <span className="text-[9px] font-black uppercase truncate w-14 text-center tracking-tight">{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      {splitType === 'Custom' && (
        <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {Array.from(selectedParticipants).map(id => (
            <div key={id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-inner">
              <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{participants.find(x => x.id === id)?.name}</span>
              <input type="number" value={shares[id] || 0} onChange={e => handleCustomChange(id, e.target.value)} className="w-24 bg-transparent border-none text-right font-black text-lg dark:text-white focus:ring-0" />
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
      <button disabled={!total || !isBalanced} onClick={() => onSave({ type: 'Split', amount: parseFloat(total), payerId, participants: Array.from(selectedParticipants).map(id => ({ userId: id, share: shares[id] })), category, notes: 'Group split bill', mode, timestamp: new Date().toISOString() })} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-8 rounded-[3rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 transition-all">Confirm Split</button>
    </div>
  );
};
