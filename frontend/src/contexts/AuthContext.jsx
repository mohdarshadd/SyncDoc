import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, setAccessToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  function loginUser(userData, token) {
    setAccessToken(token)
    setUser(userData)
  }

  function logoutUser() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
