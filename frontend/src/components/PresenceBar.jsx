export default function PresenceBar({ users }) {
  return (
    <div className="presence">
      {users.map((u) => (
        <span key={u.clientId} className="avatar" title={u.name} style={{ background: u.color }}>
          {u.name[0]?.toUpperCase() || '?'}
        </span>
      ))}
    </div>
  )
}
