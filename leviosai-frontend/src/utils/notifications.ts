import { useState, useEffect } from 'react'

export interface Notification {
  id: string
  message: string
  type: 'cart' | 'project' | 'system' | 'auth'
  time: string
  read: boolean
}

let notifications: Notification[] = []
let listeners: Array<(n: Notification[]) => void> = []

function emit() {
  const copy = [...notifications]
  listeners.forEach(fn => fn(copy))
}

export function addNotification(message: string, type: Notification['type'] = 'system') {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  notifications = [
    { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, type, time, read: false },
    ...notifications,
  ].slice(0, 30)
  emit()
}

export function markAllRead() {
  notifications = notifications.map(n => ({ ...n, read: true }))
  emit()
}

export function clearNotifications() {
  notifications = []
  emit()
}

export function useNotifications() {
  const [state, setState] = useState<Notification[]>([])
  useEffect(() => {
    listeners.push(setState)
    setState([...notifications])
    return () => { listeners = listeners.filter(fn => fn !== setState) }
  }, [])
  const unreadCount = state.filter(n => !n.read).length
  return { notifications: state, unreadCount, markAllRead, clearNotifications }
}
