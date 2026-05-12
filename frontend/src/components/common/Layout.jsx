import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, ClipboardEdit, FileText,
  Users, BarChart3, Settings, LogOut, Menu, X,
  Droplets, ChevronRight, Sun, Moon, History, Calendar,
  Sparkles
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
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(window.innerWidth > 1280) // Auto open on large screens
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleLogout = async () => {
    await logout()
    toast.success('Session Terminated')
    navigate('/login')
  }

  const sidebarWidth = isMobile ? 260 : (sidebarOpen ? 280 : 80)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F3FF] dark:bg-[#030712] transition-colors duration-500">
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-[#4C1D95]/40 backdrop-blur-md z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar Component ── */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: (isMobile && !sidebarOpen) ? -sidebarWidth : 0,
        }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`
          fixed inset-y-0 left-0 lg:relative z-[70] 
          flex flex-col premium-sidebar-bg
          border-r border-white/10 shadow-2xl lg:shadow-none 
          transition-colors duration-500 overflow-hidden
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-4 px-6 py-10 border-b border-white/10 min-h-[100px] flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-900/20 border border-white/20 group cursor-pointer overflow-hidden">
            <Droplets size={26} className="text-white group-hover:scale-125 transition-transform duration-500" />
          </div>
          <AnimatePresence mode="wait">
            {(sidebarOpen || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-2xl font-bold text-white tracking-tight font-heading">Milkhub</p>
                <p className="text-[9px] text-orange-300 font-bold tracking-[0.4em] uppercase opacity-90">SaaS Intelligence</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-4 custom-scrollbar space-y-3">
          {NAV.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  group flex items-center h-14 rounded-2xl transition-all duration-300 relative overflow-hidden
                  ${sidebarOpen || isMobile ? 'px-4 gap-4' : 'justify-center'}
                  ${isActive 
                    ? 'premium-active-menu text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'}
                `}
                title={!sidebarOpen && !isMobile ? item.label : ''}
              >
                <div className={`flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <item.icon size={22} className={`${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`} />
                </div>
                
                <AnimatePresence>
                  {(sidebarOpen || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-bold tracking-wide whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div 
                    layoutId="activeGlow" 
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"
                  />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Module */}
        <div className="p-4 mt-auto bg-black/10 backdrop-blur-xl border-t border-white/10">
          <div className={`flex items-center gap-4 mb-4 ${sidebarOpen || isMobile ? 'px-2' : 'justify-center'}`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xl border border-white/20 flex-shrink-0 group cursor-help overflow-hidden">
              <span className="group-hover:scale-125 transition-transform duration-500">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <AnimatePresence>
              {(sidebarOpen || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden min-w-0"
                >
                  <p className="text-sm font-bold text-white truncate">{user?.username || 'Operator'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <p className="text-[10px] text-purple-200/60 font-bold uppercase tracking-widest">Active Node</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center h-12 rounded-xl transition-all duration-300 group
              ${sidebarOpen || isMobile ? 'px-4 gap-4' : 'justify-center'}
              text-purple-200/60 hover:text-white hover:bg-white/10
            `}
            title={!sidebarOpen && !isMobile ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            <AnimatePresence>
              {(sidebarOpen || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase"
                >
                  Terminate
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main Viewport ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Superior Topbar */}
        <header className="h-[100px] flex items-center gap-6 px-6 sm:px-10 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl z-30 border-b border-[#C4B5FD]/20">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="flex items-center justify-center w-12 h-12 text-[#7C3AED] hover:text-orange-500 transition-all bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-[#C4B5FD]/30 group"
          >
            {sidebarOpen ? <X size={20} className="group-hover:rotate-90 transition-transform duration-300" /> : <Menu size={20} className="group-hover:scale-110 transition-transform" />}
          </button>

          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-[#1E1B4B] dark:text-white truncate tracking-tight">
                Quality <span className="text-[#7C3AED]">Intelligence Terminal</span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles size={12} className="text-orange-400" />
                <span className="text-[10px] font-bold text-[#7C3AED]/60 uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-600 shadow-sm uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] animate-pulse" />
                System Active
              </div>
              <button
                onClick={toggleTheme}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-[#7C3AED] hover:text-orange-500 bg-white dark:bg-white/5 border border-[#C4B5FD]/30 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        {/* Intelligence Portal Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 lg:p-10 custom-scrollbar bg-[#F5F3FF] dark:bg-[#030712] relative">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />
          
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1600px] mx-auto w-full relative z-10"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
