import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="btn btn-ghost theme-toggle"
      onClick={toggle}
      aria-label={`Toggle ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <span className="theme-icon">{theme === 'dark' ? '\u2600' : '\u263E'}</span>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
