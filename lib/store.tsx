'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { generateId } from './utils'
import type { Template } from './templates'
import { TEMPLATES } from './templates'

// ── Types ──────────────────────────────────────────────────────────────────

export type CreateOptions = {
  durationSec: 3 | 5
  intensity: 'low' | 'mid' | 'high'
  keepFirstFrame: boolean
}

export type CreateJobStatus =
  | 'queued'
  | 'processing'
  | 'done'
  | 'failed'
  | 'canceled'

export type CreateJob = {
  jobId: string
  templateId: string
  sourceImageDataUrl: string
  options: CreateOptions
  status: CreateJobStatus
  progress: number // 0–100
  createdAt: number
  result?: { previewVideoUrl: string; shareUrl: string }
  errorMessage?: string
}

type State = {
  creditBalance: number
  templates: Template[]
  jobs: Record<string, CreateJob>
  history: string[] // jobId, newest first
}

type Action =
  | { type: 'ADD_CREDITS'; amount: number }
  | { type: 'SPEND_CREDITS'; amount: number }
  | { type: 'CREATE_JOB'; job: CreateJob }
  | { type: 'UPDATE_JOB'; jobId: string; updates: Partial<CreateJob> }
  | { type: 'HYDRATE'; state: State }

// ── Default state ──────────────────────────────────────────────────────────

const DEFAULT_STATE: State = {
  creditBalance: 15,
  templates: TEMPLATES,
  jobs: {},
  history: [],
}

// ── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.state, templates: TEMPLATES }

    case 'ADD_CREDITS':
      return { ...state, creditBalance: state.creditBalance + action.amount }

    case 'SPEND_CREDITS':
      return {
        ...state,
        creditBalance: Math.max(0, state.creditBalance - action.amount),
      }

    case 'CREATE_JOB': {
      const newJobs = { ...state.jobs, [action.job.jobId]: action.job }
      const newHistory = [action.job.jobId, ...state.history]
      return { ...state, jobs: newJobs, history: newHistory }
    }

    case 'UPDATE_JOB': {
      const existing = state.jobs[action.jobId]
      if (!existing) return state
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [action.jobId]: { ...existing, ...action.updates },
        },
      }
    }

    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────

type StoreContextValue = {
  state: State
  addCredits: (amount: number) => void
  spendCredits: (amount: number) => void
  createJob: (
    templateId: string,
    sourceImageDataUrl: string,
    options: CreateOptions,
  ) => string
  updateJob: (jobId: string, updates: Partial<CreateJob>) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'miso-studio-v1'

function loadFromStorage(): State | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as State
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state: State) {
  if (typeof window === 'undefined') return
  try {
    // Don't persist template data (it's static)
    const toSave = {
      creditBalance: state.creditBalance,
      jobs: state.jobs,
      history: state.history,
      templates: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // ignore
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      dispatch({ type: 'HYDRATE', state: { ...saved, templates: TEMPLATES } })
    }
  }, [])

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const addCredits = useCallback((amount: number) => {
    dispatch({ type: 'ADD_CREDITS', amount })
  }, [])

  const spendCredits = useCallback((amount: number) => {
    dispatch({ type: 'SPEND_CREDITS', amount })
  }, [])

  const createJob = useCallback(
    (
      templateId: string,
      sourceImageDataUrl: string,
      options: CreateOptions,
    ): string => {
      const jobId = generateId()
      const job: CreateJob = {
        jobId,
        templateId,
        sourceImageDataUrl,
        options,
        status: 'queued',
        progress: 0,
        createdAt: Date.now(),
      }
      dispatch({ type: 'CREATE_JOB', job })
      return jobId
    },
    [],
  )

  const updateJob = useCallback(
    (jobId: string, updates: Partial<CreateJob>) => {
      dispatch({ type: 'UPDATE_JOB', jobId, updates })
    },
    [],
  )

  return (
    <StoreContext.Provider
      value={{ state, addCredits, spendCredits, createJob, updateJob }}
    >
      {children}
    </StoreContext.Provider>
  )
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useCreditBalance() {
  return useStore().state.creditBalance
}

export function useJob(jobId: string): CreateJob | undefined {
  return useStore().state.jobs[jobId]
}

export function useHistory() {
  const { state } = useStore()
  return state.history.map((id) => state.jobs[id]).filter(Boolean) as CreateJob[]
}
