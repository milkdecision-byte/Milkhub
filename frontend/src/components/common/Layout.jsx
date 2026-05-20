import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, ClipboardEdit, FileText,
  Users, BarChart3, Settings, LogOut, Menu, X,
  Search, Bell, Clock, Calendar, Sun, Moon,
  History, User, ChevronDown, Plus
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', iconKey: 'dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Data', iconKey: 'upload' },
  { to: '/upload-history', icon: History, label: 'Upload History', iconKey: 'history' },
  { to: '/manual-entry', icon: ClipboardEdit, label: 'Manual Entry', iconKey: 'manual' },
  { to: '/records', icon: FileText, label: 'Records', iconKey: 'records' },
  { to: '/farmers', icon: Users, label: 'Farmers', iconKey: 'farmers' },
  { to: '/reports', icon: BarChart3, label: 'Reports', iconKey: 'reports' },
  { to: '/settings', icon: Settings, label: 'Settings', iconKey: 'settings' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : (isMobile ? 0 : 80) }}
        className={`sidebar-shell fixed inset-y-0 left-0 z-50 text-white flex flex-col transition-all duration-500 overflow-hidden ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden focusable="false">
          <defs>
            <linearGradient id="sidebar-grad-dashboard" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="sidebar-grad-upload" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id="sidebar-grad-history" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id="sidebar-grad-manual" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="sidebar-grad-records" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="sidebar-grad-farmers" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9A8D4" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="sidebar-grad-reports" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="sidebar-grad-settings" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
        </svg>
        <div className="sidebar-glass-overlay" aria-hidden />
        <div className="sidebar-inner flex flex-col h-full min-h-0 flex-1">
          {/* Logo */}
          <div className="h-24 flex items-center px-8 shrink-0 relative">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="sidebar-logo-glow" aria-hidden />
              <div className="sidebar-logo-mark w-12 h-12 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl group hover:scale-105 transition-all duration-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-500">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#logo-drop-grad)" />
                  <path d="M2 14h3l2-4 2.5 8 2.5-6 2 2h6" stroke="url(#logo-pulse-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-pulse" />
                  <defs>
                    <linearGradient id="logo-drop-grad" x1="12" y1="2.69" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8B5CF6" />
                      <stop offset="0.5" stopColor="#3B82F6" />
                      <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                    <linearGradient id="logo-pulse-grad" x1="2" y1="14" x2="22" y2="14" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#10B981" />
                      <stop offset="0.5" stopColor="#F59E0B" />
                      <stop offset="1" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            {sidebarOpen && (
              <div className="ml-4 overflow-hidden min-w-0">
                <span className="sidebar-logo-title block font-black text-2xl tracking-tighter leading-none">IVRI Milk</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/90 mt-1 block">Management Hub</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar min-h-0">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item group ${isActive ? 'active' : ''} ${!sidebarOpen && !isMobile ? 'justify-center px-0' : ''}`
                }
                title={!sidebarOpen ? item.label : ''}
              >
                <div className={`sidebar-icon-wrap sidebar-icon-wrap--${item.iconKey}`}>
                  <item.icon size={22} strokeWidth={2.5} className="flex-shrink-0" />
                </div>
                {(sidebarOpen || isMobile) && <span className="tracking-tight">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${!isMobile ? (sidebarOpen ? 'ml-[280px]' : 'ml-[80px]') : ''}`}>
        {/* Header */}
        <header className="h-20 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 mx-0 md:mx-6 my-0 md:my-4 rounded-none md:rounded-3xl text-slate-800 bg-gradient-to-r from-white via-[#faf5ff] to-[#ecfeff] dark:from-slate-50 dark:via-violet-50/90 dark:to-cyan-50 backdrop-blur-xl border border-violet-100/90 dark:border-violet-200/60 shadow-[0_10px_40px_-8px_rgba(139,92,246,0.18),0_4px_14px_rgba(6,182,212,0.12)] ring-1 ring-white/80">
          <div className="flex items-center gap-6 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl bg-white/95 text-violet-600 shadow-sm ring-1 ring-violet-200/70 hover:bg-violet-50 hover:text-violet-700 hover:scale-105 active:scale-95 transition-all"
            >
              <Menu size={22} strokeWidth={2.5} />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center max-w-md w-full relative group">
              <Search size={18} strokeWidth={2.5} className="absolute left-4 text-violet-500 group-focus-within:text-cyan-600 transition-colors" />
              <input
                type="text"
                placeholder="Search analytics, farmers..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/records?search=${e.target.value}`)
                    toast.success(`Searching for: ${e.target.value}`)
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/95 text-slate-800 placeholder:text-slate-400 rounded-xl border-2 border-violet-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200/90 focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Live Time & Date */}
            <div className="hidden lg:flex items-center gap-6 px-6 border-x border-violet-200/60 h-10">
              <div className="flex items-center gap-2.5 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                <Clock size={16} strokeWidth={2.5} className="text-violet-600" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                <Calendar size={16} strokeWidth={2.5} className="text-cyan-600" />
                <span>{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Action Icons Removed */}

            {/* Admin Profile */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-4 pl-6 border-l border-violet-200/60 h-10 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-300/50 ring-2 ring-white">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-200" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-black tracking-tight leading-none mb-1 text-slate-900">{user?.username || 'Admin'}</p>
                  <p className="text-[9px] text-cyan-700 font-black uppercase tracking-widest">System Admin</p>
                </div>
                <ChevronDown size={16} strokeWidth={2.5} className={`text-slate-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 bg-white/98 backdrop-blur-xl border border-violet-200/70 rounded-3xl shadow-xl shadow-violet-200/40 z-20 overflow-hidden p-2"
                    >
                      <div className="p-4 border-b border-violet-100">
                        <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-black truncate text-slate-900">{user?.email || 'admin@milkhub.ai'}</p>
                      </div>
                      <div className="p-1 space-y-1">
                        <button 
                          type="button"
                          onClick={() => { setProfileOpen(false); navigate('/settings') }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-violet-50 rounded-2xl transition-all"
                        >
                          <Settings size={18} strokeWidth={2.5} className="text-violet-600" />
                          Settings
                        </button>
                        <button 
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <LogOut size={18} strokeWidth={2.5} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-violet-500/15 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-violet-100 px-6 py-3 flex items-center justify-between z-50 shadow-[0_-8px_30px_rgba(139,92,246,0.1)]">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-violet-600' : 'text-slate-500'}`}>
          <LayoutDashboard size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Dashboard</span>
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-cyan-600' : 'text-slate-500'}`}>
          <Upload size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Upload</span>
        </NavLink>
        
        {/* Central Action Button */}
        <button 
          type="button"
          onClick={() => navigate('/manual-entry')}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-cyan-500 text-white rounded-full -mt-8 shadow-lg border-4 border-white shadow-cyan-400/25"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
        
        <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-violet-600' : 'text-slate-500'}`}>
          <BarChart3 size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Reports</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-cyan-600' : 'text-slate-500'}`}>
          <Settings size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Settings</span>
        </NavLink>
      </div>
    </div>
  )
}

