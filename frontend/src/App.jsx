import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import Layout from './components/common/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ManualEntryPage from './pages/ManualEntryPage'
import RecordsPage from './pages/RecordsPage'
import FarmersPage from './pages/FarmersPage'
import FarmerDetailPage from './pages/FarmerDetailPage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'
import UploadHistoryPage from './pages/UploadHistoryPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center transition-all duration-1000">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)]"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(37,99,235,1)]"/>
        </div>
      </div>
      <p className="mt-8 text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] animate-pulse">Initializing Security Grid</p>
    </div>
  )
  return user ? children : <Navigate to="/login" replace/>
}

export default function App() {
  const { theme } = useTheme()
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { 
              background: theme === 'dark' ? '#0f172a' : '#ffffff', 
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '24px',
              fontSize: '11px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              padding: '20px 32px',
              maxWidth: '400px',
            },
            success: { iconTheme: { primary: '#2563eb', secondary: theme === 'dark' ? '#0f172a' : '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: theme === 'dark' ? '#0f172a' : '#ffffff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/" element={
            <ProtectedRoute>
              <Layout/>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace/>}/>
            <Route path="dashboard"      element={<DashboardPage/>}/>
            <Route path="upload"         element={<UploadPage/>}/>
            <Route path="upload-history" element={<UploadHistoryPage/>}/>
            <Route path="manual-entry"   element={<ManualEntryPage/>}/>
            <Route path="records"        element={<RecordsPage/>}/>
            <Route path="farmers"        element={<FarmersPage/>}/>
            <Route path="farmers/:id"    element={<FarmerDetailPage/>}/>
            <Route path="reports"        element={<ReportsPage/>}/>
            <Route path="settings"       element={<SettingsPage/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

