import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './components/landing/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DocumentBrowser from './components/DocumentBrowser'
import Editor from './components/Editor'
import Toaster from './components/Toaster'
import usePageTitle from './hooks/usePageTitle'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/documents" replace />
  return children
}

function AppRoutes() {
  const { user, loginUser, logoutUser } = useAuth()
  usePageTitle()

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<GuestOnly><LoginPage onLogin={loginUser} /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage onLogin={loginUser} /></GuestOnly>} />
        <Route path="/documents" element={<RequireAuth><DocumentBrowser /></RequireAuth>} />
        <Route path="/editor/:docId" element={<RequireAuth><Editor /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
