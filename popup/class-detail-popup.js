document.addEventListener('DOMContentLoaded', async function() {
    // Initialize clock
    updateClockPopup();
    setInterval(updateClockPopup, 1000);
    
    // Back button
    document.getElementById('back-button').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'popup.html';
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('id');
    
    if (!classId) {
        document.getElementById('class-name').textContent = 'Class not found';
        document.getElementById('links-container').innerHTML = '<div class="empty-state">No class ID provided</div>';
        return;
    }
    
    // Check authentication before allowing access
    const isAuthenticated = await requireAuth(() => {
        loadClassDetails(classId);
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown
    
    // Edit button
    document.getElementById('edit-class-btn').addEventListener('click', function() {
        window.location.href = `edit-class-popup.html?id=${classId}&from=detail`;
    });
    
    // Delete button
    document.getElementById('delete-class-btn').addEventListener('click', function() {
        showConfirmModal('Delete Class', 'Are you sure you want to delete this class?', function() {
            deleteClass(classId);
        });
    });
});

async function deleteClass(classId) {
    try {
        await syncService.deleteClass(classId);
        
        showNotification('Deleted', 'Class has been deleted.');
        setTimeout(() => window.location.href = 'popup.html', 1000);
    } catch (error) {
        console.error('Error deleting class:', error);
        showNotification('Error', error.message || 'Failed to delete class');
    }
}

function showNotification(title, message) {
    const notif = document.createElement('div');
    notif.innerHTML = `<strong>${title}</strong><br>${message}`;
    notif.style.cssText = `
        position: fixed; top: 10px; right: 10px; background: #ed8936; color: white;
        padding: 10px 15px; border-radius: 8px; z-index: 10000; font-size: 0.8rem;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function showConfirmModal(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="confirm-modal-title">${title}</div>
            <div class="confirm-modal-message">${message}</div>
            <div class="confirm-modal-buttons">
                <button class="btn btn-cancel">Cancel</button>
                <button class="btn btn-confirm-delete">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    overlay.querySelector('.btn-cancel').addEventListener('click', function() {
        overlay.remove();
    });
    
    overlay.querySelector('.btn-confirm-delete').addEventListener('click', function() {
        overlay.remove();
        if (onConfirm) onConfirm();
    });
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

async function loadClassDetails(classId) {
    try {
        const classes = await syncService.getClasses();
        const classData = classes.find(cls => cls.id === classId);

        if (!classData) {
            document.getElementById('class-name').textContent = 'Class not found';
            document.getElementById('links-container').innerHTML = '<div class="empty-state">Class not found</div>';
            return;
        }

        document.getElementById('class-name').textContent = classData.name;

        const daysContainer = document.getElementById('class-days');
        if (classData.days && classData.days.length > 0) {
            classData.days.forEach(day => {
                const dayTag = document.createElement('span');
                dayTag.className = 'day-tag';
                dayTag.textContent = day.charAt(0).toUpperCase() + day.slice(1);
                daysContainer.appendChild(dayTag);
            });
        }

        const linksContainer = document.getElementById('links-container');
        linksContainer.innerHTML = '';

        let links = [];
        if (classData.links && Array.isArray(classData.links)) {
            links = classData.links;
        }

        if (links.length === 0) {
            linksContainer.innerHTML = '<div class="empty-state">No links available</div>';
            return;
        }

        links.forEach(link => {
            const linkCard = document.createElement('a');
            linkCard.href = link.url;
            linkCard.target = '_blank';
            linkCard.className = 'link-card';

            const favicon = document.createElement('img');
            favicon.className = 'link-favicon';
            favicon.src = getFaviconUrl(link.url);
            favicon.alt = '';
            favicon.onerror = function() {
                this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
            };

            const linkInfo = document.createElement('div');
            linkInfo.className = 'link-info';

            const linkTitle = document.createElement('div');
            linkTitle.className = 'link-title';
            try {
                linkTitle.textContent = link.title || new URL(link.url).hostname;
            } catch (e) {
                linkTitle.textContent = link.title || link.url;
            }

            const linkUrl = document.createElement('div');
            linkUrl.className = 'link-url';
            try {
                linkUrl.textContent = new URL(link.url).hostname;
            } catch (e) {
                linkUrl.textContent = link.url;
            }

            linkInfo.appendChild(linkTitle);
            linkInfo.appendChild(linkUrl);
            linkCard.appendChild(favicon);
            linkCard.appendChild(linkInfo);
            linksContainer.appendChild(linkCard);
        });
    } catch (error) {
        console.error('Error loading class details:', error);
        document.getElementById('class-name').textContent = 'Error loading class';
        document.getElementById('links-container').innerHTML = '<div class="empty-state">Failed to load class details</div>';
    }
}

function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch (e) {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    }
}

// Dark mode functions
function initializeDarkMode() {
    chrome.storage.local.get(['darkMode'], function(result) {
        const isDarkMode = result.darkMode || false;
        applyDarkMode(isDarkMode);
        updateDarkModeIcon(isDarkMode);
    });
}

function toggleDarkMode() {
    chrome.storage.local.get(['darkMode'], function(result) {
        const newMode = !result.darkMode;
        chrome.storage.local.set({ darkMode: newMode }, function() {
            applyDarkMode(newMode);
            updateDarkModeIcon(newMode);
        });
    });
}

function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
}

function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Clock
function updateClockPopup() {
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
