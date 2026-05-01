import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, updatePassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'

export default function Header() {
  const { isDark, toggleDark } = useTheme()
  const { isLoggedIn, user, logout } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current) return
      if (!profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateStr = time.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = time.toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordMessage('')
  }

  const openProfileModal = () => {
    setIsProfileMenuOpen(false)
    setShowProfileModal(true)
  }

  const openPasswordModal = () => {
    setIsProfileMenuOpen(false)
    setPasswordError('')
    setPasswordMessage('')
    setShowPasswordModal(true)
  }

  const handleForgotPassword = async () => {
    setPasswordError('')
    setPasswordMessage('')
    if (!user?.email) {
      setPasswordError(t('passwordResetNoEmail'))
      return
    }

    try {
      await sendPasswordResetEmail(auth, user.email)
      setPasswordMessage(t('passwordResetSent'))
    } catch (err) {
      const messages = {
        'auth/invalid-email': t('passwordResetInvalidEmail'),
        'auth/too-many-requests': t('passwordTooManyRequests'),
        'auth/operation-not-allowed': t('passwordResetOperationDisabled'),
      }
      setPasswordError(messages[err.code] || err.message || t('passwordResetFailed'))
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!currentPassword) {
      setPasswordError(t('passwordCurrentRequired'))
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(t('passwordMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordMismatch'))
      return
    }
    if (!user?.email) {
      setPasswordError(t('passwordResetNoEmail'))
      return
    }

    setIsUpdatingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setPasswordMessage(t('passwordUpdated'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const messages = {
        'auth/wrong-password': t('passwordWrongCurrent'),
        'auth/invalid-credential': t('passwordWrongCurrent'),
        'auth/weak-password': t('passwordWeak'),
        'auth/requires-recent-login': t('passwordRequiresRecentLogin'),
        'auth/too-many-requests': t('passwordTooManyRequests'),
      }
      setPasswordError(messages[err.code] || err.message || t('passwordUpdateFailed'))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-surface-1 border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <i className="fas fa-graduation-cap text-primary text-xl"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90 tracking-tight">StudyFlow</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Time */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xs text-gray-500 dark:text-white/50 leading-tight">{dateStr}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/80 tabular-nums leading-tight">{timeStr}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200 dark:border-white/[0.08]">
            {/* Dashboard */}
            <button
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.tabs) {  
                  chrome.tabs.create({ url: 'https://studyflow-web.pages.dev/' })
                }
              }}              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 hover:text-gray-700 dark:hover:text-white/80 transition-all cursor-pointer"
              title={t('openDashboard')}
            >
              <i className="fas fa-globe text-sm"></i>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 hover:text-gray-700 dark:hover:text-white/80 transition-all cursor-pointer text-xs font-bold"
              title={t('language')}
            >
              {lang === 'en' ? 'ID' : 'EN'}
            </button>

            {/* Dark Mode */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 hover:text-gray-700 dark:hover:text-white/80 transition-all cursor-pointer"
              title={t('toggleDark')}
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
            </button>

            {/* Account Menu */}
            {isLoggedIn && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30"
                  title={t('account')}
                >
                  <i className="fas fa-user-circle text-sm"></i>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={openProfileModal}
                      className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-surface-3 transition-colors"
                    >
                      <i className="fas fa-id-card mr-2 text-gray-400"></i>{t('menuViewProfile')}
                    </button>
                    <button
                      onClick={openPasswordModal}
                      className="w-full text-left px-3 py-2.5 text-xs text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-surface-3 transition-colors"
                    >
                      <i className="fas fa-key mr-2 text-gray-400"></i>{t('menuChangePassword')}
                    </button>
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false)
                        await logout()
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>{t('logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{t('profileTitle')}</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-gray-500 dark:text-white/50">{t('profileNameLabel')}</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">{user?.displayName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-white/50">{t('profileEmailLabel')}</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-white/50">{t('profileProvidersLabel')}</p>
                <p className="text-gray-800 dark:text-white/90 font-medium">
                  {(user?.providerData || [])
                    .map((p) => (p.providerId === 'google.com' ? 'Google' : p.providerId === 'password' ? 'Email/Password' : p.providerId))
                    .join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{t('changePasswordTitle')}</h3>
              <button onClick={closePasswordModal} className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {passwordError && (
              <div className="mb-3 text-xs rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2.5">
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="mb-3 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-2.5">
                {passwordMessage}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:text-primary-dark transition-colors"
                >
                  {t('forgotPassword')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isUpdatingPassword && <i className="fas fa-spinner animate-spin"></i>}
                  {t('savePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
