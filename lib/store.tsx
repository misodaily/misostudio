'use client'

/**
 * Simplified store — only manages credit balance (UI shared state).
 * Jobs and history are fetched directly from API in each page.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type State = {
  creditBalance: number | null // null = not yet loaded from API
}

type Action =
  | { type: 'SET_BALANCE'; balance: number }
  | { type: 'ADJUST_BALANCE'; delta: number }

type StoreContextValue = {
  creditBalance: number | null
  setBalance: (balance: number) => void
  adjustBalance: (delta: number) => void
}

// ── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BALANCE':
      return { ...state, creditBalance: action.balance }
    case 'ADJUST_BALANCE':
      return {
        ...state,
        creditBalance:
          state.creditBalance !== null
            ? Math.max(0, state.creditBalance + action.delta)
            : null,
      }
    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { creditBalance: null })

  // Fetch credit balance from API on mount (only if logged in)
  useEffect(() => {
    fetch('/api/credits/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.balance !== undefined) {
          dispatch({ type: 'SET_BALANCE', balance: data.balance })
        }
      })
      .catch(() => {
        // Not logged in or network error — leave null
      })
  }, [])

  const setBalance = useCallback((balance: number) => {
    dispatch({ type: 'SET_BALANCE', balance })
  }, [])

  const adjustBalance = useCallback((delta: number) => {
    dispatch({ type: 'ADJUST_BALANCE', delta })
  }, [])

  return (
    <StoreContext.Provider
      value={{ creditBalance: state.creditBalance, setBalance, adjustBalance }}
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

export function useCreditBalance(): number | null {
  return useStore().creditBalance
}
