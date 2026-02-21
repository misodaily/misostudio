'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { generateId } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Icons ──────────────────────────────────────────────────────────────────

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success')
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 8l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  if (type === 'error')
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 6l4 4M10 6l-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5v4M8 11v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Individual Toast Item ──────────────────────────────────────────────────

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))

    // Auto dismiss
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 3200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, onRemove])

  const colorMap: Record<ToastType, string> = {
    success: 'text-emerald-600',
    error: 'text-red-500',
    info: 'text-blue-500',
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      }}
      className="flex items-center gap-3 min-w-[240px] max-w-sm bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-lg shadow-black/5"
    >
      <span className={colorMap[toast.type]}>
        <ToastIcon type={toast.type} />
      </span>
      <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        aria-label="알림 닫기"
        className="text-gray-300 hover:text-gray-500 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack - bottom right */}
      <div
        aria-label="알림 목록"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
