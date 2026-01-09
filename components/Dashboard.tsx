
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
}

type TimeFilter = 'Today' | 'Yesterday' | '7D' | '30D' | 'Custom';

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7D');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    cash: 0, online: 0, pending: 0, incoming: 0, outgoing: 0, moneyGiven: 0, moneyTaken: 0
  });

  const fetchData = async () => {
    const [dashRes, histRes] = await Promise.all([
      api.fetchDashboard(user.id),
      api.fetchTransactionHistory(user.id)
    ]);
    if (dashRes.success) setStats(dashRes.data);
    if (histRes.success) setHistory(histRes.history);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter(t => {
      const tDate = new Date(t.timestamp);
      if (timeFilter === 'Today') return tDate.toDateString() === now.toDateString();
      if (timeFilter === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return tDate.toDateString() === yesterday.toDateString();
      }
      if (timeFilter === '7D') return (now.getTime() - tDate.getTime()) < (7 * 24 * 3600 * 1000);
      if (timeFilter === '30D') return (now.getTime() - tDate.getTime()) < (30 * 24 * 3600 * 1000);
      if (timeFilter === 'Custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59);
        return tDate >= start && tDate <= end;
      }
      return true;
    });
  }, [history, timeFilter, customRange]);

  const cashFlowData = useMemo(() => {
    const daily: Record<string, any> = {};
    filteredHistory.forEach(t => {
      const d = new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!daily[d]) daily[d] = { date: d, inflow: 0, outflow: 0 };
      if (t.type === 'Income' || t.type === 'Money Taken') daily[d].inflow += t.amount;
      if (t.type === 'Expense' || t.type === 'Money Given') daily[d].outflow += t.amount;
    });
    return Object.values(daily).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredHistory]);

  const totalLiquid = (stats.cash || 0) + (stats.online || 0);

  return (
    <div className="space-y-8 pb-48 animate-in fade-in duration-1000">
      <div className="card-ui p-12 bg-slate-900 dark:bg-black text-white relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em] mb-4">Total Assets (Liquid)</p>
          <h2 className="text-7xl font-black tracking-tighter mb-12">₹{totalLiquid.toLocaleString()}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <MetricBox label="Cash Mode" value={stats.cash} color="text-emerald-400" />
            <MetricBox label="Online Mode" value={stats.online} color="text-indigo-400" />
            <MetricBox label="Locked Pending" value={stats.pending} color="text-amber-400" />
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="space-y-6">
        <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-2 rounded-[3rem] shadow-xl">
          {['Today', 'Yesterday', '7D', '30D', 'Custom'].map(f => (
            <button key={f} onClick={() => setTimeFilter(f as TimeFilter)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'text-slate-400'}`}>{f}</button>
          ))}
        </div>
        {timeFilter === 'Custom' && (
          <div className="flex gap-3 animate-in slide-in-from-top-4">
            <input type="date" className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase text-slate-500 shadow-sm" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} />
            <input type="date" className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase text-slate-500 shadow-sm" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 ml-2">Growth Analysis</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e122" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fill="#10b98122" strokeWidth={4} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fill="#f43f5e22" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AggregateCard label="Incoming Total" value={stats.incoming} color="text-green-600" />
          <AggregateCard label="Outgoing Total" value={stats.outgoing} color="text-red-600" />
          <AggregateCard label="Money Given" value={stats.moneyGiven} color="text-blue-600" />
          <AggregateCard label="Money Taken" value={stats.moneyTaken} color="text-orange-600" />
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }: any) => (
  <div className="bg-white/5 p-6 rounded-[2.25rem] hover:bg-white/10 transition-all">
    <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-lg font-black ${color}`}>₹{(value || 0).toLocaleString()}</p>
  </div>
);

const AggregateCard = ({ label, value, color }: any) => (
  <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-sm">
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black ${color}`}>₹{(value || 0).toLocaleString()}</p>
  </div>
);
