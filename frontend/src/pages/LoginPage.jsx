import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Eye, EyeOff, Lock, User, 
  Activity, Zap, Loader2, Droplets,
  ChevronRight, Sparkles, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

function FeaturePill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm">
      <Icon size={14} className="text-purple-400" />
      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{label}</span>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Operator ID and Password are required')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Access Granted. Synchronizing Hub.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Access Denied. Verification Failed.')
    } finally {
      setLoading(false)
    }
  }

  const bgGradient = theme === 'dark' 
    ? 'bg-[#070B1A] from-[#070B1A] via-[#0D1224] to-[#111827]' 
    : 'bg-[#F8F5FF] from-[#F8F5FF] via-[#FDF9FF] to-[#FFF7ED]'

  const textHeading = theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'
  const textSub = theme === 'dark' ? 'text-white/60' : 'text-[#1E1B4B]/60'

  return (
    <div className={`h-screen w-full flex items-center justify-center p-4 lg:p-0 overflow-hidden transition-colors duration-700 ${bgGradient} bg-gradient-to-br`} style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      
      {/* ── Theme Toggle ── */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3.5 rounded-2xl bg-white/5 dark:bg-white/5 border border-purple-500/10 dark:border-white/10 text-purple-600 dark:text-white/40 hover:scale-110 transition-all z-50 shadow-xl"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 dark:bg-orange-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
        
        {/* ── LEFT SIDE: BRANDING ── */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/2 space-y-8 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-purple-600/5 dark:bg-purple-600/10 border border-purple-600/20 text-purple-600 dark:text-purple-400 font-bold uppercase tracking-[0.3em] text-[9px] mb-2">
            <Sparkles size={12} /> AI-Powered Dairy Intelligence
          </div>
          
          <h1 className={`text-6xl lg:text-7xl font-bold tracking-tighter leading-none ${textHeading}`}>
            IVRI Milk <br />
            <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent italic">Intelligence</span> <br />
            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">Hub</span>
          </h1>

          <p className={`text-lg lg:text-xl ${textSub} max-w-md font-normal leading-relaxed`}>
            Real-time milk quality analysis and intelligent dairy monitoring platform.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <FeaturePill icon={Zap} label="Fat Analysis" />
            <FeaturePill icon={Activity} label="SNF Monitoring" />
            <FeaturePill icon={Droplets} label="pH Detection" />
          </div>
        </motion.div>

        {/* ── RIGHT SIDE: LOGIN CARD ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[420px]"
        >
          <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-[40px] p-10 lg:p-12 rounded-[3rem] border border-white/40 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-orange-500 opacity-30" />
            
            <div className="mb-10">
              <h2 className={`text-3xl font-bold ${textHeading} mb-1 tracking-tight italic`}>Operator Login</h2>
              <p className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white/30' : 'text-[#1E1B4B]/40'} uppercase tracking-widest`}>Access the dairy intelligence platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} uppercase tracking-[0.3em] ml-4 flex items-center gap-2`}>
                  <User size={12} /> Operator ID
                </label>
                <input
                  className={`w-full bg-white/40 dark:bg-white/[0.04] border ${theme === 'dark' ? 'border-white/10' : 'border-purple-600/10'} px-8 py-5 rounded-[1.5rem] ${theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'} font-bold placeholder:text-slate-400 dark:placeholder:text-white/10 focus:ring-4 focus:ring-purple-600/5 outline-none transition-all text-sm`}
                  placeholder="Enter Operator ID"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'} uppercase tracking-[0.3em] ml-4 flex items-center gap-2`}>
                  <Lock size={12} /> Password
                </label>
                <div className="relative group">
                  <input
                    className={`w-full bg-white/40 dark:bg-white/[0.04] border ${theme === 'dark' ? 'border-white/10' : 'border-purple-600/10'} px-8 py-5 rounded-[1.5rem] ${theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'} font-bold placeholder:text-slate-400 dark:placeholder:text-white/10 focus:ring-4 focus:ring-orange-600/5 outline-none transition-all text-sm tracking-widest`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter Secure Password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className={`absolute right-6 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/20' : 'text-purple-900/20'} hover:text-purple-600 transition-colors`}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-[#7C3AED] to-[#F97316] text-white py-5 rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.3em] shadow-2xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group border-none"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                <span className="relative z-10">{loading ? 'Syncing...' : 'Access Platform'}</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}
      />
    </div>
  )
}
