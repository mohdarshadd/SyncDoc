import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

vi.mock('../src/api', () => ({
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
  })

  it('shows the landing page first', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Write together, without the conflicts.' })).toBeInTheDocument()
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0)
  })

  it('navigates from the landing page to the join screen', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(screen.getByRole('heading', { name: 'SyncDoc' })).toBeInTheDocument()
  })

  it('lets a user join the workspace and browse documents', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enter workspace' }))

    await waitFor(() => expect(screen.getByText('Tech Spec')).toBeInTheDocument())
    expect(screen.getByText(/5 blocks/)).toBeInTheDocument()
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
