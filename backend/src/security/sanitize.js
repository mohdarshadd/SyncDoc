const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'pre', 'code', 'ul', 'ol', 'li',
  'blockquote', 'img', 'hr', 'br', 'strong', 'em', 'u', 's', 'a',
  'details', 'summary', 'input'
]
const ALLOWED_ATTR = ['src', 'alt', 'class', 'lang', 'type', 'checked', 'disabled', 'open', 'href', 'target', 'rel']

function sanitizeHtml(html, opts = {}) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ...opts })
}

function sanitizePlainText(text) {
  return DOMPurify.sanitize(String(text || ''), { ALLOWED_TAGS: [] }).trim()
}

function sanitizeHref(href) {
  const value = String(href || '').trim()
  if (/^[a-z][a-z0-9+.-]*\:/i.test(value) && !/^(https?|mailto)\:/i.test(value)) return ''
  return value
}

function sanitizeMarks(marks) {
  return (marks || [])
    .filter((m) => m && Number.isFinite(m.from) && Number.isFinite(m.to) && m.from < m.to && typeof m.type === 'string')
    .map((m) => (m.type === 'link' ? { ...m, href: sanitizeHref(m.href) } : { ...m }))
}

function sanitizeBlocks(nodes) {
  return (nodes || []).map((n) => {
    const copy = { ...n, children: n.children ? sanitizeBlocks(n.children) : [] }
    if (copy.type === 'code') copy.text = String(copy.text || '')
    else copy.text = sanitizePlainText(copy.text)
    if (copy.attrs && Array.isArray(copy.attrs.marks)) {
      copy.attrs = { ...copy.attrs, marks: sanitizeMarks(copy.attrs.marks) }
    }
    return copy
  })
}

module.exports = { sanitizeHtml, sanitizePlainText, sanitizeBlocks, sanitizeHref }
