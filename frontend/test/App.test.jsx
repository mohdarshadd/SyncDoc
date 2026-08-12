import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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
  it('shows the welcome screen first', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'SyncDoc' })).toBeInTheDocument()
  })

  it('lets a user join the workspace and browse documents', async () => {
    render(<App />)
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enter workspace' }))

    await waitFor(() => expect(screen.getByText('Tech Spec')).toBeInTheDocument())
    expect(screen.getByText(/5 blocks/)).toBeInTheDocument()
  })
})
