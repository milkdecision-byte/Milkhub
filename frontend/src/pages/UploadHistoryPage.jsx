import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Trash2, Eye, Download, History, Calendar, 
  LayoutDashboard, FileText, ChevronDown, Database,
  Activity, ShieldCheck, Filter, Share2, MoreHorizontal,
  X, CheckCircle2, AlertTriangle, Box
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function UploadHistoryPage() {
  const [batches, setBatches] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [downloadDropdown, setDownloadDropdown] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const fetchBatches = async (pg = page, isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const params = new URLSearchParams({ page: pg, per_page: 20 })
      if (search) params.append('search', search)
      if (dateFilter) params.append('date', dateFilter)
      if (shiftFilter) params.append('shift', shiftFilter)
      const r = await api.get(`/batches?${params}`)
      setBatches(r.data.batches)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch (e) { console.error(e) }
    finally { if (!isSilent) setLoading(false) }
  }

  useEffect(() => { fetchBatches(1); setPage(1) }, [search, dateFilter, shiftFilter])
  useEffect(() => { fetchBatches(page) }, [page])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBatches(page, true)
    }, 30000)
    return () => clearInterval(interval)
  }, [page, search, dateFilter, shiftFilter])

  const handleDelete = async (batchId) => {
    if (!window.confirm('PROTOCOL WARNING: This action will permanently decommission the selected batch and all associated supply vectors. Proceed?')) return
    try {
      await api.delete(`/batches/${batchId}`)
      toast.success('Batch decommissioned successfully')
      fetchBatches()
    } catch (err) {
      toast.error('Failed to decommission batch archive')
    }
  }

  const handleDownload = async (batchId, format) => {
    try {
      toast.loading(`Synchronizing ${format.toUpperCase()} Protocol...`, { id: 'download' })
      const res = await api.get(`/export/${format}?batch_id=${batchId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `milkhub_archive_${batchId}.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Archive package exported successfully', { id: 'download' })
      setDownloadDropdown(null)
    } catch (err) {
      toast.error('Export protocol failed', { id: 'download' })
      setDownloadDropdown(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20" /> Historical Ledger
        </h2>
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="card-premium p-6 space-y-6">
        <div className="relative group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-16 pr-8 py-5 rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-600/5 transition-all outline-none shadow-inner" 
            placeholder="Search by Archive ID, Analytical Session, or Source Descriptor…"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[240px] relative">
            <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
            <input 
              type="date" 
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-14 pr-6 py-4 rounded-2xl text-[11px] font-black tracking-widest text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)} 
            />
          </div>
          <div className="flex-1 min-w-[240px] relative">
            <Filter size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
            <select 
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-14 pr-12 py-4 rounded-2xl text-[11px] font-black tracking-widest text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer appearance-none"
              value={shiftFilter} 
              onChange={e => setShiftFilter(e.target.value)}
            >
              <option value="">Global Network Shifts</option>
              <option value="morning">Morning Operations</option>
              <option value="evening">Evening Operations</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Data Grid ── */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Archive ID</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Analytical Session</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Source Descriptor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Horizon</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Segment</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Vectors</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Validation Metrics</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Operator</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-40">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl" />
                    <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Accessing Historical Shards...</p>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-40">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching ingestion cycles detected in registry archive.</p>
                  </td>
                </tr>
              ) : batches.map((b, i) => (
                <motion.tr 
                  key={b.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-8 py-5 text-slate-900 dark:text-white font-mono text-[10px] font-black uppercase tracking-tighter truncate max-w-[120px]">{b.batch_id}</td>
                  <td className="px-8 py-5 text-slate-900 dark:text-white font-black text-xs truncate max-w-[180px]">{b.session_name || 'System Baseline'}</td>
                  <td className="px-8 py-5 text-slate-500 text-[10px] font-bold truncate max-w-[180px]" title={b.file_name}>{b.file_name || 'Direct Laboratory Entry'}</td>
                  <td className="px-8 py-5 text-slate-500 text-[10px] font-bold whitespace-nowrap">{b.upload_date}</td>
                  <td className="px-8 py-5 text-slate-600 dark:text-slate-300 capitalize text-[10px] font-black tracking-widest">{b.shift}</td>
                  <td className="px-8 py-5 text-slate-900 dark:text-white font-black text-xs font-mono">{b.total_records}</td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-black tracking-widest whitespace-nowrap">Accepted: {b.accepted}</span>
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 text-[9px] font-black tracking-widest whitespace-nowrap">Rejected: {b.rejected}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{b.uploaded_by_name}</td>

                  <td className="px-8 py-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/records?batch_id=${b.batch_id}`)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-600/5 transition-all"
                        title="View Protocol"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => setDownloadDropdown(b.batch_id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-600/5 transition-all"
                        title="Export Archive"
                      >
                        <Download size={18} />
                      </button>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(b.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-500/5 transition-all"
                          title="Decommission Batch"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Export Portal Modal ── */}
      <AnimatePresence>
        {downloadDropdown && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-3xl max-w-sm w-full border border-slate-200 dark:border-white/10"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-8 mx-auto">
                <Box size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Intelligence Pack</h3>
              <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-10 italic">Batch Reference: {downloadDropdown.slice(0,16)}…</p>
              
              <div className="space-y-4">
                {[
                  { f: 'pdf', l: 'Analytical Package', x: '.PDF', icon: FileText, c: 'hover:border-red-500' },
                  { f: 'excel', l: 'Master Ledger', x: '.XLSX', icon: Database, c: 'hover:border-emerald-500' },
                  { f: 'csv', l: 'Raw Supply Vectors', x: '.CSV', icon: Activity, c: 'hover:border-blue-500' },
                ].map(opt => (
                  <button 
                    key={opt.f} 
                    onClick={() => handleDownload(downloadDropdown, opt.f)} 
                    className={`w-full flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-white/5 border-2 border-transparent ${opt.c} rounded-[1.5rem] transition-all group`}
                  >
                    <div className="flex items-center gap-4">
                       <opt.icon size={18} className="text-slate-400 group-hover:text-inherit" />
                       <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{opt.l}</span>
                    </div>
                    <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md">{opt.x}</span>
                  </button>
                ))}
              </div>
              <div className="mt-10">
                <button 
                  onClick={() => setDownloadDropdown(null)} 
                  className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-all"
                >
                  Abort Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
