import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  Microscope, CheckCircle2, XCircle, AlertTriangle, 
  RotateCcw, Info, ChevronDown, ChevronUp, Loader2,
  Zap, ShieldCheck, Thermometer, Droplets, FlaskConical,
  Activity, Database, Send, Clock, Sparkles
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EMPTY = {
  farmer_name: '', farmer_code: '', date: new Date().toISOString().slice(0,10),
  shift: 'morning', quantity: '',
  fat: '', snf: '', ph: '', acidity: '', temperature: '',
  specific_gravity: '', mbrt: '', raw_milk_temp: '',
  cob_test: '', alcohol_test: '',
  organoleptic: '', sediment_test: '',
}

function evaluateLive(data, sys) {
  if (!sys) return null;
  
  const flags = {}
  const reasons = []
  
  const f = v => (v === '' || isNaN(v) ? null : parseFloat(v))
  const s = k => parseFloat(sys[k] || 0)
  
  const fat = f(data.fat)
  const snf = f(data.snf)
  const ph = f(data.ph)
  const acidity = f(data.acidity)
  const temp = f(data.temperature)
  const sg = f(data.specific_gravity)
  const mbrt = f(data.mbrt)
  const rawTemp = f(data.raw_milk_temp)

  // Molecular Parameter Analysis
  if (fat !== null) {
    if (fat < s('fat_min') || fat > s('fat_max')) { flags.fat = 'fail'; reasons.push(`Fat ${fat}% deviant`) }
    else flags.fat = 'pass'
  }
  if (snf !== null) {
    if (snf < s('snf_min') || snf > s('snf_max')) { flags.snf = 'fail'; reasons.push(`SNF ${snf}% deviant`) }
    else flags.snf = 'pass'
  }
  if (ph !== null) {
    if (ph < s('ph_min') || ph > s('ph_max')) { flags.ph = 'fail'; reasons.push(`pH ${ph} out of range`) }
    else flags.ph = 'pass'
  }
  if (acidity !== null) {
    if (acidity < s('acidity_min') || acidity > s('acidity_max')) { flags.acidity = 'fail'; reasons.push(`Acidity ${acidity}% abnormal`) }
    else flags.acidity = 'pass'
  }
  if (temp !== null) {
    if (temp > s('temp_acceptable')) { flags.temperature = 'fail'; reasons.push(`Thermal: ${temp}°C exceeds max`) }
    else flags.temperature = 'pass'
  }
  
  // Laboratory Test Analysis
  if (data.cob_test === 'positive') { flags.cob_test = 'fail'; reasons.push('COB Positive') }
  else if (data.cob_test === 'negative') flags.cob_test = 'pass'
  
  if (data.alcohol_test === 'positive') { flags.alcohol_test = 'fail'; reasons.push('Alcohol Alert') }
  else if (data.alcohol_test === 'negative') flags.alcohol_test = 'pass'
  
  if (data.organoleptic === 'abnormal') { flags.organoleptic = 'fail'; reasons.push('Sensory Deviation') }
  else if (data.organoleptic === 'normal') flags.organoleptic = 'pass'
  
  if (data.sediment_test === 'dirty') { flags.sediment_test = 'fail'; reasons.push('Sediment Detected') }
  else if (data.sediment_test === 'clean') flags.sediment_test = 'pass'

  // Determination Logic
  const hasFail = Object.values(flags).some(f => f === 'fail');
  const enteredRequired = ['fat', 'snf', 'ph', 'acidity', 'temperature', 'cob_test', 'alcohol_test', 'organoleptic', 'sediment_test']
    .filter(k => data[k] !== '').length;
  
  const totalRequired = 9;

  let decision = 'pending';
  if (hasFail) decision = 'reject';
  else if (enteredRequired === totalRequired) decision = 'accept';
  else if (enteredRequired > 0) decision = 'analyzing';

  return { 
    decision, 
    reasons, 
    parameter_flags: flags, 
    isLive: true, 
    progress: (enteredRequired / totalRequired) * 100,
    isComplete: enteredRequired === totalRequired
  }
}

function ResultCard({ result }) {
  if (!result) return null
  
  const states = {
    pending: { bg: 'bg-[#F5F3FF]/80 border-[#C4B5FD]/20', text: 'text-purple-400', icon: Database, label: 'AWAITING TELEMETRY', glow: 'shadow-purple-500/5' },
    analyzing: { bg: 'bg-purple-600/5 border-purple-600/20', text: 'text-[#7C3AED]', icon: Activity, label: 'CORE ANALYSIS ACTIVE', glow: 'shadow-purple-500/10' },
    accept: { bg: 'bg-emerald-500/5 border-emerald-500/20', text: 'text-emerald-600', icon: CheckCircle2, label: 'ACCEPTED', glow: 'shadow-emerald-500/20' },
    reject: { bg: 'bg-rose-500/5 border-rose-500/20', text: 'text-rose-600', icon: XCircle, label: 'REJECTED', glow: 'shadow-rose-500/20' },
  }

  const cfg = states[result.decision] || states.pending
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card-premium p-10 ${cfg.bg} ${cfg.glow} border-2 relative overflow-hidden transition-all duration-500`}
    >
      {/* Live Status Indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-[#C4B5FD]/30 z-20">
        <span className={`w-2 h-2 rounded-full ${result.decision === 'reject' ? 'bg-rose-500' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]'} animate-pulse`} />
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#7C3AED] uppercase">Live Diagnostic</span>
      </div>
      
      <Icon size={200} className={`absolute -right-16 -bottom-16 opacity-[0.03] ${cfg.text} transition-transform duration-700 ${result.decision === 'analyzing' ? 'animate-spin-slow' : ''}`}/>

      <div className="flex items-start gap-8 mb-12 relative z-10">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white dark:bg-white/5 shadow-2xl border border-white/40 transition-all duration-500 ${result.decision === 'analyzing' ? 'scale-110 shadow-purple-500/30 rotate-12' : ''}`}>
          <Icon size={40} className={cfg.text}/>
        </div>
        <div className="flex-1">
          <h3 className={`text-3xl font-bold tracking-tight ${cfg.text} transition-colors duration-500`}>{cfg.label}</h3>
          
          {/* Progress Bar */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 dark:text-lavender uppercase tracking-widest">
              <span>Diagnostic Progress</span>
              <span className={cfg.text}>{Math.round(result.progress || 0)}%</span>
            </div>
            <div className="h-2 w-full bg-[#EDE9FE] dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-[#C4B5FD]/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${result.progress}%` }}
                className={`h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F97316] transition-all duration-700`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 mb-10 relative z-10">
        <p className="text-[10px] font-bold text-purple-400 dark:text-lavender uppercase tracking-widest ml-1">Molecular Validation Matrix</p>
        {result.reasons?.length === 0 ? (
          <div className="bg-white/60 dark:bg-white/5 p-6 rounded-3xl border border-[#C4B5FD]/20 flex items-center gap-4 group">
             <ShieldCheck size={22} className="text-purple-300 group-hover:text-purple-500 transition-colors" />
             <p className="text-xs font-bold text-purple-900/40">Waiting for molecular telemetry input...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.reasons?.map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ x: -10, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4 bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-white/60 shadow-sm"
              >
                <div className={`p-1.5 rounded-lg ${cfg.bg} border border-current opacity-30`}>
                  <AlertTriangle size={14} className={cfg.text}/>
                </div>
                <span className="text-xs font-bold text-[#1E1B4B] dark:text-slate-300">{r}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {result.parameter_flags && Object.keys(result.parameter_flags).length > 0 && (
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1 mb-4">Parameter Integrity Grid</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(result.parameter_flags).map(([k, v]) => {
              const c = { 
                pass: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5', 
                fail: 'bg-rose-500/5 text-rose-600 border-rose-500/20 shadow-rose-500/5', 
                warning: 'bg-orange-500/5 text-orange-600 border-orange-500/20 shadow-orange-500/5', 
              }[v] || 'bg-white/50 text-purple-300 border-[#C4B5FD]/20'
              return (
                <motion.span 
                  key={k} 
                  layout
                  className={`text-[9px] px-4 py-2 rounded-xl border uppercase font-bold tracking-widest transition-all duration-500 ${c}`}
                >
                  {k.replace(/_/g, ' ')}
                </motion.span>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function ManualEntryPage() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: EMPTY })
  const [serverResult, setServerResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [livePreview, setLivePreview] = useState(null)
  const [settings, setSettings] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const formValues = watch()

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (!serverResult && settings) {
      const result = evaluateLive(formValues, settings);
      setLivePreview(result);
    }
  }, [JSON.stringify(formValues), serverResult, settings])

  const onSubmit = async (data) => {
    setLoading(true)
    setServerResult(null)
    try {
      const r = await api.post('/predict', data)
      setServerResult(r.data)
      toast.success(`Analysis Protocol Locked: ${r.data.decision.toUpperCase()}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Synchronization failure')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    reset(EMPTY)
    setServerResult(null)
    setLivePreview(null)
  }

  const displayResult = serverResult || livePreview

  const getBorderColor = (name) => {
    if (errors[name]) return 'border-rose-500 focus:ring-rose-500'
    const flag = displayResult?.parameter_flags?.[name]
    if (flag === 'fail') return 'border-rose-500/50 focus:ring-rose-500 bg-rose-500/5'
    if (flag === 'pass') return 'border-emerald-500/50 focus:ring-emerald-500 bg-emerald-500/5'
    if (formValues[name] && !flag) return 'border-purple-500/50 focus:ring-purple-500 bg-purple-500/5'
    return 'border-[#C4B5FD]/40 dark:border-white/10'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* ── Minimal Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#1E1B4B] dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Molecular Terminal
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-10">
          <div className="card-premium p-10 space-y-10 border-[#C4B5FD]/20 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#C4B5FD]/20 pb-8">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-5 uppercase tracking-widest">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white flex items-center justify-center shadow-xl shadow-purple-500/20"><Microscope size={24}/></div>
                Laboratory Telemetry
              </h3>
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">System: <span className="text-orange-500">Live Feedback</span></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[
                { id: 'fat', label: 'Fat (%)', icon: Zap },
                { id: 'snf', label: 'SNF (%)', icon: Activity },
                { id: 'ph', label: 'pH', icon: Droplets },
                { id: 'acidity', label: 'Acidity (% LA)', icon: FlaskConical },
                { id: 'temperature', label: 'Temperature (°C)', icon: Thermometer },
                { id: 'mbrt', label: 'MBRT (min)', icon: Clock },
              ].map(field => (
                <div key={field.id} className="space-y-3">
                  <label className="text-[10px] font-bold text-purple-400 dark:text-lavender tracking-widest ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#7C3AED]/70 dark:text-white"><field.icon size={12} /> {field.label}</span>
                    {displayResult?.parameter_flags?.[field.id] === 'fail' && <AlertTriangle size={12} className="text-rose-500 animate-pulse" />}
                    {displayResult?.parameter_flags?.[field.id] === 'pass' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </label>
                  <input 
                    type="number" 
                    step="0.001" 
                    className={`w-full bg-[#F5F3FF]/50 dark:bg-white/5 border px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all duration-500 shadow-inner focus:ring-4 focus:ring-orange-500/10 ${getBorderColor(field.id)}`} 
                    {...register(field.id, { required: true })} 
                    placeholder="0.000"
                  />
                </div>
              ))}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-purple-400 dark:text-lavender tracking-widest ml-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#7C3AED]/70 dark:text-white"><ShieldCheck size={12} /> COB Test</span>
                </label>
                <div className="relative">
                  <select 
                    className={`w-full bg-[#F5F3FF]/50 dark:bg-white/5 border px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all duration-500 shadow-inner focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer ${getBorderColor('cob_test')}`} 
                    {...register('cob_test', { required: true })}
                  >
                    <option value="">Protocol Status</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium overflow-hidden border-[#C4B5FD]/20 shadow-xl">
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-10 flex items-center justify-between hover:bg-[#F5F3FF]/50 dark:hover:bg-white/5 transition-all duration-500 group"
            >
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white flex items-center gap-5 uppercase tracking-widest">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#F5F3FF] dark:bg-white/10 flex items-center justify-center text-purple-400 shadow-inner group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500"><Database size={24}/></div>
                Extended Node Metadata
              </h3>
              <div className={`p-3 rounded-xl bg-[#F5F3FF] dark:bg-white/5 text-purple-400 transition-transform duration-500 ${showAdvanced ? 'rotate-180 bg-[#7C3AED] text-white shadow-lg shadow-purple-500/30' : ''}`}>
                <ChevronDown size={22} />
              </div>
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="px-10 pb-12 space-y-10 border-t border-[#C4B5FD]/20 pt-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-purple-400 dark:text-lavender uppercase tracking-widest ml-1">Provider Node Identity</label>
                      <input className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10" {...register('farmer_name')} placeholder="Legal Entity Name"/>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1">Registry Code</label>
                      <input className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10" {...register('farmer_code')} placeholder="NODE-ID-000"/>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1">Batch Date</label>
                        <input type="date" className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-purple-800 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10" {...register('date')} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1">Shift Cycle</label>
                        <div className="relative">
                          <select className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer" {...register('shift')}>
                            <option value="morning">Morning Stream</option>
                            <option value="evening">Evening Stream</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1">Volume Yield (L)</label>
                        <input type="number" step="0.1" className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10" {...register('quantity')} placeholder="0.0"/>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-[#C4B5FD]/20">
                    {[
                      { id: 'alcohol_test', label: 'Alcohol Test', options: [{v:'negative', l:'Negative'}, {v:'positive', l:'Positive'}] },
                      { id: 'organoleptic', label: 'Organoleptic', options: [{v:'normal', l:'Normal'}, {v:'abnormal', l:'Off smell'}] },
                      { id: 'sediment_test', label: 'Sediment Test', options: [{v:'clean', l:'Clean'}, {v:'dirty', l:'Dirt'}] },
                    ].map(f => (
                      <div key={f.id} className="space-y-3">
                        <label className="text-[9px] font-bold text-purple-400 tracking-[0.2em] ml-1">{f.label}</label>
                        <div className="relative">
                          <select className={`w-full bg-[#F5F3FF]/50 dark:bg-white/5 border px-5 py-3.5 rounded-2xl text-xs font-bold text-purple-800 dark:text-slate-300 outline-none appearance-none cursor-pointer transition-all duration-500 ${getBorderColor(f.id)}`} {...register(f.id)}>
                            <option value="">Status</option>
                            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-1 whitespace-nowrap">Raw Temp (°C)</label>
                      <input type="number" step="0.1" className="w-full bg-[#F5F3FF]/50 dark:bg-white/5 border border-[#C4B5FD]/40 px-5 py-3.5 rounded-2xl text-xs font-bold text-purple-800 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10" {...register('raw_milk_temp')} placeholder="0.0"/>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-6">
            <button
              type="submit"
              disabled={loading || !displayResult?.isComplete}
              className="flex-1 btn-commercial btn-commercial-primary py-6 rounded-[2rem] text-sm shadow-2xl disabled:bg-purple-200 disabled:text-purple-400 hover:shadow-orange-500/40"
            >
              {loading ? <Loader2 size={24} className="animate-spin"/> : <Send size={20}/>}
              {loading ? 'Transmitting Data…' : 'Finalize Quality Protocol'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-10 rounded-[2rem] bg-white dark:bg-white/5 border border-[#C4B5FD]/40 text-purple-500 hover:text-orange-600 hover:bg-orange-500/5 transition-all shadow-xl shadow-purple-500/5"
              title="Reset Terminal"
            >
              <RotateCcw size={24}/>
            </button>
          </div>
        </form>

        {/* ── Right: Preview & Protocol ── */}
        <div className="lg:col-span-5 space-y-10">
          <ResultCard result={displayResult}/>

          <div className="card-premium p-10 border-[#C4B5FD]/20 shadow-xl">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-10 flex items-center gap-4">
              <ShieldCheck size={20} className="text-[#F97316]"/> Laboratory Protocol Standards
            </h4>
            <div className="space-y-6">
              {settings ? [
                ['Fat (%)', `${settings.fat_min} – ${settings.fat_max}%`, Zap],
                ['SNF (%)', `${settings.snf_min} – ${settings.snf_max}%`, Activity],
                ['pH', `${settings.ph_min} – ${settings.ph_max}`, Droplets],
                ['Acidity (% LA)', `≤ ${settings.acidity_max}%`, FlaskConical],
                ['Temperature (°C)', `≤ ${settings.temp_acceptable}°C`, Thermometer],
                ['Specific Gravity', `${settings.sg_min} – ${settings.sg_max}`, Database],
              ].map(([k, v, Icon]) => (
                <div key={k} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-white/5 flex items-center justify-center text-purple-400 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500 shadow-inner">
                      <Icon size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-purple-900/60 uppercase tracking-widest group-hover:text-[#7C3AED] transition-colors">{k}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1E1B4B] dark:text-white bg-[#F5F3FF] dark:bg-white/10 px-4 py-2 rounded-2xl border border-[#C4B5FD]/30 min-w-[90px] text-center shadow-sm">
                    {v}
                  </span>
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center gap-5">
                  <Loader2 size={40} className="animate-spin text-[#7C3AED]" />
                  <p className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">Retrieving Standards...</p>
                </div>
              )}
            </div>
            <div className="mt-12 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-2 flex items-center gap-3 relative z-10">
                <Info size={14} /> Quality Assurance Notice
              </p>
              <p className="text-[10px] text-purple-900/50 font-semibold leading-relaxed relative z-10">
                Data vectors are continuously validated against regional laboratory benchmarks and archived within the immutable network ledger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
