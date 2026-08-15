import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { getDocument, WS_URL } from '../api'
import { buildYdoc } from '../lib/ydoc'
import { diffBlocks, mergeDelta, snapshotFromYArray } from '../store/blockStore'

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#65a30d', '#db2777']

export function useDocumentSync(docId, user) {
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState([])
  const [users, setUsers] = useState([])
  const [myClientId, setMyClientId] = useState(null)

  useEffect(() => {
    let cancelled = false
    let provider = null
    let ydoc = null

    async function init() {
      try {
        const doc = await getDocument(docId)
        if (cancelled) return

        ydoc = buildYdoc(doc)
        provider = new WebsocketProvider(WS_URL, docId, ydoc, { connect: true })
        provider.on('status', ({ status: s }) => {
          if (!cancelled) setStatus(s)
        })

        const color = user?.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        provider.awareness.setLocalState({ user: { name: user?.name || 'Anonymous', color }, cursor: null })

        const blocksArr = ydoc.getArray('blocks')
        const applyBlocks = () => {
          const full = snapshotFromYArray(blocksArr)
          setBlocks((prev) => {
            const delta = diffBlocks(prev, full)
            return delta.length ? mergeDelta(prev, delta) : prev
          })
        }
        const applyTitle = () => setTitle(ydoc.getMap('meta').get('title') || 'Untitled')
        const applyUsers = () => {
          setMyClientId(provider.awareness.clientID)
          const states = []
          provider.awareness.getStates().forEach((state, clientId) => {
            if (state?.user) states.push({ clientId, ...state.user, cursor: state.cursor || null })
          })
          setUsers(states)
        }

        blocksArr.observeDeep(applyBlocks)
        ydoc.getMap('meta').observe(applyTitle)
        provider.awareness.on('change', applyUsers)

        ydocRef.current = ydoc
        providerRef.current = provider

        applyBlocks()
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
    if (!ydoc) return
    ydoc.transact(() => {
      const arr = ydoc.getArray('blocks')
      const existing = arr.toArray()
      const idx = afterId ? existing.findIndex((b) => b.get('id') === afterId) + 1 : existing.length
      const id = crypto.randomUUID()
      const block = new Y.Map({
        id,
        type,
        text: '',
        lang: type === 'code' ? 'text' : null,
        parentId: null,
        order: existing.length
      })
      arr.insert(Math.min(idx, arr.length), [block])
    })
  }

  function setCursor(cursor) {
    if (providerRef.current) providerRef.current.awareness.setLocalStateField('cursor', cursor)
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
      arr.delete(idx, 1)
      arr.insert(target, [list[idx]])
    })
  }

  function updateTitle(value) {
    const ydoc = ydocRef.current
    if (ydoc) ydoc.getMap('meta').set('title', value)
  }

  return { status, title, blocks, users, myClientId, updateBlockText, addBlock, setCursor, updateTitle, deleteBlock, moveBlock }
}
