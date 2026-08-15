export function documentLink(id) {
  return `${window.location.origin}${window.location.pathname}?doc=${id}`
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) { /* fall through to legacy copy */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch (e2) { /* noop */ }
  document.body.removeChild(ta)
  return ok
}
