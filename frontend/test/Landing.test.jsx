import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import LandingPage from '../src/components/landing/LandingPage'

describe('LandingPage', () => {
  afterEach(() => cleanup())

  it('renders the navbar with brand and get started action', () => {
    render(<LandingPage onGetStarted={vi.fn()} />)
    expect(screen.getAllByText('SyncDoc').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Features' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument()
  })

  it('renders the hero with headline and CTAs', () => {
    render(<LandingPage onGetStarted={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Write together, without the conflicts.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get started free' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#features')
  })

  it('renders the features section', () => {
    render(<LandingPage onGetStarted={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Everything a team needs to write together' })).toBeInTheDocument()
    for (const title of ['Real-time sync', 'Zero conflicts', 'Live presence', 'Block-based editing', 'Markdown in and out', 'Keyboard fast']) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  })

  it('renders the stats band', () => {
    render(<LandingPage onGetStarted={vi.fn()} />)
    expect(screen.getByText('<100ms')).toBeInTheDocument()
    expect(screen.getByText('average sync latency')).toBeInTheDocument()
    expect(screen.getByText('lost edits with conflict resolution')).toBeInTheDocument()
  })

  it('renders the CTA band and footer', () => {
    render(<LandingPage onGetStarted={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Ready to write together?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
    expect(screen.getByText(/© 2026 SyncDoc/)).toBeInTheDocument()
  })

  it('calls onGetStarted when the CTA button is clicked', () => {
    const onGetStarted = vi.fn()
    render(<LandingPage onGetStarted={onGetStarted} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start collaborating' }))
    expect(onGetStarted).toHaveBeenCalled()
  })
})
