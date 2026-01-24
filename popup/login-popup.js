document.addEventListener('DOMContentLoaded', function () {
    // Initialize dark mode


    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding form
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            document.getElementById(`${targetTab}-form`).classList.add('active');

            // Clear messages
            hideMessages();
        });
    });

    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Google Login - Uses Chrome Identity API
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            hideMessages();
            googleBtn.disabled = true;
            googleBtn.style.opacity = '0.7';
            
            try {
                if (typeof syncService === 'undefined') {
                    throw new Error('Sync service not available.');
                }
                
                console.log('[LOGIN] Initiating Chrome Identity OAuth flow...');
                
                // Chrome Identity API - returns user directly (no redirect)
                const user = await syncService.loginWithGoogle();
                
                console.log('[LOGIN] ✅ Login successful:', user.email);
                
                // Notify extension about auth state change
                chrome.runtime.sendMessage({
                    action: 'authStateChanged',
                    isLoggedIn: true,
                    userEmail: user.email
                });
                
                showSuccess('Login successful! Closing tab...');
                
                // Close tab automatically after brief delay
                setTimeout(() => {
                    window.close();
                }, 1500);
                
            } catch (error) {
                console.error('[LOGIN] Google login error:', error);
                
                // User-friendly error messages
                let errorMessage = 'Google login failed. ';
                if (error.message.includes('OAuth Client ID not configured')) {
                    errorMessage += 'OAuth setup required. Please contact developer.';
                } else if (error.message.includes('User may have cancelled')) {
                    errorMessage += 'Login cancelled.';
                } else if (error.message.includes('Chrome Identity API not available')) {
                    errorMessage += 'This feature requires Chrome browser.';
                } else {
                    errorMessage += error.message;
                }
                
                showError(errorMessage);
                googleBtn.disabled = false;
                googleBtn.style.opacity = '1';
            }
        });
    }

    // Login form submission
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        hideMessages();
        setLoading(submitBtn, true);

        try {
            if (typeof syncService === 'undefined') {
                throw new Error('Sync service not available. Please reload the extension.');
            }
            await syncService.login(email, password);
            const emailUser = syncService.getCurrentUser();
            // Notify extension about auth state change
            chrome.runtime.sendMessage({
                action: 'authStateChanged',
                isLoggedIn: true,
                userEmail: emailUser?.email
            });
            showSuccess('Login successful! Redirecting...');

            setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            showError(error.message || 'Login failed. Please try again.');
            setLoading(submitBtn, false);
        }
    });

    // Register form submission
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        hideMessages();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Validate passwords match
        if (password !== confirm) {
            showError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        setLoading(submitBtn, true);

        try {
            if (typeof syncService === 'undefined') {
                throw new Error('Sync service not available. Please reload the extension.');
            }
            await syncService.register(email, password);
            const regUser = syncService.getCurrentUser();
            // Notify extension about auth state change
            chrome.runtime.sendMessage({
                action: 'authStateChanged',
                isLoggedIn: true,
                userEmail: regUser?.email
            });
            showSuccess('Registration successful! Redirecting...');

            setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            showError(error.message || 'Registration failed. Please try again.');
            setLoading(submitBtn, false);
        }
    });

    // Forgot password button
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value.trim();
            
            if (!email) {
                showError('Please enter your email address first');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('Please enter a valid email address');
                return;
            }

            try {
                if (typeof syncService === 'undefined') {
                    throw new Error('Sync service not available.');
                }
                await syncService.resetPassword(email);
                showSuccess('Password reset email sent! Check your inbox.');
            } catch (error) {
                showError(error.message || 'Failed to send reset email.');
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (typeof syncService !== 'undefined') {
                await syncService.logout();
                // Notify extension about logout
                chrome.runtime.sendMessage({
                    action: 'authStateChanged',
                    isLoggedIn: false,
                    userEmail: null
                });
                // Reset UI
                window.location.reload();
            }
        });
    }

    // Check if already logged in and update UI accordingly
    if (typeof syncService !== 'undefined') {
        syncService.init().then(async isLoggedIn => {
            // Chrome Identity API doesn't use redirect flow
            // Login result is handled directly in button click handler above
            
            if (isLoggedIn) {
                const user = syncService.getCurrentUser();
                if (user) {
                    // Update UI for logged in state
                    document.getElementById('profile-email').textContent = user.email;
                    
                    // Hide tabs, Google btn, divider, and forms
                    const tabs = document.querySelector('.auth-tabs');
                    if (tabs) tabs.style.display = 'none';
                    
                    const googleBtn = document.getElementById('google-login-btn');
                    if (googleBtn) googleBtn.style.display = 'none';
                    
                    const divider = document.querySelector('.divider');
                    if (divider) divider.style.display = 'none';

                    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                    
                    // Show profile view
                    document.getElementById('profile-view').classList.add('active');
                    document.getElementById('profile-view').style.display = 'flex';
                    document.getElementById('profile-view').style.flexDirection = 'column';
                }
            }
        }).catch(err => {
            console.log('Auth check failed:', err);
        });
    }
});


function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    const messageText = errorDiv.querySelector('.message-text');
    if (messageText) {
        messageText.textContent = message;
    } else {
        errorDiv.textContent = message;
    }
    errorDiv.classList.add('show');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('auth-success');
    const messageText = successDiv.querySelector('.message-text');
    if (messageText) {
        messageText.textContent = message;
    } else {
        successDiv.textContent = message;
    }
    successDiv.classList.add('show');
}

function hideMessages() {
    document.getElementById('auth-error').classList.remove('show');
    document.getElementById('auth-success').classList.remove('show');
}

function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');

    if (isLoading) {
        button.classList.add('loading');
        btnText.innerHTML = '<span class="loading-spinner"></span>Please wait...';
    } else {
        button.classList.remove('loading');
        // Determine which form this button belongs to
        if (button.closest('#login-form')) {
            btnText.textContent = 'Login';
        } else {
            btnText.textContent = 'Create Account';
        }
    }
}


