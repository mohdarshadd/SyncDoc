const MAX_INLINE_CHARS = 2000
const MAX_MATRIX_CELLS = 6000000

function charDiff(a, b) {
  if (a === b) return [{ t: 'eq', s: a }]
  const as = a.length > MAX_INLINE_CHARS ? a.slice(0, MAX_INLINE_CHARS) : a
  const bs = b.length > MAX_INLINE_CHARS ? b.slice(0, MAX_INLINE_CHARS) : b
  const n = as.length
  const m = bs.length
  if (n * m > MAX_MATRIX_CELLS) {
    return [{ t: 'del', s: a }, { t: 'add', s: b }]
  }

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = as[i] === bs[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const segs = []
  const push = (t, ch) => {
    if (segs.length && segs[segs.length - 1].t === t) segs[segs.length - 1].s += ch
    else segs.push({ t, s: ch })
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (as[i] === bs[j]) {
      push('eq', as[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('del', as[i])
      i++
    } else {
      push('add', bs[j])
      j++
    }
  }
  while (i < n) {
    push('del', as[i])
    i++
  }
  while (j < m) {
    push('add', bs[j])
    j++
  }
  return segs
}

function sameContent(a, b) {
  return a.type === b.type && a.text === b.text && !!a.checked === !!b.checked
}

function cloneBlock(b) {
  if (!b) return null
  return { ...b, attrs: b.attrs && typeof b.attrs === 'object' ? { ...b.attrs } : {} }
}

function diffVersions(fromBlocks, toBlocks) {
  const fromList = Array.isArray(fromBlocks) ? fromBlocks : []
  const toList = Array.isArray(toBlocks) ? toBlocks : []
  const toById = new Map()
  const consumed = new Set()
  toList.forEach((b) => toById.set(b.id, b))

  const rows = []
  const pendingRemoved = []

  const flushRemoved = () => {
    while (pendingRemoved.length) {
      rows.push({ kind: 'removed', id: pendingRemoved[0].id, block: cloneBlock(pendingRemoved[0]) })
      pendingRemoved.shift()
    }
  }

  const emitAddedBefore = (toIndex) => {
    for (let k = 0; k < toIndex; k++) {
      const cand = toList[k]
      if (!consumed.has(cand.id)) {
        consumed.add(cand.id)
        rows.push({ kind: 'added', id: cand.id, block: cloneBlock(cand) })
      }
    }
  }

  for (const fromBlock of fromList) {
    const matched = toById.get(fromBlock.id)
    if (!matched) {
      pendingRemoved.push(fromBlock)
      continue
    }
    const toIndex = toList.findIndex((b) => b.id === fromBlock.id)
    flushRemoved()
    emitAddedBefore(toIndex)
    consumed.add(matched.id)
    if (sameContent(fromBlock, matched)) {
      rows.push({ kind: 'unchanged', id: matched.id, block: cloneBlock(matched) })
    } else {
      rows.push({
        kind: 'modified',
        id: matched.id,
        block: cloneBlock(matched),
        fromBlock: cloneBlock(fromBlock),
        inline: charDiff(fromBlock.text, matched.text),
        typeFrom: fromBlock.type,
        typeTo: matched.type,
      })
    }
  }
  flushRemoved()

  toList.forEach((b) => {
    if (!consumed.has(b.id)) rows.push({ kind: 'added', id: b.id, block: cloneBlock(b) })
  })

  const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 }
  rows.forEach((r) => {
    stats[r.kind] += 1
  })

  return { stats, rows }
}

module.exports = { diffVersions, charDiff }