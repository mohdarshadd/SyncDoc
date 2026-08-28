const EVENT = 'syncdoc:toast'
import { uid } from './uid'

export function pushToast(message, kind = 'info') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, kind, id: uid() } }))
}
