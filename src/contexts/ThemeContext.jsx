import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Read from localStorage synchronously to prevent flash
    try {
      return localStorage.getItem('darkMode') === 'true'
    } catch {
      return false
    }
  })

  // Sync dark class on <html> element
  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [isDark])

  // Confirm from chrome.storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['darkMode'], (result) => {
        if (!chrome.runtime.lastError) {
          const stored = result.darkMode ?? false
          setIsDark(stored)
          try { localStorage.setItem('darkMode', String(stored)) } catch {}
        }
      })
    }
  }, [])

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      // Persist to both storages
      try { localStorage.setItem('darkMode', String(next)) } catch {}
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ darkMode: next })
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export default ThemeContext
