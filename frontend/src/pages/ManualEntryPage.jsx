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
import { PARAMETER_LABELS } from '../utils/parameters'

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
  const s = k => {
    return parseFloat(sys[k] || 0);
  }
  
  const fat = f(data.fat)
  const snf = f(data.snf)
  const ph = f(data.ph)
  const acidity = f(data.acidity)
  const temp = f(data.temperature)
  const sg = f(data.specific_gravity)
  const mbrt = f(data.mbrt)
  const rawTemp = f(data.raw_milk_temp)

  // 1. Fat (3.2 - 3.5)
  if (fat !== null) {
    if (fat < s('fat_min') || fat > s('fat_max')) { flags.fat = 'fail'; reasons.push('Possible Adulteration') }
    else flags.fat = 'pass'
  }
  // 2. SNF (8.3 - 8.5)
  if (snf !== null) {
    if (snf < s('snf_min') || snf > s('snf_max')) { flags.snf = 'fail'; reasons.push('Added water (SNF)') }
    else flags.snf = 'pass'
  }
  // 3. pH (6.5 - 6.8)
  if (ph !== null) {
    if (ph < s('ph_min') || ph > s('ph_max')) { flags.ph = 'fail'; reasons.push('Spoilage') }
    else flags.ph = 'pass'
  }
  // 4. Acidity (0.10 - 0.15)
  if (acidity !== null) {
    if (acidity < s('acidity_min') || acidity > s('acidity_max')) { flags.acidity = 'fail'; reasons.push('Souring') }
    else flags.acidity = 'pass'
  }
  // 5. Temperature (<= 15)
  if (temp !== null) {
    if (temp > s('temp_acceptable')) { flags.temperature = 'fail'; reasons.push('Bacterial growth risk') }
    else flags.temperature = 'pass'
  }
  // 6. Specific Gravity (1.028 - 1.032)
  if (sg !== null) {
    if (sg < s('sg_min') || sg > s('sg_max')) { flags.specific_gravity = 'fail'; reasons.push('Added water (SG)') }
    else flags.specific_gravity = 'pass'
  }
  // 7. MBRT (>= 120)
  if (mbrt !== null) {
    if (mbrt < s('mbrt_check')) { flags.mbrt = 'fail'; reasons.push('Poor quality') }
    else flags.mbrt = 'pass'
  }
  // 8. Raw Temp (25 - 37)
  if (rawTemp !== null) {
    if (rawTemp < s('raw_milk_temp_min') || rawTemp > s('raw_milk_temp_max')) { flags.raw_milk_temp = 'fail'; reasons.push('Reject (Raw Temp)') }
    else flags.raw_milk_temp = 'pass'
  }
  
  const getPassValue = (key) => {
    if (sys[key]) return sys[key];
    // Fallback to standard industry defaults if settings aren't loaded/set
    const defaults = {
      cob_pass: 'negative',
      alcohol_pass: 'negative',
      organoleptic_pass: 'normal',
      sediment_pass: 'clean'
    };
    return defaults[key] || '';
  };

  const isPass = (val, key) => {
    if (!val) return false;
    const target = getPassValue(key);
    return val.toLowerCase() === target.toLowerCase();
  };

  // Laboratory Test Analysis
  if (data.cob_test) {
    if (isPass(data.cob_test, 'cob_pass')) flags.cob_test = 'pass'
    else { flags.cob_test = 'fail'; reasons.push(`COB Test: ${data.cob_test}`) }
  }
  
  if (data.alcohol_test) {
    if (isPass(data.alcohol_test, 'alcohol_pass')) flags.alcohol_test = 'pass'
    else { flags.alcohol_test = 'fail'; reasons.push(`Alcohol Test: ${data.alcohol_test}`) }
  }
  
  if (data.organoleptic) {
    if (isPass(data.organoleptic, 'organoleptic_pass')) flags.organoleptic = 'pass'
    else { flags.organoleptic = 'fail'; reasons.push(`Organoleptic: ${data.organoleptic}`) }
  }
  
  if (data.sediment_test) {
    if (isPass(data.sediment_test, 'sediment_pass')) flags.sediment_test = 'pass'
    else { flags.sediment_test = 'fail'; reasons.push(`Sediment Test: ${data.sediment_test}`) }
  }

  // Determination Logic
  const hasFail = Object.values(flags).some(f => f === 'fail');
  const anyEntered = Object.keys(flags).length > 0;
  
  let decision = 'pending';
  if (hasFail) decision = 'reject';
  else if (anyEntered) decision = 'accept';

  return { 
    decision, 
    reasons, 
    parameter_flags: flags, 
    isLive: true,
    isComplete: anyEntered
  }
}

function ResultCard({ result }) {
  if (!result) return null
  
  const states = {
    pending: { bg: 'bg-[#F5F3FF]/80 border-[#C4B5FD]/20', text: 'text-[#7C3AED]', icon: Database, label: 'READY FOR ENTRY', glow: 'shadow-purple-500/5' },
    accept: { bg: 'bg-emerald-500/5 border-emerald-500/20', text: 'text-emerald-600', icon: CheckCircle2, label: 'ACCEPTED', glow: 'shadow-emerald-500/20' },
    reject: { bg: 'bg-rose-500/5 border-rose-500/20', text: 'text-rose-600', icon: XCircle, label: 'REJECTED', glow: 'shadow-rose-500/20' },
  }

  const cfg = states[result.decision] || states.pending
  const Icon = cfg.icon
  const isServerResult = !result.isLive
  const fraudColor = result.fraud_risk === 'high' ? 'text-rose-600' : result.fraud_risk === 'medium' ? 'text-amber-600' : 'text-emerald-600'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card-premium p-10 ${cfg.bg} ${cfg.glow} border-2 relative overflow-hidden transition-all duration-500`}
    >
      {/* Status Indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-[#C4B5FD]/30 z-20">
        <span className={`w-2 h-2 rounded-full ${result.decision === 'reject' ? 'bg-rose-500' : 'bg-emerald-500 shadow-lg'}`} />
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#7C3AED] uppercase">
          {isServerResult ? 'AI Result' : 'Live Preview'}
        </span>
      </div>
      
      <Icon size={200} className={`absolute -right-16 -bottom-16 opacity-[0.03] ${cfg.text} transition-transform duration-700`}/>

      <div className="flex items-start gap-8 mb-8 relative z-10">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white dark:bg-white/10 shadow-2xl border border-white/40 transition-all duration-500`}>
          <Icon size={40} className={cfg.text}/>
        </div>
        <div className="flex-1">
          <h3 className={`text-3xl font-bold tracking-tight ${cfg.text} transition-colors duration-500`}>{cfg.label}</h3>
          {isServerResult && result.hybrid_override && (
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[9px] font-bold uppercase tracking-widest">
              <Sparkles size={10}/> Scientific Override Applied
            </span>
          )}
        </div>
      </div>

      {/* ML Intelligence Panel — only shown after server submission */}
      {isServerResult && (
        <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
          <div className="bg-white/70 dark:bg-white/10 rounded-2xl p-4 text-center border border-[#C4B5FD]/20">
            <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">Confidence</p>
            <p className="text-2xl font-black text-[#7C3AED]">{result.confidence_score ?? result.ml_confidence ?? 0}%</p>
          </div>
          <div className="bg-white/70 dark:bg-white/10 rounded-2xl p-4 text-center border border-[#C4B5FD]/20">
            <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">Anomaly</p>
            <p className={`text-2xl font-black ${result.anomaly_score > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{result.anomaly_score ?? 0}%</p>
          </div>
          <div className="bg-white/70 dark:bg-white/10 rounded-2xl p-4 text-center border border-[#C4B5FD]/20">
            <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mb-1">Fraud Risk</p>
            <p className={`text-lg font-black uppercase ${fraudColor}`}>{result.fraud_risk || 'Low'}</p>
          </div>
        </div>
      )}

      <div className="space-y-5 mb-10 relative z-10">
        <p className="text-[10px] font-bold text-[#7C3AED] dark:text-lavender uppercase tracking-widest ml-1">Quality Result Details</p>
        {result.reasons?.length === 0 ? (
          <div className="bg-white/60 dark:bg-white/10 p-6 rounded-3xl border border-[#C4B5FD]/20 flex items-center gap-4 group">
             <ShieldCheck size={22} className="text-[#7C3AED] group-hover:text-purple-500 transition-colors" />
             <p className="text-xs font-bold text-slate-700">Waiting for milk quality data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.reasons?.map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ x: -10, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4 bg-white/80 dark:bg-white/10 p-4 rounded-2xl border border-white/60 shadow-sm"
              >
                <div className={`p-1.5 rounded-lg ${cfg.bg} border border-current opacity-30`}>
                  <AlertTriangle size={14} className={cfg.text}/>
                </div>
                <span className="text-xs font-bold text-[#374151]">{r}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {result.parameter_flags && Object.keys(result.parameter_flags).length > 0 && (
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1 mb-4">Test Results Summary</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(result.parameter_flags).map(([k, v]) => {
              const c = { 
                pass: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5', 
                fail: 'bg-rose-500/5 text-rose-600 border-rose-500/20 shadow-rose-500/5', 
                warning: 'bg-orange-500/5 text-orange-600 border-orange-500/20 shadow-orange-500/5', 
              }[v] || 'bg-white/100 text-[#7C3AED] border-[#C4B5FD]/20'
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

      {isServerResult && result.model_version && (
        <div className="mt-6 relative z-10 flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest">Model: {result.model_version}</span>
          <span className="text-[#7C3AED]">•</span>
          <span className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest capitalize">{result.milk_type} Milk Standards</span>
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

  const gradients = {
    fat: 'linear-gradient(135deg, #fed7aa, #fdba74)',
    snf: 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
    ph: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)',
    acidity: 'linear-gradient(135deg, #fecaca, #fca5a5)',
    temperature: 'linear-gradient(135deg, #fbcfe8, #f472b6)',
    mbrt: 'linear-gradient(135deg, #a5f3fc, #67e8f9)',
    cob_test: 'linear-gradient(135deg, #f5d0fe, #f0abfc)',
  }

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
      toast.success(`Quality Record Saved: ${r.data.decision.toUpperCase()}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
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
        <h2 className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-4 h-4 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97316] shadow-lg" /> Manual Milk Quality Entry
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-10">
          <div className="card-premium p-10 space-y-10 border-[#C4B5FD]/20 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#C4B5FD]/20 pb-8">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-5 uppercase tracking-widest">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white flex items-center justify-center shadow-xl shadow-purple-500/20"><Microscope size={24}/></div>
                Manual Entry
              </h3>
              <div className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">System: <span className="text-orange-500">Live Feedback</span></div>
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
                  <label className="text-[10px] font-bold text-[#111827] tracking-widest ml-1 flex items-center justify-between opacity-100 visible">
                    <span className="flex items-center gap-2 text-[#111827]"><field.icon size={12} /> {PARAMETER_LABELS[field.id]}</span>
                    {displayResult?.parameter_flags?.[field.id] === 'fail' && <AlertTriangle size={12} className="text-rose-500 animate-pulse" />}
                    {displayResult?.parameter_flags?.[field.id] === 'pass' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </label>
                  <input 
                    type="number" 
                    step="0.001" 
                    style={{ backgroundImage: gradients[field.id] }}
                    className={`w-full border px-6 py-4 rounded-[18px] text-sm font-bold text-[#111827] text-center placeholder:text-[#6B7280] outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-[10px] ${getBorderColor(field.id)}`} 
                    {...register(field.id, { required: true })} 
                    placeholder="0.000"
                  />
                </div>
              ))}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#111827] tracking-widest ml-1 flex items-center justify-between opacity-100 visible">
                  <span className="flex items-center gap-2 text-[#111827]"><ShieldCheck size={12} /> {PARAMETER_LABELS.cob_test}</span>
                </label>
                <div className="relative">
                  <select 
                    style={{ backgroundImage: gradients.cob_test }}
                    className={`w-full border px-6 py-4 rounded-[18px] text-sm font-bold text-[#111827] text-center outline-none transition-all duration-300 ease-in-out shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-4 focus:ring-purple-500/20 backdrop-blur-[10px] appearance-none cursor-pointer ${getBorderColor('cob_test')}`} 
                    {...register('cob_test', { required: true })}
                  >
                    <option value="">Test Result</option>
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium overflow-hidden border-[#C4B5FD]/20 shadow-xl">
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-10 flex items-center justify-between hover:bg-[#F5F3FF]/70 dark:hover:bg-white/10 transition-all duration-500 group"
            >
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-5 uppercase tracking-widest">
                <div className="w-12 h-12 rounded-[1.5rem] bg-[#F5F3FF] dark:bg-white/10 flex items-center justify-center text-[#7C3AED] shadow-inner group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500"><Database size={24}/></div>
                Additional Farmer Details
              </h3>
              <div className={`p-3 rounded-xl bg-[#F5F3FF] dark:bg-white/10 text-[#7C3AED] transition-transform duration-500 ${showAdvanced ? 'rotate-180 bg-[#7C3AED] text-white shadow-lg shadow-purple-500/30' : ''}`}>
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
                      <label className="text-[10px] font-bold text-[#7C3AED] dark:text-lavender uppercase tracking-widest ml-1">Farmer Name</label>
                      <input className="w-full bg-indigo-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-[#6B7280] outline-none focus:ring-4 focus:ring-orange-500/10" {...register('farmer_name')} placeholder="Farmer Name"/>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Farmer ID</label>
                      <input className="w-full bg-indigo-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-[#6B7280] outline-none focus:ring-4 focus:ring-orange-500/10" {...register('farmer_code')} placeholder="FARMER-000"/>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Date</label>
                        <input type="date" className="w-full bg-violet-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-[#111827] outline-none focus:ring-4 focus:ring-orange-500/10" {...register('date')} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Shift</label>
                        <div className="relative">
                          <select className="w-full bg-violet-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-[#111827] outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none cursor-pointer" {...register('shift')}>
                            <option value="morning">Morning</option>
                            <option value="evening">Evening</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest ml-1">Quantity (L)</label>
                        <input type="number" step="0.1" className="w-full bg-emerald-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-6 py-4 rounded-2xl text-sm font-bold text-[#111827] placeholder:text-[#6B7280] outline-none focus:ring-4 focus:ring-orange-500/10" {...register('quantity')} placeholder="0.0"/>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-[#C4B5FD]/20">
                    {[
                      { id: 'alcohol_test', label: PARAMETER_LABELS.alcohol_test, options: [{v:'negative', l:'Negative'}, {v:'positive', l:'Positive'}] },
                      { id: 'organoleptic', label: PARAMETER_LABELS.organoleptic, options: [{v:'normal', l:'Normal'}, {v:'abnormal', l:'Off smell'}] },
                      { id: 'sediment_test', label: PARAMETER_LABELS.sediment_test, options: [{v:'clean', l:'Clean'}, {v:'dirty', l:'Dirt'}] },
                    ].map(f => (
                      <div key={f.id} className="space-y-3">
                        <label className="text-[9px] font-bold text-[#7C3AED] tracking-[0.2em] ml-1">{f.label}</label>
                        <div className="relative">
                          <select className={`w-full ${f.id === 'alcohol_test' ? 'bg-blue-50/70' : f.id === 'organoleptic' ? 'bg-amber-50/70' : 'bg-rose-50/70'} dark:bg-white/10 border px-5 py-3.5 rounded-2xl text-xs font-bold text-[#111827] outline-none appearance-none cursor-pointer transition-all duration-500 ${getBorderColor(f.id)}`} {...register(f.id)}>
                            <option value="">Status</option>
                            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#7C3AED] pointer-events-none" />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-[#7C3AED] uppercase tracking-widest ml-1 whitespace-nowrap">{PARAMETER_LABELS.raw_milk_temp}</label>
                      <input type="number" step="0.1" className="w-full bg-orange-50/70 dark:bg-white/10 border border-[#C4B5FD]/40 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#111827] placeholder:text-[#6B7280] outline-none focus:ring-4 focus:ring-orange-500/10" {...register('raw_milk_temp')} placeholder="0.0"/>
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
              className="flex-1 flex items-center justify-center gap-3 bg-[#7C3AED] text-white py-5 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-[#6D28D9] hover:shadow-purple-500/30 transition-all duration-300 disabled:bg-purple-200 disabled:text-[#7C3AED]"
            >
              {loading ? <Loader2 size={20} className="animate-spin"/> : <Send size={18}/>}
              {loading ? 'Transmitting Data…' : 'Save Quality Record'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-10 rounded-[2rem] bg-white dark:bg-white/10 border border-[#C4B5FD]/40 text-purple-500 hover:text-orange-600 hover:bg-orange-500/5 transition-all shadow-xl shadow-purple-500/5"
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
            <h4 className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest mb-10 flex items-center gap-4">
              <ShieldCheck size={20} className="text-[#F97316]"/> Milk Quality Standards
            </h4>
            <div className="space-y-6">
              {settings ? [
                [PARAMETER_LABELS.fat, `${settings.fat_min} – ${settings.fat_max}%`, Zap],
                [PARAMETER_LABELS.snf, `${settings.snf_min} – ${settings.snf_max}%`, Activity],
                [PARAMETER_LABELS.ph, `${settings.ph_min} – ${settings.ph_max}`, Droplets],
                [PARAMETER_LABELS.acidity, `≤ ${settings.acidity_max}%`, FlaskConical],
                [PARAMETER_LABELS.temperature, `≤ ${settings.temp_acceptable}°C`, Thermometer],
                [PARAMETER_LABELS.specific_gravity, `${settings.sg_min} – ${settings.sg_max}`, Database],
              ].map(([k, v, Icon]) => (
                <div key={k} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-white/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-500 shadow-inner">
                      <Icon size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-[#7C3AED] transition-colors">{k}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#111827] bg-[#F5F3FF] dark:bg-white/10 px-4 py-2 rounded-2xl border border-[#C4B5FD]/30 min-w-[90px] text-center shadow-sm">
                    {v}
                  </span>
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center gap-5">
                  <Loader2 size={40} className="animate-spin text-[#7C3AED]" />
                  <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest">Loading Standards...</p>
                </div>
              )}
            </div>
            <div className="mt-12 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-2 flex items-center gap-3 relative z-10">
                <Info size={14} /> Quality Assurance Notice
              </p>
              <p className="text-[10px] text-slate-700 font-semibold leading-relaxed relative z-10">
                All data is validated against standard dairy quality benchmarks and stored in the records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
