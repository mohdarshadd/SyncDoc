export function buildBlockTree(blocks) {
  const byId = new Map(blocks.map((b) => [b.id, b]))
  const depthOf = new Map()
  const collapsedAncestors = new Map() // id -> count of collapsed ancestors
  const hasHiddenDescendants = new Set()

  for (const b of blocks) {
    let depth = 0
    let hiddenBy = 0
    let parent = b.parentId != null ? byId.get(b.parentId) : null
    const seen = new Set([b.id])
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id)
      depth += 1
      if (parent.collapsed) hiddenBy += 1
      parent = parent.parentId != null ? byId.get(parent.parentId) : null
    }
    depthOf.set(b.id, depth)
    collapsedAncestors.set(b.id, hiddenBy)
  }

  for (const b of blocks) {
    if (!b.collapsed) continue
    let parent = b.parentId != null ? byId.get(b.parentId) : null
    while (parent && parent.parentId != null && !hasHiddenDescendants.has(parent.id)) {
      hasHiddenDescendants.add(parent.id)
      parent = byId.get(parent.parentId)
    }
  }

  return blocks.map((b, i) => {
    const prev = i > 0 ? blocks[i - 1] : null
    const next = i < blocks.length - 1 ? blocks[i + 1] : null
    const hidden = (collapsedAncestors.get(b.id) || 0) > 0
    let firstChildOfParent = false
    if (b.parentId != null && prev) {
      const prevDepth = depthOf.get(prev.id) || 0
      const curDepth = depthOf.get(b.id) || 0
      firstChildOfParent = curDepth > prevDepth
    }
    let lastOfSubtree = false
    if (b.parentId != null && next) {
      const nextDepth = depthOf.get(next.id) || 0
      const curDepth = depthOf.get(b.id) || 0
      lastOfSubtree = nextDepth <= curDepth
    }
    return {
      ...b,
      depth: depthOf.get(b.id) || 0,
      hidden,
      hasHiddenDescendants: hasHiddenDescendants.has(b.id),
      firstChildOfParent,
      lastOfSubtree
    }
  })
}

export function depthOfBlock(blocks, id) {
  const tree = buildBlockTree(blocks)
  const found = tree.find((b) => b.id === id)
  return found ? found.depth : 0
}
