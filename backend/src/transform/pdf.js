const PDFDocument = require('pdfkit')

function astToPdf(nodes) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks = []
  const done = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const render = (list) => {
    for (const node of list || []) {
      switch (node.type) {
        case 'heading': {
          const level = (node.attrs && node.attrs.level) || 1
          const size = Math.max(11, 26 - (level - 1) * 4)
          doc.font('Helvetica-Bold').fontSize(size).text(node.text || '', { underline: level === 1 })
          doc.font('Helvetica')
          break
        }
        case 'code':
          doc.font('Courier').fontSize(9).text(node.text || '', { lineGap: 2 })
          doc.font('Helvetica')
          break
        case 'quote':
          doc.font('Helvetica-Oblique').fontSize(11).text(node.text || '')
          doc.font('Helvetica')
          break
        case 'list':
          for (const child of node.children || []) doc.font('Helvetica').fontSize(11).text(`- ${child.text || ''}`)
          break
        case 'divider':
          doc.moveDown()
          doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke()
          doc.moveDown()
          break
        case 'paragraph':
        default:
          doc.font('Helvetica').fontSize(11).text(node.text || '', { lineGap: 4 })
          break
      }
      doc.moveDown()
    }
  }

  render(nodes)
  doc.end()
  return done
}

module.exports = { astToPdf }
