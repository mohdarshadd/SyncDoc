import { useEffect, useState } from 'react'
import { listVersions, compareVersions } from '../api'
import { revisionLabel, statsSummary } from '../lib/versionCompare'
import { pushToast } from '../lib/toast'

export default function VersionCompare({ docId, isOwner, initialFrom, initialTo, onClose, onRestored }) {
  const [versions, setVersions] = useState([])
  const [fromRev, setFromRev] = useState(null)
  const [toRev, setToRev] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    listVersions(docId)
      .then((list) => {
        setVersions(list)
        if (list.length >= 2) {
          setFromRev(initialFrom ?? list[1].revision)
          setToRev(initialTo ?? list[0].revision)
        } else if (list.length === 1) {
          setFromRev(initialFrom ?? list[0].revision)
          setToRev(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [docId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fromRev == null || toRev == null) return
    let cancelled = false
    setLoading(true)
    compareVersions(docId, fromRev, toRev)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) pushToast('Could not compare revisions', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [docId, fromRev, toRev])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSwap() {
    setFromRev(toRev)
    setToRev(fromRev)
  }

  async function handleRestore() {
    if (fromRev == null) return
    const { restoreVersion } = await import('../api')
    if (!window.confirm(`Restore the document to revision ${fromRev}? A new version will be created.`)) return
    setRestoring(true)
    try {
      await restoreVersion(docId, fromRev)
      pushToast(`Restored to revision ${fromRev}`, 'ok')
      if (onRestored) onRestored(fromRev)
    } catch (err) {
      pushToast(err.message, 'error')
    } finally {
      setRestoring(false)
    }
  }

  const fromVersion = versions.find((v) => v.revision === fromRev)
  const toVersion = versions.find((v) => v.revision === toRev)

  return (
    <div className="version-overlay" onClick={onClose}>
      <div className="version-compare" onClick={(e) => e.stopPropagation()}>
        <div className="version-compare-header">
          <div className="version-compare-title-wrap">
            <h2 className="version-title">Compare Versions</h2>
            <div className="version-compare-revs">
              <select
                className="version-compare-select"
                value={fromRev ?? ''}
                onChange={(e) => setFromRev(Number(e.target.value))}
                aria-label="From revision"
              >
                {versions.map((v) => (
                  <option key={v._id} value={v.revision}>{revisionLabel(v)}</option>
                ))}
              </select>
              <span className="version-compare-arrow">&rarr;</span>
              <select
                className="version-compare-select"
                value={toRev ?? ''}
                onChange={(e) => setToRev(Number(e.target.value))}
                aria-label="To revision"
              >
                {versions.map((v) => (
                  <option key={v._id} value={v.revision}>{revisionLabel(v)}</option>
                ))}
              </select>
              <button className="btn btn-ghost version-compare-swap" onClick={handleSwap} title="Swap revisions" aria-label="Swap revisions">
                Swap
              </button>
            </div>
            <div className="version-compare-stats">
              {loading ? 'Comparing...' : data ? statsSummary(data.stats) : 'No revisions to compare'}
            </div>
          </div>
          <button className="version-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="version-compare-body">
          {loading ? (
            <div className="version-empty">Comparing revisions...</div>
          ) : !data ? (
            <div className="version-empty">
              {versions.length < 2
                ? 'At least two saved versions are needed to compare.'
                : 'Select two revisions to compare.'}
            </div>
          ) : (
            <div className="version-compare-list">
              {data.rows.length === 0 ? (
                <div className="version-empty">No differences between these revisions.</div>
              ) : (
                data.rows.map((row) => (
                  <div key={`${row.kind}-${row.id}`} className={`version-compare-row version-compare-${row.kind}`}>
                    <div className="version-compare-gutter">
                      {row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : row.kind === 'modified' ? '~' : ''}
                    </div>
                    <div className="version-compare-content">
                      {row.kind === 'modified' && row.typeFrom !== row.typeTo && (
                        <div className="version-compare-typechange">
                          {row.typeFrom} &rarr; {row.typeTo}
                        </div>
                      )}
                      {renderBlock(row)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isOwner && data && fromRev != null && (
          <div className="version-compare-footer">
            <button className="btn version-compare-restore" onClick={handleRestore} disabled={restoring}>
              {restoring ? 'Restoring...' : `Restore to revision ${fromRev}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function renderBlock(row) {
  const block = row.block || {}
  const type = block.type || 'paragraph'
  const text = block.text || ''
  if (type === 'heading') {
    const level = (block.attrs && block.attrs.level) || 2
    const Tag = level > 3 ? 'h3' : level === 1 ? 'h1' : 'h2'
    return <Tag className="version-compare-block version-compare-heading">{text || 'Untitled'}</Tag>
  }
  if (type === 'code') {
    return (
      <pre className="version-compare-block version-compare-code"><code>{text || ''}</code></pre>
    )
  }
  if (type === 'quote') {
    return <blockquote className="version-compare-block version-compare-quote">{text || '\u00A0'}</blockquote>
  }
  if (type === 'divider') {
    return <hr className="version-compare-block version-compare-divider" />
  }
  if (type === 'checklist' || type === 'toggle') {
    return (
      <div className="version-compare-block version-compare-check">
        <span className={`version-compare-checkbox ${block.checked ? 'checked' : ''}`} />
        <span className={block.checked ? 'version-compare-checked-text' : ''}>{text || '\u00A0'}</span>
      </div>
    )
  }
  return <div className="version-compare-block version-compare-paragraph">{text || '\u00A0'}</div>
}