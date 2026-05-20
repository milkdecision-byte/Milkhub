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
    if (!window.confirm('WARNING: This action will permanently delete the selected upload batch and all its records. Proceed?')) return
    try {
      await api.delete(`/batches/${batchId}`)
      toast.success('Batch deleted successfully')
      fetchBatches()
    } catch (err) {
      toast.error('Failed to delete batch')
    }
  }

  const handleDownload = async (batchId, format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} file...`, { id: 'download' })
      const res = await api.get(`/export/${format}?batch_id=${batchId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `milkhub_records_${batchId}.${format === 'excel' ? 'xlsx' : format}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('Report exported successfully', { id: 'download' })
      setDownloadDropdown(null)
    } catch (err) {
      toast.error('Export failed', { id: 'download' })
      setDownloadDropdown(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] text-[#111827] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20" /> Upload History
        </h2>
      </div>

      {/* ── Search & Filter Panel — electric purple brand, light surfaces ── */}
      <div
        className="p-6 space-y-6 rounded-[2rem] border-2 shadow-[0_12px_40px_-12px_rgba(160,32,240,0.28)]"
        style={{
          borderColor: 'rgba(160, 32, 240, 0.45)',
          background: 'linear-gradient(135deg, var(--electric-purple-surface) 0%, var(--electric-purple-light) 50%, #f0d4ff 100%)',
        }}
      >
        <div className="relative group">
          <Search
            size={20}
            className="absolute left-6 top-1/2 -translate-y-1/2 transition-colors group-focus-within:opacity-100"
            style={{ color: 'var(--electric-purple-deep)' }}
          />
          <input
            className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] text-sm font-bold text-slate-900 placeholder:text-slate-600 outline-none transition-all duration-300 ease-in-out shadow-sm border-2 [color-scheme:light]"
            style={{
              backgroundColor: 'var(--electric-purple-light)',
              borderColor: 'rgba(160, 32, 240, 0.4)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--electric-purple)'
              e.target.style.boxShadow = '0 0 0 4px rgba(160, 32, 240, 0.25)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(160, 32, 240, 0.4)'
              e.target.style.boxShadow = 'none'
            }}
            placeholder="Search by Upload ID or File Name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[240px] relative">
            <Calendar
              size={18}
              className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ color: 'var(--electric-purple-deep)' }}
            />
            <input
              type="date"
              className="w-full pl-14 pr-6 py-4 rounded-2xl text-[11px] font-black tracking-widest text-slate-900 outline-none transition-all duration-300 ease-in-out shadow-sm border-2 [color-scheme:light]"
              style={{
                backgroundColor: 'var(--electric-purple-light)',
                borderColor: 'rgba(160, 32, 240, 0.4)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--electric-purple)'
                e.target.style.boxShadow = '0 0 0 4px rgba(160, 32, 240, 0.25)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(160, 32, 240, 0.4)'
                e.target.style.boxShadow = 'none'
              }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[240px] relative">
            <Filter
              size={18}
              className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ color: 'var(--electric-purple-deep)' }}
            />
            <select
              className="w-full pl-14 pr-12 py-4 rounded-2xl text-[11px] font-black tracking-widest text-slate-900 outline-none transition-all duration-300 ease-in-out shadow-sm border-2 appearance-none cursor-pointer [color-scheme:light]"
              style={{
                backgroundColor: 'var(--electric-purple-light)',
                borderColor: 'rgba(160, 32, 240, 0.4)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--electric-purple)'
                e.target.style.boxShadow = '0 0 0 4px rgba(160, 32, 240, 0.25)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(160, 32, 240, 0.4)'
                e.target.style.boxShadow = 'none'
              }}
              value={shiftFilter}
              onChange={e => setShiftFilter(e.target.value)}
            >
              <option value="" className="text-slate-900" style={{ backgroundColor: 'var(--electric-purple-surface)' }}>All Shifts</option>
              <option value="morning" className="text-slate-900" style={{ backgroundColor: 'var(--electric-purple-surface)' }}>Morning Shift</option>
              <option value="evening" className="text-slate-900" style={{ backgroundColor: 'var(--electric-purple-surface)' }}>Evening Shift</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--electric-purple)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Data Grid ── */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Upload ID</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Session Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">File Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">Shift</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">Records</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">Quality Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-40">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl" />
                    <p className="mt-6 text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading History...</p>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-40">
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No matching uploads found in records.</p>
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
                  <td className="px-8 py-5 text-[#1E1B4B] font-mono text-[10px] font-black uppercase tracking-tighter truncate max-w-[120px]">{b.batch_id}</td>
                  <td className="px-8 py-5 text-[#1E1B4B] font-black text-xs truncate max-w-[180px]">{b.session_name || 'System Baseline'}</td>
                  <td className="px-8 py-5 text-slate-700 text-[10px] font-bold truncate max-w-[180px]" title={b.file_name}>{b.file_name || 'Direct Laboratory Entry'}</td>
                  <td className="px-8 py-5 text-slate-700 text-[10px] font-bold whitespace-nowrap text-center">{b.upload_date}</td>
                  <td className="px-8 py-5 text-slate-600 capitalize text-[10px] font-black tracking-widest text-center">{b.shift}</td>
                  <td className="px-8 py-5 text-[#1E1B4B] font-black text-xs font-mono text-center">{b.total_records}</td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-black tracking-widest whitespace-nowrap">Accepted: {b.accepted}</span>
                      <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 text-[9px] font-black tracking-widest whitespace-nowrap">Rejected: {b.rejected}</span>
                    </div>
                  </td>

                  <td className="px-8 py-5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => navigate(`/records?batch_id=${b.batch_id}`)}
                        className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-600/5 transition-all"
                        title="View Protocol"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => setDownloadDropdown(b.batch_id)}
                        className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-600/5 transition-all"
                        title="Export Archive"
                      >
                        <Download size={18} />
                      </button>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(b.id)}
                          className="p-2.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-500/5 transition-all"
                          title="Delete Batch"
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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Download Records</h3>
              <p className="text-[10px] font-black text-slate-600 text-center uppercase tracking-widest mb-10 italic">Upload ID: {downloadDropdown.slice(0,16)}…</p>
              
              <div className="space-y-4">
                {[
                  { f: 'pdf', l: 'PDF Report', x: '.PDF', icon: FileText, c: 'hover:border-red-500' },
                  { f: 'excel', l: 'Excel Sheet', x: '.XLSX', icon: Database, c: 'hover:border-emerald-500' },
                  { f: 'csv', l: 'CSV Data', x: '.CSV', icon: Activity, c: 'hover:border-blue-500' },
                ].map(opt => (
                  <button 
                    key={opt.f} 
                    onClick={() => handleDownload(downloadDropdown, opt.f)} 
                    className={`w-full flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-white/10 border-2 border-transparent ${opt.c} rounded-[1.5rem] transition-all group`}
                  >
                    <div className="flex items-center gap-4">
                       <opt.icon size={18} className="text-slate-600 group-hover:text-inherit" />
                       <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{opt.l}</span>
                    </div>
                    <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md">{opt.x}</span>
                  </button>
                ))}
              </div>
              <div className="mt-10">
                <button 
                  onClick={() => setDownloadDropdown(null)} 
                  className="w-full py-4 text-[10px] font-black text-slate-600 hover:text-red-500 uppercase tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
