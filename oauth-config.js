/**
 * OAuth Configuration for Chrome Extension
 * 
 * To complete setup:
 * 1. Follow instructions in oauth_setup_guide.md
 * 2. Replace YOUR_CLIENT_ID_HERE with actual Client ID from Google Cloud Console
 * 
 * Client ID format: xxxxx-xxxxx.apps.googleusercontent.com
 */

const OAUTH_CONFIG = {
    // OAuth Client ID from Google Cloud Console (Web Application type)
    clientId: '912149378367-m8f9dmbftn2ulu56fl4rk19csjnr5tpp.apps.googleusercontent.com',
    
    // OAuth scopes - what info we request from Google
    scopes: [
        'email',
        'profile'
    ],
    
    // OAuth endpoints
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
};

/**
 * Check if OAuth is properly configured
 * @returns {boolean} True if configured
 */
function isOAuthConfigured() {
    if (!OAUTH_CONFIG.clientId || OAUTH_CONFIG.clientId === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
        console.warn('[OAUTH] Client ID not configured. Please update oauth-config.js');
        return false;
    }
    return true;
}

/**
 * Get OAuth configuration
 * @returns {object} OAuth config
 */
function getOAuthConfig() {
    return OAUTH_CONFIG;
}
