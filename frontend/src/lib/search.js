export function computeMatches(blocks, query) {
  if (!query || query.trim() === '') return []
  const term = query.trim().toLowerCase()
  const matches = []
  blocks.forEach((block) => {
    const text = block.text || ''
    const lower = text.toLowerCase()
    let fromIndex = 0
    let idx
    while ((idx = lower.indexOf(term, fromIndex)) !== -1) {
      matches.push({
        blockId: block.id,
        index: idx,
        length: term.length
      })
      fromIndex = idx + term.length
    }
  })
  return matches
}
