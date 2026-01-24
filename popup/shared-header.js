// Shared Header Component - Ensures consistent header across all popup pages
function injectSharedHeader(options = {}) {
    const {
        title = 'StudyFlow',
        showBackButton = false,
        backUrl = 'popup.html',
        backButtonId = 'back-button'
    } = options;

    const headerHTML = `
        <header class="header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #ffffff; border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-sm); overflow: visible; position: relative; flex-shrink: 0; min-height: 56px;">
            <div class="header-left" ${showBackButton ? `id="${backButtonId}" style="cursor: pointer;"` : ''} style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <i class="fas ${showBackButton ? 'fa-arrow-left' : 'fa-graduation-cap'}" style="color: var(--primary); font-size: 1.375rem;"></i>
                <h1 style="font-size: 1.125rem; font-weight: 600; color: var(--dark); letter-spacing: -0.02em; margin: 0;">${title}</h1>
            </div>
            <div class="header-right" style="display: flex; align-items: center; gap: 12px;">
                <div class="time-display" style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right;">
                    <div id="current-date-popup" class="date" style="font-size: 0.75rem; font-weight: 400; color: var(--text-light); line-height: 1.2;"></div>
                    <div id="current-time-popup" class="time" style="font-size: 1.125rem; font-weight: 600; color: var(--dark); line-height: 1.2;"></div>
                </div>
                <button id="dark-mode-toggle" class="btn btn-icon" title="Toggle Dark Mode" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--gray-light); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </header>
    `;

    // Find the container and insert header at the beginning
    const container = document.querySelector('.extension-container') || document.querySelector('.class-detail-popup-container');
    if (container) {
        // Remove existing header if any
        const existingHeader = container.querySelector('header.header');
        if (existingHeader) {
            existingHeader.remove();
        }
        container.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // Setup back button if needed
    if (showBackButton) {
        const backBtn = document.getElementById(backButtonId);
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = backUrl;
            });
        }
    }

    // Initialize clock
    updateSharedClock();
    setInterval(updateSharedClock, 1000);

    // Initialize dark mode
    initSharedDarkMode();
}

function updateSharedClock() {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dateString = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const dateEl = document.getElementById('current-date-popup');
    const timeEl = document.getElementById('current-time-popup');
    if (dateEl) dateEl.textContent = dateString;
    if (timeEl) timeEl.textContent = timeString;
}

function initSharedDarkMode() {
    chrome.storage.local.get(['darkMode'], function(result) {
        const isDarkMode = result.darkMode || false;
        applySharedDarkMode(isDarkMode);
        updateSharedDarkModeIcon(isDarkMode);
    });

    // Setup toggle button
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            chrome.storage.local.get(['darkMode'], function(result) {
                const newMode = !result.darkMode;
                chrome.storage.local.set({ darkMode: newMode }, function() {
                    applySharedDarkMode(newMode);
                    updateSharedDarkModeIcon(newMode);
                });
            });
        });
    }
}

function applySharedDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
}

function updateSharedDarkModeIcon(isDark) {
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}
