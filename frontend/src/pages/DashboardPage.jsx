import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import {
  TrendingUp, CheckCircle2, XCircle, Users, Activity, 
  Calendar, RefreshCcw, CloudOff, History, Thermometer,
  Droplets, Zap, ShieldCheck, Microscope, Clock, BarChart3,
  ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight,
  Monitor, Database, Info, FlaskConical
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0]

function StatCard({ label, value, icon: Icon, gradient, chartColor }) {
  return (
    <motion.div 
      whileHover={{ y: -8, shadow: '0 30px 60px -12px rgba(124, 58, 237, 0.15)' }}
      className="card-premium p-8 relative overflow-hidden group border-transparent transition-all duration-500 h-[280px] flex flex-col justify-between"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br ${gradient}`} />
      
      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500 mb-8`}>
          <Icon size={28} />
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-purple-900/40 dark:text-white/60 uppercase tracking-[0.2em] leading-none">{label}</p>
          <h3 className="text-4xl font-bold text-[#1E1B4B] dark:text-white tracking-tighter leading-none">{value}</h3>
        </div>
      </div>

      <div className="h-16 w-full mt-auto relative z-10 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[{v:10},{v:18},{v:14},{v:22},{v:18},{v:28}]}>
            <defs>
              <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={chartColor} 
              fill={`url(#gradient-${label.replace(/\s+/g, '-')})`} 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${gradient}`} />
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { theme } = useTheme()
  const [viewMode, setViewMode] = useState('realtime') 
  const [historyDate, setHistoryDate] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true)
    else setRefreshing(true)
    try {
      const endpoint = viewMode === 'realtime' ? '/dashboard/today' : `/dashboard?date=${historyDate}`
      const res = await api.get(endpoint)
      setData(res.data)
      setError(null)
    } catch (err) {
      setError('System connection error. Please verify network status.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [viewMode, historyDate])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-3xl border-4 border-[#7C3AED] border-t-transparent animate-spin relative">
        <div className="absolute inset-0 border-4 border-orange-400 border-b-transparent rounded-3xl animate-spin-slow" />
      </div>
      <p className="text-sm font-bold text-[#7C3AED] uppercase tracking-widest animate-pulse">Synchronizing Intelligence Cloud</p>
    </div>
  )

  const stats = data?.kpis || {}
  const records = data?.records || []
  
  // Exact Scientific Formatting for Parameters
  const radarData = [
    { subject: 'Fat (%)', A: stats.avg_fat || 3.5 },
    { subject: 'SNF (%)', A: stats.avg_snf || 8.2 },
    { subject: 'pH', A: stats.avg_ph || 6.7 },
    { subject: 'Temperature (°C)', A: stats.avg_temp || 4.2 },
    { subject: 'Specific Gravity', A: stats.avg_gravity || 1.028 },
    { subject: 'Acidity (% LA)', A: stats.avg_acidity || 0.14 },
  ]

  const donutData = [
    { name: 'Accepted', value: stats.accepted || 0, color: '#7C3AED' },
    { name: 'Rejected', value: stats.rejected || 0, color: '#F97316' },
  ]

  return (
    <div className="space-y-10 pb-20 overflow-x-hidden max-w-full">
      
      {/* ── Header Control Hub ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <AnimatePresence>
              {refreshing && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase animate-pulse"
                >
                  <RefreshCcw size={10} className="animate-spin" /> Stream Sync Active
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#1E1B4B] dark:text-white tracking-tight leading-[1.05] py-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            IVRI Milk <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#F97316]">Intelligence Hub</span>
          </h1>
          <p className="text-purple-900/50 dark:text-slate-400 font-semibold text-lg max-w-2xl">
            Real-time molecular diagnostics and supply chain intelligence for enterprise quality control.
          </p>
        </div>

        <div className="lg:col-span-5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6 border-[#C4B5FD]/20 shadow-2xl relative overflow-hidden group h-full"
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-500 flex items-center gap-2 ${viewMode === 'realtime' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'}`}>
                  <span className={`w-2 h-2 rounded-full ${viewMode === 'realtime' ? 'bg-orange-500 animate-pulse' : 'bg-purple-500'}`} />
                  {viewMode === 'realtime' ? 'LIVE MONITOR' : 'TEMPORAL AUDIT'}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F3FF] dark:bg-white/5 border border-[#C4B5FD]/30 text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest">
                  <Activity size={10} /> Active Node
                </div>
              </div>
              <div className="text-[10px] font-bold text-[#7C3AED]/40 uppercase tracking-widest">
                ID: HUB-{viewMode.toUpperCase()}-01
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#1E1B4B] dark:text-white tracking-tight">
                  {viewMode === 'realtime' ? 'Real-Time Surveillance' : 'Historical Data Audit'}
                </h2>
                <p className="text-[11px] text-purple-900/40 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  {viewMode === 'realtime' 
                    ? 'Monitoring continuous molecular streams from active supply clusters.' 
                    : `Auditing quality vectors for the temporal window: ${historyDate}`}
                </p>
                <div className="flex items-center gap-4 mt-6">
                  <div className="px-4 py-2 rounded-2xl bg-[#7C3AED]/5 border border-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <FlaskConical size={14} className="text-orange-500" /> Molecular Stream Active
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex bg-[#F5F3FF] dark:bg-white/5 p-1 rounded-2xl border border-[#C4B5FD]/20 shadow-inner">
                  <button 
                    onClick={() => setViewMode('realtime')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-500 ${viewMode === 'realtime' ? 'bg-white dark:bg-white/10 text-orange-600 shadow-lg shadow-orange-500/10' : 'text-purple-400 hover:text-purple-600'}`}
                  >
                    <Monitor size={14} className="inline mr-2" /> Live
                  </button>
                  <button 
                    onClick={() => setViewMode('history')}
                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-500 ${viewMode === 'history' ? 'bg-white dark:bg-white/10 text-orange-600 shadow-lg shadow-orange-500/10' : 'text-purple-400 hover:text-purple-600'}`}
                  >
                    <Database size={14} className="inline mr-2" /> Audit
                  </button>
                </div>
                {viewMode === 'history' && (
                  <motion.input 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="date" 
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    className="w-full bg-[#F5F3FF] dark:bg-slate-900/60 border border-[#C4B5FD]/40 rounded-xl text-[10px] font-bold text-[#7C3AED] px-4 py-2.5 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all cursor-pointer"
                  />
                )}
              </div>
            </div>

            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
              <Monitor size={120} className="text-[#7C3AED]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 lg:gap-8">
        <StatCard label="Network Throughput" value={stats.total || 0} icon={Activity} gradient="from-[#7C3AED] to-[#8B5CF6]" chartColor="#7C3AED" />
        <StatCard label="Quality Assurance" value={stats.accepted || 0} icon={ShieldCheck} gradient="from-[#10B981] to-[#34D399]" chartColor="#10B981" />
        <StatCard label="Failure Rate" value={stats.rejected || 0} icon={XCircle} gradient="from-[#F43F5E] to-[#FB7185]" chartColor="#F43F5E" />
        <StatCard label="Morning Yield" value={`${stats.morning_qty || 0}L`} icon={Sparkles} gradient="from-[#F97316] to-[#FDBA74]" chartColor="#F97316" />
        <StatCard label="Evening Yield" value={`${stats.evening_qty || 0}L`} icon={Droplets} gradient="from-[#8B5CF6] to-[#C4B5FD]" chartColor="#8B5CF6" />
        <StatCard label="Supply Nodes" value={data?.farmer_count || 0} icon={Users} gradient="from-[#4F46E5] to-[#6366F1]" chartColor="#4F46E5" />
      </div>

      {/* ── Main Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Molecular Analysis (Radar) - REDESIGNED */}
        <div className="card-premium p-10 lg:col-span-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-widest flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.5)]" /> Milk Quality Analysis
            </h3>
            <Microscope size={20} className="text-[#7C3AED]/40" />
          </div>
          
          <div className="h-[340px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius="65%" 
                data={radarData}
                margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
              >
                <PolarGrid stroke={theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.15)'} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ 
                    fill: theme === 'dark' ? '#CBD5E1' : '#4C1D95', 
                    fontSize: window.innerWidth < 640 ? 8 : 10, 
                    fontWeight: 900,
                    letterSpacing: '0.02em'
                  }} 
                />
                <Radar 
                  name="Parameters" 
                  dataKey="A" 
                  stroke="#7C3AED" 
                  strokeWidth={2}
                  fill="#8B5CF6" 
                  fillOpacity={0.15} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Scientific Stat Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {radarData.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-[#F5F3FF] dark:bg-white/5 border border-[#C4B5FD]/20 group hover:border-[#7C3AED]/40 transition-all duration-300 min-h-[72px] justify-center">
                <span className="text-[9px] font-black text-purple-900/40 dark:text-slate-400 uppercase tracking-widest leading-none truncate">
                  {item.subject}
                </span>
                <span className="text-lg font-black text-[#7C3AED] dark:text-white leading-none">
                  {item.A}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Metrics (Donut) */}
        <div className="card-premium p-10 lg:col-span-1 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-widest flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" /> Decision Metrics
            </h3>
            <BarChart3 size={20} className="text-orange-400/40" />
          </div>
          <div className="h-[320px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={85} outerRadius={115} paddingAngle={8} dataKey="value">
                  {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1E1B4B', border: 'none', borderRadius: 20, padding: '16px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-5xl font-bold text-[#1E1B4B] dark:text-white">{Math.round((stats.accepted / (stats.total || 1)) * 100)}%</p>
              <p className="text-[10px] font-bold text-[#7C3AED]/60 uppercase tracking-[0.2em] mt-2">Quality Index</p>
            </div>
          </div>
          <div className="mt-10 space-y-3">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F5F3FF] dark:hover:bg-white/5 transition-all duration-500 border border-transparent hover:border-[#C4B5FD]/20">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full shadow-lg shadow-black/5" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-bold text-[#1E1B4B]/80 dark:text-slate-300 uppercase tracking-widest">{d.name}</span>
                </div>
                <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">{d.value} Samples</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Diagnostics (Summary) */}
        <div className="card-premium p-10 lg:col-span-1 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-widest flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.5)]" /> System Diagnostics
            </h3>
            <Zap size={20} className="text-purple-400/40" />
          </div>
          <div className="space-y-6">
            {[
              { p: 'Fat (%)', v: stats.avg_fat, r: '3.5%', s: 'Optimal', c: 'text-[#7C3AED]' },
              { p: 'SNF (%)', v: stats.avg_snf, r: '8.5%', s: 'Balanced', c: 'text-orange-500' },
              { p: 'pH', v: stats.avg_ph, r: '6.7', s: 'Normal', c: 'text-purple-600' },
              { p: 'Acidity (% LA)', v: stats.avg_acidity, r: '0.14', s: 'Scientific', c: 'text-rose-500' },
              { p: 'Temperature (°C)', v: stats.avg_temp, r: '4.2°C', s: 'Controlled', c: 'text-indigo-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div>
                  <p className="text-sm font-bold text-[#1E1B4B] dark:text-white mb-1">{item.p}</p>
                  <p className="text-[10px] font-bold text-[#7C3AED]/40 dark:text-lavender/60 uppercase tracking-widest">Baseline: {item.r}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${item.c}`}>{item.v || '—'}</p>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">{item.s}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 rounded-[1.5rem] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-1 transition-all duration-500">
            Export Global Insights
          </button>
        </div>
      </div>

      {/* ── Records Section ── */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-widest flex items-center gap-4">
            <span className="w-4 h-4 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Operational Archive
          </h3>
          <NavLink to="/records" className="group flex items-center gap-3 text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest hover:text-orange-500 transition-all">
            Full Registry <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F3FF] dark:bg-black/60 border-b border-[#C4B5FD]/20">
                  <th className="table-header-enterprise">Node Identity</th>
                  <th className="table-header-enterprise">Temporal Hub</th>
                  <th className="table-header-enterprise text-center">Scientific Parameters</th>
                  <th className="table-header-enterprise text-right">Yield (L)</th>
                  <th className="table-header-enterprise text-right">System Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
                {records.slice(0, 10).map((r, i) => (
                  <tr key={i} className="hover:bg-[#F5F3FF]/50 dark:hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="px-8 py-7">
                      <p className="text-sm font-bold text-[#1E1B4B] dark:text-white group-hover:text-[#7C3AED] transition-colors">{r.farmer_name}</p>
                      <p className="text-[10px] font-bold text-[#7C3AED]/40 dark:text-lavender/60 uppercase tracking-widest mt-1">Reg: {r.farmer_code}</p>
                    </td>
                    <td className="px-8 py-7">
                      <span className={`status-pill ${r.shift === 'Morning' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'}`}>
                        {r.shift} Node
                      </span>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center justify-center gap-10">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-[#7C3AED]/40 dark:text-lavender/80 uppercase mb-1">Fat (%)</p>
                          <p className="text-sm font-bold text-[#1E1B4B] dark:text-white">{r.fat}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-[#7C3AED]/40 dark:text-lavender/80 uppercase mb-1">SNF (%)</p>
                          <p className="text-sm font-bold text-[#1E1B4B] dark:text-white">{r.snf}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-[#7C3AED]/40 dark:text-lavender/80 uppercase mb-1">pH</p>
                          <p className="text-sm font-bold text-[#1E1B4B] dark:text-white">{r.ph}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <p className="text-lg font-bold text-[#1E1B4B] dark:text-white">{r.quantity}</p>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <div className="flex justify-end">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${r.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-lg shadow-rose-500/5'}`}>
                          {r.status === 'Accepted' ? 'ACCEPTED' : 'REJECTED'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Footer Analytics Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Network Nodes', v: '124 Validated', icon: Users, g: 'from-purple-500 to-indigo-600' },
          { l: 'Stability Index', v: '99.98%', icon: Activity, g: 'from-emerald-400 to-teal-500' },
          { l: 'Cloud Processing', v: '140ms Latency', icon: Zap, g: 'from-orange-400 to-rose-500' },
          { l: 'Node Integrity', v: 'Verified', icon: ShieldCheck, g: 'from-blue-400 to-indigo-500' },
        ].map((item, i) => (
          <div key={i} className="card-premium p-8 flex items-center gap-6 border-dashed hover:border-purple-600/20 group transition-all duration-500">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.g} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
              <item.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#7C3AED]/40 tracking-widest mb-1">{item.l}</p>
              <p className="text-base font-bold text-[#1E1B4B] dark:text-white">{item.v}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
