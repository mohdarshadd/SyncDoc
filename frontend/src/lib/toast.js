const EVENT = 'syncdoc:toast'

export function pushToast(message, kind = 'info') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, kind, id: crypto.randomUUID() } }))
}
