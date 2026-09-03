const { test } = require('node:test')
const assert = require('node:assert/strict')

const { astToHtml, nodeToHtml } = require('../src/transform/html')
const { markdownToAst, astToMarkdown } = require('../src/transform/markdown')
const { astToPdf } = require('../src/transform/pdf')
const { sanitizeHtml, sanitizePlainText, sanitizeBlocks } = require('../src/security/sanitize')

test('astToHtml escapes script fragments inside text', () => {
  const html = astToHtml([{ type: 'paragraph', text: '<script>alert(1)</script>hello' }])
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('hello'))
})

test('astToHtml strips javascript: URIs from image sources', () => {
  const html = astToHtml([
    { type: 'image', attrs: { src: 'javascript:alert(1)', alt: 'x' } }
  ])
  assert.ok(!html.includes('javascript:'))
  assert.ok(!html.includes('src='))
})

test('astToHtml keeps safe image sources', () => {
  const html = astToHtml([
    { type: 'image', attrs: { src: 'https://cdn.example.com/a.png', alt: 'ok' } }
  ])
  assert.ok(html.includes('src="https://cdn.example.com/a.png"'))
})

test('astToHtml renders headings, code, quote, list', () => {
  const html = astToHtml([
    { type: 'heading', text: 'Title', attrs: { level: 1 } },
    { type: 'code', text: 'const x = 1', lang: 'js' },
    { type: 'quote', text: 'q' },
    { type: 'list', children: [{ type: 'paragraph', text: 'item' }] }
  ])
  assert.ok(html.includes('<h1>Title</h1>'))
  assert.ok(html.includes('<pre><code class="language-js">'))
  assert.ok(html.includes('<blockquote>q</blockquote>'))
  assert.ok(html.includes('<li>item</li>'))
})

test('sanitizePlainText removes tag-like fragments and dangerous content', () => {
  assert.equal(sanitizePlainText('<script>alert(1)</script>hi'), 'hi')
  assert.equal(sanitizePlainText('<b>bold</b> text'), 'bold text')
})

test('sanitizeBlocks strips dangerous fragments from saved blocks', () => {
  const safe = sanitizeBlocks([
    { type: 'paragraph', text: '<img src=x onerror=alert(1)>p' },
    { type: 'code', text: '<script>steal()</script>' }
  ])
  assert.ok(!safe[0].text.includes('<img'))
  assert.equal(safe[0].text, 'p')
  assert.equal(safe[1].text, '<script>steal()</script>')
})

test('sanitizeHtml allows safe structural tags only', () => {
  const out = sanitizeHtml('<script>x</script><h2 onclick="y()">Safe</h2>')
  assert.ok(!out.includes('<script'))
  assert.ok(!out.includes('onclick'))
  assert.ok(out.includes('<h2>Safe</h2>'))
})

test('markdownToAst maps headings, code, quote, list, paragraph', () => {
  const ast = markdownToAst(`# Title

Intro paragraph.

\`\`\`js
const a = 1
\`\`\`

> quote

- one
- two`)
  const byType = Object.fromEntries(ast.map((n) => [n.type, n]))
  assert.equal(byType.heading.text, 'Title')
  assert.deepEqual(byType.heading.attrs, { level: 1 })
  assert.equal(byType.paragraph.text, 'Intro paragraph.')
  assert.equal(byType.code.text, 'const a = 1')
  assert.equal(byType.code.lang, 'js')
  assert.equal(byType.quote.text, 'quote')
  assert.equal(byType.list.children.length, 2)
})

test('astToMarkdown renders back cleanly', () => {
  const ast = [
    { type: 'heading', text: 'Hi', attrs: { level: 2 } },
    { type: 'paragraph', text: 'Body' },
    { type: 'code', text: 'x', lang: 'js' }
  ]
  const md = astToMarkdown(ast)
  assert.ok(md.includes('## Hi'))
  assert.ok(md.includes('Body'))
  assert.ok(md.includes('```js\nx\n```'))
})

test('astToPdf produces a PDF buffer', async () => {
  const buffer = await astToPdf([{ type: 'heading', text: 'Report', attrs: { level: 1 } }])
  assert.ok(Buffer.isBuffer(buffer))
  assert.ok(buffer.length > 0)
  assert.equal(buffer.subarray(0, 5).toString(), '%PDF-')
})

test('nodeToHtml escapes raw script in code block', () => {
  const html = nodeToHtml({ type: 'code', text: '<script>alert(1)</script>' })
  assert.ok(!html.includes('<script>'))
})

test('astToHtml renders checklist and toggle blocks', () => {
  const html = astToHtml([
    { type: 'checklist', text: 'task', checked: true },
    { type: 'toggle', text: 'More', open: true }
  ])
  assert.ok(html.includes('type="checkbox"'))
  assert.ok(html.includes('checked=""'))
  assert.ok(html.includes('checkbox"'))
  assert.ok(html.includes('<summary>More</summary>'))
  assert.ok(html.includes('open'))
})

test('astToMarkdown renders checklist and toggle', () => {
  const md = astToMarkdown([
    { type: 'checklist', text: 'done', checked: true },
    { type: 'checklist', text: 'todo', checked: false },
    { type: 'toggle', text: 'Fold', open: false }
  ])
  assert.ok(md.includes('- [x] done'))
  assert.ok(md.includes('- [ ] todo'))
  assert.ok(md.includes('▸ Fold'))
})
