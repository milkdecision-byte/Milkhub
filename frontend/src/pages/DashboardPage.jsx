import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts'
import {
  CheckCircle2, XCircle, ShieldAlert,
  Sunrise, Moon, TrendingUp, Users2, Calendar, RefreshCcw,
  CloudOff, History
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().split('T')[0]

function StatCard({ label, value, icon: Icon, color, sub, theme }) {
  const isDark = theme === 'dark'
  const iconBg = color
    .replace('text-', 'bg-')
    .replace(/-[0-9]{3}$/, isDark ? '-900/40' : '-100')
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {label}
          </p>
          <p className={`text-xl sm:text-3xl font-bold mt-1 ${color}`}>
            {value !== undefined && value !== null ? String(value) : '—'}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
              {sub}
            </p>
          )}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const SHIFTS = [
  { key: '',         label: 'Full Day',  icon: TrendingUp, color: 'text-milk-500',   bg: 'bg-milk-50 dark:bg-milk-900/20'     },
  { key: 'morning',  label: 'Morning',   icon: Sunrise,    color: 'text-sky-500',    bg: 'bg-sky-50 dark:bg-sky-900/20'       },
  { key: 'evening',  label: 'Evening',   icon: Moon,       color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
]

export default function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // View mode: 'today' uses /dashboard/today | 'history' uses /dashboard?date=...
  const [viewMode, setViewMode]       = useState('today')  // 'today' | 'history'
  const [shift, setShift]             = useState('')
  const [historyDate, setHistoryDate] = useState(todayISO())
  const [batchesList, setBatchesList] = useState([])
  const [batchId, setBatchId]         = useState('')

  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError]             = useState(null)

  const intervalRef = useRef(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      let res
      if (batchId) {
        res = await api.get(`/dashboard?batch_id=${encodeURIComponent(batchId)}`)
      } else if (viewMode === 'today') {
        const params = shift ? `?shift=${shift}` : ''
        res = await api.get(`/dashboard/today${params}`)
      } else {
        const params = new URLSearchParams({ date: historyDate })
        if (shift) params.append('shift', shift)
        res = await api.get(`/dashboard?${params}`)
      }
      setData(res.data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
      setError('Failed to load dashboard data. Check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [viewMode, shift, historyDate, batchId])

  // Fetch batches list once
  useEffect(() => {
    api.get('/batches?per_page=20')
      .then(r => setBatchesList(r.data?.batches || []))
      .catch(() => {})
  }, [])

  // Fetch on filter change + auto-refresh every 30s
  useEffect(() => {
    fetchDashboard(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    // Only auto-refresh for today's live view
    if (viewMode === 'today' && !batchId) {
      intervalRef.current = setInterval(() => fetchDashboard(true), 30000)
    }
    return () => clearInterval(intervalRef.current)
  }, [fetchDashboard])

  // ── Derived values ────────────────────────────────────────────────────────

  const kpis     = data?.kpis || {}
  const hasData  = data?.has_data ?? false
  const trend    = (data?.daily_trend || []).slice(-14)
  const pieData  = [
    { name: 'Accepted', value: kpis.accepted || 0 },
    { name: 'Rejected', value: kpis.rejected  || 0 },
  ]
  const pieColors = ['#10b981', '#ef4444']

  const chartConfig = {
    grid:    isDark ? '#1e293b' : '#e2e8f0',
    text:    isDark ? '#64748b' : '#94a3b8',
    tooltip: {
      bg:     isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '#334155' : '#e2e8f0',
      label:  isDark ? '#94a3b8' : '#64748b',
    },
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-milk-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Dashboard Overview
            {refreshing && <RefreshCcw size={16} className="animate-spin text-milk-500" />}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 flex items-center gap-2 flex-wrap">
            {viewMode === 'today' && !batchId
              ? <>🟢 Live — today's data auto-refreshes every 30 seconds</>
              : <>📅 Historical view — {batchId ? 'batch' : historyDate}</>
            }
            {lastUpdated && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                Updated: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setViewMode('today'); setBatchId('') }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'today' && !batchId
                ? 'bg-milk-500 text-white border-milk-500 shadow'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-milk-400'
            }`}
          >
            🟢 Today Live
          </button>
          <button
            onClick={() => { setViewMode('history'); setBatchId('') }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              viewMode === 'history' && !batchId
                ? 'bg-slate-800 text-white border-slate-800 shadow'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <History size={13} /> History
          </button>
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-milk-400 transition-all"
            title="Refresh now"
          >
            <RefreshCcw size={14} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Date picker (history mode) ── */}
      {viewMode === 'history' && !batchId && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={historyDate}
            max={todayISO()}
            onChange={e => setHistoryDate(e.target.value)}
            className="input border-none bg-slate-50 dark:bg-slate-800 text-xs py-1.5 h-8"
          />
          <span className="text-xs text-slate-400">Select date to view historical records</span>
        </div>
      )}

      {/* ── Batch selector ── */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 px-2">Batch:</span>
        <select
          className="select text-xs py-1.5 h-8 border-none bg-slate-50 dark:bg-slate-800 flex-1 min-w-[200px]"
          value={batchId}
          onChange={e => { setBatchId(e.target.value); if (e.target.value) setViewMode('history') }}
        >
          <option value="">— Live / Date View —</option>
          <optgroup label="Historical Batches">
            {batchesList.map(b => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.session_name || b.batch_id} ({b.total_records} records)
              </option>
            ))}
          </optgroup>
        </select>
        {batchId && (
          <button onClick={() => { setBatchId(''); setViewMode('today') }} className="btn-secondary text-xs px-3 py-1.5">
            ✕ Clear Batch
          </button>
        )}
      </div>

      {/* ── Shift tabs ── */}
      <div className="grid grid-cols-3 gap-3">
        {SHIFTS.map(s => (
          <button
            key={s.key}
            onClick={() => setShift(s.key)}
            disabled={!!batchId}
            className={`p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all border ${
              shift === s.key
                ? 'border-milk-500 shadow-md ring-1 ring-milk-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            } bg-white dark:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {viewMode === 'today' && !batchId ? `Today ${s.label}` : s.label}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                {shift === s.key ? 'Active View' : 'Click to View'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
          <CloudOff size={18} /> {error}
        </div>
      )}

      {/* ── Empty state (today with no data yet) ── */}
      {!loading && !error && !hasData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <TrendingUp size={28} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {viewMode === 'today'
                ? 'No records uploaded today yet'
                : `No records found for ${historyDate}`}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {viewMode === 'today'
                ? 'Upload milk data today and this dashboard will update automatically.'
                : 'Try selecting a different date or switch to Live view.'}
            </p>
          </div>
          {viewMode === 'history' && (
            <button onClick={() => { setViewMode('today'); setBatchId('') }} className="btn-secondary text-sm px-5 py-2">
              ← Back to Live View
            </button>
          )}
        </motion.div>
      )}

      {/* ── KPI Cards (only when data exists) ── */}
      {hasData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard theme={theme} label="Total Records"   value={kpis.total}          icon={TrendingUp}   color="text-milk-600 dark:text-milk-400"    sub={`${data?.accept_rate ?? 0}% acceptance`} />
            <StatCard theme={theme} label="Accepted"        value={kpis.accepted}        icon={CheckCircle2} color="text-emerald-600 dark:text-emerald-400" sub="Passed quality checks" />
            <StatCard theme={theme} label="Rejected"        value={kpis.rejected}        icon={XCircle}      color="text-red-600 dark:text-red-400"       sub="Failed checks" />
            <StatCard theme={theme} label="Acceptance Rate" value={`${data?.accept_rate ?? 0}%`} icon={Users2} color="text-teal-600 dark:text-teal-400"  sub="Overall quality" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard theme={theme} label="Fraud High"    value={kpis.fraud_high}                              icon={ShieldAlert} color="text-red-600 dark:text-red-400"       sub="High risk alerts" />
            <StatCard theme={theme} label="Fraud Medium"  value={kpis.fraud_medium}                            icon={ShieldAlert} color="text-orange-600 dark:text-orange-400" sub="Medium risk alerts" />
            <StatCard theme={theme} label="Morning (L)"   value={Number(kpis.morning_qty || 0).toFixed(1)}     icon={Sunrise}     color="text-sky-600 dark:text-sky-400"        sub="Milk collected" />
            <StatCard theme={theme} label="Evening (L)"   value={Number(kpis.evening_qty || 0).toFixed(1)}     icon={Moon}        color="text-indigo-600 dark:text-indigo-400"  sub="Milk collected" />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Pie */}
            <div className="card p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-milk-500" /> Decision Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} className="outline-none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: chartConfig.tooltip.bg, border: `1px solid ${chartConfig.tooltip.border}`, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {pieData.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span className="w-2 h-2 rounded-full" style={{ background: pieColors[i] }} /> {d.name}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 14-day trend */}
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 14-Day Quality Trend
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAccept" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gReject" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: chartConfig.text, fontSize: 10 }} axisLine={false} tickLine={false} dy={10} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: chartConfig.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: chartConfig.tooltip.bg, border: `1px solid ${chartConfig.tooltip.border}`, borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: chartConfig.text, paddingTop: 20 }} />
                  <Area type="monotone" dataKey="accept" name="Accept" stroke="#10b981" fill="url(#gAccept)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="reject" name="Reject" stroke="#ef4444" fill="url(#gReject)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Shift + Top Farmers ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="card p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Shift Performance
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { shift: 'Morning', count: data?.shift_comparison?.morning?.count || 0, qty: data?.shift_comparison?.morning?.quantity || 0 },
                  { shift: 'Evening', count: data?.shift_comparison?.evening?.count || 0, qty: data?.shift_comparison?.evening?.quantity || 0 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
                  <XAxis dataKey="shift" tick={{ fill: chartConfig.text, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: chartConfig.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: chartConfig.tooltip.bg, border: `1px solid ${chartConfig.tooltip.border}`, borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="count" name="Records" fill="#3aa3f6" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="qty"   name="Qty (L)" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Top Performing Suppliers
              </h3>
              <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
                {(data?.top_farmers || []).slice(0, 8).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100/50 dark:border-transparent group">
                    <span className="text-[10px] font-bold text-slate-400 w-5 h-5 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-milk-600 dark:group-hover:text-milk-400 transition-colors">{f.farmer_name}</p>
                      <p className="text-[10px] font-semibold text-slate-500 font-mono uppercase tracking-tighter">{f.farmer_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{f.accepted}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ACCEPTED</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
