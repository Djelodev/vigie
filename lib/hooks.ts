/**
 * lib/hooks.ts
 * Hooks React pour l'accès aux données côté client.
 */
'use client'

import useSWR, { mutate as globalMutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
})

// ── Utilisateur connecté ───────────────────────────────────────

export interface UserData {
  id: number
  email: string
  name: string
  avatarChar: string
  prefs: {
    niveau: string
    type_bac: string
    interets: string[]
    domaines: string[]
    regions: string[]
    mobilite: string
    budget: string
    alternance: number
  } | null
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<{ user: UserData | null }>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })
  return {
    user:      data?.user ?? null,
    isLoading,
    isError:   !!error,
    mutate,
    isLoggedIn: !!data?.user,
  }
}

// ── Favoris ───────────────────────────────────────────────────

export interface Favorite {
  id: number
  cod_aff: string
  status: string
  notes: string
  priority: number
  list_name: string
  created_at: string
  updated_at: string
}

export function useFavorites() {
  const { data, error, isLoading, mutate } = useSWR<{ favorites: Favorite[] }>('/api/favorites', fetcher, {
    revalidateOnFocus: false,
  })
  return {
    favorites: data?.favorites ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}

// ── Tâches ────────────────────────────────────────────────────

export interface Task {
  id: number
  label: string
  note: string
  done: number
  due_date: string | null
  category: string
  created_at: string
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>('/api/tasks', fetcher, {
    revalidateOnFocus: false,
  })
  return {
    tasks:    data?.tasks ?? [],
    isLoading,
    isError:  !!error,
    mutate,
  }
}

// ── Notifications ─────────────────────────────────────────────

export interface Notification {
  id: number
  type: string
  title: string
  body: string
  link: string
  read: number
  created_at: string
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<{ notifications: Notification[]; unread: number }>(
    '/api/notifications', fetcher, {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  )
  return {
    notifications: data?.notifications ?? [],
    unread:        data?.unread ?? 0,
    isLoading,
    isError:       !!error,
    mutate,
  }
}

// ── Rappels ───────────────────────────────────────────────────

export interface Reminder {
  id: number
  label: string
  note: string
  due_date: string
  done: number
  created_at: string
}

export function useReminders() {
  const { data, error, isLoading, mutate } = useSWR<{ reminders: Reminder[] }>('/api/reminders', fetcher, {
    revalidateOnFocus: false,
  })
  return {
    reminders: data?.reminders ?? [],
    isLoading,
    isError:   !!error,
    mutate,
  }
}
