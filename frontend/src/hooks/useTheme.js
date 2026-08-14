import { useEffect, useState } from 'react'

const STORAGE_KEY = 'syncdoc-theme'

function initialTheme() {
  let stored = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch (e) { /* ignore */ }
  if (stored === 'light' || stored === 'dark') return stored
  const light = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)').matches : false
  return light ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) { /* ignore */ }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
