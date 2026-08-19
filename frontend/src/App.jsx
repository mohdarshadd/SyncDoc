import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './components/landing/LandingPage'
import JoinPage from './pages/JoinPage'
import DocumentBrowser from './components/DocumentBrowser'
import Editor from './components/Editor'
import Toaster from './components/Toaster'
import usePageTitle from './hooks/usePageTitle'

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/join" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  usePageTitle()

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={user ? <Navigate to="/documents" replace /> : <JoinPage />} />
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
