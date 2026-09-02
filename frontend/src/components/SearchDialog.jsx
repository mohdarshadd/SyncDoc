import { useEffect, useRef } from 'react'

export default function SearchDialog({ query, setQuery, matches, activeIndex, onNext, onPrev, onClose }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) onPrev()
        else onNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onClose])

  return (
    <div className="search-dialog">
      <div className="search-input-wrap">
        <span className="search-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <input
          ref={inputRef}
          className="search-input-field"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in document..."
          spellCheck={false}
        />
        <span className="search-count">
          {matches.length === 0 ? 'No results' : `${activeIndex + 1} / ${matches.length}`}
        </span>
        <button className="search-arrow" onClick={onPrev} aria-label="Previous match" title="Previous match (Shift+Enter)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="search-arrow" onClick={onNext} aria-label="Next match" title="Next match (Enter)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="search-hints">
          <span className="search-hint"><kbd>Enter</kbd> next</span>
          <span className="search-hint"><kbd>Esc</kbd> close</span>
        </div>
        <button className="search-close" onClick={onClose} aria-label="Close search" title="Close (Esc)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
