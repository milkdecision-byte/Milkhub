import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, ChevronLeft, ChevronRight, Eye, Calendar, 
  Clock, ChevronDown, Download, FileText, Database, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, RefreshCcw, Moon, Sparkles
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'

// ── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const isAccepted = status?.toLowerCase() === 'accept' || status?.toLowerCase() === 'accepted'
  return (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${isAccepted ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-lg shadow-rose-500/5'}`}>
      {isAccepted ? 'ACCEPTED' : 'REJECTED'}
    </span>
  )
}

function RiskBadge({ risk }) {
  const colors = {
    high: 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-rose-500/5',
    medium: 'bg-orange-500/10 text-orange-600 border-orange-500/20 shadow-orange-500/5',
    low: 'bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-purple-500/5',
  }
  return (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${colors[risk?.toLowerCase()] || colors.low}`}>
      {risk?.toUpperCase() || 'LOW'} RISK
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchParams] = useSearchParams()
  const initialBatchId = searchParams.get('batch_id') || ''

  const [filters, setFilters] = useState({
    decision: '', fraud_risk: '', shift: '', date_from: '', date_to: '', search: '', batch_id: initialBatchId
  })
  const [batchesList, setBatchesList] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/batches?per_page=50')
      .then(r => setBatchesList(r.data.batches || []))
      .catch(e => console.error(e))
  }, [])

  const fetchRecords = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      )
      const params = new URLSearchParams({ page: pg, per_page: 30, ...activeFilters })
      const r = await api.get(`/records?${params}`)
      setRecords(r.data.records)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchRecords(1); setPage(1) }, [filters, fetchRecords])
  useEffect(() => { fetchRecords(page) }, [page, fetchRecords])

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-12 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Archival Terminal
        </h2>
        <div className="flex items-center gap-4">
          <button 
            className="btn-commercial btn-commercial-secondary border-[#C4B5FD]/30"
            onClick={() => setFilters({ decision: '', fraud_risk: '', shift: '', date_from: '', date_to: '', search: '', batch_id: '' })}
          >
            <RefreshCcw size={18} /> Reset Node
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <div className="card-premium p-8 space-y-10 border-[#C4B5FD]/20 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <div className="relative group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#C4B5FD]/40 text-sm font-semibold text-slate-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none transition-all shadow-sm" 
              placeholder="Search Provider or Node ID…"
              value={filters.search} 
              onChange={e => setFilter('search', e.target.value)} 
            />
          </div>
          
          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#C4B5FD]/40 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.batch_id}
              onChange={e => setFilter('batch_id', e.target.value)}
            >
              <option value="">Operational Sessions</option>
              {batchesList.map(b => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.session_name || b.batch_id.split('_').slice(1).join('_')} ({b.total_records} Records)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#C4B5FD]/40 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.decision}
              onChange={e => setFilter('decision', e.target.value)}
            >
              <option value="">Status: All Decisions</option>
              <option value="accept">Approved</option>
              <option value="reject">Rejected</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-[#C4B5FD]/40 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.fraud_risk}
              onChange={e => setFilter('fraud_risk', e.target.value)}
            >
              <option value="">Risk: All Profiles</option>
              <option value="low">Low Risk Level</option>
              <option value="medium">Medium Risk Level</option>
              <option value="high">High Alert Profile</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-10 pt-10 border-t border-[#C4B5FD]/20">
          <div className="flex items-center gap-5">
             <Calendar size={20} className="text-purple-400" />
             <div className="flex items-center gap-3">
               <input 
                type="date" 
                className="bg-[#F5F3FF] dark:bg-white/5 border border-[#C4B5FD]/30 rounded-xl text-xs font-bold text-purple-700 dark:text-slate-300 px-5 py-3.5 focus:ring-4 focus:ring-purple-600/5 cursor-pointer outline-none transition-all" 
                value={filters.date_from}
                onChange={e => setFilter('date_from', e.target.value)} 
               />
               <span className="text-[#7C3AED]/40 font-bold uppercase text-[10px]">to</span>
               <input 
                type="date" 
                className="bg-[#F5F3FF] dark:bg-white/5 border border-[#C4B5FD]/30 rounded-xl text-xs font-bold text-purple-700 dark:text-slate-300 px-5 py-3.5 focus:ring-4 focus:ring-purple-600/5 cursor-pointer outline-none transition-all" 
                value={filters.date_to}
                onChange={e => setFilter('date_to', e.target.value)} 
               />
             </div>
          </div>
          <div className="h-8 w-px bg-[#C4B5FD]/30 hidden xl:block" />
          <div className="flex items-center gap-5">
             <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Shift Node</span>
             <div className="flex bg-[#F5F3FF] dark:bg-white/5 p-1.5 rounded-2xl border border-[#C4B5FD]/20">
               {['all', 'morning', 'evening'].map(s => (
                 <button 
                  key={s}
                  onClick={() => setFilter('shift', s === 'all' ? '' : s)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${((s === 'all' && !filters.shift) || filters.shift === s) ? 'bg-white dark:bg-white/10 text-orange-600 shadow-lg shadow-orange-500/10' : 'text-purple-400 hover:text-purple-600'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="card-premium overflow-hidden border-[#C4B5FD]/20 shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#F5F3FF] dark:bg-black/60 border-b border-[#C4B5FD]/20">
                <th className="table-header-enterprise">Provider Node</th>
                <th className="table-header-enterprise">Temporal Node</th>
                <th className="table-header-enterprise">Metrics (Scientific)</th>
                <th className="table-header-enterprise text-center">Diagnostics</th>
                <th className="table-header-enterprise text-right">Operational Result</th>
                <th className="table-header-enterprise text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-48">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-sm font-bold text-purple-400 uppercase tracking-widest animate-pulse">Retrieving Central Intelligence...</p>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-48">
                  <Search size={56} className="text-purple-200 dark:text-white/10 mx-auto mb-6" />
                  <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">No Intelligence Records Detected</p>
                </td></tr>
              ) : records.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-[#F5F3FF]/50 dark:hover:bg-white/[0.02] transition-all duration-300 group"
                >
                  <td className="px-8 py-7">
                    <p className="text-sm font-bold text-[#1E1B4B] dark:text-white group-hover:text-purple-700 transition-colors">{r.farmer_name}</p>
                    <p className="text-[10px] font-bold text-purple-400 uppercase mt-1">Registry ID: {r.farmer_code || 'MILK-HUB-NULL'}</p>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${r.shift === 'morning' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'}`}>
                        {r.shift === 'morning' ? <Clock size={18} /> : <Moon size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.date}</p>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">{r.shift} Node</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-10">
                       <div className="text-center min-w-[50px]">
                         <p className="text-[9px] font-bold text-purple-400 mb-1.5">Fat (%)</p>
                         <p className="text-sm font-bold text-[#1E1B4B] dark:text-white">{r.fat?.toFixed(2) || '—'}</p>
                       </div>
                       <div className="text-center min-w-[50px]">
                         <p className="text-[9px] font-bold text-purple-400 mb-1.5">SNF (%)</p>
                         <p className="text-sm font-bold text-[#1E1B4B] dark:text-white">{r.snf?.toFixed(2) || '—'}</p>
                       </div>
                       <div className="text-center min-w-[50px]">
                         <p className="text-[9px] font-bold text-purple-400 mb-1.5">pH</p>
                         <p className="text-sm font-bold text-orange-500">{r.ph?.toFixed(2) || '—'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-widest border transition-all duration-500 whitespace-nowrap ${r.cob_test === 'positive' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-lg shadow-rose-500/5' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                        COB Test: {r.cob_test || 'negative'}
                      </span>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-widest border transition-all duration-500 whitespace-nowrap ${r.alcohol_test === 'positive' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-lg shadow-rose-500/5' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                        Alcohol Test: {r.alcohol_test || 'negative'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={r.decision} />
                      {r.decision === 'reject' && r.reasons && r.reasons.length > 0 && (
                        <div className="flex flex-col items-end gap-1 mt-1">
                          {r.reasons.map((reason, idx) => (
                            <span key={idx} className="text-[9px] font-bold text-rose-500/70 uppercase tracking-tighter italic bg-rose-500/5 px-2 py-0.5 rounded-md border border-rose-500/10">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      <RiskBadge risk={r.fraud_risk} />
                    </div>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <button 
                      onClick={() => navigate(`/farmers/${r.farmer_id}`)}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-400 hover:bg-purple-600 hover:text-white transition-all duration-500 border border-transparent hover:border-purple-200/50 group/eye shadow-sm"
                      title="Deep Node Audit"
                    >
                      <Eye size={20} className="group-hover/eye:scale-110 transition-transform" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className="px-8 py-10 bg-[#F5F3FF] dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-[#C4B5FD]/20">
            <p className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
              Segment Index <span className="text-white px-3 py-1.5 rounded-lg bg-purple-600 shadow-lg shadow-purple-900/20 mx-2">{page}</span> of {pages}
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#C4B5FD]/30 disabled:opacity-30 transition-all shadow-sm hover:shadow-purple-500/10 hover:-translate-x-1"
              >
                <ChevronLeft size={22} className="text-[#7C3AED]" />
              </button>
              <div className="flex items-center gap-3">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  let pg = page <= 3 ? i + 1 : (page >= pages - 2 ? pages - 4 + i : page - 2 + i);
                  if (pg < 1 || pg > pages) return null;
                  return (
                    <button 
                      key={pg} 
                      onClick={() => setPage(pg)}
                      className={`w-12 h-12 rounded-2xl text-xs font-bold transition-all duration-500 border ${pg === page ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/30 scale-110' : 'bg-white dark:bg-white/5 border-[#C4B5FD]/30 text-purple-500 hover:text-orange-500'}`}
                    >
                      {pg}
                    </button>
                  )
                })}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))} 
                disabled={page === pages}
                className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#C4B5FD]/30 disabled:opacity-30 transition-all shadow-sm hover:shadow-purple-500/10 hover:translate-x-1"
              >
                <ChevronRight size={22} className="text-[#7C3AED]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
