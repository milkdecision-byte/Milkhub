import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/* ═══════════════════════════════════════════════
   SVG – IVRI Milk Quality Hub Hero Logo
═══════════════════════════════════════════════ */
function IvriLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 345 250" className={className}
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0a6b62" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="textGlow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0d9488" floodOpacity="0.18"/>
        </filter>
      </defs>

      {/* IVRI Milk – line 1 */}
      <text x="172.5" y="78"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontWeight="700" fontSize="78" letterSpacing="0"
        fill="url(#lg1)" filter="url(#textGlow)" textAnchor="middle">
        IVRI Milk
      </text>

      {/* Quality – line 2 */}
      <text x="172.5" y="158"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontWeight="700" fontSize="80" letterSpacing="0"
        fill="url(#lg2)" textAnchor="middle">
        Quality
      </text>

      {/* Hub – line 3 */}
      <text x="172.5" y="236"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontWeight="700" fontSize="80" letterSpacing="0"
        fill="url(#lg2)" textAnchor="middle">
        Hub
      </text>

    </svg>
  )
}

/* ═══════════════════════════════════════════════
   MAIN LOGIN PAGE COMPONENT
═══════════════════════════════════════════════ */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [focus, setFocus]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Admin ID and Password are required')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials. Try again.')
    } finally {
      setLoading(false)
    }
  }

  /* shared animation variants */
  const fadeUp = (delay = 0) => ({
    initial:    { opacity: 0, y: 22 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1], delay },
  })

  const fadeLeft = (delay = 0) => ({
    initial:    { opacity: 0, x: -30 },
    animate:    { opacity: 1, x: 0 },
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1], delay },
  })

  const fadeRight = (delay = 0) => ({
    initial:    { opacity: 0, x: 30 },
    animate:    { opacity: 1, x: 0 },
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1], delay },
  })

  return (
    <div className="lp-page">

      {/* ════════════════════════════════════
          LEFT PANEL  – Branding
      ════════════════════════════════════ */}
      <div className="lp-left">

        {/* soft background shapes */}
        <div className="lp-bg-circle lp-bg-circle-1" />
        <div className="lp-bg-circle lp-bg-circle-2" />
        <div className="lp-bg-circle lp-bg-circle-3" />

        <div className="lp-left-inner">

          {/* ── Hero Logo ── */}
          <motion.div {...fadeLeft(0)} className="lp-logo-wrap">
            <IvriLogo className="lp-logo-svg" />
          </motion.div>

        </div>
      </div>

      {/* ════════════════════════════════════
          RIGHT PANEL – Login Card
      ════════════════════════════════════ */}
      <div className="lp-right">

        <motion.div {...fadeRight(0.1)} className="lp-card">

          {/* card top accent */}
          <div className="lp-card-accent" />

          {/* heading */}
          <motion.div {...fadeUp(0.18)} className="lp-card-head">
            <h1 className="lp-welcome">Welcome Back</h1>
            <p className="lp-subtitle">Access your hub with your credentials</p>
          </motion.div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="lp-form">

            {/* Admin ID */}
            <motion.div {...fadeUp(0.24)}>
              <label className="lp-field-label">Admin ID</label>
              <div className={`lp-input-shell ${focus === 'user' ? 'lp-input-shell--focused-teal' : ''}`}>
                {/* envelope icon */}
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 7l10 7 10-7"/>
                </svg>
                <input
                  className="lp-input"
                  type="text"
                  placeholder="admin@ivri.hub"
                  value={form.username}
                  autoComplete="username"
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  onFocus={() => setFocus('user')}
                  onBlur={()  => setFocus(null)}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div {...fadeUp(0.30)}>
              <label className="lp-field-label">Password</label>
              <div className={`lp-input-shell ${focus === 'pass' ? 'lp-input-shell--focused-amber' : ''}`}>
                {/* lock icon */}
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="lp-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setFocus('pass')}
                  onBlur={()  => setFocus(null)}
                  style={{ paddingRight: 44 }}
                />
                <button type="button" className="lp-eye"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}>
                  {showPass
                    ? <EyeOff size={16} />
                    : <Eye    size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Remember Me only */}
            <motion.div {...fadeUp(0.36)} className="lp-row-meta">
              <label className="lp-remember">
                <input
                  type="checkbox"
                  className="lp-checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="lp-remember-text">Remember Me</span>
              </label>
            </motion.div>

            {/* Submit */}
            <motion.div {...fadeUp(0.42)}>
              <button type="submit" disabled={loading} className="lp-btn">
                <span className="lp-btn-shimmer" />
                <span className="lp-btn-label">
                  {loading
                    ? <><Loader2 size={17} className="lp-spin" /> Authenticating…</>
                    : <>Login Now &nbsp;→</>
                  }
                </span>
              </button>
            </motion.div>

          </form>

          {/* footer: copyright only */}
          <motion.div {...fadeUp(0.48)} className="lp-card-foot">
            <p className="lp-copy">© IVRI copyright</p>
          </motion.div>

        </motion.div>
      </div>

      {/* ════════ SCOPED STYLES ════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800&family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── PAGE SHELL ── */
        .lp-page {
          display: flex;
          min-height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        /* ════════════════════
           LEFT PANEL
        ════════════════════ */
        .lp-left {
          flex: 0 0 48%;
          min-height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          /* warm cream gradient matching reference */
          background: linear-gradient(160deg,
            #eef8f5 0%,
            #f0f4e8 35%,
            #ede8db 65%,
            #f2ece0 100%);
          padding: clamp(20px, 4vh, 40px) clamp(24px, 5vw, 56px);
        }

        /* soft abstract circles */
        .lp-bg-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-bg-circle-1 {
          width: 55vw; height: 55vw;
          max-width: 520px; max-height: 520px;
          top: -18%; left: -18%;
          background: radial-gradient(circle, rgba(13,148,136,0.09), transparent 65%);
        }
        .lp-bg-circle-2 {
          width: 40vw; height: 40vw;
          max-width: 360px; max-height: 360px;
          bottom: -10%; right: -8%;
          background: radial-gradient(circle, rgba(232,184,52,0.12), transparent 65%);
        }
        .lp-bg-circle-3 {
          width: 28vw; height: 28vw;
          max-width: 240px; max-height: 240px;
          top: 55%; left: 60%;
          background: radial-gradient(circle, rgba(16,185,129,0.07), transparent 65%);
          transform: translate(-50%, -50%);
        }

        .lp-left-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          max-width: 450px;
        }

        /* main logo – centered */
        .lp-logo-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .lp-logo-svg  {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: clamp(250px, 40vh, 330px);
          margin: 0 auto;
          display: block;
        }

        /* seal */
        .lp-seal-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-seal-wrap svg {
          width: clamp(130px, 20vw, 200px) !important;
          height: clamp(130px, 20vw, 200px) !important;
        }

        /* tagline */
        .lp-tagline {
          font-size: clamp(11px, 1.3vw, 13px);
          color: #5a6a5e;
          font-weight: 500;
          text-align: center;
          line-height: 1.6;
          max-width: 320px;
        }

        /* ════════════════════
           RIGHT PANEL
        ════════════════════ */
        .lp-right {
          flex: 1 1 0;
          min-height: 100dvh;
          max-height: 100dvh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 3vh, 32px) clamp(16px, 4vw, 48px);
          /* very light warm white matching reference */
          background: linear-gradient(160deg, #f5f0e6 0%, #f9f6ef 50%, #f5f0e6 100%);
        }

        /* ── CARD ── */
        .lp-card {
          width: 100%;
          max-width: 430px;
          background: rgba(255, 255, 255, 0.97);
          border-radius: 24px;
          border: 1px solid rgba(13,148,136,0.10);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.9) inset,
            0 8px 16px rgba(0,0,0,0.05),
            0 24px 56px rgba(13,148,136,0.10),
            0 48px 80px rgba(0,0,0,0.04);
          padding: clamp(24px, 4vh, 38px) clamp(24px, 4vw, 38px);
          position: relative;
          overflow: hidden;
        }

        /* thin top colour bar */
        .lp-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3.5px;
          background: linear-gradient(90deg, #0d9488, #10b981, #e8b834);
          border-radius: 24px 24px 0 0;
        }

        /* heading */
        .lp-card-head { margin-bottom: clamp(16px, 2.8vh, 26px); }
        .lp-welcome {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(1.5rem, 3.2vw, 2rem);
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .lp-subtitle {
          margin-top: 5px;
          font-size: clamp(12px, 1.5vw, 14px);
          color: #6b7280;
          font-weight: 500;
        }

        /* ── FORM ── */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 1.8vh, 18px);
        }

        .lp-field-label {
          display: block;
          font-size: clamp(11px, 1.3vw, 13px);
          font-weight: 700;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }

        /* input shell */
        .lp-input-shell {
          position: relative;
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 1.8px solid #e5e7eb;
          border-radius: 14px;
          transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
        }
        .lp-input-shell:hover {
          border-color: #d1d5db;
        }
        .lp-input-shell--focused-teal {
          border-color: #0d9488 !important;
          background: #f0fdf9 !important;
          box-shadow: 0 0 0 4px rgba(13,148,136,0.10);
        }
        .lp-input-shell--focused-amber {
          border-color: #f59e0b !important;
          background: #fffbeb !important;
          box-shadow: 0 0 0 4px rgba(245,158,11,0.10);
        }

        .lp-input-icon {
          width: 18px; height: 18px;
          flex-shrink: 0;
          margin-left: 14px;
          color: #9ca3af;
        }

        .lp-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: clamp(11px, 1.8vh, 14px) 14px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(13px, 1.6vw, 14px);
          font-weight: 500;
          color: #111827;
        }
        .lp-input::placeholder { color: #b0b7c3; }

        .lp-eye {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 14px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #0d9488; }

        /* remember + forgot row */
        .lp-row-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .lp-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .lp-checkbox {
          width: 16px; height: 16px;
          border-radius: 4px;
          border: 2px solid #d1d5db;
          cursor: pointer;
          accent-color: #0d9488;
          flex-shrink: 0;
        }
        .lp-remember-text {
          font-size: clamp(12px, 1.4vw, 13px);
          font-weight: 500;
          color: #374151;
        }
        .lp-forgot {
          background: none;
          border: none;
          cursor: pointer;
          font-size: clamp(12px, 1.4vw, 13px);
          font-weight: 600;
          color: #0d9488;
          transition: color 0.2s;
          padding: 0;
          white-space: nowrap;
        }
        .lp-forgot:hover { color: #0a7a70; text-decoration: underline; }

        /* ── SUBMIT BUTTON ── */
        .lp-btn {
          width: 100%;
          padding: clamp(13px, 2.2vh, 17px);
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #0d9488 0%, #10b981 55%, #059669 100%);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 8px 24px rgba(13,148,136,0.35),
            0 2px 4px rgba(13,148,136,0.20);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 14px 32px rgba(13,148,136,0.42),
            0 4px 8px rgba(13,148,136,0.22);
        }
        .lp-btn:active:not(:disabled) { transform: scale(0.977); }
        .lp-btn:disabled { opacity: 0.72; cursor: not-allowed; }

        .lp-btn-label {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: clamp(13px, 1.6vw, 15px);
          font-weight: 700;
          color: white;
          letter-spacing: 0.02em;
        }

        @keyframes lp-shimmer {
          0%   { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(220%)  skewX(-18deg); }
        }
        .lp-btn-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: lp-shimmer 2.2s infinite;
          z-index: 1;
        }

        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-spin { animation: lp-spin 0.85s linear infinite; flex-shrink: 0; }

        /* card footer */
        .lp-card-foot {
          margin-top: clamp(14px, 2vh, 20px);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-no-account {
          font-size: clamp(12px, 1.4vw, 13px);
          color: #6b7280;
          font-weight: 500;
        }
        .lp-request {
          background: none;
          border: none;
          cursor: pointer;
          color: #0d9488;
          font-weight: 700;
          font-size: inherit;
          padding: 0;
          transition: color 0.2s;
        }
        .lp-request:hover { color: #0a7a70; text-decoration: underline; }
        .lp-copy {
          font-size: clamp(10px, 1.2vw, 11px);
          color: #9ca3af;
          font-weight: 500;
          letter-spacing: 0.03em;
        }

        /* ════════════════════════════════
           TABLET  701–1023px
        ════════════════════════════════ */
        @media (min-width: 701px) and (max-width: 1023px) {
          .lp-left { flex: 0 0 44%; padding: 20px 28px; }
          .lp-seal-wrap svg { width: 130px !important; height: 130px !important; }
          .lp-card { max-width: 380px; }
        }

        /* ════════════════════════════════
           MOBILE  ≤ 700px
        ════════════════════════════════ */
        @media (max-width: 700px) {
          .lp-page {
            flex-direction: column;
          }

          /* ── left panel: compact top strip ── */
          .lp-left {
            flex: 0 0 auto;
            min-height: unset;
            max-height: unset;
            padding: 10px 16px 12px;
            justify-content: center;
            border-bottom: 1px solid rgba(13,148,136,0.12);
            box-shadow: 0 2px 12px rgba(13,148,136,0.07);
          }
          .lp-left-inner {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 12px;
            max-width: 100%;
          }

          /* hide tagline on mobile */
          .lp-tagline   { display: none; }

          /* logo: left part of strip */
          .lp-logo-wrap {
            flex: 0 0 auto;
            min-width: 0;
            width: min(240px, 72vw);
          }
          .lp-logo-svg {
            width: 100%;
            max-height: 124px;
            transform: translateY(8px);
          }

          /* seal: right part of strip, compact */
          .lp-seal-wrap svg {
            width: 80px !important;
            height: 80px !important;
          }

          /* bg circles – simplified on mobile */
          .lp-bg-circle-1 { width:200px; height:200px; }
          .lp-bg-circle-2 { width:140px; height:140px; }
          .lp-bg-circle-3 { display:none; }

          /* ── right panel: fills remaining height ── */
          .lp-right {
            flex: 1 1 0;
            min-height: 0;
            max-height: unset;
            padding: 12px 14px;
            align-items: center;
          }

          /* card: full-width, compact */
          .lp-card {
            max-width: 100%;
            padding: 16px 16px;
            border-radius: 18px;
          }

          .lp-welcome { font-size: 1.35rem; }
          .lp-subtitle { font-size: 11px; }
          .lp-card-head { margin-bottom: 14px; }

          .lp-form { gap: 10px; }
          .lp-field-label { font-size: 11px; margin-bottom: 5px; }

          .lp-input-shell { border-radius: 12px; }
          .lp-input { padding: 10px 12px; font-size: 13px; }
          .lp-input-icon { width: 15px; height: 15px; margin-left: 11px; }

          .lp-remember-text, .lp-forgot { font-size: 11px; }
          .lp-checkbox { width: 14px; height: 14px; }

          .lp-btn { padding: 12px; border-radius: 12px; }
          .lp-btn-label { font-size: 13px; }

          .lp-card-foot { margin-top: 12px; gap: 4px; }
          .lp-no-account, .lp-copy { font-size: 11px; }
        }

        /* very small phones ≤ 375px */
        @media (max-width: 375px) {
          .lp-seal-wrap svg { width: 68px !important; height: 68px !important; }
          .lp-logo-wrap { width: min(220px, 76vw); }
          .lp-logo-svg { max-height: 112px; }
          .lp-card { padding: 14px 13px; }
          .lp-welcome { font-size: 1.2rem; }
        }
      `}</style>

    </div>
  )
}
