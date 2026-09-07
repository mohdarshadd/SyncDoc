const escapeHtml = require('escape-html')
const { sanitizeHtml } = require('../security/sanitize')

function applyMarksToText(text, marks) {
  if (!marks || !marks.length) return escapeHtml(text)
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
    const slice = escapeHtml(text.slice(from, to))
    if (!slice) continue
    let wrap = slice
    if (marks.some((m) => m.type === 'bold' && covers(m, from, to))) wrap = `<strong>${wrap}</strong>`
    if (marks.some((m) => m.type === 'italic' && covers(m, from, to))) wrap = `<em>${wrap}</em>`
    if (marks.some((m) => m.type === 'underline' && covers(m, from, to))) wrap = `<u>${wrap}</u>`
    if (marks.some((m) => m.type === 'strike' && covers(m, from, to))) wrap = `<s>${wrap}</s>`
    const link = marks.find((m) => m.type === 'link' && covers(m, from, to))
    if (link) wrap = `<a href="${escapeHtml(link.href || '#')}">${wrap}</a>`
    parts.push(wrap)
  }
  return parts.join('')
}

function marksFor(node) {
  return (node.attrs && node.attrs.marks) || []
}

function nodeToHtml(node) {
  const text = applyMarksToText(node.text || '', marksFor(node))
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs && node.attrs.level) || 1
      return `<h${level}>${text}</h${level}>`
    }
    case 'code':
      return `<pre><code${node.lang ? ` class="language-${escapeHtml(node.lang)}"` : ''}>${text}</code></pre>`
    case 'quote':
      return `<blockquote>${text}</blockquote>`
    case 'list': {
      const items = (node.children || []).map((c) => `<li>${escapeHtml(c.text || '')}</li>`).join('')
      return `<ul>${items}</ul>`
    }
    case 'checklist':
      return `<p><input type="checkbox"${node.checked ? ' checked' : ''} disabled> <span${node.checked ? ' style="text-decoration:line-through"' : ''}>${text}</span></p>`
    case 'toggle':
      return `<details${node.open === false ? '' : ' open'}><summary>${text}</summary></details>`
    case 'image': {
      const src = escapeHtml((node.attrs && node.attrs.src) || '')
      const alt = escapeHtml((node.attrs && node.attrs.alt) || '')
      return `<img src="${src}" alt="${alt}">`
    }
    case 'divider':
      return '<hr>'
    case 'paragraph':
    default:
      return `<p>${text}</p>`
  }
}

function astToHtml(nodes) {
  const html = (nodes || []).map(nodeToHtml).join('\n')
  return sanitizeHtml(html)
}

module.exports = { astToHtml, nodeToHtml }
