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
  name:         '',
  birthday:     '',
  email:        '',
  github:       '',
  role:         '',
  photo:        null,
  organization: '',
  website:      '',
  bio:          '',
  expertise:    '',
  framework:    '',
  team:         '',
}

const TEAM_ROLE_OPTIONS = [
  'Founder', 'Lead Engineer', 'ML Engineer', 'Frontend Dev',
  'Backend Dev', 'Designer', 'PM', 'Researcher',
]

const EXPERTISE_OPTIONS = [
  'Computer Vision', 'NLP / LLM', 'Edge AI', 'Robotics',
  'Audio / Speech', 'Reinforcement Learning', 'MLOps', 'Other',
]

const FRAMEWORK_OPTIONS = [
  'TensorFlow Lite', 'PyTorch Mobile', 'ONNX Runtime', 'TensorRT',
  'OpenVINO', 'Core ML', 'MediaPipe', 'Other',
]

function loadLocalProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_PROFILE, ...parsed }
    }
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

  useEffect(() => {
    if (!username) { setLoading(false); return }
    api.getProfile(username)
      .then(data => {
        const merged: ProfileData = { ...DEFAULT_PROFILE, ...profile, ...data }
        if (!merged.photo && profile.photo) merged.photo = profile.photo
        setProfile(merged)
        setDraft(merged)
        saveLocalProfile(merged)
      })
      .catch(() => { /* use localStorage fallback */ })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  useEffect(() => { setDraft(profile) }, [profile])

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
    saveLocalProfile(updated)
    setProfile(updated)
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

  const d = editing ? draft : profile

  function formatBirthday(iso: string) {
    if (!iso) return '—'
    const [y, m, dd] = iso.split('-')
    return `${y} · ${m} · ${dd}`
  }

  /* ── Reusable row ───────────────────────────────────────── */
  function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
      <div className="flex items-start gap-3 px-3 py-2.5 bg-white/3 rounded-xl border border-white/5">
        <span className="text-secondary/60 text-xs font-mono w-4 flex-shrink-0 text-center mt-1">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider">{label}</p>
          {children}
        </div>
      </div>
    )
  }

  const inputCls = 'w-full bg-transparent text-sm text-primary focus:outline-none font-mono mt-0.5 placeholder:text-secondary/30'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !editing) onClose() }}
    >
      <div className="relative w-full max-w-md mx-4 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">

        {/* Top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent flex-shrink-0" />

        {/* Header: Avatar + Name + Buttons */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                onClick={() => editing && fileRef.current?.click()}
                className={[
                  'w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden',
                  editing
                    ? 'border-accent/50 cursor-pointer hover:border-accent transition-colors'
                    : 'border-white/15',
                ].join(' ')}
              >
                {d.photo ? (
                  <img src={d.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary text-xl font-bold font-mono bg-white/10 w-full h-full flex items-center justify-center">
                    {(d.name || username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {editing && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-[9px] font-mono font-bold">EDIT</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Name + Role */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <>
                  <input
                    type="text" value={draft.name} placeholder="Name"
                    onChange={e => setDraft(dd => ({ ...dd, name: e.target.value }))}
                    className="w-full bg-background/60 border border-white/10 text-primary rounded-lg px-3 py-1.5 text-base font-bold focus:outline-none focus:border-accent/50 transition-colors font-mono mb-1"
                  />
                  <input
                    type="text" value={draft.role} placeholder="Role (e.g. ML Engineer)"
                    onChange={e => setDraft(dd => ({ ...dd, role: e.target.value }))}
                    className="w-full bg-background/60 border border-white/10 text-secondary rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-accent/50 transition-colors font-mono"
                  />
                </>
              ) : (
                <>
                  <p className="text-primary font-bold text-lg leading-tight truncate">{profile.name || username}</p>
                  <p className="text-secondary text-xs font-mono mt-0.5 truncate">{profile.role || 'No role set'}</p>
                </>
              )}
              <p className="text-green-400 text-[11px] mt-1 font-mono">● Active session</p>
            </div>

            {/* Action buttons - aligned right */}
            <div className="flex items-center gap-2 flex-shrink-0 self-start">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-mono text-accent/70 hover:text-accent transition-colors px-2.5 py-1 border border-accent/20 rounded-lg hover:border-accent/40"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onClose}
                    className="text-secondary hover:text-primary transition-colors text-base leading-none"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="text-xs font-mono text-secondary hover:text-primary transition-colors px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs font-mono text-background bg-primary hover:bg-primary/85 transition-colors px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {editing && (
            <p className="text-[10px] text-secondary/40 font-mono text-center mt-2">
              Click avatar to upload photo
            </p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs font-mono text-secondary/50 animate-pulse">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* ── Personal ── */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/6" />
                <span className="font-mono text-[9px] text-secondary/50 uppercase tracking-[0.22em]">Personal</span>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              <div className="space-y-2">
                {/* Bio */}
                <InfoRow icon="≡" label="Bio">
                  {editing ? (
                    <textarea
                      value={draft.bio} placeholder="Brief introduction..."
                      onChange={e => setDraft(dd => ({ ...dd, bio: e.target.value }))}
                      rows={2}
                      className="w-full bg-transparent text-sm text-primary focus:outline-none font-mono mt-0.5 placeholder:text-secondary/30 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-primary mt-0.5">{d.bio || '—'}</p>
                  )}
                </InfoRow>

                {/* Organization */}
                <InfoRow icon="⌂" label="Organization">
                  {editing ? (
                    <input type="text" value={draft.organization} placeholder="Company / Lab / University"
                      onChange={e => setDraft(dd => ({ ...dd, organization: e.target.value }))}
                      className={inputCls} />
                  ) : (
                    <p className="text-sm text-primary mt-0.5 truncate">{d.organization || '—'}</p>
                  )}
                </InfoRow>

                {/* Birthday */}
                <InfoRow icon="◷" label="Birthday">
                  {editing ? (
                    <input type="date" value={draft.birthday}
                      onChange={e => setDraft(dd => ({ ...dd, birthday: e.target.value }))}
                      className={inputCls} style={{ colorScheme: 'dark' }} />
                  ) : (
                    <p className="text-sm text-primary mt-0.5">{formatBirthday(profile.birthday)}</p>
                  )}
                </InfoRow>

                {/* Location */}
                <InfoRow icon="◎" label="Location">
                  <p className="text-sm text-primary mt-0.5 truncate">{location ?? 'Detecting...'}</p>
                </InfoRow>
              </div>

              {/* ── Contact ── */}
              <div className="flex items-center gap-3 mb-3 mt-5">
                <div className="flex-1 h-px bg-white/6" />
                <span className="font-mono text-[9px] text-secondary/50 uppercase tracking-[0.22em]">Contact</span>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              <div className="space-y-2">
                {/* Email */}
                <InfoRow icon="◉" label="Email">
                  {editing ? (
                    <input type="email" value={draft.email} placeholder="your@email.com"
                      onChange={e => setDraft(dd => ({ ...dd, email: e.target.value }))}
                      className={inputCls} />
                  ) : (
                    <p className="text-sm text-primary mt-0.5 truncate">{d.email || '—'}</p>
                  )}
                </InfoRow>

                {/* Website */}
                <InfoRow icon="◆" label="Website">
                  {editing ? (
                    <input type="text" value={draft.website} placeholder="https://yoursite.com"
                      onChange={e => setDraft(dd => ({ ...dd, website: e.target.value }))}
                      className={inputCls} />
                  ) : d.website ? (
                    <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary mt-0.5 truncate block hover:text-accent transition-colors">
                      {d.website}
                    </a>
                  ) : (
                    <p className="text-sm text-primary/40 mt-0.5">—</p>
                  )}
                </InfoRow>

                {/* GitHub */}
                <InfoRow icon="⌥" label="GitHub">
                  {editing ? (
                    <input type="text" value={draft.github} placeholder="github.com/username"
                      onChange={e => setDraft(dd => ({ ...dd, github: e.target.value }))}
                      className={inputCls} />
                  ) : d.github ? (
                    <a href={`https://${d.github}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary mt-0.5 truncate block hover:text-accent transition-colors">
                      {d.github}
                    </a>
                  ) : (
                    <p className="text-sm text-primary/40 mt-0.5">—</p>
                  )}
                </InfoRow>

                {/* Team */}
                <InfoRow icon="⊞" label="Team">
                  {editing ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {TEAM_ROLE_OPTIONS.map(opt => {
                        const selected = draft.team.split(',').map(s => s.trim()).includes(opt)
                        return (
                          <button key={opt} type="button"
                            onClick={() => {
                              const current = draft.team.split(',').map(s => s.trim()).filter(Boolean)
                              const next = selected ? current.filter(c => c !== opt) : [...current, opt]
                              setDraft(dd => ({ ...dd, team: next.join(', ') }))
                            }}
                            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                              selected
                                ? 'border-accent/50 bg-accent/10 text-accent'
                                : 'border-white/10 text-secondary/60 hover:border-white/20'
                            }`}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-primary mt-0.5">{d.team || '—'}</p>
                  )}
                </InfoRow>
              </div>

              {/* ── Technical ── */}
              <div className="flex items-center gap-3 mb-3 mt-5">
                <div className="flex-1 h-px bg-white/6" />
                <span className="font-mono text-[9px] text-secondary/50 uppercase tracking-[0.22em]">Technical</span>
                <div className="flex-1 h-px bg-white/6" />
              </div>

              <div className="space-y-2">
                {/* Expertise */}
                <InfoRow icon="◈" label="AI Expertise">
                  {editing ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {EXPERTISE_OPTIONS.map(opt => {
                        const selected = draft.expertise.split(',').map(s => s.trim()).includes(opt)
                        return (
                          <button key={opt} type="button"
                            onClick={() => {
                              const current = draft.expertise.split(',').map(s => s.trim()).filter(Boolean)
                              const next = selected ? current.filter(c => c !== opt) : [...current, opt]
                              setDraft(dd => ({ ...dd, expertise: next.join(', ') }))
                            }}
                            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                              selected
                                ? 'border-accent/50 bg-accent/10 text-accent'
                                : 'border-white/10 text-secondary/60 hover:border-white/20'
                            }`}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-primary mt-0.5">{d.expertise || '—'}</p>
                  )}
                </InfoRow>

                {/* Preferred Framework */}
                <InfoRow icon="⚙" label="Preferred Framework">
                  {editing ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {FRAMEWORK_OPTIONS.map(opt => {
                        const selected = draft.framework.split(',').map(s => s.trim()).includes(opt)
                        return (
                          <button key={opt} type="button"
                            onClick={() => {
                              const current = draft.framework.split(',').map(s => s.trim()).filter(Boolean)
                              const next = selected ? current.filter(c => c !== opt) : [...current, opt]
                              setDraft(dd => ({ ...dd, framework: next.join(', ') }))
                            }}
                            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                              selected
                                ? 'border-accent/50 bg-accent/10 text-accent'
                                : 'border-white/10 text-secondary/60 hover:border-white/20'
                            }`}>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-primary mt-0.5">{d.framework || '—'}</p>
                  )}
                </InfoRow>
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
