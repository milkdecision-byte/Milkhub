import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, Eye, EyeOff, ShieldCheck, Lock, User, 
  Activity, Zap, Loader2, Microscope, Thermometer, FlaskConical,
  CheckCircle2, AlertTriangle, ChevronRight, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import loginPreview from '../assets/login_preview.png'

function FloatingCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex items-center gap-5 shadow-2xl"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-black/20`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-white tracking-tight">{value}</p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Operator credentials required for hub access')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Hub access granted. Welcome, Operator.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Access denied. Invalid operator credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B1A] flex flex-col lg:flex-row overflow-hidden selection:bg-purple-600/30 selection:text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* ── LEFT SIDE: BRANDING & PREVIEW ── */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-center px-24 py-20 overflow-hidden bg-gradient-to-br from-[#070B1A] via-[#0D1224] to-[#111827]">
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[140px] translate-y-1/3 -translate-x-1/4 animate-pulse pointer-events-none" />
        
        <div className="relative z-20 space-y-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 text-purple-400 font-bold uppercase tracking-[0.4em] text-xs">
              <Sparkles size={16} /> 
              AI-Powered Dairy Intelligence
            </div>
            <h1 className="text-8xl font-bold tracking-tighter leading-[0.9] text-white">
              IVRI <span className="text-white">Milk</span> <br />
              <span className="bg-gradient-to-r from-purple-500 to-purple-300 bg-clip-text text-transparent italic">Intelligence</span> <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-2xl text-white/60 max-w-2xl font-normal leading-relaxed pt-4">
              Real-time milk quality monitoring, fraud detection, laboratory analytics, and intelligent dairy supply chain management.
            </p>
          </motion.div>

          {/* Floating Analytics Grid */}
          <div className="grid grid-cols-2 gap-6 max-w-xl">
            <FloatingCard icon={Zap} label="Fat Analysis" value="Precision Monitoring" color="bg-purple-600" delay={0.2} />
            <FloatingCard icon={Activity} label="SNF Monitoring" value="Real-Time Telemetry" color="bg-orange-500" delay={0.4} />
            <FloatingCard icon={Droplets} label="pH Detection" value="Molecular Validation" color="bg-indigo-600" delay={0.6} />
            <FloatingCard icon={CheckCircle2} label="Quality Approved" value="Verified Samples" color="bg-emerald-600" delay={0.8} />
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.2 }}
            className="relative mt-12 group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B1A] via-transparent to-transparent z-10" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-orange-500 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <img 
              src={loginPreview} 
              alt="Dashboard Preview" 
              className="relative z-0 rounded-[2.5rem] border border-white/10 shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            />
            
            {/* Floating Mini Overlay */}
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[2rem] shadow-2xl z-20 hidden xl:block">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Fraud Detection Active</span>
               </div>
               <div className="space-y-3">
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-orange-500" />
                  </div>
                  <div className="w-32 h-1 bg-white/10 rounded-full" />
               </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* ── RIGHT SIDE: LOGIN FORM ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 relative bg-gradient-to-br from-[#070B1A] to-[#0A0F20]">
        
        {/* Mobile Header (Visible only on mobile) */}
        <div className="lg:hidden text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">IVRI Hub</h1>
          <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">AI Dairy Intelligence</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md relative"
        >
          {/* Main Login Card */}
          <div className="bg-white/[0.03] backdrop-blur-[40px] p-12 lg:p-14 rounded-[3.5rem] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-orange-500 to-purple-600 opacity-50" />
            
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight italic">Operator Authentication</h2>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">Secure access to the IVRI dairy intelligence network.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Operator ID */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#E9D5FF] uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                  <User size={14} className="text-purple-500" /> Operator ID
                </label>
                <div className="relative group">
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 px-10 py-6 rounded-[1.8rem] text-white font-bold placeholder:text-white/10 focus:ring-4 focus:ring-purple-600/10 focus:bg-white/[0.07] focus:border-purple-600/40 transition-all outline-none text-lg"
                    placeholder="Enter Operator ID"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  />
                  <div className="absolute inset-0 rounded-[1.8rem] border border-purple-500/0 group-focus-within:border-purple-500/20 transition-all pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#FFD6AE] uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                  <Lock size={14} className="text-orange-500" /> Password
                </label>
                <div className="relative group">
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 px-10 py-6 rounded-[1.8rem] text-white font-bold placeholder:text-white/10 focus:ring-4 focus:ring-orange-600/10 focus:bg-white/[0.07] focus:border-orange-600/40 transition-all outline-none text-lg tracking-widest"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter Secure Password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <div className="absolute inset-0 rounded-[1.8rem] border border-orange-500/0 group-focus-within:border-orange-500/20 transition-all pointer-events-none" />
                </div>
              </div>

              {/* Access Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-10 bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#F97316] text-white py-6 rounded-[2rem] font-bold text-sm uppercase tracking-[0.4em] shadow-2xl shadow-purple-900/40 hover:scale-[1.02] hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-4 relative overflow-hidden group border-none active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? <Loader2 size={24} className="animate-spin" /> : <ChevronRight size={24} />}
                <span className="relative z-10">{loading ? 'Synchronizing Hub…' : 'Access Intelligence Hub'}</span>
              </button>
            </form>
          </div>

          {/* Tagline */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
              Smart dairy diagnostics • fraud detection • quality assurance
            </p>
            <div className="flex items-center justify-center gap-6 opacity-20">
               <Microscope size={20} className="text-white" />
               <Thermometer size={20} className="text-white" />
               <FlaskConical size={20} className="text-white" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
