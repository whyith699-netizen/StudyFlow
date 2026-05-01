import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { auth } from '../services/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth'
import { isOAuthConfigured, getGoogleOAuthToken } from '../services/oauthConfig'
import { createUserProfile, syncFromCloud } from '../services/syncService'

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors'

export default function LoginPage() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const [mode, setMode] = useState('login') // login | register | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const ensureUserProfile = async (firebaseUser) => {
    if (!firebaseUser?.uid) return
    try {
      await createUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        lastLogin: new Date().toISOString(),
      })
    } catch (profileError) {
      console.error('Profile upsert failed:', profileError)
    }
  }

  // If already logged in, show profile view
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/15">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-20 h-20 rounded-full" />
            ) : (
              <i className="fas fa-user-circle text-4xl text-primary"></i>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-1">{user.displayName || 'User'}</h2>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-6">{user.email}</p>

          <button onClick={async () => { await logout() }}
            className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-700 dark:text-white/60 text-sm font-medium border border-gray-200 dark:border-white/[0.08] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800/30 cursor-pointer transition-colors flex items-center justify-center gap-2">
            <i className="fas fa-sign-out-alt"></i> {t('logout')}
          </button>

        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
        await ensureUserProfile(userCredential.user)
        try { await syncFromCloud(userCredential.user.uid) } catch (e) { /* ignore sync errors */ }
      } else if (mode === 'register') {
        if (password !== confirm) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        await ensureUserProfile(userCredential.user)
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, normalizedEmail)
        setMessage('Password reset email sent! Check your inbox.')
      }
    } catch (err) {
      if (mode === 'register' && err.code === 'auth/email-already-in-use') {
        try {
          const existingUserCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
          await ensureUserProfile(existingUserCredential.user)
          setMessage('Account already exists. Signed in and profile synced.')
          setError('')
          return
        } catch (signInErr) {
          if (signInErr.code === 'auth/wrong-password' || signInErr.code === 'auth/invalid-credential') {
            setError('Email already registered. Please login or reset password.')
            setMode('login')
            return
          }
        }
      }
      const messages = {
        'auth/wrong-password': 'Incorrect password',
        'auth/user-not-found': 'No account found with this email',
        'auth/email-already-in-use': 'Email already registered',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      }
      setError(messages[err.code] || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      if (!isOAuthConfigured()) {
        setError('OAuth not configured. Contact developer.')
        return
      }

      const accessToken = await getGoogleOAuthToken()
      const credential = GoogleAuthProvider.credential(null, accessToken)
      const result = await signInWithCredential(auth, credential)
      await ensureUserProfile(result.user)
    } catch (err) {
      let errorMessage = 'Google login failed. '
      if (err.message.includes('cancelled') || err.message.includes('denied')) {
        errorMessage = 'Login cancelled.'
      } else if (err.message.includes('not available')) {
        errorMessage = 'This feature requires Chrome browser.'
      } else {
        errorMessage += err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/15">
            <i className="fas fa-graduation-cap text-2xl text-primary"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">StudyFlow</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            {mode === 'login' ? t('signIn') : mode === 'register' ? t('registerTitle') : t('resetPassword')}
          </p>
        </div>

        {/* Error/Message */}
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}
        {message && <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg p-3 mb-4">{message}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className={inputCls} placeholder="you@example.com" />
          </div>

          {mode !== 'reset' && (
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('password')}</label>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className={`${inputCls} !pr-10`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[calc(50%+4px)] text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-pointer transition-colors">
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('confirmPassword')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className={inputCls} placeholder="••••••••" />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-dark cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading && <i className="fas fa-spinner animate-spin"></i>}
            {mode === 'login' ? t('signIn') : mode === 'register' ? t('signUp') : t('resetPassword')}
          </button>
        </form>

        {/* Google Sign-In */}
        {mode !== 'reset' && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]"></div>
              <span className="text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]"></div>
            </div>
            <button onClick={handleGoogleSignIn} disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white dark:bg-surface-2 text-gray-700 dark:text-white/70 text-sm font-medium border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-surface-3 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <i className="fab fa-google text-primary"></i> {t('googleSignIn')}
            </button>
          </>
        )}

        {/* Mode Switch */}
        <div className="text-center mt-6 space-y-2">
          {mode === 'login' ? (
            <>
              <button onClick={() => { setMode('reset'); setError(''); setMessage('') }}
                className="text-xs text-primary hover:text-primary-dark cursor-pointer transition-colors">{t('forgotPassword')}</button>
              <p className="text-xs text-gray-500 dark:text-white/50">
                {t('noAccount')} <button onClick={() => { setMode('register'); setError(''); setMessage('') }}
                  className="text-primary hover:text-primary-dark font-medium cursor-pointer transition-colors">{t('signUp')}</button>
              </p>
            </>
          ) : (
            <button onClick={() => { setMode('login'); setError(''); setMessage('') }}
              className="text-xs text-primary hover:text-primary-dark cursor-pointer transition-colors">{t('goBack')}</button>
          )}
        </div>
      </div>
    </div>
  )
}
