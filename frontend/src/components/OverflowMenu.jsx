import { useEffect, useRef, useState } from 'react'

export default function OverflowMenu({ items, ariaLabel = 'More actions', align = 'right' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <div className="overflow-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost overflow-menu-trigger"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="13" cy="8" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className={`overflow-menu-panel ${align === 'left' ? 'left' : 'right'}`} role="menu">
          {items.map((item) => (
            <div key={item.key}>
              {item.href ? (
                <a
                  className="overflow-menu-item"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  className="overflow-menu-item"
                  onClick={() => {
                    setOpen(false)
                    if (item.onClick) item.onClick()
                  }}
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}