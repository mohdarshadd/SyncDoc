import { useState } from 'react'
import { useEffect, useRef } from 'react'

export const WALLPAPERS = [
  { id: 'wall-01', name: 'Aurora', src: '/wallpapers/wall-01.jpg' },
  { id: 'wall-02', name: 'Mountain', src: '/wallpapers/wall-02.jpg' },
  { id: 'wall-03', name: 'Ocean', src: '/wallpapers/wall-03.jpg' },
  { id: 'wall-04', name: 'Forest', src: '/wallpapers/wall-04.jpg' },
  { id: 'wall-05', name: 'Desert', src: '/wallpapers/wall-05.jpg' },
  { id: 'wall-06', name: 'Night', src: '/wallpapers/wall-06.jpg' }
]

export default function WallpaperPicker({ value = 'none', onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className="wallpaper-picker" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((v) => !v)}
        title="Document wallpaper"
        aria-label="Document wallpaper"
      >
        Wallpaper
      </button>
      {open && (
        <div className="wallpaper-menu" role="menu">
          <span className="wallpaper-title">Document background</span>
          <button
            type="button"
            className={`wallpaper-opt ${value === 'none' ? 'active' : ''}`}
            onClick={() => { onSelect('none'); setOpen(false) }}
          >
            <span className="wallpaper-swatch wallpaper-swatch-default">A</span>
            <span className="wallpaper-name">Default</span>
          </button>
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`wallpaper-opt ${value === w.id ? 'active' : ''}`}
              onClick={() => { onSelect(w.id); setOpen(false) }}
            >
              <span className="wallpaper-swatch" style={{ backgroundImage: `url(${w.src})` }} />
              <span className="wallpaper-name">{w.name}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  )
}

export function wallpaperById(id) {
  return WALLPAPERS.find((w) => w.id === id) || null
}