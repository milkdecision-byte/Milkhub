import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, ShieldAlert, ChevronRight, ShieldCheck, Trash2, 
  Users, UserPlus, Download, Filter, UserCheck, UserX,
  Activity, MapPin, TrendingUp, ChevronLeft, Sparkles
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function FarmersPage() {
  const [farmers, setFarmers] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [fraudOnly, setFraudOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchFarmers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 30, search, fraud_only: fraudOnly })
      const r = await api.get(`/farmers?${params}`)
      setFarmers(r.data.farmers)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, fraudOnly])

  const handleDelete = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`Permanently remove farmer ${name} from records?`)) return
    try {
      await api.delete(`/farmers/${id}`)
      toast.success('Farmer record successfully removed')
      fetchFarmers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Removal failed')
    }
  }

  useEffect(() => { fetchFarmers() }, [fetchFarmers])

  return (
    <div className="space-y-12 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Farmer Records
        </h2>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#1E1B4B] p-6 sm:p-8 flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch lg:items-center rounded-[2rem] shadow-xl text-white">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors" />
          <input 
            className="w-full pl-14 pr-8 py-5 rounded-2xl bg-indigo-900/50 border border-indigo-700 text-base font-semibold text-white placeholder:text-indigo-300 focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all shadow-sm" 
            placeholder="Search Farmer Registry by Name or ID…"
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1) }} 
          />
        </div>
        <button
          onClick={() => { setFraudOnly(p => !p); setPage(1) }}
          className={`flex items-center justify-center gap-3 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl border text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-500 whitespace-nowrap
            ${fraudOnly
              ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30'
              : 'bg-indigo-900/50 border-indigo-700 text-indigo-200 hover:text-white hover:border-indigo-500'}`}
        >
          <ShieldAlert size={18} />
          High Quality Risk Farmers
        </button>
      </div>

      {/* ── Table Section ── */}
      <div className="card-premium overflow-hidden border-[#C4B5FD]/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-indigo-800">
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-center">Farmer Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Farmer ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-center">Area</th>
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-center">Quality History</th>
                <th className="px-6 py-4 text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-48">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-sm font-bold text-[#7C3AED] uppercase tracking-widest animate-pulse">Loading Farmer Records...</p>
                </td></tr>
              ) : farmers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-48">
                  <Users size={56} className="text-[#7C3AED] dark:text-slate-200 mx-auto mb-6" />
                  <p className="text-sm font-bold text-[#7C3AED] uppercase tracking-widest">No Farmers Registered</p>
                </td></tr>
              ) : farmers.map((f, i) => (
                <motion.tr 
                  key={f.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-[#F5F3FF]/70 dark:hover:bg-white/[0.02] transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/farmers/${f.id}`)}
                >
                  <td className="px-8 py-7">
                    <div className="flex items-center justify-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform">
                        {f.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827] group-hover:text-purple-700 transition-colors">{f.full_name}</p>
                        <p className="text-[10px] font-semibold text-[#7C3AED] uppercase mt-1">Verified Farmer</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-[#4B5563] font-mono text-[11px] font-medium tracking-tighter">{f.farmer_code}</td>
                  <td className="px-8 py-7 text-[#6B7280] font-medium text-[10px] uppercase tracking-widest">
                    <div className="flex items-center justify-center gap-2">
                      <MapPin size={14} className="text-orange-400" /> {f.village || f.district || 'Other Area'}
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center justify-center gap-4">
                      {/* Accepted Card */}
                      <div className="flex-1 min-w-[110px] p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 group/stat">
                        <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1.5">Accepted</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-emerald-800">{f.total_accepted}</span>
                          <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Recs</span>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-700 mt-2">
                          {f.total_submissions > 0 ? ((f.total_accepted / f.total_submissions) * 100).toFixed(0) : 0}%
                        </p>
                      </div>

                      {/* Rejected Card */}
                      <div className="flex-1 min-w-[110px] p-4 rounded-3xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-500 group/stat">
                        <p className="text-[8px] font-bold text-rose-600/60 uppercase tracking-widest mb-1.5">Rejected</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-rose-800">{f.total_rejected}</span>
                          <span className="text-[10px] font-bold text-rose-600/70 uppercase">Recs</span>
                        </div>
                        <p className="text-[11px] font-bold text-rose-700 mt-2">
                          {f.total_submissions > 0 ? ((f.total_rejected / f.total_submissions) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-7">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={(e) => handleDelete(e, f.id, f.full_name)}
                        className="p-3 rounded-xl text-[#7C3AED] hover:text-rose-600 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Farmer"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-white/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                        <ChevronRight size={20} />
                      </div>
                    </div>
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
    </div>
  )
}
