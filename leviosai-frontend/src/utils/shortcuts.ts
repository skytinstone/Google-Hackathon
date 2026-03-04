export interface Shortcut {
  key: string
  ctrl: boolean
  description: string
  action: string
}

export const SHORTCUTS: Shortcut[] = [
  { key: '1', ctrl: true, description: 'Dashboard', action: 'nav:dashboard' },
  { key: '2', ctrl: true, description: 'Project', action: 'nav:project' },
  { key: '3', ctrl: true, description: 'Contact', action: 'nav:contact' },
  { key: '4', ctrl: true, description: 'Settings', action: 'nav:settings' },
  { key: 'n', ctrl: true, description: 'New Pipeline', action: 'new:project' },
  { key: 'k', ctrl: true, description: 'Search', action: 'search' },
  { key: '/', ctrl: true, description: 'Show Shortcuts', action: 'show:shortcuts' },
  { key: 'Escape', ctrl: false, description: 'Close Modal', action: 'close:modal' },
]
