import { useState, useRef, useEffect } from 'react'
import { api, type ProfileData } from '../api/api'
import { addLog } from '../utils/syslog'

interface Props {
  username: string
  location: string | null
  onClose: () => void
  onLogout?: () => void
}

const STORAGE_KEY = 'leviosai_profile'

const DEFAULT_PROFILE: ProfileData = {
  name:     '',
  birthday: '',
  email:    '',
  github:   '',
  role:     '',
  photo:    null,
}

function loadLocalProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProfileData
  } catch { /* ignore */ }
  return DEFAULT_PROFILE
}

function saveLocalProfile(data: ProfileData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function ProfileModal({ username, location, onClose, onLogout }: Props) {
  const [profile, setProfile] = useState<ProfileData>(loadLocalProfile)
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState<ProfileData>(profile)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load profile from API on mount
  useEffect(() => {
    if (!username) { setLoading(false); return }
    api.getProfile(username)
      .then(data => {
        const merged: ProfileData = {
          name:     data.name || profile.name,
          birthday: data.birthday || profile.birthday,
          email:    data.email || profile.email,
          github:   data.github || profile.github,
          role:     data.role || profile.role,
          photo:    data.photo ?? profile.photo,
        }
        setProfile(merged)
        setDraft(merged)
        saveLocalProfile(merged)
      })
      .catch(() => { /* use localStorage fallback */ })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const base64 = ev.target?.result as string
      setDraft(prev => ({ ...prev, photo: base64 }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSave() {
    setSaving(true)
    const updated = { ...draft }

    // Save to localStorage immediately
    saveLocalProfile(updated)
    setProfile(updated)

    // Save to API
    try {
      await api.updateProfile(username, updated)
      addLog('Profile saved to database', 'OK')
    } catch {
      addLog('Profile saved locally (server unreachable)', 'ERR')
    }

    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(profile)
    setEditing(false)
  }

  const displayData = editing ? draft : profile

  function formatBirthday(iso: string) {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${y} · ${m} · ${d}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !editing) onClose() }}
    >
      <div className="relative w-full max-w-sm mx-4 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">

        {/* Top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-mono text-accent/70 hover:text-accent transition-colors px-2.5 py-1 border border-accent/20 rounded-lg hover:border-accent/40"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="text-xs font-mono text-secondary hover:text-primary transition-colors px-2.5 py-1 border border-white/10 rounded-lg hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-mono text-background bg-primary hover:bg-primary/85 transition-colors px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          {!editing && (
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors text-base leading-none ml-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-7">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs font-mono text-secondary/50 animate-pulse">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div
                    onClick={() => editing && fileRef.current?.click()}
                    className={[
                      'w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden',
                      editing
                        ? 'border-accent/50 cursor-pointer hover:border-accent transition-colors'
                        : 'border-white/15',
                    ].join(' ')}
                  >
                    {displayData.photo ? (
                      <img src={displayData.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary text-2xl font-bold font-mono bg-white/10 w-full h-full flex items-center justify-center">
                        {(displayData.name || username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {editing && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <span className="text-white text-[10px] font-mono font-bold">EDIT</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="flex-1 min-w-0">
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={draft.name}
                        placeholder="Name"
                        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        className="w-full bg-background/60 border border-white/10 text-primary rounded-lg px-3 py-1.5 text-base font-bold focus:outline-none focus:border-accent/50 transition-colors font-mono mb-1"
                      />
                      <input
                        type="text"
                        value={draft.role}
                        placeholder="Role"
                        onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}
                        className="w-full bg-background/60 border border-white/10 text-secondary rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-accent/50 transition-colors font-mono"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-primary font-bold text-lg leading-tight">{profile.name || username}</p>
                      <p className="text-secondary text-xs font-mono mt-0.5">{profile.role || 'No role set'}</p>
                    </>
                  )}
                  <p className="text-green-400 text-xs mt-1">● Active session</p>
                </div>
              </div>

              {editing && (
                <p className="text-[10px] text-secondary/40 font-mono text-center -mt-3 mb-4">
                  Click avatar to upload photo
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/6" />
                <span className="font-mono text-[9px] text-secondary/50 uppercase tracking-[0.22em]">Profile</span>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              {/* Info rows */}
              <div className="space-y-2.5">
                {/* Birthday */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl border border-white/5">
                  <span className="text-secondary/60 text-xs font-mono w-4 flex-shrink-0 text-center">◷</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider">Birthday</p>
                    {editing ? (
                      <input
                        type="date"
                        value={draft.birthday}
                        onChange={e => setDraft(d => ({ ...d, birthday: e.target.value }))}
                        className="w-full bg-transparent text-sm text-primary focus:outline-none font-mono mt-0.5"
                        style={{ colorScheme: 'dark' }}
                      />
                    ) : (
                      <p className="text-sm text-primary mt-0.5">{formatBirthday(profile.birthday)}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl border border-white/5">
                  <span className="text-secondary/60 text-xs font-mono w-4 flex-shrink-0 text-center">◉</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider">Email</p>
                    {editing ? (
                      <input
                        type="email"
                        value={draft.email}
                        placeholder="your@email.com"
                        onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                        className="w-full bg-transparent text-sm text-primary focus:outline-none font-mono mt-0.5"
                      />
                    ) : (
                      <p className="text-sm text-primary mt-0.5 truncate">{profile.email || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl border border-white/5">
                  <span className="text-secondary/60 text-xs font-mono w-4 flex-shrink-0 text-center">◎</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider">Location</p>
                    <p className="text-sm text-primary mt-0.5 truncate">{location ?? 'Detecting...'}</p>
                  </div>
                </div>

                {/* GitHub */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl border border-white/5">
                  <span className="text-secondary/60 text-xs font-mono w-4 flex-shrink-0 text-center">⌥</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider">GitHub</p>
                    {editing ? (
                      <input
                        type="text"
                        value={draft.github}
                        placeholder="github.com/username"
                        onChange={e => setDraft(d => ({ ...d, github: e.target.value }))}
                        className="w-full bg-transparent text-sm text-primary focus:outline-none font-mono mt-0.5"
                      />
                    ) : profile.github ? (
                      <a
                        href={`https://${profile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary mt-0.5 truncate block hover:text-accent transition-colors"
                      >
                        {profile.github}
                      </a>
                    ) : (
                      <p className="text-sm text-primary/40 mt-0.5">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!editing && (
                <div className="mt-6 space-y-2">
                  {onLogout && !confirmLogout && (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      className="w-full py-2.5 border border-red-500/20 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 hover:border-red-500/40 transition-colors text-sm font-mono"
                    >
                      Log Out
                    </button>
                  )}
                  {onLogout && confirmLogout && (
                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                      <p className="text-xs font-mono text-red-400 text-center mb-3">Are you sure you want to log out?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmLogout(false)}
                          className="flex-1 py-2 border border-white/10 text-secondary rounded-lg hover:border-white/20 hover:text-primary transition-colors text-xs font-mono"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { onClose(); onLogout() }}
                          className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-mono font-bold"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 border border-white/10 text-secondary font-semibold rounded-xl hover:border-white/20 hover:text-primary transition-colors text-sm font-mono"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
