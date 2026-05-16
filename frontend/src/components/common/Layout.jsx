import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
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
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Data' },
  { to: '/upload-history', icon: History, label: 'Upload History' },
  { to: '/manual-entry', icon: ClipboardEdit, label: 'Manual Entry' },
  { to: '/records', icon: FileText, label: 'Records' },
  { to: '/farmers', icon: Users, label: 'Farmers' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

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
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#071B4A] to-[#0B2C78] text-white flex flex-col transition-all duration-500 overflow-hidden ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-8">
          <div className="w-12 h-12 rounded-2xl bg-[#071B4A] border border-[#2563EB]/30 flex items-center justify-center text-white shadow-xl shadow-blue-500/10 backdrop-blur-xl group hover:scale-105 transition-all duration-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-500">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#logo-drop-grad)" />
              <path d="M2 14h3l2-4 2.5 8 2.5-6 2 2h6" stroke="url(#logo-pulse-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-pulse" />
              <defs>
                <linearGradient id="logo-drop-grad" x1="12" y1="2.69" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="logo-pulse-grad" x1="2" y1="14" x2="22" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#06B6D4" />
                  <stop offset="0.5" stopColor="#7C3AED" />
                  <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {sidebarOpen && (
            <div className="ml-4 overflow-hidden">
              <span className="block font-black text-2xl tracking-tighter bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-transparent bg-clip-text leading-none">IVRI Milk</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/70 mt-1 block">Management Hub</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item group ${isActive ? 'active' : ''} ${!sidebarOpen && !isMobile ? 'justify-center px-0' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${sidebarOpen ? '' : 'group-hover:scale-110'}`}>
                <item.icon size={22} strokeWidth={2.5} className="flex-shrink-0" />
              </div>
              {(sidebarOpen || isMobile) && <span className="tracking-tight">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${!isMobile ? (sidebarOpen ? 'ml-[280px]' : 'ml-[80px]') : ''}`}>
        {/* Header */}
        <header className="h-20 glass sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 mx-0 md:mx-6 my-0 md:my-4 rounded-none md:rounded-3xl">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <Menu size={22} strokeWidth={2.5} />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center max-w-md w-full relative group">
              <Search size={18} strokeWidth={2.5} className="absolute left-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search analytics, farmers..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/records?search=${e.target.value}`)
                    toast.success(`Searching for: ${e.target.value}`)
                  }
                }}
                className="w-full pl-12 pr-4 py-3"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Live Time & Date */}
            <div className="hidden lg:flex items-center gap-6 px-6 border-x border-indigo-100 dark:border-indigo-500/10 h-10">
              <div className="flex items-center gap-2.5 text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <Clock size={16} strokeWidth={2.5} />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <Calendar size={16} strokeWidth={2.5} />
                <span>{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Action Icons Removed */}

            {/* Admin Profile */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-4 pl-6 border-l border-indigo-100 dark:border-indigo-500/10 h-10 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#2563EB]/20">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-black tracking-tight leading-none mb-1">{user?.username || 'Admin'}</p>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">System Admin</p>
                </div>
                <ChevronDown size={16} strokeWidth={2.5} className={`text-indigo-300 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/10 rounded-3xl shadow-2xl z-20 overflow-hidden p-2"
                    >
                      <div className="p-4 border-b border-indigo-50 dark:border-indigo-500/10">
                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-black truncate text-slate-900 dark:text-white">{user?.email || 'admin@milkhub.ai'}</p>
                      </div>
                      <div className="p-1 space-y-1">
                        <button 
                          onClick={() => { setProfileOpen(false); navigate('/settings') }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all"
                        >
                          <Settings size={18} strokeWidth={2.5} className="text-indigo-400" />
                          Settings
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all"
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[var(--border-light)] px-6 py-3 flex items-center justify-between z-50 shadow-lg">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <LayoutDashboard size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Dashboard</span>
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <Upload size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Upload</span>
        </NavLink>
        
        {/* Central Action Button */}
        <button 
          onClick={() => navigate('/manual-entry')}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full -mt-8 shadow-lg border-4 border-white dark:border-slate-900 glow-indigo"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
        
        <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <BarChart3 size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Reports</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          <Settings size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-wider">Settings</span>
        </NavLink>
      </div>
    </div>
  )
}

