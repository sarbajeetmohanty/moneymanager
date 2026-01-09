
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

  // Chart 1: Cash Flow (Incoming/Outgoing)
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

  // Chart 2: Analysis (Incoming, Outgoing, Given, Taken)
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

  // Chart 3: Category Pie
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
    <div className="space-y-8 pb-48 no-scrollbar animate-in fade-in duration-1000">
      
      {/* Metrics Card - High Contrast Fix */}
      <div className="card-ui p-10 bg-slate-900 dark:bg-black text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Total Balance</p>
          <h2 className="text-6xl font-black tracking-tighter mb-10">₹{(stats.total || 0).toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricBox label="Online" value={stats.online} color="text-indigo-400" />
            <MetricBox label="Cash" value={stats.cash} color="text-emerald-400" />
            <MetricBox label="Pending" value={stats.pending} color="text-amber-400" />
            <MetricBox label="Given" value={stats.moneyGiven} color="text-rose-400" />
            <MetricBox label="Taken" value={stats.moneyTaken} color="text-cyan-400" />
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Advanced Date Filters */}
      <div className="space-y-4">
        <div className="flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-[2rem] shadow-sm">
          {['Today', 'Yesterday', '7D', '30D', 'Custom'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f as TimeFilter)}
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {timeFilter === 'Custom' && (
          <div className="flex gap-2 animate-in slide-in-from-top-4 duration-500 px-2">
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm"
              value={customRange.start}
              onChange={e => setCustomRange({...customRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm"
              value={customRange.end}
              onChange={e => setCustomRange({...customRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      {/* 3 Graphs Section */}
      <div className="space-y-8">
        {/* 1. Cash Flow (Incoming/Outgoing) */}
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 ml-2">Cash Flow Trend</h3>
          <div className="h-64">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e144" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 10, fontWeight: 800 }} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={4} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Analysis of 4 Main Types */}
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 ml-2">4-Way Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e144" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: 10, fontWeight: 800 }} />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                  {analysisData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Category Distribution */}
        <div className="card-ui bg-white dark:bg-slate-900 p-8 shadow-xl">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 ml-2">Category Spending</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={Object.values(themeColors)[index % 15]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }: any) => (
  <div className="bg-white/5 p-4 rounded-[1.5rem] hover:bg-white/10 transition-all">
    <p className="text-[8px] text-white/50 font-black uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-black ${color}`}>₹{(value || 0).toLocaleString()}</p>
