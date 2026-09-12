import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

;(function () {
  try {
    let t = localStorage.getItem('syncdoc-theme')
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.dataset.theme = t
  } catch (e) { /* ignore */ }
})()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
