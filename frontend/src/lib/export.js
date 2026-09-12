import { exportDocument } from '../api'
import { pushToast } from './toast'

export async function openExport(docId, format, fallbackName = 'document') {
  try {
    const blob = await exportDocument(docId, format)
    const ext = format === 'markdown' ? 'md' : format
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fallbackName}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    pushToast(e.message || 'Export failed', 'error')
  }
}