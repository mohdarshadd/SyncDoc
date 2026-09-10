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
  exportLinks = {},
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
  if (exportLinks.html) items.push({ key: 'html', label: 'Export HTML', href: exportLinks.html })
  if (exportLinks.markdown) items.push({ key: 'markdown', label: 'Export Markdown', href: exportLinks.markdown })
  if (exportLinks.pdf) items.push({ key: 'pdf', label: 'Export PDF', href: exportLinks.pdf })
  items.push({ key: 'shortcuts', label: 'Keyboard shortcuts', onClick: onShortcuts })
  return items
}