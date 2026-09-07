const MARKDOWN_OPEN = { bold: '**', italic: '*', underline: '__', strike: '~~' }
const MARKDOWN_CLOSE = { bold: '**', italic: '*', underline: '__', strike: '~~' }

function marksFor(node) {
  return (node.attrs && node.attrs.marks) || []
}

function applyMarksToMarkdown(text, marks) {
  if (!marks || !marks.length) return text
  const points = new Set([0, text.length])
  for (const m of marks) {
    if (m.from == null || m.to == null || m.from >= m.to) continue
    points.add(m.from)
    points.add(m.to)
  }
  const sorted = Array.from(points).sort((a, b) => a - b)
  const parts = []
  const covers = (m, from, to) => m.from <= from && m.to >= to
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]
    if (to > text.length) break
    const slice = text.slice(from, to)
    if (!slice) continue
    let wrap = slice
    for (const type of ['bold', 'italic', 'underline', 'strike']) {
      if (marks.some((m) => m.type === type && covers(m, from, to))) {
        wrap = `${MARKDOWN_OPEN[type]}${wrap}${MARKDOWN_CLOSE[type]}`
      }
    }
    const link = marks.find((m) => m.type === 'link' && covers(m, from, to))
    if (link) wrap = `[${wrap}](${link.href || ''})`
    parts.push(wrap)
  }
  return parts.join('')
}

function richText(text, node) {
  return applyMarksToMarkdown(text || '', marksFor(node))
}

function markdownToAst(md) {
  const lines = String(md || '').split(/\r?\n/)
  const nodes = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      nodes.push({ type: 'heading', text: heading[2], attrs: { level: heading[1].length } })
      i++
      continue
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i])
        i++
      }
      i++
      nodes.push({ type: 'code', text: buf.join('\n'), lang: lang || null })
      continue
    }

    if (/^>\s?/.test(line)) {
      nodes.push({ type: 'quote', text: line.replace(/^>\s?/, '') })
      i++
      continue
    }

    if (/^[-*+]\s+(.*)$/.test(line)) {
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^[-*+]\s+(.*)$/)
        if (!m) break
        items.push({ type: 'paragraph', text: m[1] })
        i++
      }
      nodes.push({ type: 'list', text: '', children: items })
      continue
    }

    const buf = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^(#{1,6})\s/) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('>') &&
      !lines[i].match(/^[-*+]\s/)
    ) {
      buf.push(lines[i])
      i++
    }
    nodes.push({ type: 'paragraph', text: buf.join('\n') })
  }

  return nodes
}

function astToMarkdown(nodes) {
  const lines = []
  const walk = (list) => {
    for (const node of list || []) {
      switch (node.type) {
        case 'heading': {
          const level = (node.attrs && node.attrs.level) || 1
          lines.push(`${'#'.repeat(level)} ${richText(node.text, node)}`)
          break
        }
        case 'code':
          lines.push(`\`\`\`${node.lang || ''}\n${node.text || ''}\n\`\`\``)
          break
        case 'quote':
          lines.push(`> ${richText(node.text, node)}`)
          break
        case 'list':
          for (const child of node.children || []) lines.push(`- ${richText(child.text, child)}`)
          break
        case 'checklist':
          lines.push(`- [${node.checked ? 'x' : ' '}] ${richText(node.text, node)}`)
          break
        case 'toggle':
          lines.push(`> ▸ ${richText(node.text, node)}`)
          break
        case 'image': {
          const src = (node.attrs && node.attrs.src) || ''
          const alt = (node.attrs && node.attrs.alt) || ''
          lines.push(`![${alt}](${src})`)
          break
        }
        case 'divider':
          lines.push('---')
          break
        case 'paragraph':
        default:
          lines.push(richText(node.text, node))
          break
      }
    }
  }
  walk(nodes)
  return lines.join('\n\n')
}

module.exports = { markdownToAst, astToMarkdown }
