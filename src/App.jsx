import { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { EmailAuthProvider, linkWithCredential, updateProfile } from 'firebase/auth'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider, useLang } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { createUserProfile } from './services/syncService'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ClassDetailPage from './pages/ClassDetailPage'
import AddClassPage, { EditClassPage } from './pages/AddClassPage'
import AddTaskPage, { EditTaskPage } from './pages/AddTaskPage'
import MyTasksPage from './pages/MyTasksPage'
import StudyToolsPage from './pages/StudyToolsPage'

function getDefaultUsername(user) {
  const fromDisplayName = (user?.displayName || '').trim()
  if (fromDisplayName) return fromDisplayName.slice(0, 80)
  const fromEmail = (user?.email || '').split('@')[0].trim()
  if (fromEmail) return fromEmail.slice(0, 80)
  return 'StudyFlow User'
}

function AccountSetupGate({ children }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [checking, setChecking] = useState(true)
  const [requiresSetup, setRequiresSetup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setRequiresSetup(false)
      setChecking(false)
      return
    }

    const providers = (user.providerData || []).map((p) => p.providerId)
    const hasGoogleProvider = providers.includes('google.com')
    const hasPasswordProvider = providers.includes('password')

    setUsername(getDefaultUsername(user))
    setRequiresSetup(hasGoogleProvider && !hasPasswordProvider)
    setChecking(false)
  }, [user?.uid, user?.displayName, user?.email])

  const handleCompleteSetup = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim()
    if (!cleanUsername || cleanUsername.length < 3) {
      setError(t('setupUsernameMin'))
      return
    }
    if (!password || password.length < 6) {
      setError(t('setupPasswordMin'))
      return
    }
    if (password !== confirm) {
      setError(t('setupPasswordMismatch'))
      return
    }
    if (!user?.email) {
      setError(t('setupInvalidGoogleEmail'))
      return
    }

    setSaving(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, password)
      try {
        await linkWithCredential(user, credential)
      } catch (linkErr) {
        if (linkErr.code !== 'auth/provider-already-linked') {
          throw linkErr
        }
      }

      await updateProfile(user, { displayName: cleanUsername })
      await createUserProfile(user.uid, {
        email: user.email,
        displayName: cleanUsername,
        photoURL: user.photoURL || null,
        hasPasswordSetup: true,
        lastLogin: new Date().toISOString(),
      })

      setRequiresSetup(false)
      setPassword('')
      setConfirm('')
    } catch (err) {
      const messages = {
        'auth/weak-password': t('setupWeakPassword'),
        'auth/email-already-in-use': t('setupEmailInUse'),
        'auth/operation-not-allowed': t('setupEmailPasswordDisabled'),
        'auth/requires-recent-login': t('setupRequiresRecentLogin'),
      }
      setError(messages[err.code] || err.message || t('setupSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-bg items-center justify-center">
        <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    )
  }

  if (!requiresSetup) return children

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-bg items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface p-5 shadow-lg">
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/15">
            <i className="fas fa-user-shield text-xl text-primary"></i>
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">{t('setupTitle')}</h2>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
            {t('setupDescription')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs rounded-lg p-2.5 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleCompleteSetup} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('setupUsername')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              placeholder="username"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('setupPassword')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              placeholder="******"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[calc(50%+4px)] text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-pointer transition-colors"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('setupConfirmPassword')}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-dark cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <i className="fas fa-spinner animate-spin"></i>}
            {t('setupSaveContinue')}
          </button>
        </form>
      </div>
    </div>
  )
}

function AppContent() {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-bg items-center justify-center">
        <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-bg p-2.5 gap-2.5 overflow-hidden">
        <LoginPage />
      </div>
    )
  }

  return (
    <AccountSetupGate>
      <MemoryRouter>
        <div className="flex flex-col h-screen max-h-screen bg-gray-100 dark:bg-bg p-2.5 gap-2.5 overflow-hidden">
          <Header />
          <main className="flex-1 min-h-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/class/:id" element={<ClassDetailPage />} />
              <Route path="/class/add" element={<AddClassPage />} />
              <Route path="/class/edit/:id" element={<EditClassPage />} />
              <Route path="/task/add" element={<AddTaskPage />} />
              <Route path="/task/edit/:id" element={<EditTaskPage />} />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/tools" element={<StudyToolsPage />} />
            </Routes>
          </main>
        </div>
      </MemoryRouter>
    </AccountSetupGate>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
