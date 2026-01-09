import React, { useState, useEffect, useMemo } from 'react';
import { User, Friend } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface FriendsProps {
  user: User;
}

export const Friends: React.FC<FriendsProps> = ({ user }) => {
  const { showToast, refreshKey } = useApp();
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
  }, [user.id, refreshKey]);

  const handleConnect = async () => {
    if (!connectUsername) return;
    const res = await api.sendFriendRequest(user.id, connectUsername);
    if (res.success) {
      showToast("✅ Friend request sent!", "success");
      setShowConnect(false);
      setConnectUsername('');
    } else {
      showToast(res.error || "Failed to send request", "error");
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
          <div className="px-4">
            <h2 className="text-xl xs:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Contacts</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Asset Network</p>
          </div>

          <div className="card-ui mx-2 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 rounded-[1.5rem]">
             <i className="fa-solid fa-magnifying-glass text-slate-300"></i>
             <input 
               type="text" 
               placeholder="Search identifiers..." 
               className="flex-1 text-sm font-black bg-transparent border-none focus:ring-0 placeholder:text-slate-300 dark:text-white" 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
             />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Vault Directory</h3>
              <button 
                onClick={() => setShowConnect(true)} 
                className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2.5 rounded-full active:scale-90 transition-all shadow-sm"
              >
                + Connect
              </button>
            </div>
            
            <div className="space-y-4 px-2">
              {friends.length === 0 ? (
                 <div className="card-ui bg-white dark:bg-slate-900 p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 opacity-50 rounded-[2.5rem]">
                    <i className="fa-solid fa-users-slash text-4xl mb-4 text-slate-200"></i>
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 border border-white/5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Node Connection</h2>
            <div className="space-y-2 mb-8">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Identifier</label>
              <input 
                type="text" 
                placeholder="Username or Email" 
                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-3xl p-5 font-black text-sm dark:text-white"
                value={connectUsername}
                onChange={(e) => setConnectUsername(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConnect(false)} className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={handleConnect} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[24px] text-[10px] font-black shadow-lg uppercase tracking-widest active:scale-95 transition-all">Link Node</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FriendRow = ({ friend, onClick }: { friend: Friend, onClick: () => void }) => (
  <div onClick={onClick} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-md active:scale-[0.98] transition-all cursor-pointer group border border-slate-50 dark:border-slate-800 rounded-[2.2rem]">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-xl uppercase group-hover:scale-110 transition-transform">
        {friend.name[0]}
      </div>
      <div>
        <h4 className="font-black text-slate-800 dark:text-white text-sm tracking-tight">{friend.name}</h4>
        <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${friend.balance > 0 ? 'text-green-600' : friend.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
          {friend.balance > 0 ? `Will pay you ₹${friend.balance.toLocaleString()}` : friend.balance < 0 ? `You owe ₹${Math.abs(friend.balance).toLocaleString()}` : 'Account Settled'}
        </p>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-all">
      <i className="fa-solid fa-chevron-right text-[10px]"></i>
    </div>
  </div>
);

const FriendDetail = ({ friend, onBack, userId, user }: any) => {
  const { showToast, refreshAll } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'Activity' | 'Debt' | 'Credit'>('Activity');

  const fetchHistory = async () => {
    const res = await api.fetchTransactionHistory(userId);
    if(res.success) {
      setHistory(res.history.filter((t: any) => t.friendId === friend.id || t.creatorId === friend.id || t.payerId === friend.id));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [friend.id, userId]);

  const stats = useMemo(() => {
    let owe = 0, get = 0;
    history.forEach(t => {
      const isUnpaid = t.status !== 'Completed' && t.status !== 'Approved'; 
      if (!isUnpaid) return;
      if ((t.type === 'Money Taken' && t.creatorId === userId) || (t.type === 'Money Given' && t.creatorId === friend.id)) owe += (t.amount - (t.paidAmount || 0));
      if ((t.type === 'Money Given' && t.creatorId === userId) || (t.type === 'Money Taken' && t.creatorId === friend.id)) get += (t.amount - (t.paidAmount || 0));
    });
    return { owe, get };
  }, [history, userId, friend.id]);

  const handleRemoveFriend = async () => {
    const totalBalance = Math.abs(friend.balance);
    if (totalBalance !== 0) {
      return alert(`⚠️ Cannot Remove Node: You have ₹${totalBalance.toLocaleString()} pending to settle with this friend. Settle all dues before removing.`);
    }
    const c = window.confirm("Disconnect node? This will remove the friend but history stays in vault.");
    if (c) {
      const res = await api.removeFriend(userId, friend.id);
      if (res.success) {
        showToast("Node Unlinked", "success");
        refreshAll();
        onBack();
      }
    }
  };

  const filteredHistory = useMemo(() => {
    if (subTab === 'Activity') return history;
    if (subTab === 'Debt') return history.filter(t => (t.type === 'Money Taken' && t.creatorId === userId) || (t.type === 'Money Given' && t.creatorId === friend.id));
    if (subTab === 'Credit') return history.filter(t => (t.type === 'Money Given' && t.creatorId === userId) || (t.type === 'Money Taken' && t.creatorId === friend.id));
    return history;
  }, [history, subTab, userId, friend.id]);

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right duration-500 no-scrollbar pb-32 overflow-y-auto px-1">
      <div className="flex items-center justify-between mb-8 sticky top-0 z-[100] py-4 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-3xl px-3 border-b border-black/5 dark:border-white/5">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-slate-500 active:scale-90 transition-all"><i className="fa-solid fa-arrow-left text-xs"></i></button>
        <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.4em]">{friend.name}</h3>
        <button onClick={handleRemoveFriend} className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-user-minus text-xs"></i></button>
      </div>

      <div className="card-ui bg-white dark:bg-slate-900 p-8 xs:p-12 text-center border border-slate-100 dark:border-slate-800 mb-8 rounded-[3.5rem] shadow-xl mx-2">
         <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 mx-auto mb-6 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-4xl uppercase shadow-inner">{friend.name[0]}</div>
         <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">{friend.name}</h2>
         <p className={`text-[10px] font-black uppercase tracking-widest ${friend.balance === 0 ? 'text-slate-400' : friend.balance > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {friend.balance === 0 ? 'Dues Cleared' : friend.balance > 0 ? `Net will pay you: ₹${friend.balance.toLocaleString()}` : `Net you owe: ₹${Math.abs(friend.balance).toLocaleString()}`}
         </p>
      </div>

      <div className="flex bg-white/70 dark:bg-slate-900/50 p-1.5 rounded-full mb-8 mx-2 shadow-sm border border-black/5 dark:border-white/5 backdrop-blur-xl">
        {['Activity', 'Debt', 'Credit'].map(tab => (
          <button 
            key={tab}
            onClick={() => setSubTab(tab as any)}
            className={`flex-1 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${subTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">No vault logs found</p></div>
        ) : filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm active:scale-95 transition-all rounded-[2.2rem]">
            <div className="flex items-center gap-5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm ${t.type.includes('Given') || t.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <i className={`fa-solid ${t.type.includes('Given') || t.type === 'Income' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate tracking-tight mb-1">{t.category || 'Asset Flow'}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[8px] text-slate-400 font-black uppercase">{new Date(t.timestamp).toLocaleDateString()}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${t.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{t.status}</span>
                </div>
              </div>
            </div>
            <div className="text-right pl-4">
              <p className={`text-base font-black ${t.type.includes('Given') || t.type === 'Income' ? 'text-green-600' : 'text-red-500'}`}>₹{t.amount.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate max-w-[100px]">{t.notes || 'Asset flow'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
