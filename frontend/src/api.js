const API_BASE = '/api'

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const listDocuments = () => request('/documents')

export const getDocument = (id) => request(`/documents/${id}`)

export const createDocument = (body = {}) => request('/documents', { method: 'POST', body: JSON.stringify(body) })

export const deleteDocument = (id) => request(`/documents/${id}`, { method: 'DELETE' })

export const importMarkdown = (body) => request('/import/markdown', { method: 'POST', body: JSON.stringify(body) })

export const exportUrl = (id, format) => `/api/documents/${id}/export/${format}`

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'
