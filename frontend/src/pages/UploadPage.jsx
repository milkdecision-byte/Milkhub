import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileSpreadsheet, X, CheckCircle, XCircle, 
  AlertTriangle, Loader2, Info, ShieldAlert, FileText, 
  Database, Activity, TrendingUp, Zap, ChevronRight,
  ShieldCheck, Share2, Search, Sparkles, LayoutDashboard, ArrowRight
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { PARAMETER_LABELS } from '../utils/parameters'

function StatusPill({ decision }) {
  if (decision === 'accept') {
    return (
      <span className="px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
        ACCEPTED
      </span>
    )
  }
  if (decision === 'partial') {
    return (
      <span className="px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-lg shadow-amber-500/5">
        Partial
      </span>
    )
  }
  return (
    <span className="px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-lg shadow-rose-500/5">
      REJECTED
    </span>
  )
}

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const navigate = useNavigate()

  const onDrop = useCallback(files => {
    const f = files[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv', 'pdf', 'txt'].includes(ext)) {
      toast.error('File type error: Only Excel, CSV, PDF, or TXT arrays accepted.')
      return
    }
    setFile(f)
    setResult(null)
    setIsConfirmed(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    }
  })

  const executePipeline = async (isPreview = true) => {
    if (!file) return
    setUploading(true)
    setProgress(10)
    const fd = new FormData()
    fd.append('file', file)
    if (sessionName) fd.append('session_name', sessionName)
    if (isPreview) fd.append('preview', 'true')
    try {
      setProgress(40)
      const r = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.min(80, Math.round(e.loaded / e.total * 80))),
      })
      setProgress(100)
      setResult(r.data)
      if (!isPreview) {
        setIsConfirmed(true)
        toast.success(`Records Saved: ${r.data.total_rows} records added.`)
      } else {
        toast.success(`Validation successful: Data ready for upload.`)
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Upload failed.'
      const details = err.response?.data?.details
      
      if (details && Array.isArray(details) && details.length > 0) {
        toast.error(`${errMsg}\n\n${details.slice(0, 3).join('\n')}`, {
          duration: 6000,
          style: { minWidth: '350px', whiteSpace: 'pre-line' }
        })
      } else {
        toast.error(errMsg)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* ── Minimal Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <h2 className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Sample Upload Center
        </h2>
        
        <button 
          onClick={() => {
            const csv = "Farmer Name,Farmer ID,Date,Shift,Fat (%),SNF (%),pH,Quantity (L)\nJohn Doe,F-101,2026-05-12,morning,4.2,8.5,6.7,15.5\nJane Smith,F-102,2026-05-12,evening,3.8,8.2,6.6,12.0"
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'milkhub_template.csv'
            a.click()
          }}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-sm"
        >
          <FileText size={14} /> Download Sample Template
        </button>
      </div>

      {!result && (
        <>
          {/* ── Dropzone ── */}
          <motion.div
            {...getRootProps()}
            whileHover={{ scale: 1.002 }}
            className={`card-premium p-24 text-center cursor-pointer transition-all duration-700 border-2 border-dashed relative overflow-hidden group
              ${isDragActive 
                ? 'border-purple-600 bg-purple-600/5 shadow-2xl' 
                : 'border-[#C4B5FD]/40 dark:border-white/10 hover:border-orange-500 hover:bg-orange-500/5'}`}
          >
            <input {...getInputProps()}/>
            <div className="flex flex-col items-center gap-10 relative z-10">
              <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-2xl border border-white/40
                ${isDragActive ? 'bg-orange-500 text-white scale-110 rotate-12' : 'bg-[#F5F3FF] dark:bg-white/10 text-[#7C3AED] group-hover:rotate-6 shadow-inner'}`}>
                {file
                  ? <FileSpreadsheet size={44} className="text-[#7C3AED]"/>
                  : <Upload size={44} className={isDragActive ? 'text-white' : 'text-[#7C3AED] group-hover:text-orange-500'}/>
                }
              </div>
              
              {file ? (
                <div>
                  <h3 className="text-3xl font-bold text-[#1E1B4B] dark:text-white tracking-tight">{file.name}</h3>
                  <p className="text-[11px] text-orange-600 font-bold uppercase tracking-[0.25em] mt-4 flex items-center justify-center gap-2">
                    <Sparkles size={14} /> {(file.size / 1024).toFixed(1)} KB — Milk Records Found
                  </p>
                </div>
              ) : (
                <div className="max-w-md">
                  <h3 className="text-3xl font-bold text-[#111827] tracking-tight">Upload Quality Data</h3>
                  <p className="text-[11px] text-[#6B7280] mt-5 font-bold uppercase tracking-[0.25em] leading-relaxed">
                    Drag and Drop or Click to Upload
                  </p>
                </div>
              )}
            </div>
            
            {/* Background decorative elements */}
            <Activity size={280} className="absolute -right-24 -bottom-24 text-purple-600 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:rotate-6" />
            <ShieldCheck size={220} className="absolute -left-12 -top-12 text-orange-600 opacity-[0.03] -rotate-12 transition-transform duration-1000 group-hover:-rotate-6" />
          </motion.div>
          
          {file && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="card-premium p-4 sm:p-6 md:p-10 shadow-xl border-[#C4B5FD]/20">
                <label className="text-[11px] font-bold text-[#111827] tracking-wide uppercase ml-1 mb-4 block flex items-center gap-3">
                  <Share2 size={16} className="text-[#7C3AED]" /> Collection Details (Session Name)
                </label>
                <input 
                  type="text" 
                  className="w-full bg-[#F5F3FF]/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-8 py-5 rounded-[2rem] text-[#111827] font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 transition-all shadow-inner" 
                  placeholder="e.g. Milk Collection - Morning Batch" 
                  value={sessionName} 
                  onChange={e => setSessionName(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-8">
                <button 
                  onClick={() => executePipeline(true)} 
                  disabled={uploading} 
                  className="flex-1 flex items-center justify-center gap-3 bg-[#7C3AED] text-white py-5 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-[#6D28D9] hover:shadow-purple-500/30 transition-all duration-300 disabled:bg-purple-200 disabled:text-[#7C3AED]"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin"/> : <Zap size={18}/>}
                  {uploading ? 'Processing Data…' : 'Verify Quality Data'}
                </button>
                <button 
                  onClick={() => { setFile(null); setResult(null); setProgress(0); setIsConfirmed(false) }}
                  className="px-10 py-4 rounded-full bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 transition-all duration-300 font-bold uppercase text-[10px] tracking-widest shadow-sm"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── Progress Pipeline ── */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card-premium p-4 sm:p-6 md:p-12 bg-gradient-to-r from-[#1E1B4B] to-[#4C1D95] text-white overflow-hidden relative shadow-2xl border-none">
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <p className="text-[11px] font-bold text-orange-400 uppercase tracking-[0.3em] mb-3">Data Processing in Progress</p>
                <h3 className="text-2xl font-bold tracking-tight">Analyzing Milk Quality...</h3>
              </div>
              <span className="text-5xl font-bold text-white tracking-tighter">{progress}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5 relative z-10 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <TrendingUp size={180} className="absolute -right-16 -bottom-16 opacity-[0.05] rotate-12" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results Dashboard ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Records',  value: result.total_rows,    icon: Database, g: 'from-purple-500 to-indigo-600' },
                { label: 'Passed',         value: result.accepted,      icon: CheckCircle, g: 'from-emerald-400 to-teal-500' },
                { label: 'Partial',        value: result.partial || 0,  icon: AlertTriangle, g: 'from-amber-400 to-orange-500' },
                { label: 'Rejected',       value: result.rejected,      icon: XCircle, g: 'from-rose-500 to-red-700' },
                { label: 'Quality Alerts', value: result.fraud_alerts, icon: ShieldAlert, g: 'from-orange-400 to-rose-600' },
              ].map(s => (
                <div key={s.label} className="card-premium p-4 sm:p-6 md:p-8 text-center group hover:border-[#C4B5FD]/60 transition-all duration-500 shadow-xl border-[#C4B5FD]/20">
                   <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.g} flex items-center justify-center mx-auto mb-4 text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                     <s.icon size={22} />
                   </div>
                   <p className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest mb-1">{s.label}</p>
                   <p className="text-3xl font-bold text-[#111827] tracking-tighter">{s.value}</p>
                </div>
              ))}
            </div>

            {/* AI Diagnosis: Field Integrity Matrix */}
            {(result.detected_fields || result.missing_fields) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-premium p-8 border-emerald-500/20 bg-emerald-500/[0.02]">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle size={14} /> Available Parameters ({result.detected_fields?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.detected_fields?.map(f => (
                      <span key={f} className="px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                        ✔ {PARAMETER_LABELS[f] || f.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-premium p-8 border-amber-500/20 bg-amber-500/[0.02]">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle size={14} /> Missing Parameters ({result.missing_fields?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_fields?.map(f => (
                      <span key={f} className="px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                        ⚠ {PARAMETER_LABELS[f] || f.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600/70 font-bold uppercase mt-6 italic">
                    Note: Missing values will be estimated based on standards.
                  </p>
                </div>
              </div>
            )}

            {/* Ingestion Table */}
            <div className="card-premium overflow-hidden border-[#C4B5FD]/20 shadow-xl">
              <div className="px-10 py-8 bg-[#F5F3FF] dark:bg-white/10 border-b border-[#C4B5FD]/20 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111827] tracking-wide uppercase flex items-center gap-4">
                  <Activity size={20} className="text-[#7C3AED]"/> 
                  {isConfirmed ? `Batch ID: ${result.batch_id.slice(0,12)}…` : 'Quality Data Preview'}
                </h3>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Live Validation Active
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-white/100 dark:bg-black/40 border-b border-[#C4B5FD]/20">
                      {['Entity Node', 'Registry ID', 'Timestamp', 'Operations', 'Quality Result', 'Security Profile', 'Laboratory Observations'].map(h => (
                        <th key={h} className="table-header-enterprise">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE] dark:divide-white/5">
                    {result.rows?.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-[#F5F3FF]/70 dark:hover:bg-white/[0.02] transition-all duration-300 group">
                        <td className="px-8 py-6 text-sm font-bold text-[#111827] group-hover:text-[#7C3AED] max-w-[200px] truncate">{row.farmer_name}</td>
                        <td className="px-8 py-6 text-[11px] font-bold text-[#111827] font-mono tracking-tighter">{row.farmer_code}</td>
                        <td className="px-8 py-6 text-[10px] font-bold text-[#4B5563]">{row.date}</td>
                        <td className="px-8 py-6 text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">{row.shift}</td>
                        <td className="px-8 py-6"><StatusPill decision={row.decision}/></td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-lg ${
                            row.fraud_risk === 'high' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-sm' : 'text-[#7C3AED]'
                          }`}>{row.fraud_risk || 'Verified'}</span>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-bold text-[#4B5563] uppercase italic truncate max-w-[250px]">
                          {row.reasons?.[0] || 'Meets Quality Standards'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-6">
              {!isConfirmed ? (
                <>
                  <button 
                    onClick={() => { setFile(null); setResult(null); setProgress(0); setIsConfirmed(false) }}
                    className="px-10 py-4 rounded-full bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 transition-all duration-300 font-bold uppercase text-[10px] tracking-widest shadow-sm"
                  >
                    Cancel Upload
                  </button>
                  <button 
                    onClick={() => executePipeline(false)} 
                    disabled={uploading}
                    className="flex items-center gap-3 bg-[#7C3AED] text-white px-12 py-4 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-[#6D28D9] hover:shadow-purple-500/30 transition-all duration-300 disabled:bg-purple-200 disabled:text-[#7C3AED]"
                  >
                    {uploading ? <Loader2 size={20} className="animate-spin"/> : <ShieldCheck size={18}/>}
                    {uploading ? 'Saving Data…' : 'Save to Records'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => navigate(`/records?batch_id=${result.batch_id}`)}
                  className="flex items-center justify-center gap-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white px-12 py-5 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <LayoutDashboard size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>Access System Ledger</span>
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 

      {/* ── Protocol Architecture ── */}
      <div
        className="card-premium p-4 sm:p-6 md:p-12 space-y-12 relative overflow-hidden shadow-xl group border-2"
        style={{ borderColor: 'rgba(160, 32, 240, 0.35)' }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--electric-purple-surface), transparent)' }}
        />
        
        <div className="flex items-center gap-6 relative z-10">
           <div
             className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl"
             style={{
               background: 'linear-gradient(135deg, var(--electric-purple), var(--electric-purple-bright))',
               boxShadow: '0 12px 32px rgba(160, 32, 240, 0.45)',
               color: '#f5e6ff',
             }}
           >
             <Info size={32}/>
           </div>
           <div>
               <h4 className="text-xl font-bold tracking-wide uppercase" style={{ color: 'var(--electric-purple-deep)' }}>Milk Testing Parameters</h4>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--electric-purple)' }}>Standard Quality Parameters</p>
           </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          <div className="space-y-6 flex-1">
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-[0.25em] flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse"></span>
              Required Quality Fields
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {[PARAMETER_LABELS.fat, PARAMETER_LABELS.snf, PARAMETER_LABELS.ph, PARAMETER_LABELS.acidity, PARAMETER_LABELS.cob_test, PARAMETER_LABELS.mbrt].map(h => (
                <span key={h} className="h-14 w-full bg-rose-500 text-white rounded-2xl flex items-center justify-center text-center text-sm font-semibold tracking-wide leading-none border border-rose-600 hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/10">{h}</span>
              ))}
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] flex items-center gap-3" style={{ color: 'var(--electric-purple-deep)' }}>
              <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(160,32,240,0.55)]" style={{ backgroundColor: 'var(--electric-purple)' }} />
              Optional Quality Fields
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {['Temperature', 'Specific Gravity', 'Alcohol Test', 'Organoleptic', 'Sediment Test', 'Raw Temp', 'Quantity'].map(h => (
                <span
                  key={h}
                  className="h-14 w-full rounded-2xl flex items-center justify-center text-center text-sm font-semibold tracking-wide leading-none border transition-colors shadow-md"
                  style={{
                    backgroundColor: 'var(--electric-purple)',
                    borderColor: 'var(--electric-purple-bright)',
                    color: '#f5e6ff',
                    boxShadow: '0 4px 14px rgba(160, 32, 240, 0.35)',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-10 border-t relative z-10" style={{ borderColor: 'rgba(160, 32, 240, 0.25)' }}>
          <p className="text-[12px] text-[#374151] font-bold uppercase tracking-wide leading-relaxed">
            <b className="text-[#111827]">Automatic Data Matching:</b> The system automatically matches your column names. 
            Missing values are checked against standard dairy quality rules.
          </p>
        </div>
        <Search size={300} className="absolute -right-24 -top-24 opacity-[0.06] rotate-12 group-hover:rotate-6 transition-transform duration-1000" style={{ color: 'var(--electric-purple)' }} />
      </div>
    </div>
  )
}
