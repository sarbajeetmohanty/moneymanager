import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../App';

interface DashboardProps {
  user: User;
}

type TimeFilter = 'Today' | 'Yesterday' | '7D' | '30D' | 'Custom';

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7D');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0, cash: 0, online: 0, pending: 0, incoming: 0, outgoing: 0, moneyGiven: 0, moneyTaken: 0
  });

  const fetchData = async () => {
    const [dashRes, histRes] = await Promise.all([
      api.fetchDashboard(user.id),
      api.fetchTransactionHistory(user.id)
    ]);
    
    if (dashRes.success) {
      setStats(dashRes.data);
      if (histRes.success && histRes.history.length > 0) {
        api.getWealthInsight(dashRes.data, histRes.history).then(insight => setAiInsight(insight));
      }
    }
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
      if (t.type === 'Income') daily[d].inflow += t.amount;
      if (t.type === 'Expense') daily[d].outflow += t.amount;
    });
    return Object.values(daily).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredHistory]);

  const analysisData = useMemo(() => {
    let inc = 0, out = 0, giv = 0, tak = 0;
    filteredHistory.forEach(t => {
      if (t.type === 'Income') inc += t.amount;
      else if (t.type === 'Expense') out += t.amount;
      else if (t.type === 'Money Given') giv += t.amount;
      else if (t.type === 'Money Taken') tak += t.amount;
    });
    return [
      { name: 'Income', value: inc, color: '#10b981' },
      { name: 'Spent', value: out, color: '#f43f5e' },
      { name: 'Lent', value: giv, color: '#6366f1' },
      { name: 'Owed', value: tak, color: '#f59e0b' }
    ];
  }, [filteredHistory]);

  return (
    <div className="space-y-6 xs:space-y-8 pb-32 no-scrollbar animate-in fade-in duration-1000">
      
      {/* Wealth Hero Card - Enhanced Contrast */}
      <div className="card-ui p-6 xs:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-black text-white relative overflow-hidden group border-none shadow-2xl rounded-[2.5rem] xs:rounded-[3rem]">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <p className="text-white/60 text-[9px] xs:text-[10px] font-black uppercase tracking-[0.4em]">Liquid Asset Portfolio</p>
            {aiInsight && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                <i className="fa-solid fa-wand-magic-sparkles text-indigo-400 text-[9px]"></i>
                <p className="text-[8px] font-black uppercase tracking-wider text-white truncate max-w-[100px]">{aiInsight}</p>
              </div>
            )}
          </div>
          <h2 className="text-4xl xs:text-5xl md:text-7xl font-black tracking-tighter mb-10 text-white leading-none truncate">₹{(stats.total || 0).toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
            <MetricBox label="In Bank" value={stats.online} />
            <MetricBox label="In Hand" value={stats.cash} />
            <MetricBox label="Pending" value={stats.pending} />
            <MetricBox label="Owed" value={stats.moneyTaken} />
            <MetricBox label="Lent" value={stats.moneyGiven} />
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Filter Segment - RESTORED YESTERDAY & CUSTOM */}
      <div className="space-y-4">
        <div className="flex bg-white/70 dark:bg-slate-900/50 p-1.5 rounded-full backdrop-blur-xl border border-slate-200 dark:border-white/5 shadow-sm mx-1">
          {['Today', 'Yesterday', '7D', '30D', 'Custom'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f as TimeFilter)}
              className={`flex-1 py-3 text-[8px] xs:text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {timeFilter === 'Custom' && (
          <div className="flex gap-2 animate-in slide-in-from-top-4 duration-500 px-2">
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase dark:text-white shadow-sm border border-slate-200 dark:border-slate-800"
              value={customRange.start}
              onChange={e => setCustomRange({...customRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase dark:text-white shadow-sm border border-slate-200 dark:border-slate-800"
              value={customRange.end}
              onChange={e => setCustomRange({...customRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
        {/* Charts remain fixed and responsive */}
        <div className="card-ui bg-white dark:bg-slate-900 p-6 shadow-xl relative overflow-hidden border border-black/5 dark:border-white/5 rounded-[2rem]">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Cash Flow Velocity</h3>
          <div className="h-48 xs:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: 'currentColor' }} className="text-slate-400" />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 10, fontWeight: 900 }} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-ui bg-white dark:bg-slate-900 p-6 shadow-xl border border-black/5 dark:border-white/5 rounded-[2rem]">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Capital Distribution</h3>
          <div className="h-48 xs:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900, fill: 'currentColor' }} className="text-slate-400" />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: 10, fontWeight: 900 }} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={32}>
                  {analysisData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value }: { label: string, value: number }) => (
  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-default min-w-0">
    <p className="text-[8px] xs:text-[9px] text-white/40 font-black uppercase tracking-widest mb-1 truncate">{label}</p>
    <p className="text-xs xs:text-sm font-black text-white tracking-tight truncate">₹{(value || 0).toLocaleString()}</p>
  </div>
);
