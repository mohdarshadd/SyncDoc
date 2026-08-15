import { useEffect, useState } from 'react'

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const onToast = (e) => {
      const item = e.detail
      setItems((prev) => [...prev.slice(-3), item])
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== item.id)), 2600)
    }
    window.addEventListener('syncdoc:toast', onToast)
    return () => window.removeEventListener('syncdoc:toast', onToast)
  }, [])

  return (
    <div className="toaster" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>
      ))}
    </div>
  )
}
