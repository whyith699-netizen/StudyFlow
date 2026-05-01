import { useState } from 'react'
import Button from './Button'

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-surface-1 rounded-xl p-5 w-[90%] max-w-md border border-gray-200 dark:border-white/[0.08] shadow-2xl" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-white/[0.08]">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{title}</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 transition-colors cursor-pointer">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', variant = 'danger' }) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 dark:text-white/60 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose() }}>{confirmText}</Button>
      </div>
    </Modal>
  )
}
