export function friendlyStatus(status) {
  switch (status) {
    case 'connected':
      return 'All changes saved'
    case 'connecting':
      return 'Connecting…'
    case 'disconnected':
      return 'Reconnecting…'
    case 'error':
      return 'Connection error'
    default:
      return status || 'Connecting…'
  }
}

export function typers(users, myClientId) {
  return users
    .filter((u) => u.typing && u.clientId !== myClientId)
    .map((u) => u.name)
    .filter(Boolean)
}

export function typingSummary(names) {
  if (names.length === 0) return ''
  if (names.length === 1) return `${names[0]} is typing…`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
  return `${names[0]}, ${names[1]}, and ${names.length - 2} more are typing…`
}

export function viewerCountLabel(count) {
  if (count <= 0) return ''
  return count === 1 ? '1 viewing' : `${count} viewing`
}

export function formatSavedAt(savedAt, now) {
  if (savedAt == null) return ''
  const delta = Math.max(0, Math.round((now - savedAt) / 1000))
  if (delta < 5) return 'Saved just now'
  if (delta < 60) return `Saved ${delta}s ago`
  const minutes = Math.round(delta / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  return 'Saved a while ago'
}