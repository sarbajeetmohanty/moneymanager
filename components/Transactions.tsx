import React, { useState, useEffect, useMemo } from 'react';
import { User, TransactionType, PaymentMode, Friend } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface TransactionsProps {
  user: User;
}

export const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const { refreshAll, showToast, refreshKey, transactionMode, setTransactionMode } = useApp();
  const [formType, setFormType] = useState<'Simple' | 'Friend' | 'Split'>('Simple');
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const res = await api.fetchTransactionHistory(user.id);
    if (res.success) setHistory(res.history);
  };

  useEffect(() => {
    if (transactionMode === 'History') fetchHistory();
  }, [transactionMode, user.id, refreshKey]);

  const handleSave = async (payload: any) => {
    const res = await api.saveTransaction(user.id, payload);
    if (res.success) {
      showToast("Record Secured", "success");
      setTransactionMode('History');
      refreshAll();
    } else {
      showToast(res.error || "Failed to save", "error");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 relative py-2">
      <div className="flex bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-full shadow-xl sticky top-2 z-[90] backdrop-blur-3xl border border-black/5 dark:border-white/5 mx-2">
        <button 
          onClick={() => setTransactionMode('History')} 
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${transactionMode === 'History' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-500'}`}
        >
          Insights
        </button>
        <button 
          onClick={() => setTransactionMode('Add')} 
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${transactionMode === 'Add' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-500'}`}
        >
          New Entry
        </button>
      </div>

      <div className="flex-grow px-2">
        {transactionMode === 'History' ? (
          <TransactionList history={history} user={user} />
        ) : (
          <div className="space-y-6 max-w-lg mx-auto pb-40">
            <div className="flex justify-around bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full shadow-inner">
              {['Simple', 'Friend', 'Split'].map((t) => (
                <button key={t} onClick={() => setFormType(t as any)} className={`flex-1 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${formType === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl' : 'text-slate-500'}`}>{t}</button>
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
      className={`relative flex flex-col items-center gap-3 p-6 xs:p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === 'Online' ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-900 shadow-2xl scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}
    >
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${mode === 'Online' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          <i className="fa-solid fa-cloud-arrow-up"></i>
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Online' ? 'text-white' : 'text-slate-500'}`}>Digital</span>
    </button>
    <button 
      onClick={() => setMode('Cash')} 
      className={`relative flex flex-col items-center gap-3 p-6 xs:p-8 rounded-[2.5rem] transition-all duration-500 border-4 ${mode === 'Cash' ? 'bg-emerald-600 border-emerald-100 dark:border-emerald-900 shadow-2xl scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 opacity-60'}`}
    >
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${mode === 'Cash' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          <i className="fa-solid fa-wallet"></i>
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${mode === 'Cash' ? 'text-white' : 'text-slate-500'}`}>Cash</span>
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
    <div className="space-y-6 pb-40">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {['All', 'Income', 'Expense', 'Pending'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f as any)} 
            className={`px-8 py-3.5 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'bg-white dark:bg-slate-900 text-slate-500'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-md active:scale-95 transition-all group relative overflow-hidden border border-slate-50 dark:border-slate-800 rounded-[2rem]">
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${t.type === 'Income' || t.type === 'Money Taken' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} transition-all group-hover:rotate-12`}>
                <i className={`fa-solid ${t.type === 'Income' || t.type === 'Money Taken' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{t.category}</p>
                  {(t.status === 'Pending' || t.status === 'Paid') && <span className="bg-amber-400 text-black text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Review</span>}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[140px]">{t.notes || t.subcategory || 'Asset Flow'}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 relative z-10 pl-4">
              <p className={`text-xl font-black ${t.type === 'Income' || t.type === 'Money Taken' ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(t.amount || 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest">{new Date(t.timestamp).toLocaleDateString()}</p>
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
  const [selectedCat, setSelectedCat] = useState<number>(-1);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-8 xs:p-10 shadow-2xl space-y-10 border border-slate-100 dark:border-slate-800 rounded-[3rem]">
      <div className="flex p-2 bg-slate-100 dark:bg-slate-800/50 rounded-full shadow-inner">
        <button onClick={() => setType('Income')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Income' ? 'bg-green-600 text-white shadow-xl scale-105' : 'text-slate-500'}`}>Incoming</button>
        <button onClick={() => setType('Expense')} className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === 'Expense' ? 'bg-red-600 text-white shadow-xl scale-105' : 'text-slate-500'}`}>Outgoing</button>
      </div>
      
      <div className="text-center py-6 relative group">
        <span className="absolute -top-4 left-0 right-0 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Amount</span>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0" 
          className="w-full bg-transparent border-none text-center text-7xl xs:text-8xl font-black text-slate-900 dark:text-white placeholder:text-slate-50 dark:placeholder:text-slate-800 focus:ring-0" 
        />
      </div>

      <ModeSelector mode={mode} setMode={setMode} />

      <div className="space-y-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {user.categories.map((c, i) => (
            <button key={i} onClick={() => { setSelectedCat(i); setSelectedSub(''); }} className={`px-8 py-4 rounded-3xl whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${selectedCat === i ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{c.name}</button>
          ))}
        </div>
        {selectedCat !== -1 && user.categories[selectedCat].subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] shadow-inner">
            {user.categories[selectedCat].subcategories.map(sub => (
              <button key={sub} onClick={() => setSelectedSub(sub)} className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${selectedSub === sub ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border-transparent'}`}>{sub}</button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <i className="fa-solid fa-calendar absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold text-slate-900 dark:text-white shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all" 
          />
        </div>

        <div className="relative group">
          <i className="fa-solid fa-pen-nib absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
          <input 
            type="text" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Notes / Reason" 
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 pl-16 pr-8 text-sm font-bold text-slate-900 dark:text-white shadow-inner focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-200" 
          />
        </div>
      </div>
      
      <button 
        disabled={!amount || selectedCat === -1}
        onClick={() => onSave({ type, amount: parseFloat(amount), mode, category: user.categories[selectedCat].name, subcategory: selectedSub, notes, timestamp: new Date(date).toISOString() })} 
        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] disabled:opacity-20 active:scale-95 transition-all mt-4"
      >
        Lock Record
      </button>
    </div>
  );
};

const FriendForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [subType, setSubType] = useState<'Money Given' | 'Money Taken' | 'He Paid Back' | 'I Paid Back'>('Money Given');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Online');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => res.success && setFriends(res.friends));
  }, [user.id]);

  const handleSaveClick = () => {
    if (!selectedFriend) return alert("Select a friend first.");
    const c = window.confirm("Security Confirmation: This will notify the selected friend. Proceed?");
    if (!c) return;
    onSave({ type: subType, amount: parseFloat(amount), mode, friendId: selectedFriend, notes, timestamp: new Date().toISOString(), category: 'Personal' });
  };

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-8 xs:p-10 shadow-2xl space-y-10 border border-slate-100 dark:border-slate-800 rounded-[3rem]">
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-3xl">
        {['Money Given', 'Money Taken', 'He Paid Back', 'I Paid Back'].map(st => (
          <button key={st} onClick={() => setSubType(st as any)} className={`py-3 rounded-2xl text-[8px] font-black uppercase transition-all ${subType === st ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{st}</button>
        ))}
      </div>

      <div className="text-center py-6">
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="₹0" 
          className="w-full bg-transparent border-none text-center text-7xl font-black text-slate-900 dark:text-white" 
        />
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Friend</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {friends.map(f => (
            <button 
              key={f.id} 
              onClick={() => setSelectedFriend(f.id)} 
              className={`flex-shrink-0 w-20 h-20 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-1 ${selectedFriend === f.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}
            >
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-black text-xs">{f.name[0]}</div>
              <span className="text-[7px] font-black uppercase truncate w-16 text-center">{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      <ModeSelector mode={mode} setMode={setMode} />

      <input 
        type="text" 
        value={notes} 
        onChange={(e) => setNotes(e.target.value)} 
        placeholder="Reason for payment..." 
        className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] py-6 px-8 text-sm font-bold text-slate-900 dark:text-white" 
      />

      <button onClick={handleSaveClick} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-widest text-[11px]">Save Ledger Entry</button>
    </div>
  );
};

const SplitForm = ({ onSave, user }: { onSave: any, user: User }) => {
  const [total, setTotal] = useState('');
  const [splitType, setSplitType] = useState<'Equal' | 'Custom'>('Equal');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shares, setShares] = useState<Record<string, number>>({});
  const [payerId, setPayerId] = useState<string>(user.id);
  const [mode, setMode] = useState<PaymentMode>('Online');

  useEffect(() => {
    api.fetchFriends(user.id).then(res => res.success && setFriends(res.friends));
  }, [user.id]);

  useEffect(() => {
    const participants = [user.id, ...selectedIds];
    const bill = parseFloat(total) || 0;
    if (splitType === 'Equal' && bill > 0) {
      const share = bill / participants.length;
      const newShares: Record<string, number> = {};
      participants.forEach(id => newShares[id] = share);
      setShares(newShares);
    }
  }, [total, selectedIds, splitType, user.id]);

  const handleShareChange = (uid: string, val: string) => {
    if (splitType === 'Equal') return;
    const newShares = { ...shares, [uid]: parseFloat(val) || 0 };
    setShares(newShares);
  };

  const handleSaveClick = () => {
    const bill = parseFloat(total);
    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    if (Math.abs(bill - sum) > 0.01) return alert(`Total doesn't match! Sum: ₹${sum.toFixed(2)}, Bill: ₹${bill}`);
    
    const participants = Object.entries(shares).map(([uid, s]) => ({
      userId: uid,
      name: uid === user.id ? user.username : (friends.find(f => f.id === uid)?.name || 'Unknown'),
      share: s
    }));

    onSave({ 
      type: 'Split', 
      amount: bill, 
      mode, 
      payerId, 
      participants, 
      category: 'Food', 
      timestamp: new Date().toISOString() 
    });
  };

  return (
    <div className="card-ui bg-white dark:bg-slate-900 p-8 xs:p-10 shadow-2xl space-y-10 border border-slate-100 dark:border-slate-800 rounded-[3rem]">
      <input 
        type="number" 
        value={total} 
        onChange={(e) => setTotal(e.target.value)} 
        placeholder="Total Bill ₹" 
        className="w-full bg-transparent border-none text-center text-6xl font-black text-slate-900 dark:text-white" 
      />

      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
        <button onClick={() => setSplitType('Equal')} className={`flex-1 py-3.5 rounded-full text-[9px] font-black uppercase transition-all ${splitType === 'Equal' ? 'bg-white dark:bg-slate-900 shadow-lg' : 'text-slate-400'}`}>Equal</button>
        <button onClick={() => setSplitType('Custom')} className={`flex-1 py-3.5 rounded-full text-[9px] font-black uppercase transition-all ${splitType === 'Custom' ? 'bg-white dark:bg-slate-900 shadow-lg' : 'text-slate-400'}`}>Custom</button>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Participants</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          <ParticipantIcon name="You" active={true} />
          {friends.map(f => (
            <div key={f.id} onClick={() => setSelectedIds(prev => prev.includes(f.id) ? prev.filter(i => i !== f.id) : [...prev, f.id])}>
              <ParticipantIcon name={f.name} active={selectedIds.includes(f.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Breakdown</p>
        <div className="space-y-3">
          <ShareRow name="You" value={shares[user.id] || 0} onChange={v => handleShareChange(user.id, v)} readOnly={splitType === 'Equal'} />
          {selectedIds.map(id => (
            <ShareRow key={id} name={friends.find(f => f.id === id)?.name || ''} value={shares[id] || 0} onChange={v => handleShareChange(id, v)} readOnly={splitType === 'Equal'} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Who Paid?</p>
        <select value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 py-5 rounded-3xl px-6 font-black text-sm">
          <option value={user.id}>I Paid</option>
          {selectedIds.map(id => (
            <option key={id} value={id}>{friends.find(f => f.id === id)?.name} Paid</option>
          ))}
        </select>
      </div>

      <ModeSelector mode={mode} setMode={setMode} />

      <button onClick={handleSaveClick} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-widest text-[11px]">Finalize Split</button>
    </div>
  );
};

const ParticipantIcon = ({ name, active }: { name: string, active: boolean }) => (
  <div className={`w-16 h-16 rounded-[1.8rem] flex flex-col items-center justify-center gap-1 transition-all ${active ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>{name[0]}</div>
    <span className="text-[7px] font-black uppercase truncate w-12 text-center">{name}</span>
  </div>
);

const ShareRow = ({ name, value, onChange, readOnly }: { name: string, value: number, onChange: (v: string) => void, readOnly: boolean }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{name}</span>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black text-slate-400">₹</span>
      <input 
        type="number" 
        value={value.toFixed(2)} 
        onChange={e => onChange(e.target.value)} 
        readOnly={readOnly}
        className="w-24 bg-transparent border-none text-right font-black text-slate-900 dark:text-white focus:ring-0 p-0" 
      />
    </div>
  </div>
);
