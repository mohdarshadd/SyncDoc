import { useMemo, useState, useEffect, useCallback } from 'react'
import { computeMatches } from '../lib/search'

export default function useDocumentSearch(blocks) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const matches = useMemo(() => computeMatches(blocks, query), [blocks, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, blocks])

  const activeMatch = matches[activeIndex] || null

  const next = useCallback(() => {
    if (matches.length === 0) return
    setActiveIndex((i) => (i + 1) % matches.length)
  }, [matches.length])

  const prev = useCallback(() => {
    if (matches.length === 0) return
    setActiveIndex((i) => (i - 1 + matches.length) % matches.length)
  }, [matches.length])

  const openSearch = useCallback(() => {
    setOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  return { query, setQuery, open, setOpen, openSearch, closeSearch, matches, activeIndex, activeMatch, next, prev }
}
