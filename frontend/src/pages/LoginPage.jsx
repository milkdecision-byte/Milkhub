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
    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-purple-600/10 dark:bg-white/5 border border-purple-600/20 dark:border-white/10 shadow-sm transition-all hover:scale-105">
      <Icon size={14} className="text-purple-600 dark:text-purple-400" />
      <span className="text-[10px] font-black text-purple-900 dark:text-white uppercase tracking-widest">{label}</span>
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
      toast.error('Admin ID and Password are required')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Login successful. Opening Hub.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Invalid ID or Password.')
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
    <div className={`min-h-screen lg:h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-0 transition-colors duration-700 ${bgGradient} bg-gradient-to-br py-10 lg:py-0`}>
      
      {/* ── Theme Toggle ── */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-purple-500/10 dark:border-white/10 text-purple-600 dark:text-white/40 hover:scale-110 transition-all z-50 shadow-xl"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* ── Background Glows ── */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 dark:bg-orange-600/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-24 relative z-10">
        
        {/* ── LEFT SIDE: BRANDING ── */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/2 space-y-4 lg:space-y-8 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-600/30 text-purple-700 dark:text-purple-400 font-black uppercase tracking-[0.3em] text-[8px] sm:text-[10px] mb-1 shadow-sm">
            <Sparkles size={10} /> Milk Quality Monitoring
          </div>
          
          <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none ${textHeading}`} style={{ fontFamily: "'Clash Display', sans-serif" }}>
            IVRI Milk <br />
            <span className="bg-gradient-to-r from-purple-700 to-purple-500 dark:from-purple-500 dark:to-purple-400 bg-clip-text text-transparent italic">Quality</span> <br />
            <span className="bg-gradient-to-r from-orange-600 to-orange-400 dark:from-orange-500 dark:to-orange-400 bg-clip-text text-transparent">Hub</span>
          </h1>

        </motion.div>

        {/* ── RIGHT SIDE: LOGIN CARD ── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[380px]"
        >
          <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-[40px] p-6 sm:p-8 lg:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/40 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-orange-500 opacity-30" />
            
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className={`text-2xl sm:text-3xl font-black ${textHeading} mb-1 tracking-tight italic`}>Admin Login</h2>
                <p className={`text-[9px] font-black ${theme === 'dark' ? 'text-white/40' : 'text-[#1E1B4B]'} uppercase tracking-widest`}>LOGIN TO THE MILK QUALITY HUB</p>
              </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'} uppercase tracking-[0.4em] ml-4 flex items-center gap-2`}>
                  <User size={12} /> Admin ID
                </label>
                <input
                  className={`w-full bg-white/60 dark:bg-white/[0.04] border ${theme === 'dark' ? 'border-white/10' : 'border-purple-600/20'} px-6 py-4 rounded-[1.5rem] ${theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'} font-black placeholder:text-slate-500 dark:placeholder:text-white/20 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all text-sm shadow-sm`}
                  placeholder="Enter Admin ID"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'} uppercase tracking-[0.4em] ml-4 flex items-center gap-2`}>
                  <Lock size={12} /> Password
                </label>
                <div className="relative group">
                  <input
                    className={`w-full bg-white/60 dark:bg-white/[0.04] border ${theme === 'dark' ? 'border-white/10' : 'border-orange-600/20'} px-6 py-4 rounded-[1.5rem] ${theme === 'dark' ? 'text-white' : 'text-[#1E1B4B]'} font-black placeholder:text-slate-500 dark:placeholder:text-white/20 focus:ring-4 focus:ring-orange-600/10 outline-none transition-all text-sm tracking-widest shadow-sm`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter Admin Password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-900/20 dark:text-white/20 hover:text-purple-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-[#7C3AED] to-[#F97316] text-white py-4 rounded-[1.2rem] font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group border-none"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                <span className="relative z-10">{loading ? 'Syncing...' : 'Login Now'}</span>
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
