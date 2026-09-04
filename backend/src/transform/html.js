const escapeHtml = require('escape-html')
const { sanitizeHtml } = require('../security/sanitize')

function nodeToHtml(node) {
  const text = escapeHtml(node.text || '')
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
