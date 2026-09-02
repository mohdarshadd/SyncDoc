import { useEffect, useState } from 'react'

const KIND_ICON = {
  ok: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warn: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l6.5 12H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const onToast = (e) => {
      const item = e.detail
      setItems((prev) => [...prev.slice(-3), { ...item, exiting: false }])
      setTimeout(() => {
        setItems((prev) => prev.map((t) => t.id === item.id ? { ...t, exiting: true } : t))
        setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== item.id)), 200)
      }, 2400)
    }
    window.addEventListener('syncdoc:toast', onToast)
    return () => window.removeEventListener('syncdoc:toast', onToast)
  }, [])

  function dismiss(id) {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="toaster" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.kind} ${t.exiting ? 'toast-exit' : ''}`}
          onClick={() => dismiss(t.id)}
          role="alert"
        >
          {KIND_ICON[t.kind] && <span className="toast-icon">{KIND_ICON[t.kind]}</span>}
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
