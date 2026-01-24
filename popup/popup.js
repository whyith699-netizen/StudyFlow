
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication before loading anything
    const isAuthenticated = await requireAuth(() => {
        initializeExtension();
        loadExtensionData();
        loadTaskCounts();
        initializeSyncStatus();
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown

    const classSearch = document.getElementById('class-search-popup');
    const tasksSection = document.getElementById('tasks-section');

    if (classSearch) classSearch.addEventListener('input', filterClassesPopup);
    if (tasksSection) {
        tasksSection.addEventListener('click', function() {
            window.location.href = 'my-tasks-popup.html';
        });
    }

    // Class pagination
    const prevBtn = document.getElementById('class-prev-btn');
    const nextBtn = document.getElementById('class-next-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentClassPage > 1) {
                currentClassPage--;
                renderClassesPopup();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // Calculate total pages based on filtered classes
            const dayMapping = {
                'senin': 'monday',
                'selasa': 'tuesday',
                'rabu': 'wednesday',
                'kamis': 'thursday',
                'jumat': 'friday',
                'sabtu': 'saturday'
            };
            const mappedFilter = dayMapping[currentDayFilter] || currentDayFilter;
            const dayFilteredClasses = myClassesCache.filter(cls => {
                if (currentDayFilter === 'all') return true;
                if (!cls.days || cls.days.length === 0) return false;
                const classDays = cls.days.map(day => dayMapping[day] || day);
                return classDays.includes(mappedFilter);
            });
            const filteredClasses = dayFilteredClasses.filter(cls =>
                cls.name.toLowerCase().includes(currentSearchTerm)
            );
            const totalPages = Math.ceil(filteredClasses.length / CLASSES_PER_PAGE);
            if (currentClassPage < totalPages) {
                currentClassPage++;
                renderClassesPopup();
            }
        });
    }

    // Initialize dark mode and clock

    updateClockPopup();
    setInterval(updateClockPopup, 1000);

    // Reload task counts when needed (auth changes, etc)
    // Note: No longer listening to storage changes since we're cloud-only

    // Day migration is no longer needed with cloud-only storage

    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            setDayFilter(this.dataset.day);
        });
    });

    const viewMoreClasses = document.getElementById('view-more-classes');
    if (viewMoreClasses) {
        viewMoreClasses.addEventListener('click', function () {
            document.getElementById('class-list-popup').classList.add('expanded');
            this.style.display = 'none';
        });
    }

    const customSelectButton = document.querySelector('.custom-select-button');
    if (customSelectButton) {
        customSelectButton.addEventListener('click', function () {
            const panel = document.getElementById('class-select-panel');
            panel.classList.toggle('show');
        });
    }

    window.addEventListener('click', function (e) {
        const wrapper = document.querySelector('.custom-select-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            document.getElementById('class-select-panel').classList.remove('show');
        }
    });

    // Import/Export Data Buttons
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportAllData);
    }

    const importDataBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', function() {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                importAllData(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
});


async function loadTaskCounts() {
    try {
        const tasks = await syncService.getTasks();
        const pendingTasks = tasks.filter(t => !t.completed);

        // Update badge count
        const badgeElement = document.getElementById('task-count-badge-popup');
        const badgeNumber = badgeElement.querySelector('.badge-number');
        const count = pendingTasks.length;

        badgeNumber.textContent = count;
        badgeElement.setAttribute('data-count', count);

        if (count === 0) {
            badgeElement.style.display = 'none';
        } else {
            badgeElement.style.display = 'flex';
            // Add pulse animation if count changed
            badgeElement.classList.add('badge-pulse');
            setTimeout(() => {
                badgeElement.classList.remove('badge-pulse');
            }, 600);
        }

        // Calculate breakdown
        const breakdown = {
            'Exam': 0,
            'Individual Task': 0,
            'Group Task': 0,
            'Other': 0
        };

        pendingTasks.forEach(task => {
            const taskType = task.text;
            if (taskType === 'Exam' || taskType === 'Daily Quiz' || taskType === 'Ulangan Harian') {
                breakdown['Exam']++;
            } else if (taskType === 'Individual Task' || taskType === 'Tugas Individu') {
                breakdown['Individual Task']++;
            } else if (taskType === 'Group Task' || taskType === 'Tugas Kelompok') {
                breakdown['Group Task']++;
            } else {
                breakdown['Other']++;
            }
        });

        // Update breakdown tooltip
        document.getElementById('breakdown-ulangan').textContent = breakdown['Exam'];
        document.getElementById('breakdown-individu').textContent = breakdown['Individual Task'];
        document.getElementById('breakdown-kelompok').textContent = breakdown['Group Task'];
        document.getElementById('breakdown-lainnya').textContent = breakdown['Other'];

        // Update inline quick stats
        const examCountEl = document.getElementById('stat-exam-count');
        const individualCountEl = document.getElementById('stat-individual-count');
        const groupCountEl = document.getElementById('stat-group-count');
        
        if (examCountEl) examCountEl.textContent = breakdown['Exam'];
        if (individualCountEl) individualCountEl.textContent = breakdown['Individual Task'];
        if (groupCountEl) groupCountEl.textContent = breakdown['Group Task'];
    } catch (error) {
        console.error('Error loading task counts:', error);
    }
}



function initializeExtension() {
    // Ensure "All" filter is active on initialization
    currentDayFilter = 'all';
    currentClassPage = 1; // Reset to first page
    document.querySelectorAll('.day-btn').forEach(btn => {
        if (btn.dataset.day === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    loadClassesPopup();

    // Check deadlines and update badge when extension opens
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'checkDeadlines' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Error checking deadlines:', chrome.runtime.lastError);
            }
        });
        chrome.runtime.sendMessage({ action: 'updateBadge' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Error updating badge:', chrome.runtime.lastError);
            }
        });
    }, 300); // Reduced delay for faster response
}


let myClassesCache = [];
let currentDayFilter = 'all';
let currentSearchTerm = '';
let currentClassPage = 1;
const CLASSES_PER_ROW = 3; // 3 columns
const ROWS_PER_PAGE = 8; // 8 rows per page
const CLASSES_PER_PAGE = CLASSES_PER_ROW * ROWS_PER_PAGE; // 3 columns x 8 rows = 24 classes per page

async function loadClassesPopup() {
    try {
        const classes = await syncService.getClasses();
        
        // Map old Indonesian day names to new English day names for compatibility  
        const dayMapping = {
            'senin': 'monday',
            'selasa': 'tuesday',
            'rabu': 'wednesday',
            'kamis': 'thursday',
            'jumat': 'friday',
            'sabtu': 'saturday'
        };

        classes.forEach(cls => {
            if (cls.days && Array.isArray(cls.days)) {
                cls.days = cls.days.map(day => dayMapping[day] || day);
            }
        });

        myClassesCache = classes;
        renderClassesPopup();
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function filterClassesPopup(event) {
    currentSearchTerm = event.target.value.toLowerCase();
    currentClassPage = 1; // Reset to first page when search changes
    renderClassesPopup();
}

function setDayFilter(day) {
    currentDayFilter = day;
    currentClassPage = 1; // Reset to first page when filter changes
    document.querySelectorAll('.day-btn').forEach(btn => {
        if (btn.dataset.day === day) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderClassesPopup();
}

function renderClassesPopup() {
    const classList = document.getElementById('class-list-popup');
    const pagination = document.getElementById('class-pagination');
    const prevBtn = document.getElementById('class-prev-btn');
    const nextBtn = document.getElementById('class-next-btn');
    const pageInfo = document.getElementById('class-page-info');

    classList.innerHTML = '';

    // Map old Indonesian day names to new English names for compatibility
    const dayMapping = {
        'senin': 'monday',
        'selasa': 'tuesday',
        'rabu': 'wednesday',
        'kamis': 'thursday',
        'jumat': 'friday',
        'sabtu': 'saturday'
    };

    const mappedFilter = dayMapping[currentDayFilter] || currentDayFilter;

    const dayFilteredClasses = myClassesCache.filter(cls => {
        if (currentDayFilter === 'all') return true;
        if (!cls.days || cls.days.length === 0) return false;
        const classDays = cls.days.map(day => dayMapping[day] || day);
        return classDays.includes(mappedFilter);
    });

    const filteredClasses = dayFilteredClasses.filter(cls =>
        cls.name.toLowerCase().includes(currentSearchTerm)
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredClasses.length / CLASSES_PER_PAGE);
    const startIndex = (currentClassPage - 1) * CLASSES_PER_PAGE;
    const endIndex = startIndex + CLASSES_PER_PAGE;
    const classesToShow = filteredClasses.slice(startIndex, endIndex);

    // Always render exactly 24 slots (3 columns x 8 rows) to maintain fixed grid
    for (let i = 0; i < CLASSES_PER_PAGE; i++) {
        const classItem = document.createElement('div');
        classItem.className = 'class-item';

        if (i < classesToShow.length) {
            // Render actual class
            const cls = classesToShow[i];
            const link = document.createElement('a');
            link.href = chrome.runtime.getURL(`popup/class-detail-popup.html?id=${cls.id}&from=popup`);
            link.className = 'icon-item';
            link.title = cls.name;
            const iconClass = cls.icon || getSubjectIcon(cls.name);
            link.innerHTML = `<i class="fas ${iconClass}"></i>`;

            const name = document.createElement('span');
            name.className = 'class-name';
            name.textContent = cls.name;

            classItem.appendChild(link);
            classItem.appendChild(name);
        } else if (filteredClasses.length === 0 && i === 9) {
            // Show empty state message in the middle row (row 4, spanning all 3 columns, slot 9-11)
            classItem.style.gridColumn = '1 / -1';
            classItem.style.gridRow = '4 / 5';
            classItem.style.visibility = 'visible';
            classItem.style.display = 'flex';
            classItem.style.alignItems = 'center';
            classItem.style.justifyContent = 'center';
            classItem.innerHTML = '<p style="font-size: 0.8rem; color: #6b7280; text-align: center; margin: 0;">No classes found for this filter.</p>';
            // Skip next 2 slots (10, 11) since this message spans 3 columns
            i += 2;
        } else {
            // Fill with empty slot to maintain grid structure
            classItem.style.visibility = 'hidden';
        }

        classList.appendChild(classItem);
    }

    // Update pagination
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        pageInfo.textContent = `${currentClassPage} / ${totalPages}`;
        prevBtn.disabled = currentClassPage === 1;
        nextBtn.disabled = currentClassPage === totalPages;
    } else {
        pagination.style.display = 'none';
    }
}


function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}



function updateClockPopup() {
    const now = new Date();

    // Format date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = dayNames[now.getDay()];
    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const dateString = `${dayName}, ${day} ${month} ${year}`;

    // Format time
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const dateElement = document.getElementById('current-date-popup');
    const timeElement = document.getElementById('current-time-popup');

    if (dateElement) {
        dateElement.textContent = dateString;
    }
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}



function saveTimerState() {
    chrome.storage.local.set({
        currentTime: currentTime,
        isRunning: isRunning,
        lastUpdate: Date.now()
    });
}

function loadExtensionData() {
    chrome.storage.local.get(['currentTime', 'isRunning', 'lastUpdate'], function (result) {
        if (result.currentTime !== undefined) {
            const timeElapsed = Math.floor((Date.now() - (result.lastUpdate || 0)) / 1000);

            if (result.isRunning && timeElapsed > 0) {
                currentTime = Math.max(0, result.currentTime - timeElapsed);
            } else {
                currentTime = result.currentTime;
            }

            updateTimerDisplay();

            if (result.isRunning && currentTime > 0) {
                startTimer();
            }
        }
    });
}

function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: #38a169;
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.8rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        ">
            <strong>${title}</strong><br>${message}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);


function getSubjectIcon(name) {
    const lowerName = name.toLowerCase();
    
    // Religion (Priority 1)
    if (lowerName.includes('agama') || lowerName.includes('religion') || lowerName.includes('pai') || lowerName.includes('kristen') || lowerName.includes('katolik') || lowerName.includes('islam')) return 'fa-hands-praying';
    
    // Science & Math
    if (lowerName.includes('matematika') || lowerName.includes('math') || lowerName.includes('kalkulus') || lowerName.includes('aljabar')) return 'fa-calculator';
    if (lowerName.includes('fisika') || lowerName.includes('physics')) return 'fa-atom';
    if (lowerName.includes('kimia') || lowerName.includes('chem')) return 'fa-flask';
    if (lowerName.includes('biologi') || lowerName.includes('bio')) return 'fa-dna';
    if (lowerName.includes('ipa') || lowerName.includes('science')) return 'fa-microscope';

    // Tech
    if (lowerName.includes('informatika') || lowerName.includes('tik') || lowerName.includes('komputer') || lowerName.includes('cs') || lowerName.includes('it') || lowerName.includes('coding')) return 'fa-laptop-code';
    if (lowerName.includes('prakarya') || lowerName.includes('pkwu') || lowerName.includes('craft')) return 'fa-screwdriver-wrench';
    if (lowerName.includes('kka') || lowerName.includes('ai') || lowerName.includes('kecerdasan')) return 'fa-brain';
    
    // Languages
    if (lowerName.includes('inggris') || lowerName.includes('english') || lowerName.includes('eng')) return 'fa-earth-americas';
    if (lowerName.includes('indo') || lowerName.includes('sastra')) return 'fa-book-open';
    if (lowerName.includes('jerman') || lowerName.includes('german')) return 'fa-beer'; 
    if (lowerName.includes('jepang') || lowerName.includes('japan') || lowerName.includes('nihongo')) return 'fa-torii-gate';
    if (lowerName.includes('arab') || lowerName.includes('arabic')) return 'fa-moon';
    if (lowerName.includes('mandarin') || lowerName.includes('chinese')) return 'fa-yin-yang';
    if (lowerName.includes('jawa') || lowerName.includes('javanese')) return 'fa-scroll';
    if (lowerName.includes('bahasa') || lowerName.includes('language')) return 'fa-language';
    
    // Social Studies
    if (lowerName.includes('sejarah') || lowerName.includes('history')) return 'fa-landmark';
    if (lowerName.includes('geografi') || lowerName.includes('geo')) return 'fa-map-location-dot';
    if (lowerName.includes('ekonomi') || lowerName.includes('economy') || lowerName.includes('akuntansi')) return 'fa-chart-line';
    if (lowerName.includes('sosiologi') || lowerName.includes('socio') || lowerName.includes('ips')) return 'fa-users';
    if (lowerName.includes('pkn') || lowerName.includes('civic') || lowerName.includes('pancasila') || lowerName.includes('kewarganegaraan')) return 'fa-scale-balanced';
    
    // Arts & PE (Lower priority, removed 'pe')
    if (lowerName.includes('seni') || lowerName.includes('art') || lowerName.includes('budaya') || lowerName.includes('sbk')) return 'fa-palette';
    if (lowerName.includes('musik') || lowerName.includes('music')) return 'fa-music';
    if (lowerName.includes('olahraga') || lowerName.includes('pjok') || lowerName.includes('sport') || lowerName.includes('penjas')) return 'fa-person-running';
    
    // Others
    if (lowerName.includes('bk') || lowerName.includes('konseling')) return 'fa-comments';
    if (lowerName.includes('kka')) return 'fa-clipboard-check';
    
    return 'fa-chalkboard-teacher';
}

// ==========================================
// IMPORT / EXPORT FUNCTIONS
// ==========================================

function exportAllData() {
    const keysToExport = [
        'myClasses', 
        'tasks', 
 
        'hasInitializedClasses',
        'sentNotifications'
    ];
    
    chrome.storage.local.get(keysToExport, function(result) {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            extensionName: 'Study Dashboard',
            data: result
        };
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `study_dashboard_backup_${dateStr}.json`;
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const classCount = (result.myClasses || []).length;
        const taskCount = (result.tasks || []).length;
        showNotification('Export Berhasil! ✅', 
            `${classCount} kelas dan ${taskCount} tugas telah diekspor.`);
    });
}

function importAllData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.data) {
                showNotification('Import Gagal ❌', 'Format file tidak valid.');
                return;
            }
            
            const classCount = (importData.data.myClasses || []).length;
            const taskCount = (importData.data.tasks || []).length;
            const exportDate = importData.exportDate ? 
                new Date(importData.exportDate).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }) : 'Tidak diketahui';
            
            const confirmMessage = 
                `📦 Data yang akan diimpor:\n\n` +
                `📚 Kelas: ${classCount}\n` +
                `✅ Tugas: ${taskCount}\n` +
                `📅 Ekspor: ${exportDate}\n\n` +
                `⚠️ Ini akan MENGGANTI semua data saat ini.\n\n` +
                `Lanjutkan?`;
            
            if (!confirm(confirmMessage)) {
                showNotification('Import Dibatalkan', 'Tidak ada data yang diubah.');
                return;
            }
            
            const dataToImport = {};
            const validKeys = ['myClasses', 'tasks', 'darkMode', 'hasInitializedClasses', 'sentNotifications'];
            
            validKeys.forEach(key => {
                if (importData.data.hasOwnProperty(key)) {
                    dataToImport[key] = importData.data[key];
                }
            });
            
            chrome.storage.local.set(dataToImport, function() {
                showNotification('Import Berhasil! ✅', 
                    `${classCount} kelas dan ${taskCount} tugas berhasil diimpor.`);
                
                loadClassesPopup();
                loadTaskCounts();
                

                
                chrome.runtime.sendMessage({ action: 'updateBadge' });
            });
            
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Import Gagal ❌', 'File tidak valid.');
        }
    };
    
    reader.onerror = function() {
        showNotification('Import Gagal ❌', 'Tidak dapat membaca file.');
    };
    
    reader.readAsText(file);
}

// ==========================================
// SYNC STATUS FUNCTIONS
// ==========================================

/**
 * Update UI to reflect logged-in state
 */
function updateUIForLoggedInState(userEmail) {
    const accountBtn = document.getElementById('account-btn');
    const logoutBtn = document.getElementById('header-logout-btn');

    if (accountBtn) {
        accountBtn.classList.add('logged-in');
        accountBtn.title = `Logged in as ${userEmail}`;
        accountBtn.innerHTML = '<i class="fas fa-user-check"></i>';
    }

    if (logoutBtn) {
        logoutBtn.style.display = 'flex';
        logoutBtn.title = 'Logout';
    }
}

/**
 * Update UI to reflect logged-out state
 */
function updateUIForLoggedOutState() {
    const accountBtn = document.getElementById('account-btn');
    const logoutBtn = document.getElementById('header-logout-btn');

    if (accountBtn) {
        accountBtn.classList.remove('logged-in');
        accountBtn.title = 'Login / Register';
        accountBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
    }

    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
}

/**
 * Initialize sync status display and account button
 */
function initializeSyncStatus() {
    const accountBtn = document.getElementById('account-btn');
    const logoutBtn = document.getElementById('header-logout-btn');

    // Check if sync service is available
    if (typeof syncService === 'undefined') {
        console.log('Sync service not available');
        if (logoutBtn) logoutBtn.style.display = 'none';
        return;
    }

    // Open login in new tab to support Google Auth without popup closing
    if (accountBtn) {
        accountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: chrome.runtime.getURL('popup/login-popup.html') });
        });
    }

    // Listen for auth state updates from background script (when login happens in another tab)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'authStateUpdate') {
            console.log('[Popup] Received auth state update:', request.isLoggedIn);
            if (request.isLoggedIn) {
                updateUIForLoggedInState(request.userEmail);
                // Reload data from cloud
                if (typeof syncService !== 'undefined') {
                    syncService.syncFromCloud().then(() => {
                        loadClassesPopup();
                        loadTaskCounts();
                    }).catch(console.error);
                }
            } else {
                updateUIForLoggedOutState();
            }
        }
    });

    // Also check stored auth state for quick UI update
    chrome.storage.local.get(['authState'], (result) => {
        if (result.authState && result.authState.isLoggedIn) {
            // Check if auth state is recent (within last 24 hours)
            const isRecent = (Date.now() - result.authState.timestamp) < 24 * 60 * 60 * 1000;
            if (isRecent) {
                updateUIForLoggedInState(result.authState.userEmail);
            }
        }
    });

    // Initialize and check login status with Firebase
    syncService.init().then(isLoggedIn => {
        if (isLoggedIn) {
            const user = syncService.getCurrentUser();
            updateUIForLoggedInState(user.email);
        } else {
            updateUIForLoggedOutState();
        }
    }).catch(err => {
        console.error('Sync init failed:', err);
        if (logoutBtn) logoutBtn.style.display = 'none';
    });

    // Logout button click handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // Use custom modal instead of confirm() to avoid permission issues
            showConfirmModal('Logout', 'Are you sure you want to logout?', async function() {
                await syncService.logout();
                // Notify extension about logout
                chrome.runtime.sendMessage({
                    action: 'authStateChanged',
                    isLoggedIn: false,
                    userEmail: null
                });
                window.location.reload();
            });
        });
    }
}

/**
 * Trigger data sync after changes (call this after any data modification)
 */
function triggerDataSync() {
    if (typeof syncService !== 'undefined' && syncService.isLoggedIn()) {
        syncService.triggerSync();
    }
}