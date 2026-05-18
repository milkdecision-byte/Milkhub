import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, RotateCcw, Settings2, ShieldCheck, Thermometer, 
  FlaskConical, Loader2, Database, Activity, ShieldAlert,
  Droplets, Zap, CheckCircle2, LayoutDashboard, Cog, Microscope, Sparkles
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const GROUPS = [
  {
    title: 'Fat & SNF Standards',
    icon: FlaskConical,
    color: 'text-blue-600',
    bg: 'bg-blue-600',
    fields: [
      { key: 'fat_min', label: 'Fat (%) Minimum', step: '0.01' },
      { key: 'fat_max', label: 'Fat (%) Maximum', step: '0.01' },
      { key: 'snf_min', label: 'SNF (%) Minimum', step: '0.01' },
      { key: 'snf_max', label: 'SNF (%) Maximum', step: '0.01' },
    ],
  },
  {
    title: 'Acidity & pH Standards',
    icon: Droplets,
    color: 'text-emerald-600',
    bg: 'bg-emerald-600',
    fields: [
      { key: 'ph_min', label: 'pH Minimum', step: '0.01' },
      { key: 'ph_max', label: 'pH Maximum', step: '0.01' },
      { key: 'acidity_min', label: 'Acidity (% LA) Minimum', step: '0.001' },
      { key: 'acidity_max', label: 'Acidity (% LA) Maximum', step: '0.001' },
    ],
  },
  {
    title: 'Temperature Standards',
    icon: Thermometer,
    color: 'text-amber-600',
    bg: 'bg-amber-600',
    fields: [
      { key: 'temp_ideal', label: 'Temperature (°C) Ideal', step: '0.1' },
      { key: 'temp_acceptable', label: 'Temperature (°C) Acceptable', step: '0.1' },
      { key: 'raw_milk_temp_min', label: 'Raw Milk Temperature Min', step: '0.1' },
      { key: 'raw_milk_temp_max', label: 'Raw Milk Temperature Max', step: '0.1' },
    ],
  },
  {
    title: 'Density & Quality Tests',
    icon: Activity,
    color: 'text-indigo-600',
    bg: 'bg-indigo-600',
    fields: [
      { key: 'sg_min', label: 'Specific Gravity Minimum', step: '0.0001' },
      { key: 'sg_max', label: 'Specific Gravity Maximum', step: '0.0001' },
      { key: 'mbrt_good', label: 'MBRT (min) Target', step: '0.5' },
      { key: 'mbrt_check', label: 'MBRT (min) Alert', step: '0.5' },
    ],
  },
  {
    title: 'Organization & Security',
    icon: ShieldCheck,
    color: 'text-slate-900',
    bg: 'bg-slate-900',
    fields: [
      { key: 'company_name', label: 'Organization Entity', type: 'text' },
      { key: 'fraud_threshold', label: 'Anomaly Trigger Limit', step: '1' },
    ],
  },
  {
    title: 'Manual Quality Checks',
    icon: Microscope,
    color: 'text-rose-600',
    bg: 'bg-rose-600',
    fields: [
      { 
        key: 'cob_pass', 
        label: 'COB Test (Accept)', 
        type: 'select', 
        options: [
          { label: 'Negative', value: 'negative' },
          { label: 'Positive', value: 'positive' }
        ] 
      },
      { 
        key: 'alcohol_pass', 
        label: 'Alcohol Test (Accept)', 
        type: 'select', 
        options: [
          { label: 'Negative', value: 'negative' },
          { label: 'Positive', value: 'positive' }
        ] 
      },
      { 
        key: 'organoleptic_pass', 
        label: 'Organoleptic (Accept)', 
        type: 'select', 
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Off smell', value: 'abnormal' }
        ] 
      },
      { 
        key: 'sediment_pass', 
        label: 'Sediment Test (Accept)', 
        type: 'select', 
        options: [
          { label: 'Clean', value: 'clean' },
          { label: 'Dirt', value: 'dirty' }
        ] 
      },
    ],
  },
]

const DEFAULTS = {
  fat_min: '3.2', fat_max: '3.5',
  snf_min: '8.3', snf_max: '8.5',
  ph_min: '6.5', ph_max: '6.8',
  acidity_min: '0.10', acidity_max: '0.15',
  temp_ideal: '10', temp_acceptable: '15',
  raw_milk_temp_min: '25', raw_milk_temp_max: '37',
  sg_min: '1.028', sg_max: '1.032',
  mbrt_good: '180', mbrt_check: '120',
  company_name: 'IVRI Milk Quality Hub',
  fraud_threshold: '3',
  cob_pass: 'negative',
  alcohol_pass: 'negative',
  organoleptic_pass: 'normal',
  sediment_pass: 'clean',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({ ...DEFAULTS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [retraining, setRetraining] = useState(false)

  useEffect(() => {
    api.get('/settings')
      .then(r => setSettings(prev => ({ ...prev, ...r.data })))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/settings', settings)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRetrain = async () => {
    setRetraining(true)
    try {
      await api.post('/settings/retrain')
      toast.success('ML Models retrained successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Retraining failed')
    } finally {
      setRetraining(false)
    }
  }

  const handleReset = () => {
    setSettings(p => ({ ...p, ...DEFAULTS }))
    toast(`Settings reset to standard values`, { icon: '↩️' })
  }

  const updateField = (k, v) => {
    setSettings(p => ({ ...p, [k]: v }))
  }

  const getValue = (k) => {
    return settings[k] ?? DEFAULTS[k] ?? '';
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl" />
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Loading Settings...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="badge-enterprise bg-blue-600/10 text-blue-600 border-blue-600/20">Admin Control</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Settings Panel</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            System <span className="text-blue-600">Configuration</span>
          </h1>
          <p className="text-[#4B5563] font-medium mt-2 flex items-center gap-2">
            <Cog size={16} className="text-blue-500" /> 
            Set the quality standards for milk testing and analysis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={handleRetrain} 
            disabled={retraining} 
            className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-600/20 flex items-center justify-center gap-3 border-2 border-transparent transition-all w-full lg:w-auto"
          >
            {retraining ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {retraining ? 'Retraining…' : 'Retrain ML Models'}
          </button>
          <button 
            onClick={handleReset} 
            className="px-6 py-3 rounded-xl font-bold text-sm bg-white dark:bg-white/10 border-2 border-slate-200 dark:border-white/10 text-slate-700 hover:text-red-600 flex items-center justify-center gap-3 transition-all w-full lg:w-auto"
          >
            <RotateCcw size={16} /> Reset to Default
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 border-2 border-transparent transition-all w-full lg:w-auto"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Synchronizing…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* ── Groups ── */}
      <div className="grid gap-8">
        {GROUPS.map((group, gIndex) => {
          const Icon = group.icon
          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gIndex * 0.05 }}
              className={`p-8 space-y-8 rounded-[2rem] border transition-all ${
                group.bg === 'bg-blue-600' ? 'bg-blue-100/50 border-blue-200' :
                group.bg === 'bg-emerald-600' ? 'bg-emerald-100/50 border-emerald-200' :
                group.bg === 'bg-amber-600' ? 'bg-amber-100/50 border-amber-200' :
                group.bg === 'bg-indigo-600' ? 'bg-indigo-100/50 border-indigo-200' :
                group.bg === 'bg-slate-900' ? 'bg-slate-100/50 border-slate-200' :
                'bg-rose-100/50 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-5 border-b border-slate-50 dark:border-white/5 pb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl ${group.bg} shadow-${group.bg.split('-')[1]}-600/20`}>
                  <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">{group.title}</h3>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Quality Standards Group</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {group.fields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 tracking-widest ml-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        className={`w-full border px-5 py-4 rounded-2xl text-sm font-black text-[#1E1B4B] focus:ring-4 outline-none transition-all shadow-inner font-mono appearance-none ${
                          group.bg === 'bg-blue-600' ? 'bg-blue-50 border-blue-300 focus:ring-blue-600/5' :
                          group.bg === 'bg-emerald-600' ? 'bg-emerald-50 border-emerald-300 focus:ring-emerald-600/5' :
                          group.bg === 'bg-amber-600' ? 'bg-amber-50 border-amber-300 focus:ring-amber-600/5' :
                          group.bg === 'bg-indigo-600' ? 'bg-indigo-50 border-indigo-300 focus:ring-indigo-600/5' :
                          group.bg === 'bg-slate-900' ? 'bg-slate-50 border-slate-300 focus:ring-slate-900/5' :
                          'bg-rose-50 border-rose-300 focus:ring-rose-600/5'
                        }`}
                        value={getValue(field.key)}
                        onChange={e => updateField(field.key, e.target.value)}
                      >
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={`w-full border px-5 py-4 rounded-2xl text-sm font-black text-[#1E1B4B] focus:ring-4 outline-none transition-all shadow-inner font-mono ${
                          group.bg === 'bg-blue-600' ? 'bg-blue-50 border-blue-300 focus:ring-blue-600/5' :
                          group.bg === 'bg-emerald-600' ? 'bg-emerald-50 border-emerald-300 focus:ring-emerald-600/5' :
                          group.bg === 'bg-amber-600' ? 'bg-amber-50 border-amber-300 focus:ring-amber-600/5' :
                          group.bg === 'bg-indigo-600' ? 'bg-indigo-50 border-indigo-300 focus:ring-indigo-600/5' :
                          group.bg === 'bg-slate-900' ? 'bg-slate-50 border-slate-300 focus:ring-slate-900/5' :
                          'bg-rose-50 border-rose-300 focus:ring-rose-600/5'
                        }`}
                        type={field.type || 'number'}
                        step={field.step || '0.01'}
                        value={getValue(field.key)}
                        onChange={e => updateField(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Baseline Reference ── */}
      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-3xl relative overflow-hidden group">
        <div className="flex items-center gap-4 mb-10 relative z-10">
           <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-600/40">
             <LayoutDashboard size={24} />
           </div>
           <h3 className="text-xl font-black uppercase tracking-widest text-white">How Decisions are Made</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-3xl p-8 border border-white/5 hover:border-emerald-500/30 transition-all group/card">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Result: ACCEPTED</p>
            </div>
            <p className="text-[11px] font-bold leading-relaxed text-indigo-200 uppercase tracking-widest">
              Record saved. All quality parameters meet the required standards.
            </p>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-3xl p-8 border border-white/5 hover:border-red-500/30 transition-all group/card">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert size={20} className="text-red-500" />
              <p className="text-xs font-black text-red-500 uppercase tracking-widest">Result: Rejected</p>
            </div>
            <ul className="text-[10px] font-black text-indigo-200 space-y-3 uppercase tracking-widest">
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" /> COB Positive Detected</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" /> Low MBRT Result</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-500" /> Multiple Quality Issues</li>
            </ul>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-3xl p-8 border border-white/5 hover:border-amber-500/30 transition-all group/card">
            <div className="flex items-center gap-3 mb-6">
              <Settings2 size={20} className="text-amber-500" />
              <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Result: Observation</p>
            </div>
            <ul className="text-[10px] font-black text-indigo-200 space-y-3 uppercase tracking-widest">
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500" /> Slight Temperature Variation</li>
              <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500" /> Borderline MBRT Result</li>
            </ul>
          </div>
        </div>
        <Cog size={240} className="absolute -right-20 -bottom-20 text-white opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
      </div>
    </div>
  )
}
