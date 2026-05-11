import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileSpreadsheet, FileText, Download, Loader2, Filter } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

function ExportCard({ icon: Icon, title, desc, color, onClick, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      disabled={loading}
      className="card p-5 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all w-full flex items-center gap-4 disabled:opacity-50"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {loading ? <Loader2 size={20} className="animate-spin text-white"/> : <Icon size={20} className="text-white"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <Download size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0"/>
    </motion.button>
  )
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({ date_from: '', date_to: '', shift: '' })
  const [loadingKey, setLoadingKey] = useState(null)

  const download = async (key, path) => {
    setLoadingKey(key)
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)))
      const r = await api.get(`${path}?${params}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      const cd = r.headers['content-disposition'] || ''
      const match = cd.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : `milk_export_${Date.now()}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch {
      toast.error('Export failed')
    } finally {
      setLoadingKey(null)
    }
  }

  const sf = (k, v) => setFilters(p => ({ ...p, [k]: v }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports &amp; Exports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Download milk quality data in various formats</p>
      </div>

      {/* Filters */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-widest">
          <Filter size={14} className="text-milk-500"/>Filter Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input text-sm py-2" value={filters.date_from}
              onChange={e => sf('date_from', e.target.value)}/>
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input text-sm py-2" value={filters.date_to}
              onChange={e => sf('date_to', e.target.value)}/>
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="select text-sm py-2" value={filters.shift}
              onChange={e => sf('shift', e.target.value)}>
              <option value="">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>
        <button onClick={() => setFilters({ date_from:'', date_to:'', shift:'' })}
          className="text-xs text-milk-600 dark:text-milk-400 hover:text-milk-700 dark:hover:text-milk-300 font-semibold transition-colors">
          Clear filters
        </button>
      </div>

      {/* Export buttons */}
      <div className="grid gap-3">
        <ExportCard
          icon={FileSpreadsheet} color="bg-emerald-600"
          title="Export All Records — Excel"
          desc="Full quality data with decision, fraud risk, and all parameters"
          loading={loadingKey === 'excel'}
          onClick={() => download('excel', '/export/excel')}
        />
        <ExportCard
          icon={FileText} color="bg-red-600"
          title="Export All Records — PDF"
          desc="Formatted PDF report for management and compliance"
          loading={loadingKey === 'pdf'}
          onClick={() => download('pdf', '/export/pdf')}
        />
        <ExportCard
          icon={FileSpreadsheet} color="bg-red-800"
          title="Rejected Records Only — Excel"
          desc="All rejected milk entries with reasons and fraud risk"
          loading={loadingKey === 'rejected'}
          onClick={() => download('rejected', '/export/excel?decision=reject')}
        />
        <ExportCard
          icon={FileSpreadsheet} color="bg-amber-600"
          title="Manual Check Records — Excel"
          desc="Records requiring manual verification"
          loading={loadingKey === 'manual'}
          onClick={() => download('manual', '/export/excel?decision=manual_check')}
        />
        <ExportCard
          icon={FileSpreadsheet} color="bg-orange-600"
          title="Fraud Risk Report — Excel"
          desc="High and medium fraud risk records only"
          loading={loadingKey === 'fraud'}
          onClick={() => download('fraud', '/export/excel?fraud_risk=high')}
        />
      </div>

      {/* Tips */}
      <div className="card p-5 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-800 dark:text-slate-300">Tip:</span> Set a date range above before exporting to get period-specific reports.
          The PDF export includes up to 500 records per page. For larger datasets, use Excel export.
        </p>
      </div>
    </div>
  )
}
