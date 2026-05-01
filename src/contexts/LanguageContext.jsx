import { createContext, useContext, useState, useEffect } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    // Load saved language preference
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['language'], (result) => {
        if (result.language) setLang(result.language)
      })
    } else {
      const saved = localStorage.getItem('language')
      if (saved) setLang(saved)
    }
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'id' : 'en'
    setLang(newLang)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ language: newLang })
    } else {
      localStorage.setItem('language', newLang)
    }
  }

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations.en[key] || key
    // Replace {param} placeholders
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v)
    })
    return text
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
