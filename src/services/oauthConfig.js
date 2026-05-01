/**
 * OAuth Configuration for Chrome Extension
 * Uses Chrome Identity API (launchWebAuthFlow)
 */
export const OAUTH_CONFIG = {
  clientId: '912149378367-m8f9dmbftn2ulu56fl4rk19csjnr5tpp.apps.googleusercontent.com',
  scopes: ['email', 'profile'],
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
}

export function isOAuthConfigured() {
  return OAUTH_CONFIG.clientId && !OAUTH_CONFIG.clientId.includes('YOUR_CLIENT_ID')
}

/**
 * Get a Google OAuth access token via chrome.identity.launchWebAuthFlow
 */
export function getGoogleOAuthToken() {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      reject(new Error('Chrome Identity API not available.'))
      return
    }

    const redirectUrl = chrome.identity.getRedirectURL()
    const authUrl = new URL(OAUTH_CONFIG.authUrl)
    authUrl.searchParams.set('client_id', OAUTH_CONFIG.clientId)
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('redirect_uri', redirectUrl)
    authUrl.searchParams.set('scope', OAUTH_CONFIG.scopes.join(' '))

    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (!responseUrl) {
          reject(new Error('No response from OAuth. User may have cancelled.'))
          return
        }
        try {
          const url = new URL(responseUrl)
          const params = new URLSearchParams(url.hash.substring(1))
          const token = params.get('access_token')
          if (token) resolve(token)
          else reject(new Error('No access token in OAuth response'))
        } catch (err) {
          reject(new Error('Failed to parse OAuth response: ' + err.message))
        }
      }
    )
  })
}
