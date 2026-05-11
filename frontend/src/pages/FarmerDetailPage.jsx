import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

function DecisionBadge({ d }) {
  const c = { accept: 'badge-accept', reject: 'badge-reject' }[d] || 'badge-low'
  const l = { accept: 'Accept', reject: 'Reject' }[d] || d
  return <span className={c}>{l}</span>
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
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-milk-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return <p className="text-slate-500 dark:text-slate-400">Farmer not found</p>

  const { farmer, records } = data
  const trendData = records.slice().reverse().map(r => ({
    date: r.date?.slice(5),
    fat: r.fat, snf: r.snf, ph: r.ph
  }))
  const acceptRate = farmer.total_submissions
    ? ((farmer.total_accepted / farmer.total_submissions) * 100).toFixed(1)
    : 0

  const chartConfig = {
    grid: isDark ? '#1e293b' : '#e2e8f0',
    text: isDark ? '#64748b' : '#94a3b8',
    tooltip: {
      bg: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '#334155' : '#e2e8f0',
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/farmers')}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to Farmers
      </button>

      {/* Header */}
      <div className="card p-6 flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-milk-500 to-milk-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {farmer.full_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{farmer.full_name}</h1>
            {farmer.fraud_flag && (
              <span className="badge-high flex items-center gap-1"><ShieldAlert size={12} />FRAUD FLAGGED</span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {farmer.farmer_code} {farmer.village && `• ${farmer.village}`} {farmer.district && `• ${farmer.district}`}
          </p>
          {farmer.phone && <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{farmer.phone}</p>}
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-milk-600 dark:text-milk-400">{farmer.total_submissions}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wide">Submissions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{acceptRate}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wide">Accept Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{farmer.fraud_count || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wide">Fraud Events</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{farmer.total_accepted}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">Accepted</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{farmer.total_rejected}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">Rejected</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{farmer.avg_fat?.toFixed(3) ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">Avg FAT %</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{farmer.avg_snf?.toFixed(3) ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">Avg SNF %</p>
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            FAT &amp; SNF Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: chartConfig.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartConfig.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: chartConfig.tooltip.bg, border: `1px solid ${chartConfig.tooltip.border}`, borderRadius: 10, fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: chartConfig.text, paddingTop: 16 }} />
              <Line type="monotone" dataKey="fat" name="FAT %" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="snf" name="SNF %" stroke="#3aa3f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent Records ({records.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                {['Date', 'Shift', 'FAT', 'SNF', 'pH', 'Temp', 'MBRT', 'Decision', 'Fraud Risk', 'Reasons'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs font-medium">{r.date}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 capitalize text-xs font-bold">{r.shift}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{r.fat?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{r.snf?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{r.ph?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{r.temperature?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{r.mbrt?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-2.5"><DecisionBadge d={r.decision} /></td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold ${r.fraud_risk === 'high' ? 'text-red-600 dark:text-red-400' :
                        r.fraud_risk === 'medium' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>{r.fraud_risk?.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500 text-xs max-w-[150px] truncate" title={r.reasons?.join(', ')}>
                    {r.reasons && r.reasons.length > 0 ? r.reasons[0] : '—'}
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
