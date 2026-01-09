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
      return true;
    });
  }, [history, timeFilter]);

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
      { name: 'Given', value: giv, color: '#6366f1' },
      { name: 'Taken', value: tak, color: '#f59e0b' }
    ];
  }, [filteredHistory]);

  return (
    <div className="space-y-8 pb-48 no-scrollbar animate-in fade-in duration-1000">
      
      {/* Wealth Hero Card - Fixed "Odd" Visuals */}
      <div className="card-ui p-8 xs:p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-black text-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-black relative overflow-hidden group border-none shadow-2xl rounded-[3rem]">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">Liquid Asset Portfolio</p>
            {aiInsight && (
              <div className="hidden xs:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                <i className="fa-solid fa-bolt text-indigo-400 text-[10px]"></i>
                <p className="text-[9px] font-black uppercase tracking-widest text-white">{aiInsight}</p>
              </div>
            )}
          </div>
          <h2 className="text-5xl xs:text-7xl font-black tracking-tighter mb-10 text-white leading-none">₹{(stats.total || 0).toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-4">
            <MetricBox label="In Bank" value={stats.online} />
            <MetricBox label="In Hand" value={stats.cash} />
            <MetricBox label="Receivable" value={stats.moneyGiven} />
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Modern Filter Controls */}
      <div className="flex bg-white/50 dark:bg-white/5 p-1.5 rounded-[2.5rem] backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-inner mx-1">
        {['Today', '7D', '30D'].map(f => (
          <button
            key={f}
            onClick={() => setTimeFilter(f as TimeFilter)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-1">
        {/* Flux Chart */}
        <div className="card-ui p-8 shadow-xl relative overflow-hidden border border-white/10">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Asset Flow Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: 'currentColor' }} className="text-slate-400" />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 10, fontWeight: 900 }} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type Chart */}
        <div className="card-ui p-8 shadow-xl border border-white/10">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Capital Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: 'currentColor' }} className="text-slate-400" />
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
  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-lg hover:bg-white/10 transition-all cursor-default group">
    <p className="text-[8px] text-white/40 font-black uppercase tracking-widest mb-1 group-hover:text-white/60 transition-colors">{label}</p>
    <p className="text-sm xs:text-base font-black text-white tracking-tight">₹{(value || 0).toLocaleString()}</p>
  </div>
);
