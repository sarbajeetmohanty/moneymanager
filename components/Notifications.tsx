import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface NotificationsProps {
  user: User;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const { refreshAll, showToast, refreshKey } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const res = await api.fetchNotifications(user.id);
    if (res.success) {
      setNotifications(res.notifications);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.id, refreshKey]);

  const handleAction = async (notif: Notification, action: string) => {
    let finalAmount = notif.amount;
    
    if (action === 'already_paid') {
      const amt = window.prompt(`Confirm Payment Amount (Total: ₹${notif.amount}):`, notif.amount?.toString());
      if (amt === null) return;
      finalAmount = parseFloat(amt);
      if (isNaN(finalAmount) || finalAmount <= 0) return alert("Invalid amount entered.");
    }

    if (action === 'pay_now') {
      // Find friend's UPI or use target's registered UPI
      const upiUrl = `upi://pay?pa=${user.upiId || 'payment@node'}&pn=${encodeURIComponent(notif.senderName)}&am=${notif.amount}&cu=INR`;
      window.open(upiUrl, '_blank');
      showToast("Syncing with Payment Node...", "info");
      // Don't resolve notification until "Already Paid" is clicked
      return;
    }

    const res = await api.handleAction(user.id, notif.id, action, notif.transactionId || '', finalAmount);
    if (res.success) {
      showToast("Protocol Updated", "success");
      refreshAll();
      fetchNotifications();
    } else {
      showToast(res.error || "Update failed", "error");
    }
  };

  const unreadCount = notifications.filter(n => !n.isResolved).length;

  return (
    <div className="space-y-4 h-full flex flex-col px-1">
      <div className="flex items-center justify-between px-4 flex-shrink-0 mb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tighter">Vault Inbox</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Alerts & Actions</p>
        </div>
        <span className="bg-indigo-600 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/20">{unreadCount} Actionable</span>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar space-y-5 pb-32">
        {notifications.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-bell-slash text-4xl text-slate-200"></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault fully synchronized</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`card-ui mx-2 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-500 rounded-[2.5rem] relative overflow-hidden ${!n.isResolved ? 'ring-2 ring-indigo-500/10' : 'opacity-40'}`}>
            <div className="flex gap-5 relative z-10">
              <div className="w-14 h-14 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-600 uppercase shadow-inner text-xl">{n.senderName[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight pr-4">
                    {n.senderName} <span className="font-bold text-slate-400 lowercase">{n.message}</span>
                  </p>
                  <p className="text-[8px] font-black text-slate-300 uppercase whitespace-nowrap">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>

                {n.amount && n.amount > 0 && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{n.amount.toLocaleString()}</p>
                    {n.remainingAmount !== undefined && n.remainingAmount > 0 && (
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><i className="fa-solid fa-clock-rotate-left"></i> ₹{n.remainingAmount.toLocaleString()} Pending</p>
                    )}
                  </div>
                )}
                
                {!n.isResolved && (
                  <div className="flex flex-wrap gap-2.5 mt-6">
                    {n.type === 'FriendRequest' ? (
                      <>
                        <button onClick={() => handleAction(n, 'approve_friend')} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">Link Node</button>
                        <button onClick={() => handleAction(n, 'reject_friend')} className="flex-1 bg-red-100 text-red-600 font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest active:scale-95 transition-all">Refuse</button>
                      </>
                    ) : n.type === 'TransactionApproval' ? (
                      <>
                        <button onClick={() => handleAction(n, 'approve')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">Validate</button>
                        <button onClick={() => handleAction(n, 'reject')} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest">Deny</button>
                      </>
                    ) : n.type === 'PaymentConfirmation' ? (
                      <>
                        <button onClick={() => handleAction(n, 'received')} className="flex-1 bg-green-600 text-white font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest shadow-lg shadow-green-600/20">Confirm</button>
                        <button onClick={() => handleAction(n, 'not_received')} className="flex-1 bg-red-50 dark:bg-red-500/10 text-red-500 font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest">Dispute</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleAction(n, 'pay_now')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">Pay Now</button>
                        <button onClick={() => handleAction(n, 'already_paid')} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-[1.5rem] text-[9px] uppercase tracking-widest">Mark Paid</button>
                      </>
                    )}
                  </div>
                )}
                {n.isResolved && <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-green-600 uppercase tracking-widest opacity-80"><i className="fa-solid fa-circle-check"></i> Action Protocol Completed</div>}
              </div>
            </div>
            {/* Background design */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
