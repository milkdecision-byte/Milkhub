import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileSpreadsheet, FileText, Download, Loader2, Filter,
  Search, ShieldAlert, CheckCircle2, LayoutDashboard,
  Calendar, Clock, Database, ChevronDown, Mail, Activity,
  ArrowRight, Sparkles, RotateCcw, Microscope, Thermometer, Droplets, FlaskConical, Zap
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Shared Components ─────────────────────────────────────────────────────────

function StatMiniCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="card-premium p-6 flex items-center gap-6 border-[#C4B5FD]/10 shadow-lg group hover:border-[#7C3AED]/40 transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white"/>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#1E1B4B] tracking-tighter">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

function ExportCard({ icon: Icon, title, desc, colorClass, onClick, loading, variant = 'full' }) {
  const isCompact = variant === 'compact'
  return (
    <motion.button
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`card-premium p-8 text-left transition-all duration-500 flex items-center gap-8 disabled:opacity-50 group border-transparent hover:border-[#C4B5FD]/40 ${isCompact ? 'sm:p-6' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl ${colorClass} group-hover:scale-110 transition-transform`}>
        {loading ? <Loader2 size={24} className="animate-spin text-white"/> : <Icon size={24} className="text-white"/>}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-[#111827] tracking-tight group-hover:text-[#7C3AED] transition-colors ${isCompact ? 'text-lg' : 'text-xl'}`}>
          {title}
        </h4>
        <p className="text-[10px] text-[#374151] font-semibold leading-relaxed mt-1">
          {desc}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-white/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-all">
        <Download size={18} />
      </div>
    </motion.button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [filters, setFilters] = useState({ 
    date_from: new Date().toISOString().split('T')[0], 
    date_to: '', 
    decision: '', 
    fraud_risk: '', 
    session: '' 
  })
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingKey, setLoadingKey] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const displayedRecords = records.filter(r => !filters.date_from || r.date === filters.date_from)

  const fetchReportsData = useCallback(async () => {
    setLoading(true)
    setRecords([]) // Clear previous state
    setSummary(null)
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
      
      if (activeFilters.date_from && new Date(activeFilters.date_from) > new Date()) {
        toast.error('Future dates are unavailable')
        setLoading(false)
        setRecords([])
        setSummary(null)
        return
      }

      const [sumRes, recRes] = await Promise.all([
        api.get('/records/summary', { params: activeFilters }),
        api.get('/records', { params: { ...activeFilters, page, per_page: 20 } })
      ])
      setSummary(sumRes.data)
      setRecords(recRes.data.records)
      setTotal(recRes.data.total)
    } catch (e) {
      toast.error('Data synchronization failed')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  const downloadReport = async (key, path) => {
    if (!records || records.length === 0) {
      toast.error('No valid data exists for export')
      return
    }
    setLoadingKey(key)
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)))
      const queryString = params.toString()
      const separator = path.includes('?') ? '&' : '?'
      const finalUrl = queryString ? `${path}${separator}${queryString}` : path
      const r = await api.get(finalUrl, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      const cd = r.headers['content-disposition'] || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : `milkhub_export_${Date.now()}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch {
      toast.error('Report download failed')
    } finally {
      setLoadingKey(null)
    }
  }

  const setFilter = (k, v) => {
    setFilters(p => ({ ...p, [k]: v }))
    setPage(1)
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent flex items-center gap-4">
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg shadow-purple-500/20" /> 
          Download Quality Reports
        </h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Reports Ready
          </span>
        </div>
      </div>

      {/* ── Summary Analytics ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatMiniCard label="Total Records" value={summary.total} icon={Database} colorClass="bg-gradient-to-br from-indigo-600 to-blue-700" />
          <StatMiniCard label="ACCEPTED" value={summary.approved} icon={CheckCircle2} colorClass="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <StatMiniCard label="REJECTED" value={summary.rejected} icon={ShieldAlert} colorClass="bg-gradient-to-br from-rose-500 to-red-700" />
          <StatMiniCard label="Fraud High" value={summary.fraud} icon={Zap} colorClass="bg-gradient-to-br from-slate-700 to-slate-900" />
          <StatMiniCard label="Morning" value={summary.morning} icon={Calendar} colorClass="bg-gradient-to-br from-purple-500 to-indigo-600" />
          <StatMiniCard label="Evening" value={summary.evening} icon={Clock} colorClass="bg-gradient-to-br from-orange-500 to-amber-600" />
        </div>
      )}

      {/* ── Master Filter Matrix ── */}
      <div className="card-premium p-10 border-[#C4B5FD]/20 shadow-xl bg-white/100 dark:bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[#C4B5FD]/10 pb-8 mb-8">
          <h3 className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-[0.3em] flex items-center gap-4">
            <Filter size={18} /> Filter by Date and Shift
          </h3>
          <button 
            onClick={() => setFilters({ date_from:'', date_to:'', decision:'', fraud_risk:'', session:'' })}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-all flex items-center gap-2 group"
          >
            Clear Filters <RotateCcw size={12} className="group-hover:rotate-180 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Date Picker */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Date Selection</label>
            <input 
              type="date" 
              className="w-full bg-white dark:bg-white/10 border border-[#C4B5FD] px-5 py-4 rounded-2xl text-sm font-bold text-purple-900 outline-none focus:ring-4 focus:ring-purple-600/5 transition-all" 
              value={filters.date_from}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setFilter('date_from', e.target.value)}
            />
          </div>

          {/* Decision Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Quality Result</label>
            <select 
              className="w-full bg-white dark:bg-white/10 border border-[#C4B5FD] px-5 py-4 rounded-2xl text-sm font-bold text-purple-900 outline-none focus:ring-4 focus:ring-purple-600/5 appearance-none"
              value={filters.decision}
              onChange={e => setFilter('decision', e.target.value)}
            >
              <option value="">All Results</option>
              <option value="accept">ACCEPTED Only</option>
              <option value="reject">REJECTED Only</option>
            </select>
          </div>

          {/* Fraud Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Risk Level</label>
            <select 
              className="w-full bg-white dark:bg-white/10 border border-[#C4B5FD] px-5 py-4 rounded-2xl text-sm font-bold text-purple-900 outline-none focus:ring-4 focus:ring-purple-600/5 appearance-none"
              value={filters.fraud_risk}
              onChange={e => setFilter('fraud_risk', e.target.value)}
            >
              <option value="">All Risk Profiles</option>
              <option value="detected">Fraud Detected (High/Med)</option>
              <option value="high">Fraud High</option>
              <option value="medium">Fraud Medium</option>
              <option value="clean">Clean Samples Only</option>
            </select>
          </div>

          {/* Session Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Entry Source</label>
            <select 
              className="w-full bg-white dark:bg-white/10 border border-[#C4B5FD] px-5 py-4 rounded-2xl text-sm font-bold text-purple-900 outline-none focus:ring-4 focus:ring-purple-600/5 appearance-none"
              value={filters.session}
              onChange={e => setFilter('session', e.target.value)}
            >
              <option value="">All Sessions</option>
              <option value="morning">Morning Shift</option>
              <option value="evening">Evening Shift</option>
              <option value="manual">Manual Intelligence Entry</option>
            </select>
          </div>

          {/* Download Quick Actions */}
          <div className="flex items-end gap-3 pb-0.5">
            <button onClick={() => downloadReport('excel', '/export/excel')} className="flex-1 py-4 rounded-2xl bg-[#059669] text-white flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-widest">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={() => downloadReport('pdf', '/export/pdf')} className="flex-1 py-4 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 text-xs font-bold uppercase tracking-widest">
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Terminal Table ── */}
      <div className="card-premium overflow-hidden border-[#C4B5FD]/10 shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1800px]">
            <thead>
              <tr className="bg-[#1E1B4B] text-white border-b border-[#C4B5FD]/20">
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest sticky left-0 bg-[#1E1B4B] z-20">Provider Entity</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Registry ID</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Date / Time</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Fat (%)</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">SNF (%)</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">pH</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Acidity (% LA)</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Temp (°C)</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Specific Gravity</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">COB Test</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">MBRT (min)</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Quality Result</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-right pr-10">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-48 text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-[0.4em] animate-pulse">Generating Report...</p>
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-48 text-center">
                    <Database size={64} className="text-[#7C3AED] dark:text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-white mb-2">No milk records available for selected date</h3>
                    <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">Adjust your date and shift filters to view records.</p>
                  </td>
                </tr>
              ) : displayedRecords.map((r, i) => (
                <tr key={r.id} className="hover:bg-[#F5F3FF]/70 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5 sticky left-0 bg-white dark:bg-[#111827] z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-purple-500/20">
                        {r.farmer_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate max-w-[150px]">{r.farmer_name}</p>
                        <p className="text-[9px] font-bold text-[#7C3AED] dark:text-[#7C3AED] uppercase tracking-widest">{r.entry_type === 'manual' ? 'Manual Entry' : 'Bulk Upload'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">{r.farmer_code || '---'}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">{r.date}</p>
                    <p className="text-[10px] font-bold text-[#7C3AED] dark:text-[#7C3AED] uppercase tracking-widest">{r.shift}</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.fat?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.snf?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.ph?.toFixed(2)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.acidity?.toFixed(3)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.temperature?.toFixed(1)}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.specific_gravity?.toFixed(4)}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg border ${r.cob_test === 'positive' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {r.cob_test}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{r.mbrt || '---'}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg text-center ${r.decision === 'accept' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {r.decision === 'accept' ? 'ACCEPTED' : 'REJECTED'}
                        </span>
                      {r.decision === 'reject' && r.reasons?.slice(0,1).map((res,idx) => {
                        let displayReason = res;
                        if (res.toUpperCase().includes('ALCOHOL TEST FAIL')) displayReason = `Alcohol Test: ${r.alcohol_test || 'positive'}`;
                        if (res.toUpperCase().includes('COB POSITIVE')) displayReason = `COB Test: ${r.cob_test || 'positive'}`;
                        if (res.toUpperCase().includes('PH')) displayReason = `pH: ${r.ph?.toFixed(2)}`;
                        if (res.toUpperCase().includes('FAT')) displayReason = `Fat: ${r.fat?.toFixed(2)}%`;
                        if (res.toUpperCase().includes('SNF')) displayReason = `SNF: ${r.snf?.toFixed(2)}%`;
                        
                        return (
                          <span key={idx} className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter text-center">{displayReason}</span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right pr-10">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${r.fraud_risk === 'high' ? 'text-rose-500' : r.fraud_risk === 'medium' ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {r.fraud_risk === 'high' ? '!!! HIGH QUALITY RISK' : r.fraud_risk === 'medium' ? '! MEDIUM QUALITY RISK' : '✓ QUALITY VERIFIED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-10 py-8 bg-[#F5F3FF] dark:bg-black/40 border-t border-[#C4B5FD]/10 flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">
              Showing <span className="text-[#7C3AED]">{records.length}</span> of <span className="text-[#7C3AED]">{total}</span> Milk Records
            </p>
            <div className="flex items-center gap-4">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-[#C4B5FD]/20 flex items-center justify-center text-purple-600 disabled:opacity-30 hover:bg-purple-50 transition-all"
              >
                <ArrowRight className="rotate-180" size={18} />
              </button>
              <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">Page {page}</span>
              <button 
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-[#C4B5FD]/20 flex items-center justify-center text-purple-600 disabled:opacity-30 hover:bg-purple-50 transition-all"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Export Options ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <ExportCard
          icon={FileSpreadsheet} colorClass="bg-gradient-to-br from-[#059669] to-[#10B981]"
          title="Full Excel Report"
          desc={<span>Download all filtered records in <span className="text-[#7C3AED] font-bold">EXCEL</span></span>}
          loading={loadingKey === 'excel'}
          onClick={() => downloadReport('excel', '/export/excel')}
        />
        <ExportCard
          icon={FileText} colorClass="bg-gradient-to-br from-[#7C3AED] to-indigo-700"
          title="Summary PDF Report"
          desc={<span>Professional summary for <span className="text-[#7C3AED] font-bold">QUALITY REVIEW</span></span>}
          loading={loadingKey === 'pdf'}
          onClick={() => downloadReport('pdf', '/export/pdf')}
        />
        <ExportCard
          icon={FileSpreadsheet} colorClass="bg-gradient-to-br from-slate-700 to-slate-900"
          title="Filtered CSV Data"
          desc={<span>Download records in simple <span className="text-[#7C3AED] font-bold">CSV FORMAT</span></span>}
          loading={loadingKey === 'csv'}
          onClick={() => downloadReport('csv', '/export/csv')}
        />
      </div>
    </div>
  )
}
