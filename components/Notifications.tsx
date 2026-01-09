
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { api } from '../services/api';
import { useApp } from '../App';

interface NotificationsProps {
  user: User;
}

export const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const { refreshAll, showToast } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const res = await api.fetchNotifications(user.id);
    if (res.success) {
      setNotifications(res.notifications);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleAction = async (notif: Notification, action: string) => {
    let finalAmount = notif.amount;
    
    if (action === 'already_paid') {
      const amt = window.prompt(`Confirm Payment Amount (Total: ₹${notif.amount}):`, notif.amount?.toString());
      if (amt === null) return;
      finalAmount = parseFloat(amt);
      if (isNaN(finalAmount) || finalAmount <= 0) return alert("Invalid amount entered.");
    }

    if (action === 'pay_now') {
      const upiUrl = `upi://pay?pa=${user.upiId || 'test@bank'}&pn=${encodeURIComponent(notif.senderName)}&am=${notif.amount}&cu=INR`;
      window.open(upiUrl, '_blank');
      showToast("Redirecting to payment app...", "info");
      return;
    }

    const res = await api.handleAction(user.id, notif.id, action, notif.transactionId || '', finalAmount);
    if (res.success) {
      showToast("Updated", "success");
      refreshAll();
      fetchNotifications();
    } else {
      showToast("Update failed", "error");
    }
  };

  const unreadCount = notifications.filter(n => !n.isResolved).length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between px-2 flex-shrink-0">
        <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Inbox</h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unreadCount} Pending Tasks</span>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <i className="fa-solid fa-bell-slash text-4xl mb-6 block"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">All caught up!</p>
          </div>
        ) : notifications.map(n => (
          <div key={n.id} className={`card-ui bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 ${!n.isResolved ? 'border-l-4 border-l-indigo-600' : 'opacity-40 grayscale'}`}>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-[20px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-600 uppercase shadow-inner text-xl">{n.senderName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                  {n.senderName} <span className="font-bold text-slate-400 lowercase">{n.message}</span>
                </p>
                {n.amount && n.amount > 0 && (
                  <div className="mt-2">
                    <p className="text-xl font-black text-indigo-600">₹{n.amount.toLocaleString()}</p>
                    {n.remainingAmount !== undefined && n.remainingAmount > 0 && (
                      <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">₹{n.remainingAmount.toLocaleString()} Remaining</p>
                    )}
                  </div>
                )}
                
                {!n.isResolved && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {n.type === 'FriendRequest' ? (
                      <button onClick={() => handleAction(n, 'approve_friend')} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest active:scale-95 transition-all">Accept</button>
                    ) : n.type === 'TransactionApproval' ? (
                      <>
                        <button onClick={() => handleAction(n, 'approve')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Approve</button>
                        <button onClick={() => handleAction(n, 'reject')} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Reject</button>
                      </>
                    ) : n.type === 'PaymentConfirmation' ? (
                      <>
                        <button onClick={() => handleAction(n, 'received')} className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Received</button>
                        <button onClick={() => handleAction(n, 'not_received')} className="flex-1 bg-red-100 text-red-500 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Not Received</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleAction(n, 'pay_now')} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Pay Now</button>
                        <button onClick={() => handleAction(n, 'already_paid')} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl text-[9px] uppercase tracking-widest">Mark Paid</button>
                      </>
                    )}
                  </div>
                )}
                {n.isResolved && <div className="mt-3 flex items-center gap-2 text-[8px] font-black text-green-600 uppercase"><i className="fa-solid fa-circle-check"></i> Completed</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
