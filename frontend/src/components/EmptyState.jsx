export default function EmptyState({ icon = 'doc', title, hint, action }) {
  return (
    <div className="empty-state">
      <div className={`empty-art empty-${icon}`} aria-hidden="true" />
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
