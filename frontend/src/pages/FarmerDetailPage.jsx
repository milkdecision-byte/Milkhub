import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ShieldAlert, Activity, TrendingUp, 
  MapPin, Phone, Database, FileText, CheckCircle2, 
  XCircle, AlertTriangle, Microscope, User, Info, 
  Clock, Thermometer, Droplets, Zap
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

function StatusBadge({ decision }) {
  const isAccept = decision === 'accept'
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
      isAccept 
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
        : 'bg-red-500/10 text-red-600 border-red-500/20'
    }`}>
      {isAccept ? 'ACCEPTED' : 'REJECTED'}
    </span>
  )
}

export default function FarmerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    api.get(`/farmers/${id}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Farmer Records...</p>
    </div>
  )
  
  if (!data) return (
    <div className="card-premium p-12 text-center">
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Farmer not found in records.</p>
    </div>
  )

  const { farmer, records } = data
  const trendData = records.slice().reverse().map(r => ({
    date: r.date?.slice(5),
    fat: r.fat, snf: r.snf, ph: r.ph
  }))
  
  const acceptRate = farmer.total_submissions
    ? ((farmer.total_accepted / farmer.total_submissions) * 100).toFixed(1)
    : 0

  const chartColors = {
    fat: '#3b82f6',
    snf: '#10b981',
    ph: '#f59e0b',
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#64748b' : '#94a3b8'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* ── Navigation ── */}
      <button 
        onClick={() => navigate('/farmers')}
        className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-all text-[10px] font-black uppercase tracking-widest group"
      >
        <div className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
          <ArrowLeft size={16} /> 
        </div>
        Back to Farmer Registry
      </button>

      {/* ── Profile Header ── */}
      <div className="card-premium p-8 flex flex-col lg:flex-row items-center gap-10">
        <div className="w-32 h-32 rounded-[2.5rem] bg-blue-600 text-white flex items-center justify-center text-5xl font-black shadow-2xl shadow-blue-600/30 rotate-3 border-4 border-white dark:border-slate-800">
          {farmer.full_name[0]?.toUpperCase()}
        </div>
        
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap mb-3">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{farmer.full_name}</h1>
            {farmer.fraud_flag && (
              <span className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 shadow-sm animate-pulse">
                <ShieldAlert size={14} /> High Quality Risk
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Database size={14} className="text-blue-600" /> {farmer.farmer_code}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-blue-600" /> {farmer.village || farmer.district || 'Other Area'}
            </p>
            {farmer.phone && (
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} className="text-blue-600" /> {farmer.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 text-center border-l border-slate-100 dark:border-white/10 pl-10 hidden lg:grid">
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{farmer.total_submissions}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Collections</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">{acceptRate}%</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Acceptance Rate</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-red-600 tracking-tighter">{farmer.fraud_count || 0}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Rejections</p>
          </div>
        </div>
      </div>

      {/* ── Quality Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 card-premium p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
              <TrendingUp size={18} className="text-blue-600"/> Milk Quality Trends
            </h3>
            <div className="flex items-center gap-4">
               {['Fat', 'SNF', 'pH'].map((key, i) => (
                 <div key={key} className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${['bg-blue-600', 'bg-emerald-500', 'bg-amber-500'][i]}`} />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="h-[340px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.fat} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={chartColors.fat} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSnf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.snf} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={chartColors.snf} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartColors.text, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: isDark ? '#0f172a' : '#fff', 
                      border: 'none', 
                      borderRadius: '16px',
                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area type="monotone" dataKey="fat" stroke={chartColors.fat} strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  <Area type="monotone" dataKey="snf" stroke={chartColors.snf} strokeWidth={3} fillOpacity={1} fill="url(#colorSnf)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                <Activity size={48} className="text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Not enough data for trend analysis</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium p-8 bg-slate-900 text-white relative overflow-hidden group">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Microscope size={16} /> Farmer Details
            </h4>
            <div className="space-y-5 relative z-10">
              {[
                { label: 'Average Fat', value: `${farmer.avg_fat?.toFixed(3) ?? '—'}%`, icon: Zap },
                { label: 'Average SNF', value: `${farmer.avg_snf?.toFixed(3) ?? '—'}%`, icon: Activity },
                { label: 'Member Since', value: records[records.length-1]?.date || '—', icon: Clock },
                { label: 'Village/Area', value: farmer.village || 'Main Area', icon: MapPin },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center group/item pb-4 border-b border-white/5 last:border-none last:pb-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <item.icon size={12} className="text-blue-500" /> {item.label}
                  </span>
                  <span className="text-xs font-black tracking-tight">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Quality Status</p>
               <p className="text-xl font-black tracking-tighter">{farmer.fraud_flag ? 'HIGH RISK' : 'REGULAR FARMER'}</p>
            </div>
            <TrendingUp size={140} className="absolute -right-10 -bottom-10 opacity-5 text-white rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>

          <div className="card-premium p-6 flex flex-col items-center justify-center text-center gap-4 bg-emerald-500/5 border-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Status</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Farmer is in good standing with quality standards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supply Vector Ledger ── */}
      <div className="card-premium overflow-hidden">
        <div className="px-8 py-6 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
            <Database size={18} className="text-blue-600"/> Past Milk Records
          </h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <div className="w-2 h-2 rounded-full bg-emerald-500" /> ACCEPTED
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <div className="w-2 h-2 rounded-full bg-red-500" /> REJECTED
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-black/20">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fat (%)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SNF (%)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">pH</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temp</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Result Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {records.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-4 text-[11px] font-black text-slate-900 dark:text-white font-mono">{r.date}</td>
                  <td className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{r.shift}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">{r.fat?.toFixed(2) ?? '—'}%</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">{r.snf?.toFixed(2) ?? '—'}%</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">{r.ph?.toFixed(2) ?? '—'}</td>
                  <td className="px-8 py-4 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">{r.temperature?.toFixed(1) ?? '—'}°C</td>
                  <td className="px-8 py-4"><StatusBadge decision={r.decision} /></td>
                  <td className="px-8 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      r.fraud_risk === 'high' ? 'text-red-600' : 'text-slate-400'
                    }`}>
                      {r.fraud_risk || 'Low Risk'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="max-w-[150px] truncate ml-auto text-[10px] font-bold text-slate-400 uppercase italic" title={r.reasons?.join(', ')}>
                      {r.reasons && r.reasons.length > 0 ? r.reasons[0] : 'No Issues'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
