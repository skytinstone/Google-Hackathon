import { useState, useMemo } from 'react'
import TypewriterText from '../TypewriterText'
import { showToast } from '../../utils/toast'
import { addLog } from '../../utils/syslog'

// ── Mock Data (replace with real API later) ──────────────────

interface UserRecord {
  username: string
  password: string
  role: 'admin' | 'user'
  createdAt: string
  lastLogin: string | null
  status: 'active' | 'inactive' | 'suspended'
}

interface AccessLog {
  id: number
  username: string
  ip: string
  timestamp: string
  action: string
  userAgent: string
}

interface TrafficStat {
  hour: string
  requests: number
  uniqueUsers: number
}

interface ApiUsage {
  endpoint: string
  method: string
  calls: number
  avgLatency: number
  errors: number
  lastCalled: string
}

// Initial mock data
const INITIAL_USERS: UserRecord[] = [
  { username: 'admin', password: '1234', role: 'admin', createdAt: '2025-12-01', lastLogin: '2026-03-04T09:30:00', status: 'active' },
  { username: 'stevenshin16', password: '1234', role: 'user', createdAt: '2025-12-01', lastLogin: '2026-03-04T08:15:00', status: 'active' },
  { username: 'pjscjs777', password: 'wnstjd1986!', role: 'user', createdAt: '2026-03-04', lastLogin: null, status: 'active' },
]

const MOCK_ACCESS_LOGS: AccessLog[] = [
  { id: 1, username: 'stevenshin16', ip: '211.234.56.78', timestamp: '2026-03-04T09:30:12', action: 'LOGIN', userAgent: 'Chrome/133' },
  { id: 2, username: 'admin', ip: '192.168.1.100', timestamp: '2026-03-04T09:28:45', action: 'LOGIN', userAgent: 'Chrome/133' },
  { id: 3, username: 'stevenshin16', ip: '211.234.56.78', timestamp: '2026-03-04T09:31:00', action: 'GENERATE_CODE', userAgent: 'Chrome/133' },
  { id: 4, username: 'stevenshin16', ip: '211.234.56.78', timestamp: '2026-03-04T09:35:22', action: 'SAVE_PROJECT', userAgent: 'Chrome/133' },
  { id: 5, username: 'admin', ip: '192.168.1.100', timestamp: '2026-03-04T09:40:10', action: 'ADMIN_ACCESS', userAgent: 'Chrome/133' },
  { id: 6, username: 'stevenshin16', ip: '211.234.56.78', timestamp: '2026-03-03T14:20:33', action: 'LOGIN', userAgent: 'Safari/17' },
  { id: 7, username: 'stevenshin16', ip: '10.0.0.55', timestamp: '2026-03-02T11:05:10', action: 'CHECK_COMPAT', userAgent: 'Firefox/128' },
]

const MOCK_TRAFFIC: TrafficStat[] = [
  { hour: '00:00', requests: 12, uniqueUsers: 2 },
  { hour: '03:00', requests: 5, uniqueUsers: 1 },
  { hour: '06:00', requests: 18, uniqueUsers: 3 },
  { hour: '09:00', requests: 87, uniqueUsers: 12 },
  { hour: '12:00', requests: 65, uniqueUsers: 9 },
  { hour: '15:00', requests: 92, uniqueUsers: 14 },
  { hour: '18:00', requests: 54, uniqueUsers: 8 },
  { hour: '21:00', requests: 38, uniqueUsers: 5 },
]

const MOCK_API_USAGE: ApiUsage[] = [
  { endpoint: '/login', method: 'POST', calls: 342, avgLatency: 45, errors: 12, lastCalled: '2026-03-04T09:30:12' },
  { endpoint: '/api/generate-code', method: 'POST', calls: 156, avgLatency: 2340, errors: 8, lastCalled: '2026-03-04T09:31:00' },
  { endpoint: '/api/check-compatibility', method: 'POST', calls: 128, avgLatency: 1820, errors: 3, lastCalled: '2026-03-04T09:29:45' },
  { endpoint: '/api/model-info', method: 'POST', calls: 210, avgLatency: 890, errors: 5, lastCalled: '2026-03-04T09:28:30' },
  { endpoint: '/api/validate-key', method: 'POST', calls: 89, avgLatency: 320, errors: 15, lastCalled: '2026-03-04T08:55:20' },
  { endpoint: '/api/analyze-hardware', method: 'POST', calls: 34, avgLatency: 4500, errors: 2, lastCalled: '2026-03-03T16:40:00' },
]

// ── Sub-components ───────────────────────────────────────────

type AdminTab = 'users' | 'access' | 'traffic' | 'api' | 'system'

function BarRow({ label, value, max, color = 'bg-accent' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <span className="w-16 text-secondary truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} animate-bar`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-primary">{value}</span>
    </div>
  )
}

// ── User Management Panel ────────────────────────────────────

function UsersPanel({ users, onAddUser, onToggleStatus }: {
  users: UserRecord[]
  onAddUser: (u: { username: string; password: string; role: 'admin' | 'user' }) => void
  onToggleStatus: (username: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')

  function handleAdd() {
    if (!newUser.trim() || !newPass.trim()) return
    onAddUser({ username: newUser.trim(), password: newPass.trim(), role: newRole })
    setNewUser('')
    setNewPass('')
    setNewRole('user')
    setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-secondary">{users.length} registered user(s)</p>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-3 py-1.5 text-xs font-mono border border-accent/30 text-accent rounded-lg hover:bg-accent/10 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showAdd && (
        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 animate-fade-in space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newUser}
              onChange={e => setNewUser(e.target.value)}
              placeholder="Username"
              className="bg-background/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50"
            />
            <input
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Password"
              type="password"
              className="bg-background/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as 'user' | 'admin')}
              className="bg-background/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-primary focus:outline-none focus:border-accent/50"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newUser.trim() || !newPass.trim()}
              className="px-4 py-2 text-xs font-mono bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Username</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Role</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Created</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Last Login</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 text-secondary/50 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5 text-primary">{u.username}</td>
                <td className="px-4 py-2.5">
                  <span className={u.role === 'admin' ? 'text-red-400' : 'text-secondary'}>{u.role}</span>
                </td>
                <td className="px-4 py-2.5 text-secondary">{u.createdAt}</td>
                <td className="px-4 py-2.5 text-secondary">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className={[
                    'inline-flex items-center gap-1',
                    u.status === 'active' ? 'text-green-400' : u.status === 'suspended' ? 'text-red-400' : 'text-secondary',
                  ].join(' ')}>
                    <span className={[
                      'w-1.5 h-1.5 rounded-full',
                      u.status === 'active' ? 'bg-green-400' : u.status === 'suspended' ? 'bg-red-400' : 'bg-secondary/50',
                    ].join(' ')} />
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => onToggleStatus(u.username)}
                      className={[
                        'px-2 py-1 rounded border text-[10px] transition-colors',
                        u.status === 'active'
                          ? 'border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10'
                          : 'border-green-500/20 text-green-400 hover:bg-green-500/10',
                      ].join(' ')}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Access Logs Panel ────────────────────────────────────────

function AccessPanel({ logs }: { logs: AccessLog[] }) {
  const [filter, setFilter] = useState('')
  const filtered = useMemo(() => {
    if (!filter) return logs
    const q = filter.toLowerCase()
    return logs.filter(l =>
      l.username.toLowerCase().includes(q) ||
      l.ip.includes(q) ||
      l.action.toLowerCase().includes(q)
    )
  }, [logs, filter])

  return (
    <div className="space-y-4">
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter by username, IP, or action..."
        className="w-full bg-background/60 border border-white/8 rounded-xl px-4 py-2.5 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors"
      />
      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Timestamp</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">IP Address</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Action</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Browser</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5 text-secondary">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-primary">{log.username}</td>
                <td className="px-4 py-2.5 text-accent">{log.ip}</td>
                <td className="px-4 py-2.5">
                  <span className={[
                    'px-2 py-0.5 rounded border text-[10px]',
                    log.action === 'LOGIN' ? 'border-green-500/20 text-green-400' :
                    log.action === 'ADMIN_ACCESS' ? 'border-red-500/20 text-red-400' :
                    'border-white/10 text-secondary',
                  ].join(' ')}>{log.action}</span>
                </td>
                <td className="px-4 py-2.5 text-secondary/50">{log.userAgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-secondary/30 font-mono">{filtered.length} log entries shown</p>
    </div>
  )
}

// ── Traffic Panel ────────────────────────────────────────────

function TrafficPanel({ stats }: { stats: TrafficStat[] }) {
  const maxReqs = Math.max(...stats.map(s => s.requests))
  const totalReqs = stats.reduce((a, b) => a + b.requests, 0)
  const totalUsers = stats.reduce((a, b) => a + b.uniqueUsers, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Requests (24h)', value: totalReqs },
          { label: 'Unique Users (24h)', value: totalUsers },
          { label: 'Peak Requests/hr', value: maxReqs },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 rounded-xl border border-white/8 bg-component text-center">
            <p className="text-2xl font-bold text-primary font-mono animate-count-in">{kpi.value}</p>
            <p className="text-[10px] text-secondary/50 font-mono uppercase tracking-widest mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl border border-white/8 bg-component">
        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-4">Hourly Traffic Distribution</p>
        <div className="space-y-2">
          {stats.map(s => (
            <BarRow key={s.hour} label={s.hour} value={s.requests} max={maxReqs} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── API Usage Panel ──────────────────────────────────────────

function ApiPanel({ usage }: { usage: ApiUsage[] }) {
  const totalCalls = usage.reduce((a, b) => a + b.calls, 0)
  const totalErrors = usage.reduce((a, b) => a + b.errors, 0)
  const errorRate = totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total API Calls', value: totalCalls.toLocaleString(), color: 'text-accent' },
          { label: 'Total Errors', value: totalErrors.toString(), color: 'text-red-400' },
          { label: 'Error Rate', value: `${errorRate}%`, color: Number(errorRate) > 5 ? 'text-yellow-400' : 'text-green-400' },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 rounded-xl border border-white/8 bg-component text-center">
            <p className={`text-2xl font-bold font-mono animate-count-in ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-secondary/50 font-mono uppercase tracking-widest mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Endpoint</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Method</th>
              <th className="text-right px-4 py-2.5 text-secondary/50 font-medium">Calls</th>
              <th className="text-right px-4 py-2.5 text-secondary/50 font-medium">Avg Latency</th>
              <th className="text-right px-4 py-2.5 text-secondary/50 font-medium">Errors</th>
              <th className="text-left px-4 py-2.5 text-secondary/50 font-medium">Last Called</th>
            </tr>
          </thead>
          <tbody>
            {usage.sort((a, b) => b.calls - a.calls).map(u => (
              <tr key={u.endpoint} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5 text-accent">{u.endpoint}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded border border-green-500/20 text-green-400 text-[10px]">{u.method}</span>
                </td>
                <td className="px-4 py-2.5 text-primary text-right">{u.calls.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={u.avgLatency > 2000 ? 'text-yellow-400' : 'text-secondary'}>{u.avgLatency}ms</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={u.errors > 10 ? 'text-red-400' : 'text-secondary'}>{u.errors}</span>
                </td>
                <td className="px-4 py-2.5 text-secondary">{new Date(u.lastCalled).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── System Health Panel ──────────────────────────────────────

function SystemPanel() {
  const metrics = [
    { label: 'Server Status', value: 'Online', color: 'text-green-400' },
    { label: 'Uptime', value: '99.7%', color: 'text-green-400' },
    { label: 'CPU Usage', value: '34%', color: 'text-primary' },
    { label: 'Memory Usage', value: '62%', color: 'text-yellow-400' },
    { label: 'Disk Usage', value: '28%', color: 'text-primary' },
    { label: 'API Latency (avg)', value: '1.2s', color: 'text-primary' },
    { label: 'Active Sessions', value: '3', color: 'text-accent' },
    { label: 'Deployment', value: 'Vercel', color: 'text-primary' },
    { label: 'Backend', value: 'FastAPI', color: 'text-primary' },
    { label: 'Region', value: 'ap-northeast-2', color: 'text-primary' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-component">
            <span className="text-xs font-mono text-secondary">{m.label}</span>
            <span className={`text-xs font-mono font-bold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl border border-white/8 bg-component">
        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-3">Environment Variables</p>
        <div className="space-y-1.5">
          {[
            { key: 'GEMINI_API_KEY', status: 'SET' },
            { key: 'VERCEL_ENV', status: 'production' },
            { key: 'PYTHON_VERSION', status: '3.12' },
            { key: 'CORS_ORIGINS', status: '*' },
          ].map(env => (
            <div key={env.key} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-accent">{env.key}</span>
              <span className="text-secondary/30">=</span>
              <span className="text-primary">{env.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Admin Page ──────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS)

  function handleAddUser(data: { username: string; password: string; role: 'admin' | 'user' }) {
    if (users.find(u => u.username === data.username)) {
      showToast('Username already exists', 'error')
      return
    }
    setUsers(prev => [...prev, {
      ...data,
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: null,
      status: 'active',
    }])
    showToast(`User "${data.username}" created`, 'success')
    addLog(`Admin created user "${data.username}" · role: ${data.role}`, 'AUTH')
  }

  function handleToggleStatus(username: string) {
    setUsers(prev => prev.map(u =>
      u.username === username
        ? { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const }
        : u
    ))
    const user = users.find(u => u.username === username)
    const newStatus = user?.status === 'active' ? 'suspended' : 'active'
    showToast(`User "${username}" ${newStatus}`, newStatus === 'active' ? 'success' : 'warning')
    addLog(`Admin ${newStatus} user "${username}"`, 'AUTH')
  }

  const ADMIN_TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'users',   label: 'Users',        icon: '◉' },
    { id: 'access',  label: 'Access Logs',  icon: '◎' },
    { id: 'traffic', label: 'Traffic',       icon: '◈' },
    { id: 'api',     label: 'API Usage',    icon: '⬡' },
    { id: 'system',  label: 'System',       icon: '::' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest">Restricted</p>
          <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            ADMIN
          </span>
        </div>
        <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
          <TypewriterText text="Admin Console" speed={40} />
        </h1>
        <p className="text-xs text-secondary/50 font-mono mt-1">System administration and monitoring dashboard</p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/5 pb-3">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all',
              activeTab === tab.id
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'text-secondary hover:text-primary hover:bg-white/4',
            ].join(' ')}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && <UsersPanel users={users} onAddUser={handleAddUser} onToggleStatus={handleToggleStatus} />}
      {activeTab === 'access' && <AccessPanel logs={MOCK_ACCESS_LOGS} />}
      {activeTab === 'traffic' && <TrafficPanel stats={MOCK_TRAFFIC} />}
      {activeTab === 'api' && <ApiPanel usage={MOCK_API_USAGE} />}
      {activeTab === 'system' && <SystemPanel />}
    </div>
  )
}
