/**
 * Auth Guard - Reusable authentication check for popup pages
 * Ensures user is logged in before allowing access to features
 */

/**
 * Check if user is authenticated and redirect to login if not
 * @param {Function} onAuthSuccess - Callback to run if user is logged in
 * @returns {boolean} True if authenticated, false if not
 */
async function requireAuth(onAuthSuccess) {
    // Wait for sync service to initialize
    if (!syncService._initialized) {
        await syncService.init();
    }
    
    if (!syncService.isLoggedIn()) {
        showAuthRequiredOverlay();
        return false;
    }
    
    // User is logged in, proceed
    if (onAuthSuccess) {
        onAuthSuccess();
    }
    return true;
}

/**
 * Show auth required overlay with login/register options
 */
function showAuthRequiredOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-required-overlay';
    overlay.className = 'auth-required-overlay';
    overlay.innerHTML = `
        <div class="auth-required-modal">
            <div class="auth-required-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h2 class="auth-required-title">Authentication Required</h2>
            <p class="auth-required-message">
                You must be logged in to use Study Dashboard. 
                <br>All your data is securely stored in the cloud.
            </p>
            <div class="auth-required-buttons">
                <button class="btn btn-primary" id="go-to-login">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="btn btn-secondary" id="go-to-register">
                    <i class="fas fa-user-plus"></i> Register
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add event listeners - Open in new tab instead of navigating in popup
    document.getElementById('go-to-login').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/login-popup.html') });
        window.close(); // Close the popup
    });
    
    document.getElementById('go-to-register').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/login-popup.html?mode=register') });
        window.close(); // Close the popup
    });
}

// Add CSS styles for auth overlay
const authStyles = document.createElement('style');
authStyles.textContent = `
    .auth-required-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .auth-required-modal {
        background: white;
        border-radius: 16px;
        padding: 40px 30px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .auth-required-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .auth-required-icon i {
        font-size: 36px;
        color: white;
    }
    
    .auth-required-title {
        font-size: 24px;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 12px;
    }
    
    .auth-required-message {
        font-size: 14px;
        color: #718096;
        line-height: 1.6;
        margin-bottom: 30px;
    }
    
    .auth-required-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
    
    .auth-required-buttons .btn {
        flex: 1;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .auth-required-buttons .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
    }
    
    .auth-required-buttons .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }
    
    .auth-required-buttons .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
    }
    
    .auth-required-buttons .btn-secondary:hover {
        background: #cbd5e0;
        transform: translateY(-2px);
    }
    
    body.dark-mode .auth-required-modal {
        background: #2d3748;
    }
    
    body.dark-mode .auth-required-title {
        color: #f7fafc;
    }
    
    body.dark-mode .auth-required-message {
        color: #a0aec0;
    }
    
    body.dark-mode .auth-required-buttons .btn-secondary {
        background: #4a5568;
        color: #e2e8f0;
    }
    
    body.dark-mode .auth-required-buttons .btn-secondary:hover {
        background: #5a6676;
    }
`;
document.head.appendChild(authStyles);
