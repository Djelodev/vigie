'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

type ToastType = 'default' | 'success' | 'error'
type ToastItem = { id: number; message: string; type: ToastType }

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const toast = useCallback((message: string, type: ToastType = 'default') => {
    const id = Date.now() + (counter++)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.type !== 'default' ? ` ${t.type}` : ''}`} role="status">
            {t.type === 'success' && <Check size={15} aria-hidden="true" />}
            {t.type === 'error'   && <AlertCircle size={15} aria-hidden="true" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
