let selectedIcon = 'fa-chalkboard-teacher';

// Available icons for class (~200 icons)
const availableIcons = [
    // Education
    'fa-graduation-cap', 'fa-book', 'fa-book-open', 'fa-book-reader', 'fa-chalkboard', 
    'fa-chalkboard-teacher', 'fa-school', 'fa-university', 'fa-pencil', 'fa-pen', 
    'fa-pen-fancy', 'fa-highlighter', 'fa-eraser', 'fa-ruler', 'fa-ruler-combined',
    'fa-backpack', 'fa-apple-whole', 'fa-glasses', 'fa-user-graduate', 'fa-award',
    
    // Science & Math
    'fa-calculator', 'fa-atom', 'fa-flask', 'fa-flask-vial', 'fa-vial', 'fa-vials',
    'fa-dna', 'fa-microscope', 'fa-magnet', 'fa-radiation', 'fa-biohazard',
    'fa-temperature-half', 'fa-fire', 'fa-fire-flame-curved', 'fa-droplet', 'fa-wind',
    'fa-cloud', 'fa-sun', 'fa-moon', 'fa-star', 'fa-meteor', 'fa-rocket',
    'fa-satellite', 'fa-satellite-dish', 'fa-space-shuttle', 'fa-infinity',
    'fa-square-root-variable', 'fa-superscript', 'fa-subscript', 'fa-percent',
    'fa-divide', 'fa-plus', 'fa-minus', 'fa-equals', 'fa-pi', 'fa-wave-square',
    
    // Technology
    'fa-laptop', 'fa-laptop-code', 'fa-computer', 'fa-desktop', 'fa-keyboard',
    'fa-mouse', 'fa-microchip', 'fa-memory', 'fa-hard-drive', 'fa-server',
    'fa-database', 'fa-code', 'fa-terminal', 'fa-bug', 'fa-robot',
    'fa-brain', 'fa-microphone', 'fa-headphones', 'fa-wifi', 'fa-bluetooth',
    'fa-usb', 'fa-ethernet', 'fa-mobile', 'fa-tablet', 'fa-tv',
    'fa-camera', 'fa-video', 'fa-film', 'fa-gamepad', 'fa-vr-cardboard',
    'fa-screwdriver-wrench', 'fa-wrench', 'fa-screwdriver', 'fa-hammer', 'fa-gear',
    'fa-gears', 'fa-cog', 'fa-plug', 'fa-battery-full', 'fa-bolt',
    
    // Languages & Communication
    'fa-language', 'fa-earth-americas', 'fa-earth-asia', 'fa-earth-europe', 'fa-earth-africa',
    'fa-globe', 'fa-flag', 'fa-comment', 'fa-comments', 'fa-message',
    'fa-envelope', 'fa-paper-plane', 'fa-spell-check', 'fa-font', 'fa-text-height',
    'fa-quote-left', 'fa-quote-right', 'fa-paragraph', 'fa-align-left', 'fa-list',
    
    // Countries & Culture
    'fa-torii-gate', 'fa-yin-yang', 'fa-om', 'fa-dharmachakra', 'fa-menorah',
    'fa-star-of-david', 'fa-cross', 'fa-mosque', 'fa-church', 'fa-kaaba',
    'fa-hands-praying', 'fa-pray', 'fa-scroll', 'fa-landmark', 'fa-monument',
    'fa-archway', 'fa-gopuram', 'fa-vihara', 'fa-place-of-worship',
    
    // History & Geography
    'fa-map', 'fa-map-location-dot', 'fa-location-dot', 'fa-compass', 'fa-mountain',
    'fa-mountain-sun', 'fa-tree', 'fa-seedling', 'fa-leaf', 'fa-cannabis',
    'fa-water', 'fa-volcano', 'fa-hurricane', 'fa-tornado', 'fa-city',
    'fa-building', 'fa-house', 'fa-igloo', 'fa-tent', 'fa-campground',
    
    // Economics & Business
    'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie', 'fa-chart-area', 'fa-chart-column',
    'fa-coins', 'fa-money-bill', 'fa-credit-card', 'fa-wallet', 'fa-piggy-bank',
    'fa-dollar-sign', 'fa-euro-sign', 'fa-yen-sign', 'fa-bitcoin-sign', 'fa-sack-dollar',
    'fa-briefcase', 'fa-building-columns', 'fa-scale-balanced', 'fa-handshake', 'fa-receipt',
    
    // Arts & Music
    'fa-palette', 'fa-paint-brush', 'fa-pen-ruler', 'fa-paintbrush', 'fa-brush',
    'fa-spray-can', 'fa-wand-magic-sparkles', 'fa-icons', 'fa-shapes', 'fa-swatchbook',
    'fa-music', 'fa-guitar', 'fa-drum', 'fa-headphones-simple', 'fa-radio',
    'fa-compact-disc', 'fa-record-vinyl', 'fa-volume-high', 'fa-sliders', 'fa-microphone-lines',
    'fa-masks-theater', 'fa-theater-masks', 'fa-film', 'fa-clapperboard', 'fa-ticket',
    
    // Sports & Health
    'fa-person-running', 'fa-person-walking', 'fa-person-swimming', 'fa-person-biking', 'fa-person-skiing',
    'fa-basketball', 'fa-football', 'fa-volleyball', 'fa-baseball', 'fa-golf-ball-tee',
    'fa-table-tennis-paddle-ball', 'fa-bowling-ball', 'fa-dumbbell', 'fa-weight-hanging', 'fa-medal',
    'fa-trophy', 'fa-ranking-star', 'fa-stopwatch', 'fa-heart', 'fa-heart-pulse',
    'fa-stethoscope', 'fa-syringe', 'fa-pills', 'fa-capsules', 'fa-bandage',
    'fa-hospital', 'fa-user-doctor', 'fa-wheelchair', 'fa-crutch', 'fa-tooth',
    
    // Social & People
    'fa-user', 'fa-users', 'fa-user-group', 'fa-people-group', 'fa-children',
    'fa-baby', 'fa-child', 'fa-person', 'fa-hand', 'fa-hands',
    'fa-handshake-angle', 'fa-people-arrows', 'fa-circle-user', 'fa-id-card', 'fa-address-book',
    
    // Nature & Animals
    'fa-paw', 'fa-dog', 'fa-cat', 'fa-fish', 'fa-fish-fins',
    'fa-dove', 'fa-crow', 'fa-feather', 'fa-feather-pointed', 'fa-bug',
    'fa-spider', 'fa-locust', 'fa-frog', 'fa-hippo', 'fa-otter',
    'fa-horse', 'fa-dragon', 'fa-kiwi-bird', 'fa-shrimp', 'fa-worm',
    
    // Objects & Tools
    'fa-scissors', 'fa-clipboard', 'fa-clipboard-list', 'fa-note-sticky', 'fa-thumbtack',
    'fa-paperclip', 'fa-folder', 'fa-folder-open', 'fa-file', 'fa-file-lines',
    'fa-box', 'fa-box-archive', 'fa-trash', 'fa-recycle', 'fa-clock',
    'fa-hourglass', 'fa-calendar', 'fa-calendar-days', 'fa-bell', 'fa-bullhorn',
    'fa-lightbulb', 'fa-key', 'fa-lock', 'fa-unlock', 'fa-shield',
    'fa-puzzle-piece', 'fa-dice', 'fa-chess', 'fa-crosshairs', 'fa-bullseye',
    
    // Food & Drinks
    'fa-utensils', 'fa-pizza-slice', 'fa-burger', 'fa-hotdog', 'fa-ice-cream',
    'fa-cake-candles', 'fa-cookie', 'fa-bread-slice', 'fa-egg', 'fa-bacon',
    'fa-carrot', 'fa-lemon', 'fa-pepper-hot', 'fa-mug-hot', 'fa-coffee',
    'fa-wine-glass', 'fa-beer-mug-empty', 'fa-martini-glass', 'fa-bottle-water', 'fa-glass-water',
    
    // Misc
    'fa-face-smile', 'fa-face-laugh', 'fa-face-grin', 'fa-gem', 'fa-crown',
    'fa-gift', 'fa-cake', 'fa-champagne-glasses', 'fa-ghost', 'fa-skull',
    'fa-wand-sparkles', 'fa-hat-wizard', 'fa-broom', 'fa-spider', 'fa-candy-cane'
];

document.addEventListener('DOMContentLoaded', async function() {
    updateClockPopup();
    setInterval(updateClockPopup, 1000);
    
    // Check authentication before allowing access
    const isAuthenticated = await requireAuth(() => {
        initIconPicker();
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown
    
    // Back button
    document.getElementById('back-to-popup').addEventListener('click', function() {
        window.location.href = 'popup.html';
    });
    
    // Add link button
    document.getElementById('add-link-btn').addEventListener('click', addLinkRow);
    updateRemoveButtons();
    
    // Form submit
    document.getElementById('add-class-form').addEventListener('submit', addClass);
});

function initIconPicker() {
    const iconGrid = document.getElementById('icon-grid');
    const previewBtn = document.getElementById('icon-preview-btn');
    
    // Populate icon grid
    availableIcons.forEach(icon => {
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'icon-btn';
        iconBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        iconBtn.dataset.icon = icon;
        
        iconBtn.addEventListener('click', function() {
            selectIcon(icon);
        });
        
        iconGrid.appendChild(iconBtn);
    });
    
    // Toggle icon picker visibility
    previewBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        iconGrid.classList.toggle('show');
    });
    
    // Close picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.icon-picker-compact')) {
            iconGrid.classList.remove('show');
        }
    });
    
    // Set default icon as active
    selectIcon('fa-chalkboard-teacher');
}

function selectIcon(icon) {
    selectedIcon = icon;
    document.getElementById('selected-icon').value = icon;
    document.getElementById('current-icon').className = `fas ${icon}`;
    document.getElementById('icon-grid').classList.remove('show');
    
    // Update active state
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.icon === icon);
    });
}

function addLinkRow() {
    const container = document.getElementById('links-container');
    const linkRow = document.createElement('div');
    linkRow.className = 'link-input-row';
    
    linkRow.innerHTML = `
        <input type="text" class="link-title-input" placeholder="Link Name (optional)">
        <input type="url" class="link-url-input" placeholder="URL Link" required>
        <button type="button" class="btn-remove-link">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    linkRow.querySelector('.btn-remove-link').addEventListener('click', function() {
        linkRow.remove();
        updateRemoveButtons();
    });
    
    container.appendChild(linkRow);
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const rows = document.querySelectorAll('.link-input-row');
    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.btn-remove-link');
        if (removeBtn) {
            removeBtn.style.display = rows.length > 1 ? 'flex' : 'none';
        }
    });
}

async function addClass(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('class-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Error', 'Class name is required.');
        return;
    }
    
    const linkRows = document.querySelectorAll('.link-input-row');
    const links = [];
    
    linkRows.forEach(row => {
        const titleInput = row.querySelector('.link-title-input');
        const urlInput = row.querySelector('.link-url-input');
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        
        if (url) {
            try {
                new URL(url);
                links.push({
                    url: url,
                    title: title || new URL(url).hostname
                });
            } catch (_) {
                showNotification('Error', `Invalid URL: ${url}`);
            }
        }
    });
    
    if (links.length === 0) {
        showNotification('Error', 'At least one valid link is required.');
        return;
    }
    
    const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
                              .map(cb => cb.value);
    
    if (selectedDays.length === 0) {
        showNotification('Error', 'Please select at least one day.');
        return;
    }
    
    try {
        const newClass = {
            id: 'class-' + Date.now(),
            name: name,
            links: links,
            days: selectedDays,
            icon: selectedIcon
        };
        
        await syncService.addClass(newClass);
        
        showNotification('Success', `Class "${name}" has been added.`);
        setTimeout(() => {
            window.location.href = 'popup.html';
        }, 1000);
    } catch (error) {
        console.error('Error adding class:', error);
        showNotification('Error', error.message || 'Failed to add class');
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

function showNotification(title, message) {
    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    notif.innerHTML = `<strong>${title}</strong><br>${message}`;
    notif.style.cssText = `
        position: fixed; top: 10px; right: 10px; background: ${title === 'Error' ? '#e53e3e' : '#38a169'}; color: white;
        padding: 10px 15px; border-radius: 8px; z-index: 10000; font-size: 0.8rem;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
