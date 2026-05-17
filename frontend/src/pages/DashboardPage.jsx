import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts'
import {
  TrendingUp, TrendingDown, CheckCircle2, XCircle, 
  Activity, Calendar, Clock, ArrowUpRight, ArrowDownRight,
  FlaskConical, Thermometer, Droplets, Zap, ShieldCheck,
  Microscope, Info, ChevronRight, MoreHorizontal, Search,
  Filter, Download, LayoutGrid, List, Sun, Moon, ChevronDown, FileText, File, Printer
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// --- Main Dashboard ---

export default function DashboardPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTrendShift, setActiveTrendShift] = useState('fullDay') // morning, evening, fullDay
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/today')
      setData(res.data)
      setError(null)
    } catch (err) {
      setError('System connection error. Please verify network status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-blue-600 animate-pulse">Syncing Analytics...</p>
    </div>
  )

  const stats = data?.kpis || {}
  const records = data?.records || []

  // Dynamic Trend Data from backend filtered by shift
  const trendData = data?.daily_trend?.length > 0 
    ? data.daily_trend.map(d => {
        let acc = 0, rej = 0
        if (activeTrendShift === 'morning') {
          acc = d.morning_acc; rej = d.morning_rej
        } else if (activeTrendShift === 'evening') {
          acc = d.evening_acc; rej = d.evening_rej
        } else {
          acc = d.total_acc; rej = d.total_rej
        }
        return {
          name: d.date.split('-').slice(1).join('/'), 
          collection: acc,
          rejected: rej
        }
      })
    : [
        { name: '06:00', collection: 0, rejected: 0 },
        { name: '12:00', collection: 0, rejected: 0 },
        { name: '18:00', collection: 0, rejected: 0 },
      ]

  const donutData = [
    { name: 'Accepted', value: stats.accepted || 0, color: '#2563eb' },
    { name: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
  ]

  // Dynamic AI Insight Logic
  const insights = [
    {
      title: stats.morning_qty > stats.evening_qty ? "Morning Surge" : "Evening Surge",
      desc: `Today's ${stats.morning_qty > stats.evening_qty ? 'morning' : 'evening'} collection (${Math.max(stats.morning_qty, stats.evening_qty)}L) is leading the daily volume.`,
      type: 'info',
      icon: Info,
      color: 'blue'
    },
    {
      title: stats.rejected > 0 ? "Quality Alert" : "Quality Stable",
      desc: stats.rejected > 0 
        ? `${stats.rejected} samples were rejected today. Main issues: ${stats.avg_temp > 10 ? 'High Temp' : 'Standard variance'}.`
        : "All processed samples today meet the set quality standards. No immediate action required.",
      type: stats.rejected > 0 ? 'warning' : 'success',
      icon: stats.rejected > 0 ? Activity : ShieldCheck,
      color: stats.rejected > 0 ? 'orange' : 'emerald'
    },
    {
      title: "Efficiency Insight",
      desc: `Current acceptance rate is ${Math.round((stats.accepted / (stats.total || 1)) * 100)}%. System throughput is optimal.`,
      type: 'system',
      icon: Zap,
      color: 'indigo'
    }
  ]

  const handleExport = () => {
    if (!records || records.length === 0) {
      alert('No data to export')
      return
    }
    
    const headers = ['ID', 'Farmer', 'Fat', 'SNF', 'Status', 'DATE']
    const csvData = records.map(r => [
      r.id || '',
      r.farmer_name || '',
      r.fat || '',
      r.snf || '',
      r.decision || '',
      r.date || ''
    ])
    
    const csvContent = [headers, ...csvData].map(e => e.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'milk_collection_report.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportExcel = () => {
    if (!records || records.length === 0) {
      alert('No data to export')
      return
    }
    
    const headers = ['ID', 'Farmer', 'Fat', 'SNF', 'Status', 'DATE']
    const rows = records.map(r => [
      r.id || '',
      r.farmer_name || '',
      r.fat || '',
      r.snf || '',
      r.decision || '',
      r.date || ''
    ])
    
    let html = '<table border="1"><thead><tr>'
    headers.forEach(h => { html += `<th>${h}</th>` })
    html += '</tr></thead><tbody>'
    rows.forEach(row => {
      html += '<tr>'
      row.forEach(cell => { html += `<td>${cell}</td>` })
      html += '</tr>'
    })
    html += '</tbody></table>'
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'milk_collection_report.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (!records || records.length === 0) {
      alert('No data to export')
      return
    }
    
    const doc = new jsPDF()
    doc.text('Milk Collection Report', 14, 15)
    
    const headers = [['ID', 'Farmer', 'Fat', 'SNF', 'Status', 'DATE']]
    const data = records.map(r => [
      r.id || '',
      r.farmer_name || '',
      r.fat || '',
      r.snf || '',
      r.decision || '',
      r.date || ''
    ])
    
    doc.autoTable({
      head: headers,
      body: data,
      startY: 20,
    })
    
    doc.save('milk_collection_report.pdf')
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time monitoring of milk collection and quality parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-pro border border-[var(--border-light)] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Calendar size={18} />
            <span>Today</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="btn-pro btn-pro-primary">
              <Download size={18} />
              <span>Export Report</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden">
                <button onClick={() => { handleExport(); setShowExportDropdown(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                  <FileText size={16} className="text-slate-600" />
                  <span>Export CSV</span>
                </button>
                <button onClick={() => { handleExportExcel(); setShowExportDropdown(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                  <File size={16} className="text-emerald-500" />
                  <span>Export Excel</span>
                </button>
                <button onClick={() => { handleExportPDF(); setShowExportDropdown(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                  <Printer size={16} className="text-rose-500" />
                  <span>Export PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-10"
      >
        {/* Premium Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
          <OverviewCard 
            title="Morning Collection" 
            total={stats.morning_qty} 
            accepted={stats.morning_acc_qty} 
            rejected={stats.morning_rej_qty} 
            acceptance={Math.round((stats.morning_acc_qty / (stats.morning_qty || 1)) * 100)}
            icon={Sun} 
            color="orange"
            trendData={trendData.map(d => ({ value: d.collection }))}
          />
          <OverviewCard 
            title="Evening Collection" 
            total={stats.evening_qty} 
            accepted={stats.evening_acc_qty} 
            rejected={stats.evening_rej_qty} 
            acceptance={Math.round((stats.evening_acc_qty / (stats.evening_qty || 1)) * 100)}
            icon={Moon} 
            color="purple"
            trendData={trendData.map(d => ({ value: d.collection }))}
          />
          <OverviewCard 
            title="Full Day Collection" 
            total={stats.total_qty || (stats.morning_qty + stats.evening_qty)} 
            accepted={stats.morning_acc_qty + stats.evening_acc_qty} 
            rejected={stats.morning_rej_qty + stats.evening_rej_qty} 
            acceptance={Math.round(((stats.morning_acc_qty + stats.evening_acc_qty) / (stats.total_qty || 1)) * 100)}
            icon={Activity} 
            color="indigo"
            trendData={trendData.map(d => ({ value: d.collection }))}
          />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Milk Collection Trend */}
          <div 
            className="lg:col-span-7 card-pro p-4 md:p-8 flex flex-col h-[300px] md:h-[450px]"
            style={{ backgroundImage: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg md:text-xl font-black tracking-tight">Milk Collection Trend</h3>
                <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">Shift-wise volume analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex p-1.5 bg-indigo-50/50 dark:bg-slate-800 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10">
                  <button 
                    onClick={() => setActiveTrendShift('morning')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTrendShift === 'morning' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-500'}`}
                  >
                    Morning
                  </button>
                  <button 
                    onClick={() => setActiveTrendShift('evening')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTrendShift === 'evening' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-500'}`}
                  >
                    Evening
                  </button>
                  <button 
                    onClick={() => setActiveTrendShift('fullDay')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTrendShift === 'fullDay' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-500'}`}
                  >
                    Full Day
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-emerald glow-emerald" />
                <span className="text-emerald-500">Accepted (L)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-orange glow-orange" />
                <span className="text-rose-500">Rejected (L)</span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRej" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="collection" stroke="#22C55E" strokeWidth={3} fillOpacity={0.1} fill="url(#colorAcc)" />
                  <Area type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={3} fillOpacity={0.1} fill="url(#colorRej)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acceptance Overview */}
          <div 
            className="lg:col-span-5 card-pro p-4 md:p-8 flex flex-col h-[300px] md:h-[450px] relative overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full" />
            <h3 className="text-lg md:text-xl font-black tracking-tight mb-8">Acceptance Overview</h3>
            
            <div className="flex-1 flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                      <Cell fill="url(#gradEmerald)" />
                      <Cell fill="url(#gradOrange)" />
                    </Pie>
                    <defs>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                      <linearGradient id="gradOrange" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">
                    {Math.round((stats.accepted / (stats.total || 1)) * 100)}%
                  </span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Accepted</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Accepted Milk</span>
                    <span className="text-sm font-black text-emerald-600">{stats.accepted || 0} L</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.accepted / (stats.total || 1)) * 100}%` }}
                      className="h-full bg-gradient-emerald"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Rejected Milk</span>
                    <span className="text-sm font-black text-rose-600">{stats.rejected || 0} L</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.rejected / (stats.total || 1)) * 100}%` }}
                      className="h-full bg-gradient-orange"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 pt-2">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Total Collection</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{stats.total || 0} L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Parameters Row */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-purple flex items-center justify-center text-white glow-purple">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Milk Quality Standards</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-0.5">Real-time laboratory parameters</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ParameterCard 
              label="Fat (%)" value={stats.avg_fat || 0} 
              range={`${data?.standards?.fat?.min}-${data?.standards?.fat?.max}`} 
              status={stats.avg_fat < (data?.standards?.fat?.min || 3.2) ? 'Critical' : 'Optimal'}
              icon={Droplets} color="amber"
            />
            <ParameterCard 
              label="SNF (%)" value={stats.avg_snf || 0} 
              range={`${data?.standards?.snf?.min}-${data?.standards?.snf?.max}`} 
              status={stats.avg_snf < (data?.standards?.snf?.min || 8.0) ? 'Critical' : 'Optimal'}
              icon={Activity} color="blue"
            />
            <ParameterCard 
              label="pH" value={stats.avg_ph || 0} 
              range={`${data?.standards?.ph?.min}-${data?.standards?.ph?.max}`} 
              status={(stats.avg_ph < (data?.standards?.ph?.min || 6.5) || stats.avg_ph > (data?.standards?.ph?.max || 6.8)) ? 'Warning' : 'Optimal'}
              icon={FlaskConical} color="indigo"
            />
            <ParameterCard 
              label="MBRT (hrs)" value={stats.avg_mbrt || 0} 
              range={`> ${data?.standards?.mbrt?.min || 3.0}`} 
              status={stats.avg_mbrt < (data?.standards?.mbrt?.min || 3.0) ? 'Critical' : 'Optimal'}
              icon={Clock} color="emerald"
            />
            <ParameterCard 
              label="Gravity" value={stats.avg_gravity || 0} 
              range={`${data?.standards?.gravity?.min}-${data?.standards?.gravity?.max}`} 
              status={(stats.avg_gravity < (data?.standards?.gravity?.min || 1.028) || stats.avg_gravity > (data?.standards?.gravity?.max || 1.032)) ? 'Critical' : 'Optimal'}
              icon={Microscope} color="blue"
            />
            <ParameterCard 
              label="Acidity" value={stats.avg_acidity || 0} 
              range={`< ${data?.standards?.acidity?.max || 0.16}`} 
              status={stats.avg_acidity > (data?.standards?.acidity?.max || 0.16) ? 'Warning' : 'Optimal'}
              icon={Zap} color="rose"
            />
            <ParameterCard 
              label="Temp (°C)" value={stats.avg_temp || 0} 
              range={`< ${data?.standards?.temp?.max || 10.0}`} 
              status={stats.avg_temp > (data?.standards?.temp?.max || 10.0) ? 'Critical' : 'Optimal'}
              icon={Thermometer} color="orange"
            />
          </div>
        </div>

        {/* Bottom Grid: Records & AI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Records */}
          <div className="lg:col-span-8 card-pro flex flex-col">
            <div className="p-4 md:p-8 border-b border-indigo-50 dark:border-indigo-500/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-black tracking-tight">Recent Collection Records</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Live sampling data</p>
              </div>
              <button 
                onClick={() => navigate('/records')}
                className="px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider hover:scale-105 transition-all"
              >
                View Full History
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="table-header-pro">ID</th>
                    <th className="table-header-pro">Farmer</th>
                    <th className="table-header-pro text-center">Quality</th>
                    <th className="table-header-pro text-center">Status</th>
                    <th className="table-header-pro text-center">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-500/10">
                  {records.slice(0, 8).map((r, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">#{r.id || `S-${1000 + i}`}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black tracking-tight">{r.farmer_name}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{r.farmer_code}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-bold text-[#111827]">Fat: {r.fat}%</span>
                          <span className="text-[10px] font-medium text-[#4B5563]">SNF: {r.snf}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`status-badge mx-auto ${r.decision === 'accept' ? 'status-badge-success' : 'status-badge-error'}`}>
                          {r.decision === 'accept' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {r.decision === 'accept' ? 'Accepted' : 'Rejected'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">{r.date || '08:30 AM'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="lg:col-span-4 card-pro p-4 md:p-8 flex flex-col relative overflow-hidden bg-gradient-to-b from-indigo-500/5 to-transparent">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg md:text-xl font-black tracking-tight">AI Insights</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Intelligent anomaly detection</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white glow-indigo">
                <Zap size={20} fill="currentColor" />
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {insights.map((insight, idx) => {
                const Icon = insight.icon
                const gradients = {
                  emerald: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/10 border-emerald-200/50 dark:border-emerald-500/10 text-emerald-600',
                  indigo: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/10 dark:to-indigo-800/10 border-indigo-200/50 dark:border-indigo-500/10 text-indigo-600',
                  rose: 'from-rose-50 to-rose-100/50 dark:from-rose-900/10 dark:to-rose-800/10 border-rose-200/50 dark:border-rose-500/10 text-rose-600',
                  orange: 'from-orange-50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-500/10 text-orange-600',
                }
                const g = gradients[insight.color] || gradients.indigo
                return (
                  <div key={idx} className={`p-5 rounded-2xl bg-gradient-to-br border ${g} transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                        <Icon size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black uppercase tracking-wider">{insight.title}</p>
                          <span className="text-[9px] font-black text-[#6B7280]">09:30 AM</span>
                        </div>
                        <p className="text-[11px] font-bold text-[#374151] leading-relaxed">{insight.desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button 
              onClick={() => navigate('/records')}
              className="mt-8 btn-pro btn-pro-primary py-4 rounded-[20px] text-[11px] uppercase tracking-[0.2em]"
            >
              View All Intelligence Logs
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const OverviewCard = ({ title, total, accepted, rejected, acceptance, icon: Icon, color, trendData }) => {
  const colors = {
    indigo: { 
      grad: 'from-indigo-500 to-indigo-600', 
      soft: 'bg-indigo-50/50 dark:bg-indigo-900/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      glow: 'glow-indigo'
    },
    orange: { 
      grad: 'from-orange-500 to-coral-500', 
      soft: 'bg-orange-50/50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      glow: 'glow-orange'
    },
    purple: { 
      grad: 'from-purple-500 to-pink-500', 
      soft: 'bg-purple-50/50 dark:bg-purple-900/10',
      text: 'text-purple-600 dark:text-[#7C3AED]',
      glow: 'glow-purple'
    },
  }
  const c = colors[color] || colors.indigo

  return (
    <div 
      className="card-pro group p-8 flex flex-col gap-6 relative overflow-hidden"
      style={{ backgroundImage: `linear-gradient(135deg, ${color === 'orange' ? '#fff7ed, #ffedd5' : color === 'purple' ? '#f5f3ff, #ede9fe' : '#eff6ff, #dbeafe'})` }}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${c.soft} blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className={`w-12 h-12 rounded-full ${color === 'orange' ? 'bg-orange-100 text-orange-600' : color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{title}</p>
          <h2 className={`text-3xl font-black tracking-tighter ${c.text}`}>{(total || 0).toLocaleString()}L</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 relative z-10">
        <div>
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Accepted</p>
          <p className="text-base font-black tracking-tight text-emerald-600">{(accepted || 0).toLocaleString()} L</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejected</p>
          <p className="text-base font-black tracking-tight text-rose-600">{(rejected || 0).toLocaleString()} L</p>
        </div>
      </div>

      <div className="pt-6 border-t border-indigo-50 dark:border-indigo-500/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-emerald-500">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Acceptance</p>
            <p className="text-sm font-black text-emerald-500">{acceptance}%</p>
          </div>
        </div>
        <div className="w-24 h-10 opacity-50 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <Area type="monotone" dataKey="value" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : '#6366f1'} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

const ParameterCard = ({ label, value, range, status, icon: Icon, color }) => {
  const statusColors = {
    Optimal: 'from-emerald-500 to-mint-500 shadow-emerald-500/20 text-emerald-500',
    Warning: 'from-orange-500 to-coral-500 shadow-orange-500/20 text-orange-500',
    Critical: 'from-rose-500 to-pink-500 shadow-rose-500/20 text-rose-500',
  }
  const colorMap = {
    amber: 'text-orange-500',
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    orange: 'text-orange-500'
  }
  
  const gradientMap = {
    'fat (%)': 'linear-gradient(135deg, #fff7ed, #ffedd5)',
    'snf (%)': 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    'ph': 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    'mbrt (hrs)': 'linear-gradient(135deg, #ecfeff, #cffafe)',
    'gravity': 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
    'acidity': 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    'temp (°c)': 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
  }

  return (
    <div 
      className="card-pro group p-5 flex flex-col items-center gap-4 hover:border-indigo-500/30"
      style={{ backgroundImage: gradientMap[label.toLowerCase()] || 'none' }}
    >
      <div className={`w-12 h-12 rounded-2xl bg-white/100 dark:bg-white/10 flex items-center justify-center ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
        <h4 className={`text-lg font-black tracking-tight ${colorMap[color]}`}>{value}</h4>
      </div>
      <div className="w-full pt-4 border-t border-indigo-50 dark:border-indigo-500/10 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Normal Range</span>
          <span className="text-[10px] font-black text-indigo-500">{range}</span>
        </div>
        <div className={`status-badge ${status === 'Optimal' ? 'status-badge-success' : status === 'Warning' ? 'status-badge-warning' : 'status-badge-error'}`}>
          {status}
        </div>
      </div>
    </div>
  )
}
