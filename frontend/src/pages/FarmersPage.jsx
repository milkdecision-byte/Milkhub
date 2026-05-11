import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ShieldAlert, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react'
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

  const fetch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 30, search, fraud_only: fraudOnly })
      const r = await api.get(`/farmers?${params}`)
      setFarmers(r.data.farmers)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      await api.delete(`/farmers/${id}`)
      toast.success('Farmer deleted successfully')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete farmer')
    }
  }

  useEffect(() => { fetch() }, [page, search, fraudOnly])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Farmers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{total} registered suppliers</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm py-2" placeholder="Search by name or code…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <button
          onClick={() => { setFraudOnly(p => !p); setPage(1) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors
            ${fraudOnly
              ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          <ShieldAlert size={15} />
          Fraud Flagged Only
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="w-full overflow-x-auto -mx-0">
          <table className="w-full text-sm min-w-[600px] w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              {['Farmer', 'Code', 'Location', 'Submissions', 'Accepted', 'Rejected', 'Avg FAT', 'Avg SNF', 'Fraud', ''].map(h => (
                <th key={h} className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12">
                <div className="inline-block w-6 h-6 border-2 border-milk-500 border-t-transparent rounded-full animate-spin" />
              </td></tr>
            ) : farmers.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold">No farmers found</td></tr>
            ) : farmers.map(f => (
              <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/farmers/${f.id}`)}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-milk-500 to-milk-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {f.full_name[0]?.toUpperCase()}
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold group-hover:text-milk-600 dark:group-hover:text-milk-400 transition-colors">{f.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold uppercase">{f.farmer_code}</td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{f.village || f.district || '—'}</td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{f.total_submissions}</td>
                <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">{f.total_accepted}</td>
                <td className="px-4 py-3.5 text-red-600 dark:text-red-400 font-semibold">{f.total_rejected}</td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{f.avg_fat?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono text-xs">{f.avg_snf?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3.5">
                  {f.fraud_flag
                    ? <span className="badge-high flex items-center gap-1"><ShieldAlert size={11} /> FLAGGED</span>
                    : <span className="badge-low flex items-center gap-1"><ShieldCheck size={11} /> SAFE</span>
                  }
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => handleDelete(e, f.id, f.full_name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete Farmer"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={16} className="text-slate-400 dark:text-slate-600" />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Page <span className="text-slate-900 dark:text-white">{page}</span> of {pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
