export function buildEditorNav({
  isOwner,
  mentionCount = 0,
  onHistory,
  onCompare,
  onCopyLink,
  onSearch,
  onMentions,
  onShare,
  onShortcuts,
  onExport,
}) {
  const items = []
  items.push({ key: 'history', label: 'History', onClick: onHistory })
  items.push({ key: 'compare', label: 'Compare versions', onClick: onCompare })
  items.push({ key: 'copy', label: 'Copy link', onClick: onCopyLink })
  items.push({ key: 'search', label: 'Search', onClick: onSearch })
  if (mentionCount > 0) {
    items.push({ key: 'mentions', label: `Mentions (${mentionCount})`, onClick: onMentions })
  }
  if (isOwner) {
    items.push({ key: 'share', label: 'Share', onClick: onShare })
  }
  if (onExport) {
    items.push({ key: 'html', label: 'Export HTML', onClick: () => onExport('html') })
    items.push({ key: 'markdown', label: 'Export Markdown', onClick: () => onExport('markdown') })
    items.push({ key: 'pdf', label: 'Export PDF', onClick: () => onExport('pdf') })
  }
  items.push({ key: 'shortcuts', label: 'Keyboard shortcuts', onClick: onShortcuts })
  return items
}