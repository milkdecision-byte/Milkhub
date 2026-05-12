import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, Eye, EyeOff, LogIn, Sun, Moon, 
  ShieldCheck, Lock, User, Activity, Globe, Zap, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

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
      toast.error('Authentication Error: Credentials Required')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Authentication Protocol Successful. Access Granted.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication Failed: Access Denied')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-600/30 selection:text-white">
      {/* ── Background Intelligence ── */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[140px] translate-y-1/3 -translate-x-1/4 animate-pulse pointer-events-none" />

      {/* ── Cyber Matrix Grid ── */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,.1) 1.5px, transparent 1.5px)`,
          backgroundSize: '100px 100px'
        }}
      />

      {/* ── Theme Toggle Gateway ── */}
      <div className="absolute top-10 right-10 z-50">
        <button
          onClick={toggleTheme}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-blue-500 hover:bg-white/10 hover:border-blue-500/30 backdrop-blur-3xl transition-all shadow-3xl group"
        >
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-90 transition-transform duration-700" /> : <Moon size={20} />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        {/* ── Secure Ingress Terminal ── */}
        <div className="bg-slate-900/40 backdrop-blur-[60px] p-12 sm:p-16 rounded-[4rem] border border-white/10 shadow-[0_60px_150px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-40" />
          
          {/* ── Identity Header ── */}
          <div className="text-center mb-16">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-blue-600 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.6)] mb-8 border border-white/20"
            >
              <Droplets size={44} className="text-white drop-shadow-2xl" />
            </motion.div>
            <h1 className="text-6xl font-bold text-white tracking-tighter uppercase mb-4 italic">
              Milkhub<span className="text-blue-700">.</span>
            </h1>
            <div className="flex items-center justify-center gap-5">
              <span className="h-px w-12 bg-white/20" />
              <p className="text-blue-600 text-[11px] font-bold uppercase tracking-[0.6em]">Global Quality Network</p>
              <span className="h-px w-12 bg-white/20" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* ── Operator Field ── */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                <User size={14} className="text-blue-700" /> Operator Registry Identity
              </label>
              <div className="relative group/input">
                <input
                  className="w-full bg-white/[0.04] border border-white/10 px-10 py-7 rounded-[2rem] text-white font-bold placeholder:text-white/5 focus:ring-4 focus:ring-blue-600/10 focus:bg-white/[0.08] focus:border-blue-600/40 transition-all outline-none text-xl font-serif"
                  placeholder="HUB-SEC-ID-000"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            {/* ── Security Protocol Field ── */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                <Lock size={14} className="text-blue-700" /> Authentication Protocol
              </label>
              <div className="relative group/input">
                <input
                  className="w-full bg-white/[0.04] border border-white/10 px-10 py-7 rounded-[2rem] text-white font-bold placeholder:text-white/5 focus:ring-4 focus:ring-blue-600/10 focus:bg-white/[0.08] focus:border-blue-600/40 transition-all outline-none text-xl font-serif tracking-widest"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/30 hover:text-blue-600 transition-colors"
                >
                  {showPass ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            {/* ── Ingress Action ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-12 bg-blue-700 text-white py-7 rounded-[2.5rem] font-bold text-base uppercase tracking-[0.5em] shadow-3xl shadow-blue-900/60 hover:scale-[1.01] hover:shadow-blue-700/80 transition-all flex items-center justify-center gap-6 relative overflow-hidden group/btn border-none"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              {loading ? (
                <Loader2 size={28} className="animate-spin" />
              ) : (
                <ShieldCheck size={28} />
              )}
              <span className="relative z-10">{loading ? 'Verifying Gateway…' : 'Access Network'}</span>
            </button>
          </form>
          
          {/* ── Decorative Matrix Elements ── */}
          <Activity size={300} className="absolute -left-20 -bottom-20 text-blue-600 opacity-[0.02] -rotate-12 pointer-events-none" />
          <Globe size={240} className="absolute -right-20 -top-20 text-blue-600 opacity-[0.02] rotate-12 pointer-events-none" />
        </div>

        {/* ── Terminal Metadata ── */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
            <Zap size={14} className="text-blue-600/40" /> 
            Milkhub Security Node Alpha
            <Zap size={14} className="text-blue-600/40" />
          </div>
          <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em] max-w-sm text-center leading-loose">
            Enterprise Grade Quality Network • End-to-End Encryption Enabled • Registry Protocol v4.0.2
          </p>
        </div>
      </motion.div>
    </div>
  )
}

