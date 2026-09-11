import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import useMediaQuery from '../src/hooks/useMediaQuery'

afterEach(cleanup)

describe('useMediaQuery', () => {
  it('returns false when the media query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    expect(result.current).toBe(false)
  })

  it('accepts a query string without throwing in jsdom', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(typeof result.current).toBe('boolean')
  })

  it('is stable across re-renders for a fixed query', () => {
    const { result, rerender } = renderHook(() => useMediaQuery('(max-width: 640px)'))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})