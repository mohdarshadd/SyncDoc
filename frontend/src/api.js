const API_BASE = '/api'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...opts
  })
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retry = await fetch(`${API_BASE}${path}`, { headers, ...opts })
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({}))
        throw new Error(body.error || `Request failed: ${retry.status}`)
      }
      return retry.status === 204 ? null : retry.json()
    }
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) return false
    const data = await res.json()
    accessToken = data.accessToken
    return true
  } catch {
    return false
  }
}

export const register = (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body), credentials: 'include' })

export const login = (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body), credentials: 'include' })

export const getMe = () => request('/auth/me')

export const logout = () => request('/auth/logout', { method: 'POST', credentials: 'include' }).then(() => { accessToken = null })

export const listDocuments = () => request('/documents')

export const getDocument = (id) => request(`/documents/${id}`)

export const createDocument = (body = {}) => request('/documents', { method: 'POST', body: JSON.stringify(body) })

export const deleteDocument = (id) => request(`/documents/${id}`, { method: 'DELETE' })

export const importMarkdown = (body) => request('/import/markdown', { method: 'POST', body: JSON.stringify(body) })

export const exportUrl = (id, format) => `/api/documents/${id}/export/${format}`

export const listShares = (docId) => request(`/documents/${docId}/shares`)

export const addShare = (docId, body) => request(`/documents/${docId}/shares`, { method: 'POST', body: JSON.stringify(body) })

export const removeShare = (docId, shareId) => request(`/documents/${docId}/shares/${shareId}`, { method: 'DELETE' })

export const listSharedWithMe = () => request('/shared-with-me')

export const listVersions = (docId) => request(`/documents/${docId}/versions`)

export const getVersion = (docId, revision) => request(`/documents/${docId}/versions/${revision}`)

export const restoreVersion = (docId, revision) => request(`/documents/${docId}/versions/${revision}/restore`, { method: 'POST' })

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'
