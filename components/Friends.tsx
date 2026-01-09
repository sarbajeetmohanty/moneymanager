
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
      showToast("Friend request sent!", "success");
      setShowConnect(false);
      setConnectUsername('');
    } else {
      showToast(res.error || "Failed", "error");
    }
  };

  const removeFriend = async (fId: string, balance: number) => {
    if (balance !== 0) {
      alert(`Cannot Remove Friend: You have ₹${Math.abs(balance)} pending to settle with this friend. Please settle all dues first.`);
      return;
    }
    const confirmed = window.confirm("Remove friend from list? History will stay safe.");
    if (!confirmed) return;
    const res = await api.removeFriend(user.id, fId);
    if (res.success) {
      showToast("Friend removed", "success");
      fetchFriends();
      setSelectedFriend(null);
    }
  };

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col no-scrollbar">
      {selectedFriend ? (
        <FriendDetail 
          friend={selectedFriend} 
          onBack={() => setSelectedFriend(null)} 
          userId={user.id}
          onRemove={() => removeFriend(selectedFriend.id, selectedFriend.balance)}
        />
      ) : (
        <div className="space-y-6 flex-grow overflow-y-auto no-scrollbar pb-32 px-2">
          <div className="card-ui bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center gap-4">
             <i className="fa-solid fa-magnifying-glass text-slate-300"></i>
             <input type="text" placeholder="Search friends..." className="flex-1 text-sm font-black bg-transparent border-none focus:ring-0 placeholder:text-slate-300 dark:text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between px-3">
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">Network</h3>
            <button onClick={() => setShowConnect(true)} className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2.5 rounded-full active:scale-90 transition-all shadow-sm">+ Add Connection</button>
          </div>
          <div className="space-y-4">
            {filteredFriends.length === 0 ? (
               <div className="card-ui bg-white dark:bg-slate-900 p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 opacity-50"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No active connections</p></div>
            ) : filteredFriends.map(f => (
              <FriendRow key={f.id} friend={f} onClick={() => setSelectedFriend(f)} />
            ))}
          </div>
        </div>
      )}
      {showConnect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">New Link</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">User Email / Username</p>
            <input type="text" placeholder="Search..." className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-3xl p-6 mb-10 font-black text-sm dark:text-white focus:ring-2 focus:ring-indigo-500" value={connectUsername} onChange={(e) => setConnectUsername(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowConnect(false)} className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleConnect} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FriendRow = ({ friend, onClick }: any) => (
  <div onClick={onClick} className="card-ui bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group">
    <div className="flex items-center gap-5">
      <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-300 dark:text-slate-600 text-2xl group-hover:scale-110 transition-all shadow-inner">{friend.name[0]}</div>
      <div>
        <h4 className="font-black text-slate-800 dark:text-white text-base tracking-tight">{friend.name}</h4>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${friend.balance > 0 ? 'text-green-600' : friend.balance < 0 ? 'text-red-500' : 'text-slate-300'}`}>
          {friend.balance > 0 ? `Will pay you ₹${friend.balance.toLocaleString()}` : friend.balance < 0 ? `You owe ₹${Math.abs(friend.balance).toLocaleString()}` : 'Settled'}
        </p>
      </div>
    </div>
    <i className="fa-solid fa-chevron-right text-slate-100 dark:text-slate-800"></i>
  </div>
);

const FriendDetail = ({ friend, onBack, userId, onRemove }: any) => {
  const { showToast } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'Activity' | 'Pending'>('Activity');

  const fetchHistory = async () => {
    const res = await api.fetchTransactionHistory(userId);
    if(res.success) {
      setHistory(res.history.filter((t: any) => 
        t.friendId === friend.id || 
        t.payerId === friend.id || 
        (t.participants && t.participants.some((p:any) => p.userId === friend.id))
      ));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [friend.id, userId]);

  const sendReminder = async (tId: string) => {
    const res = await api.sendReminder(userId, friend.id, tId);
    if (res.success) showToast("Reminder Sent", "success");
  };

  const filteredHistory = useMemo(() => {
    if (subTab === 'Activity') return history;
    return history.filter(t => t.status === 'Pending' || t.status === 'Paid');
  }, [history, subTab]);

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right duration-500 pb-32 overflow-y-auto px-2">
      <div className="flex items-center justify-between mb-8 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-500 active:scale-90 transition-all"><i className="fa-solid fa-arrow-left"></i></button>
        <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.3em]">Node Details</h3>
        <button onClick={onRemove} className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-user-minus"></i></button>
      </div>
      <div className="card-ui bg-white dark:bg-slate-900 p-12 text-center shadow-sm mb-10">
         <div className="w-28 h-28 rounded-[36px] bg-slate-50 dark:bg-slate-800 mx-auto mb-8 flex items-center justify-center text-slate-300 dark:text-slate-600 font-black text-4xl shadow-inner">{friend.name[0]}</div>
         <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">{friend.name}</h2>
         <p className={`text-[11px] font-black uppercase tracking-widest ${friend.balance === 0 ? 'text-slate-400' : friend.balance > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {friend.balance === 0 ? 'All Settled' : friend.balance > 0 ? `To be received: ₹${friend.balance.toLocaleString()}` : `Total to pay: ₹${Math.abs(friend.balance).toLocaleString()}`}
         </p>
      </div>
      <div className="flex bg-white dark:bg-slate-900 p-2 rounded-full mb-10 shadow-sm">
        {['Activity', 'Pending'].map(tab => (
          <button key={tab} onClick={() => setSubTab(tab as any)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${subTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400'}`}>{tab}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredHistory.map(t => (
          <div key={t.id} className="card-ui bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm ${t.status === 'Completed' ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <i className={`fa-solid ${t.status === 'Completed' ? 'fa-check' : 'fa-clock-rotate-left'}`}></i>
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[120px]">{t.category}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase opacity-50">{new Date(t.timestamp).toLocaleDateString()} • {t.status}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-base font-black dark:text-white">₹{t.amount.toLocaleString()}</p>
              {t.status === 'Pending' && <button onClick={() => sendReminder(t.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest active:scale-90 transition-all">Remind</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
