
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
    <div className="space-y-10 pb-48 no-scrollbar animate-in fade-in duration-1000">
      
      <div className="card-ui p-12 bg-slate-900 dark:bg-black text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Net Liquid Wealth</p>
          <h2 className="text-7xl font-black tracking-tighter mb-12">₹{(stats.total || 0).toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <MetricBox label="In Bank" value={stats.online} color="text-indigo-400" />
            <MetricBox label="In Hand" value={stats.cash} color="text-emerald-400" />
            <MetricBox label="Pending" value={stats.pending} color="text-amber-400" />
            <MetricBox label="Loaned Out" value={stats.moneyGiven} color="text-rose-400" />
            <MetricBox label="Owed Out" value={stats.moneyTaken} color="text-cyan-400" />
          </div>
        </div>
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] transition-transform duration-[3000ms] group-hover:scale-125"></div>
      </div>

      <div className="space-y-6">
        <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-2 rounded-[3rem] shadow-xl mx-2">
          {['Today', 'Yesterday', '7D', '30D', 'Custom'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f as TimeFilter)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${timeFilter === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {timeFilter === 'Custom' && (
          <div className="flex gap-3 animate-in slide-in-from-top-4 duration-500 px-4">
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm border-2 border-slate-50 dark:border-slate-800"
              value={customRange.start}
              onChange={e => setCustomRange({...customRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm border-2 border-slate-50 dark:border-slate-800"
              value={customRange.end}
              onChange={e => setCustomRange({...customRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl relative overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 ml-2">Flux Analysis</h3>
          <div className="h-72">
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
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: 10, fontWeight: 800 }} />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={5} />
                <Area type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 ml-2">Type Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e144" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', fontSize: 10, fontWeight: 800 }} />
                <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={45}>
                  {analysisData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-ui bg-white dark:bg-slate-900 p-10 shadow-2xl md:col-span-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 ml-2">Category Spending</h3>
          <div className="h-80 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none"
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={Object.values(themeColors)[index % 15]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', paddingBottom: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }: any) => (
  <div className="bg-white/5 p-6 rounded-[2.25rem] hover:bg-white/10 transition-all duration-300 transform active:scale-95 group/metric cursor-default">
    <p className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-2 group-hover/metric:text-white transition-colors">{label}</p>
    <p className={`text-lg font-black ${color} tracking-tight`}>₹{(value || 0).toLocaleString()}</p>
  </div>
);
