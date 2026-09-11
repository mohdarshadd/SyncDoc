import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { getDocument, getAccessToken, WS_URL, renameDocument } from '../api'
import { buildYdoc } from '../lib/ydoc'
import { diffBlocks, mergeDelta, snapshotFromYArray, commentsFromYArray } from '../store/blockStore'
import { uid } from '../lib/uid'
import { toggleMark, clearMarks as emptyMarks } from '../lib/richText'
import { buildComment } from '../lib/comments'

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777']

function cloneMap(m) {
  const c = new Y.Map()
  m.forEach((value, key) => c.set(key, value))
  return c
}

export function useDocumentSync(docId, user) {
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const renameTimerRef = useRef(null)
  const typingTimerRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState([])
  const [comments, setComments] = useState([])
  const [users, setUsers] = useState([])
  const [myClientId, setMyClientId] = useState(null)
  const [docRole, setDocRole] = useState(null)

  useEffect(() => {
    let cancelled = false
    let provider = null
    let ydoc = null

    async function init() {
      try {
        const doc = await getDocument(docId)
        if (cancelled) return

        setDocRole(doc.role || 'owner')
        ydoc = buildYdoc(doc)
        provider = new WebsocketProvider(WS_URL, docId, ydoc, {
          connect: true,
          params: { token: getAccessToken() || '' }
        })
        provider.on('status', ({ status: s }) => {
          if (!cancelled) setStatus(s)
        })

        const color = user?.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        provider.awareness.setLocalState({ user: { name: user?.name || 'Anonymous', color }, cursor: null })

        const blocksArr = ydoc.getArray('blocks')
        const commentsArr = ydoc.getArray('comments')
        const applyBlocks = () => {
          const full = snapshotFromYArray(blocksArr)
          setBlocks((prev) => {
            const delta = diffBlocks(prev, full)
            return delta.length ? mergeDelta(prev, delta) : prev
          })
        }
        const applyComments = () => setComments(commentsFromYArray(commentsArr))
        const applyTitle = () => {
          const metaTitle = ydoc.getMap('meta').get('title')
          setTitle(metaTitle == null ? 'Untitled' : String(metaTitle))
        }
        const applyUsers = () => {
          setMyClientId(provider.awareness.clientID)
          const states = []
          provider.awareness.getStates().forEach((state, clientId) => {
            if (state?.user) states.push({ clientId, ...state.user, cursor: state.cursor || null })
          })
          setUsers(states)
        }

        blocksArr.observeDeep(applyBlocks)
        commentsArr.observeDeep(applyComments)
        ydoc.getMap('meta').observe(applyTitle)
        provider.awareness.on('change', applyUsers)

        ydocRef.current = ydoc
        providerRef.current = provider

        applyBlocks()
        applyComments()
        applyTitle()
        applyUsers()
        if (!cancelled) setStatus('connected')
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          console.error(e)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      clearTimeout(renameTimerRef.current)
      clearTimeout(typingTimerRef.current)
      try {
        provider?.awareness.setLocalState(null)
      } catch (e) { /* noop */ }
      provider?.destroy()
      ydocRef.current = null
      providerRef.current = null
      if (ydoc) ydoc.destroy()
    }
  }, [docId, user?.name, user?.color])

  function updateBlockText(id, text) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('blocks').forEach((m) => {
        if (m.get('id') === id) m.set('text', text)
      })
    })
  }

  function addBlock(type = 'paragraph', afterId = null) {
    const ydoc = ydocRef.current
    if (!ydoc) return null
    let newId = null
    ydoc.transact(() => {
      const arr = ydoc.getArray('blocks')
      const existing = arr.toArray()
      let idx = existing.length
      if (afterId) {
        const found = existing.findIndex((b) => b.get('id') === afterId)
        if (found >= 0) idx = found + 1
      }
      const insertIndex = Math.min(idx, arr.length)
      const id = uid()
      const block = new Y.Map()
      block.set('id', id)
      block.set('type', type)
      block.set('text', '')
      block.set('lang', type === 'code' ? 'text' : null)
      block.set('checked', false)
      block.set('open', true)
      block.set('parentId', null)
      block.set('order', insertIndex)
      existing.forEach((m) => {
        if (m.get('order') >= insertIndex) m.set('order', m.get('order') + 1)
      })
      arr.insert(insertIndex, [block])
      newId = id
    })
    return newId
  }

  function changeBlockType(id, newType) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('blocks').forEach((m) => {
        if (m.get('id') === id) {
          m.set('type', newType)
          if (newType === 'code') m.set('lang', 'text')
          else m.set('lang', null)
        }
      })
    })
  }

  function toggleBlockChecked(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('blocks').forEach((m) => {
        if (m.get('id') === id) m.set('checked', !m.get('checked'))
      })
    })
  }

  function toggleBlockOpen(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('blocks').forEach((m) => {
        if (m.get('id') === id) m.set('open', !m.get('open'))
      })
    })
  }

  function toggleBlockCollapsed(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('blocks').forEach((m) => {
        if (m.get('id') === id) m.set('collapsed', !m.get('collapsed'))
      })
    })
  }

  function commentToYMap(c) {
    const m = new Y.Map()
    m.set('id', c.id)
    m.set('blockId', c.blockId)
    m.set('from', c.from)
    m.set('to', c.to)
    m.set('authorId', c.authorId)
    m.set('authorName', c.authorName)
    m.set('text', c.text)
    m.set('created', c.created)
    m.set('resolved', !!c.resolved)
    return m
  }

  function addComment(blockId, from, to, text) {
    const ydoc = ydocRef.current
    if (!ydoc || !text.trim()) return null
    const block = ydoc.getArray('blocks').toArray().find((m) => m.get('id') === blockId)
    const maxLen = (block?.get('text') || '').length
    const comment = buildComment({
      blockId,
      from: Math.min(from, maxLen),
      to: Math.min(to, maxLen),
      text,
      authorId: user?._id || 'anonymous',
      authorName: user?.name || 'Anonymous',
      now: Date.now()
    })
    ydoc.transact(() => {
      ydoc.getArray('comments').push([commentToYMap(comment)])
    })
    return comment.id
  }

  function resolveComment(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      ydoc.getArray('comments').forEach((m) => {
        if (m.get('id') === id) m.set('resolved', !m.get('resolved'))
      })
    })
  }

  function deleteComment(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const arr = ydoc.getArray('comments')
      const idx = arr.toArray().findIndex((m) => m.get('id') === id)
      if (idx !== -1) arr.delete(idx, 1)
    })
  }

  function toggleBlockMark(id, from, to, type, href) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const found = ydoc.getArray('blocks').toArray().find((m) => m.get('id') === id)
      if (!found) return
      const textLen = (found.get('text') || '').length
      const current = Array.isArray(found.get('attrs')?.get?.('marks')) ? found.get('attrs').get('marks') : []
      const next = toggleMark(textLen, current, from, to, type, href)
      let attrs = found.get('attrs')
      if (!(attrs instanceof Y.Map)) {
        attrs = new Y.Map()
        found.set('attrs', attrs)
      }
      attrs.set('marks', next)
    })
  }

  function clearBlockMarks(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const found = ydoc.getArray('blocks').toArray().find((m) => m.get('id') === id)
      if (!found) return
      const attrs = found.get('attrs')
      if (attrs instanceof Y.Map) attrs.set('marks', emptyMarks())
    })
  }

  function setCursor(cursor) {
    if (providerRef.current) providerRef.current.awareness.setLocalStateField('cursor', cursor)
  }

  function setTyping(typing) {
    if (providerRef.current) providerRef.current.awareness.setLocalStateField('typing', !!typing)
  }

  function notifyTyping() {
    clearTimeout(typingTimerRef.current)
    if (providerRef.current) providerRef.current.awareness.setLocalStateField('typing', true)
    typingTimerRef.current = setTimeout(() => {
      if (providerRef.current) providerRef.current.awareness.setLocalStateField('typing', false)
    }, 1500)
  }

  function deleteBlock(id) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const arr = ydoc.getArray('blocks')
      const idx = arr.toArray().findIndex((b) => b.get('id') === id)
      if (idx !== -1) arr.delete(idx, 1)
    })
  }

  function moveBlock(id, dir) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const arr = ydoc.getArray('blocks')
      const list = arr.toArray()
      const idx = list.findIndex((b) => b.get('id') === id)
      const target = idx + dir
      if (idx === -1 || target < 0 || target >= list.length) return
      const reordered = [...list]
      const [block] = reordered.splice(idx, 1)
      reordered.splice(target, 0, block)
      const fresh = reordered.map((m) => cloneMap(m))
      arr.delete(0, arr.length)
      arr.insert(0, fresh)
      refreshOrder(arr)
    })
  }

  function reorderBlock(fromId, toIndex) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    ydoc.transact(() => {
      const arr = ydoc.getArray('blocks')
      const list = arr.toArray()
      const fromIdx = list.findIndex((b) => b.get('id') === fromId)
      if (fromIdx === -1 || fromIdx === toIndex) return
      const reordered = [...list]
      const [block] = reordered.splice(fromIdx, 1)
      const adjustedIndex = fromIdx < toIndex ? toIndex - 1 : toIndex
      reordered.splice(adjustedIndex, 0, block)
      const fresh = reordered.map((m) => cloneMap(m))
      arr.delete(0, arr.length)
      arr.insert(0, fresh)
      refreshOrder(arr)
    })
  }

  function updateTitle(value) {
    const ydoc = ydocRef.current
    if (!ydoc) return
    const next = String(value ?? '')
    ydoc.getMap('meta').set('title', next)
    clearTimeout(renameTimerRef.current)
    renameTimerRef.current = setTimeout(() => {
      renameDocument(docId, next).catch(() => { /* rely on Yjs sync persist */ })
    }, 400)
  }

  function refreshOrder(arr) {
    arr.toArray().forEach((m, i) => m.set('order', i))
  }

  return { status, title, blocks, comments, users, myClientId, docRole, updateBlockText, addBlock, changeBlockType, toggleBlockChecked, toggleBlockOpen, toggleBlockCollapsed, toggleBlockMark, clearBlockMarks, setCursor, setTyping, notifyTyping, updateTitle, deleteBlock, moveBlock, reorderBlock, addComment, resolveComment, deleteComment }
}
