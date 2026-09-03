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
          lines.push(`${'#'.repeat(level)} ${node.text || ''}`)
          break
        }
        case 'code':
          lines.push(`\`\`\`${node.lang || ''}\n${node.text || ''}\n\`\`\``)
          break
        case 'quote':
          lines.push(`> ${node.text || ''}`)
          break
        case 'list':
          for (const child of node.children || []) lines.push(`- ${child.text || ''}`)
          break
        case 'checklist':
          lines.push(`- [${node.checked ? 'x' : ' '}] ${node.text || ''}`)
          break
        case 'toggle':
          lines.push(`> ▸ ${node.text || ''}`)
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
          lines.push(node.text || '')
          break
      }
    }
  }
  walk(nodes)
  return lines.join('\n\n')
}

module.exports = { markdownToAst, astToMarkdown }
