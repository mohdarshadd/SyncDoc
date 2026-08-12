const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'pre', 'code', 'ul', 'ol', 'li',
  'blockquote', 'img', 'hr', 'br', 'strong', 'em'
]
const ALLOWED_ATTR = ['src', 'alt', 'class', 'lang']

function sanitizeHtml(html, opts = {}) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ...opts })
}

function sanitizePlainText(text) {
  return DOMPurify.sanitize(String(text || ''), { ALLOWED_TAGS: [] }).trim()
}

function sanitizeBlocks(nodes) {
  return (nodes || []).map((n) => {
    const copy = { ...n, children: n.children ? sanitizeBlocks(n.children) : [] }
    if (copy.type === 'code') copy.text = String(copy.text || '')
    else copy.text = sanitizePlainText(copy.text)
    return copy
  })
}

module.exports = { sanitizeHtml, sanitizePlainText, sanitizeBlocks }
