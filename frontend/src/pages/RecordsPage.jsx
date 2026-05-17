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
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [milkFilter, setMilkFilter] = useState('all')
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

  const filteredData = records.filter((item) => {
    const matchesSearch =
      item.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmer_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMilk =
      milkFilter === "all" ||
      item.milk_type?.toLowerCase() === milkFilter.toLowerCase();

    return matchesSearch && matchesMilk;
  });

  const downloadCSV = () => {
    const headers = ['Farmer', 'ID', 'Date', 'Shift', 'Status']
    const csvData = filteredData.map(r => [
      r.farmer_name || '',
      r.farmer_code || '',
      r.date || '',
      r.shift || '',
      r.decision || ''
    ])
    
    let filename = "milk_records.csv";
    if (milkFilter === "cow") filename = "cow_milk_records.csv";
    if (milkFilter === "buffalo") filename = "buffalo_milk_records.csv";

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div className="space-y-12 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Milk Records Monitor
        </h2>
        <div className="flex items-center gap-4">
          <button 
            className="btn-commercial btn-commercial-secondary border-[#C4B5FD]/30 flex items-center gap-2"
            onClick={() => setFilters({ decision: '', fraud_risk: '', shift: '', date_from: '', date_to: '', search: '', batch_id: '' })}
          >
            <RefreshCcw size={18} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <div className="card-premium p-8 space-y-10 border-[#C4B5FD]/20 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
          <div className="relative group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] group-focus-within:text-orange-500 transition-colors" />
            <input 
              className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/100 dark:bg-white/10 border border-[#C4B5FD]/40 text-sm font-semibold text-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none transition-all shadow-sm" 
              placeholder="Search Farmer Name or ID…"
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/100 dark:bg-white/10 border border-[#C4B5FD]/40 text-sm font-semibold text-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.batch_id}
              onChange={e => setFilter('batch_id', e.target.value)}
            >
              <option value="" className="text-slate-900">Collection Batches</option>
              {batchesList.map(b => (
                <option key={b.batch_id} value={b.batch_id} className="text-slate-900">
                  {b.session_name || b.batch_id.split('_').slice(1).join('_')} ({b.total_records} Records)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/100 dark:bg-white/10 border border-[#C4B5FD]/40 text-sm font-semibold text-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.decision}
              onChange={e => setFilter('decision', e.target.value)}
            >
              <option value="" className="text-slate-900">Status: All Decisions</option>
              <option value="accept" className="text-slate-900">Approved</option>
              <option value="reject" className="text-slate-900">Rejected</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/100 dark:bg-white/10 border border-[#C4B5FD]/40 text-sm font-semibold text-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={filters.fraud_risk}
              onChange={e => setFilter('fraud_risk', e.target.value)}
            >
              <option value="" className="text-slate-900">All Quality Risks</option>
              <option value="low" className="text-slate-900">Low Risk</option>
              <option value="medium" className="text-slate-900">Medium Risk</option>
              <option value="high">High Quality Risk</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              className="w-full px-6 py-5 rounded-2xl bg-white/100 dark:bg-white/10 border border-[#C4B5FD]/40 text-sm font-semibold text-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 appearance-none cursor-pointer" 
              value={milkFilter}
              onChange={e => setMilkFilter(e.target.value)}
            >
              <option value="all" className="text-slate-900">All Milk</option>
              <option value="cow" className="text-slate-900">Cow Milk</option>
              <option value="buffalo" className="text-slate-900">Buffalo Milk</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-10 pt-10 border-t border-[#C4B5FD]/20">
          <div className="flex items-center gap-5">
             <Calendar size={20} className="text-[#7C3AED]" />
             <div className="flex items-center gap-3">
               <input 
                type="date" 
                className="bg-[#F5F3FF] dark:bg-white/10 border border-[#C4B5FD]/30 rounded-xl text-xs font-bold text-black px-5 py-3.5 focus:ring-4 focus:ring-purple-600/5 cursor-pointer outline-none transition-all" 
                value={filters.date_from}
                onChange={e => setFilter('date_from', e.target.value)} 
               />
               <span className="text-[#7C3AED] font-bold uppercase text-[10px]">to</span>
               <input 
                type="date" 
                className="bg-[#F5F3FF] dark:bg-white/10 border border-[#C4B5FD]/30 rounded-xl text-xs font-bold text-black px-5 py-3.5 focus:ring-4 focus:ring-purple-600/5 cursor-pointer outline-none transition-all" 
                value={filters.date_to}
                onChange={e => setFilter('date_to', e.target.value)} 
               />
             </div>
          </div>
          <div className="h-8 w-px bg-[#C4B5FD]/30 hidden xl:block" />
          <div className="flex items-center gap-5">
             <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">Shift</span>
             <div className="flex bg-[#F5F3FF] dark:bg-white/10 p-1.5 rounded-2xl border border-[#C4B5FD]/20">
               {['all', 'morning', 'evening'].map(s => (
                 <button 
                  key={s}
                  onClick={() => setFilter('shift', s === 'all' ? '' : s)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${((s === 'all' && !filters.shift) || filters.shift === s) ? 'bg-white dark:bg-white/10 text-orange-600 shadow-lg shadow-orange-500/10' : 'text-[#7C3AED] hover:text-purple-600'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#1E1B4B] uppercase tracking-widest">Milk Record Search & Filter</h3>
          <p className="text-xs text-slate-600 mt-1">Search, filter and export milk quality records</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
          <button 
            className="btn-commercial btn-commercial-primary flex items-center gap-2"
            onClick={downloadCSV}
          >
            <Download size={18} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="card-premium overflow-hidden border-[#C4B5FD]/20 shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#F5F3FF] border-b border-[#C4B5FD]/20">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Farmer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Shift</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-48">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-sm font-bold text-[#7C3AED] uppercase tracking-widest animate-pulse">Loading Records...</p>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-48">
                  <Search size={56} className="text-[#7C3AED] dark:text-slate-200 mx-auto mb-6" />
                  <p className="text-sm font-bold text-[#7C3AED] uppercase tracking-widest">No Records Found</p>
                </td></tr>
              ) : records.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-[#F5F3FF]/70 transition-all duration-300 group"
                >
                  <td className="px-6 py-4 text-sm font-bold text-[#1E1B4B]">
                    {r.farmer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {r.farmer_code || '---'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {r.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 uppercase">
                    {r.shift}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={r.decision} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedRecord(r)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 mx-auto"
                      title="View Audit"
                    >
                      <Eye size={18} />
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
            <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">
              Page <span className="text-white px-3 py-1.5 rounded-lg bg-purple-600 shadow-lg shadow-purple-900/20 mx-2">{page}</span> of {pages}
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-4 rounded-2xl bg-white dark:bg-white/10 border border-[#C4B5FD]/30 disabled:opacity-30 transition-all shadow-sm hover:shadow-purple-500/10 hover:-translate-x-1"
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
                      className={`w-12 h-12 rounded-2xl text-xs font-bold transition-all duration-500 border ${pg === page ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/30 scale-110' : 'bg-white dark:bg-white/10 border-[#C4B5FD]/30 text-purple-500 hover:text-orange-500'}`}
                    >
                      {pg}
                    </button>
                  )
                })}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))} 
                disabled={page === pages}
                className="p-4 rounded-2xl bg-white dark:bg-white/10 border border-[#C4B5FD]/30 disabled:opacity-30 transition-all shadow-sm hover:shadow-purple-500/10 hover:translate-x-1"
              >
                <ChevronRight size={22} className="text-[#7C3AED]" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── View Audit Modal ── */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedRecord(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl z-10 w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#1E1B4B]">Audit Details</h3>
                    <p className="text-sm text-slate-600">Farmer: {selectedRecord.farmer_name} ({selectedRecord.farmer_code})</p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                  <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.date} | {selectedRecord.shift} Shift</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <StatusBadge status={selectedRecord.decision} />
                </div>
                
                <div className="col-span-2 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-bold text-[#1E1B4B] mb-4">Scientific Parameters</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Fat</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.fat?.toFixed(2) || '---'}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">SNF</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.snf?.toFixed(2) || '---'}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">pH</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.ph?.toFixed(2) || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Acidity</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.acidity?.toFixed(3) || '---'}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Temp</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.temperature?.toFixed(1) || '---'}°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">MBRT</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.mbrt || '---'} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Gravity</p>
                      <p className="text-sm font-bold text-[#1E1B4B]">{selectedRecord.specific_gravity?.toFixed(4) || '---'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-bold text-[#1E1B4B] mb-4">Qualitative Tests</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Alcohol Test</p>
                      <p className="text-sm font-bold text-[#1E1B4B] capitalize">{selectedRecord.alcohol_test || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">COB Test</p>
                      <p className="text-sm font-bold text-[#1E1B4B] capitalize">{selectedRecord.cob_test || '---'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-bold text-[#1E1B4B] mb-4">Diagnostics</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Risk Level</p>
                      <RiskBadge risk={selectedRecord.fraud_risk} />
                    </div>
                    {selectedRecord.reasons && selectedRecord.reasons.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rejection Reasons</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.reasons.map((r, idx) => (
                            <span key={idx} className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
