import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const mockGetMe = vi.fn().mockRejectedValue(new Error('not authenticated'))
const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockSetAccessToken = vi.fn()

vi.mock('../src/api', () => ({
  getMe: (...args) => mockGetMe(...args),
  login: (...args) => mockLogin(...args),
  register: (...args) => mockRegister(...args),
  setAccessToken: (...args) => mockSetAccessToken(...args),
  logout: vi.fn().mockResolvedValue(undefined),
  listDocuments: vi.fn().mockResolvedValue([
    { _id: 'd1', title: 'Tech Spec', author: 'Alice', updatedAt: new Date().toISOString(), revision: 3, blockCount: 5 }
  ]),
  createDocument: vi.fn().mockResolvedValue({ _id: 'd2', title: 'Untitled' }),
  deleteDocument: vi.fn().mockResolvedValue(null),
  importMarkdown: vi.fn().mockResolvedValue({ _id: 'd3', title: 'Imported' }),
  exportUrl: (id, format) => `/api/documents/${id}/export/${format}`,
  WS_URL: 'ws://localhost:4000/ws'
}))

import App from '../src/App'

describe('App', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    delete document.documentElement.dataset.theme
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    mockGetMe.mockRejectedValue(new Error('not authenticated'))
  })

  it('shows the landing page first', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Write together, without the conflicts.' })).toBeInTheDocument()
    expect(screen.getAllByText('SyncDoc').length).toBeGreaterThan(0)
  })

  it('navigates from the landing page to the register screen', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Get started free' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument())
  })

  it('shows login form when clicking sign in link', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Get started free' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument())
    fireEvent.click(screen.getByText('Sign in'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in to SyncDoc' })).toBeInTheDocument())
  })

  it('toggles between dark and light mode and persists the choice', () => {
    render(<App />)
    const toggle = screen.getByRole('button', { name: 'Toggle light mode' })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(toggle).toHaveTextContent('Light')

    fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('syncdoc-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveTextContent('Dark')
  })
})
