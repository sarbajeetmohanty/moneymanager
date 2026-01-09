
import React, { useState, useEffect, useMemo } from 'react';
import { User, Friend } from '../types';
import { api } from '../services/api';

interface FriendsProps {
  user: User;
}

export const Friends: React.FC<FriendsProps> = ({ user }) => {
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [connectUsername, setConnectUsername] = useState('');

  const fetchFriends = async () => {
    const res = await api.fetchFriends(user.id);
    if (res.success) setFriends(res.friends);
  };

  useEffect(() => {
    fetchFriends();
    const interval = setInterval(fetchFriends, 15000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleConnect = async () => {
    if (!connectUsername) return;
    const res = await api.sendFriendRequest(user.id, connectUsername);
    if (res.success) {
      alert("✅ Friend request sent!");
      setShowConnect(false);
      setConnectUsername('');
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="h-full flex flex-col no-scrollbar">
      {selectedFriend ? (
        <FriendDetail 
          friend={selectedFriend} 
          onBack={() => setSelectedFriend(null)} 
          userId={user.id}
          user={user}
        />
      ) : (
        <div className="space-y-6 flex-grow overflow-y-auto no-scrollbar pb-32">
          <div className="card-ui bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
             <i className="fa-solid fa-magnifying-glass text-slate-300"></i>
             <input 
               type="text" 
               placeholder="Search friends..." 
               className="flex-1 text-sm font-black bg-transparent border-none focus:ring-0 placeholder:text-slate-300 dark:text-white" 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
             />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-3">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Directory</h3>
              <button 
                onClick={() => setShowConnect(true)} 
                className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full active:scale-90 transition-all"
              >
                + Connect
              </button>
            </div>
            
            <div className="space-y-4">
              {friends.length === 0 ? (
                 <div className="card-ui bg-white dark:bg-slate-900 p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 opacity-50">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No connections yet</p>
                 </div>
              ) : friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => (
                <FriendRow key={f.id} friend={f} onClick={() => setSelectedFriend(f)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showConnect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-white/5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Add Connection</h2>
            <input 
              type="text" 
              placeholder="Username or Email" 
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-3xl p-5 mb-8 font-black text-sm dark:text-white"
              value={connectUsername}
              onChange={(e) => setConnectUsername(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConnect(false)} className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={handleConnect} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[24px] text-[10px] font-black shadow-lg uppercase tracking-widest active:scale-95 transition-all">Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FriendRow = ({ friend, onClick }: { friend: Friend, onClick: () => void }) => (
  <div onClick={onClick} className="card-ui bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 rounded-[22px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-600 text-xl uppercase group-hover:scale-110 transition-transform">
        {friend.name[0]}
      </div>
      <div>
        <h4 className="font-black text-slate-800 dark:text-white text-sm tracking-tight">{friend.name}</h4>
        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${friend.balance > 0 ? 'text-green-600' : friend.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
          {friend.balance > 0 ? `Will pay you ₹${friend.balance.toLocaleString()}` : friend.balance < 0 ? `You owe ₹${Math.abs(friend.balance).toLocaleString()}` : 'Settled'}
        </p>
      </div>
    </div>
    <i className="fa-solid fa-chevron-right text-slate-200 dark:text-slate-800"></i>
  </div>
);

const FriendDetail = ({ friend, onBack, userId, user }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'Activity' | 'I-Owe' | 'They-Owe'>('Activity');

  useEffect(() => {
    api.fetchTransactionHistory(userId).then(res => {
      if(res.success) {
        setHistory(res.history.filter((t: any) => t.friendId === friend.id || t.creatorId === friend.id));
      }
    });
  }, [friend.id, userId]);

  const filteredHistory = useMemo(() => {
    if (subTab === 'Activity') return history;
    if (subTab === 'I-Owe') return history.filter(t => (t.type === 'Money Taken' && t.creatorId === userId) || (t.type === 'Money Given' && t.creatorId === friend.id));
    if (subTab === 'They-Owe') return history.filter(t => (t.type === 'Money Given' && t.creatorId === userId) || (t.type === 'Money Taken' && t.creatorId === friend.id));
    return history;
  }, [history, subTab, userId, friend.id]);

  const stats = useMemo(() => {
    let owe = 0, get = 0;
    history.forEach(t => {
      if ((t.type === 'Money Taken' && t.creatorId === userId) || (t.type === 'Money Given' && t.creatorId === friend.id)) owe += (t.amount - (t.paidAmount || 0));
      if ((t.type === 'Money Given' && t.creatorId === userId) || (t.type === 'Money Taken' && t.creatorId === friend.id)) get += (t.amount - (t.paidAmount || 0));
    });
    return { owe, get };
  }, [history, userId, friend.id]);

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right duration-500 no-scrollbar pb-32 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 sticky top-0 z-10 py-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-500 active:scale-90 transition-all"><i className="fa-solid fa-arrow-left"></i></button>
        <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.3em]">{friend.name}</h3>
        <div className="w-12 h-12"></div>
      </div>

      <div className="card-ui bg-white dark:bg-slate-900 p-10 text-center border border-slate-100 dark:border-slate-800 mb-8">
         <div className="w-24 h-24 rounded-[32px] bg-slate-100 dark:bg-slate-800 mx-auto mb-6 flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-3xl uppercase shadow-inner">{friend.name[0]}</div>
         <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">{friend.name}</h2>
         <p className={`text-[10px] font-black uppercase tracking-widest ${friend.balance === 0 ? 'text-slate-400' : friend.balance > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {friend.balance === 0 ? 'No Dues' : friend.balance > 0 ? `Net will pay you: ₹${friend.balance.toLocaleString()}` : `Net you owe: ₹${Math.abs(friend.balance).toLocaleString()}`}
         </p>
      </div>

      {/* 3 Tabs Implementation */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full mb-8 mx-2 shadow-inner">
        {['Activity', 'I-Owe', 'They-Owe'].map(tab => (
          <button 
            key={tab}
            onClick={() => setSubTab(tab as any)}
            className={`flex-1 py-3.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${subTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl' : 'text-slate-400'}`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Aggregate Stats Section for Specific Tabs */}
      {subTab !== 'Activity' && (
        <div className={`p-6 rounded-[2rem] mx-2 mb-8 animate-in zoom-in-95 duration-500 ${subTab === 'I-Owe' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : 'bg-green-50 dark:bg-green-600/10 text-green-600'}`}>
           <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{subTab === 'I-Owe' ? 'Total you need to pay' : 'Total they need to pay'}</p>
           <p className="text-3xl font-black">₹{(subTab === 'I-Owe' ? stats.owe : stats.get).toLocaleString()}</p>
        </div>
      )}

      <div className="space-y-4 px-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">No entries found</p></div>
        ) : filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-5 flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${t.type.includes('Given') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`fa-solid ${t.type.includes('Given') ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{t.category}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase opacity-50">{new Date(t.timestamp).toLocaleDateString()} • {t.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${t.type.includes('Given') ? 'text-green-600' : 'text-red-500'}`}>₹{t.amount.toLocaleString()}</p>
              <p className="text-[8px] text-slate-300 dark:text-slate-700 font-black uppercase">{t.notes || 'No Reason'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
