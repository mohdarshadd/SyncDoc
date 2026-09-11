const MAX_AVATARS = 5

export default function PresenceBar({ users, myClientId }) {
  const shown = users.slice(0, MAX_AVATARS)
  const extra = users.length - shown.length
  const extraNames = extra > 0 ? users.slice(MAX_AVATARS).map((u) => u.name).join(', ') : ''

  return (
    <div className="presence" role="list">
      {users.length === 0 && (
        <span className="presence-empty" title="Only you are viewing">
          <span className="presence-dot" />
          Private
        </span>
      )}
      {users.length > 0 && (
        <span className="presence-count" title={`${users.map((u) => u.name).join(', ')}`} role="listitem">
          <i className="presence-count-dot" />
          {users.length} online
        </span>
      )}
      {shown.map((u) => (
        <span
          key={u.clientId}
          role="listitem"
          className={`avatar ${u.clientId === myClientId ? 'avatar-self' : ''}`}
          title={u.clientId === myClientId ? `${u.name} (you)` : u.name}
          style={{ background: u.color }}
        >
          {u.name[0]?.toUpperCase() || '?'}
        </span>
      ))}
      {extra > 0 && (
        <span className="avatar avatar-more" title={`${extra} more: ${extraNames}`}>
          +{extra}
        </span>
      )}
    </div>
  )
}
