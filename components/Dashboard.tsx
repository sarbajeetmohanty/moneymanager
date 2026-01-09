import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, Legend
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

  const themeColors: Record<string, string> = {
    indigo: '#6366f1', rose: '#f43f5e', emerald: '#10b981', amber: '#f59e0b', violet: '#8b5cf6',
    sky: '#0ea5e9', cyan: '#06b6d4', fuchsia: '#d946ef', pink: '#ec4899', orange: '#f97316',
    lime: '#84cc16', teal: '#14b8a6', slate: '#475569', zinc: '#3f3f46', neutral: '#404040'
  };

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
      { name: 'Income', value: inc, color: '#059669' },
      { name: 'Spent', value: out, color: '#dc2626' },
      { name: 'Given', value: giv, color: '#4f46e5' },
      { name: 'Taken', value: tak, color: '#d97706' }
    ];
  }, [filteredHistory]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredHistory.forEach(t => {
      if (t.type === 'Expense') {
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredHistory]);

  return (
    <div className="space-y-6 xs:space-y-8 pb-48 no-scrollbar animate-in fade-in duration-1000 px-1">
      
      {/* Wealth Hero Card - High Contrast Optimized */}
      <div className="card-ui p-8 xs:p-12 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden group border border-slate-200 dark:border-slate-800">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-800 dark:text-white/80 text-[11px] font-black uppercase tracking-[0.4em]">Net Liquid Wealth</p>
            {aiInsight && (
              <div className="hidden xs:flex items-center gap-2 animate-in slide-in-from-right-8 duration-700 bg-indigo-600 dark:bg-white/10 px-4 py-2 rounded-full shadow-lg">
                <i className="fa-solid fa-wand-magic-sparkles text-white dark:text-indigo-400 text-[10px]"></i>
                <p className="text-[9px] font-black uppercase tracking-widest text-white italic">{aiInsight}</p>
              </div>
            )}
          </div>
          <h2 className="text-5xl xs:text-7xl font-black tracking-tighter mb-10 text-slate-900 dark:text-white">₹{(stats.total || 0).toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 xs:gap-6">
            <MetricBox label="In Bank" value={stats.online} color="text-indigo-600 dark:text-indigo-300" />
            <MetricBox label="In Hand" value={stats.cash} color="text-emerald-600 dark:text-emerald-300" />
            <MetricBox label="Pending" value={stats.pending} color="text-amber-600 dark:text-amber-300" />
            <MetricBox label="Loaned" value={stats.moneyGiven} color="text-rose-600 dark:text-rose-300" />
            <MetricBox label="Owed" value={stats.moneyTaken} color="text-cyan-600 dark:text-cyan-300" />
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[140px] transition-transform duration-[4000ms] group-hover:scale-125"></div>
      </div>

      <div className="space-y-4">
        <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800">
          {['Today', 'Yesterday', '7D', '30D', 'Custom'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f as TimeFilter)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {timeFilter === 'Custom' && (
          <div className="flex gap-3 animate-in slide-in-from-top-4 duration-500">
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-md border-2 border-slate-200 dark:border-slate-800"
              value={customRange.start}
              onChange={e => setCustomRange({...customRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-md border-2 border-slate-200 dark:border-slate-800"
              value={customRange.end}
              onChange={e => setCustomRange({...customRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
          <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-[0.3em] mb-8">Flux Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', fontSize: 10, fontWeight: 900 }} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={4} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-[0.3em] mb-8">Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', fontSize: 10, fontWeight: 900 }} />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
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

const MetricBox = ({ label, value, color }: any) => (
  <div className="bg-slate-100/60 dark:bg-white/10 p-5 rounded-[2.25rem] hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-300 transform active:scale-95 group/metric cursor-default backdrop-blur-sm border border-slate-200 dark:border-white/5">
    <p className="text-[10px] text-slate-700 dark:text-white/80 font-black uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-base xs:text-lg font-black ${color} tracking-tight`}>₹{(value || 0).toLocaleString()}</p>
  </div>
);
