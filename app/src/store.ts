import { useSyncExternalStore } from 'react'
import type { Attempt, Settings } from './types'

// On-device, single-user persistence. No server, no accounts.
const KEY = 'psychometry-study/v1'

interface PersistState {
  attempts: Attempt[]
  bookmarkedFormulas: string[]
  settings: Settings
}

const empty: PersistState = { attempts: [], bookmarkedFormulas: [], settings: {} }

function load(): PersistState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return { ...empty }
  }
}

let state: PersistState = load()
const listeners = new Set<() => void>()

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage may be full/blocked; keep in-memory */
  }
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useStore(): PersistState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

// ---------- Mutations ----------
export function recordAttempt(a: Attempt) {
  state = { ...state, attempts: [...state.attempts, a] }
  emit()
}

export function toggleBookmark(formulaId: string) {
  const has = state.bookmarkedFormulas.includes(formulaId)
  state = {
    ...state,
    bookmarkedFormulas: has
      ? state.bookmarkedFormulas.filter((id) => id !== formulaId)
      : [...state.bookmarkedFormulas, formulaId],
  }
  emit()
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } }
  emit()
}

export function resetProgress() {
  state = { ...state, attempts: [], bookmarkedFormulas: [] }
  emit()
}

// ---------- Selectors ----------
export function lastAttemptFor(attempts: Attempt[], questionId: string): Attempt | undefined {
  for (let i = attempts.length - 1; i >= 0; i--) if (attempts[i].questionId === questionId) return attempts[i]
  return undefined
}
