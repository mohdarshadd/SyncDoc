import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, changePassword } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../lib/toast'

const COLORS = ['#2997ff', '#bf5af2', '#30d158', '#ff9f0a', '#ff453a', '#64d2ff', '#ffd60a', '#ff375f', '#ac8e68', '#8e8e93']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setColor(user.color || COLORS[0])
    }
  }, [user])

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { user: updated } = await updateProfile({ name, color })
      updateUser(updated)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword })
      showToast('Password changed', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="profile-back" onClick={() => navigate('/documents')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Documents
          </button>
          <h1 className="profile-title">Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar" style={{ background: color }}>
            <span>{name.charAt(0).toUpperCase()}</span>
          </div>
          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Color</label>
              <div className="profile-swatches">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`profile-swatch ${c === color ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            <button className="profile-btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h2 className="profile-section-title">Change password</h2>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="profile-field">
              <label className="profile-label" htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                className="profile-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className="profile-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <span className="profile-hint">Minimum 8 characters</span>
            </div>
            <div className="profile-field">
              <label className="profile-label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                className="profile-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button className="profile-btn" type="submit" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>

        <div className="profile-card profile-danger">
          <h2 className="profile-section-title">Account</h2>
          <p className="profile-info">Signed in as {user?.email}</p>
        </div>
      </div>
    </div>
  )
}
