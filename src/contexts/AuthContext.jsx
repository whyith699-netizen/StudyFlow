import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../services/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { apiCreateUserProfile } from '../services/apiService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)

      // Fase 4: Pastikan user terdaftar di MariaDB setiap kali login
      if (firebaseUser) {
        apiCreateUserProfile({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL:    firebaseUser.photoURL,
          lastLogin:   new Date().toISOString(),
        }).catch(err => console.warn('[AUTH] Gagal sync user ke MariaDB:', err.message))
      }
    })
    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      // Clear local data to prevent stale data after logout
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.remove(['myClasses', 'tasks', 'studyTools', 'studyflow_lang', 'studyflow_theme'])
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export default AuthContext
