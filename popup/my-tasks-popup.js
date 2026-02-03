document.addEventListener('DOMContentLoaded', async function() {
    updateClockPopup();
    setInterval(updateClockPopup, 1000);
    
    // Check authentication before allowing access
    const isAuthenticated = await requireAuth(() => {
        loadTasks();
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown
    
    // Back button
    document.getElementById('back-to-popup').addEventListener('click', function() {
        window.location.href = 'popup.html';
    });
    
    // Day filter
    document.getElementById('task-day-filter').addEventListener('change', function() {
        currentDayFilter = this.value;
        loadTasks();
    });

    // Class filter
    document.getElementById('task-class-filter').addEventListener('change', function() {
        currentClassFilter = this.value;
        loadTasks();
    });
    
    // Clear completed
    document.getElementById('clear-completed-btn').addEventListener('click', clearCompletedTasks);

    // Search input
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentSearchTerm = e.target.value.toLowerCase();
            loadTasks();
        });
    }
});

let currentDayFilter = 'all';
let currentSearchTerm = '';
let currentClassFilter = 'all';

async function loadTasks() {
    try {
        let tasks = await syncService.getTasks();
        
        // Populate class filter dynamically (only once or update if needed)
        populateClassFilter(tasks);
        
        if (currentDayFilter !== 'all') {
            tasks = tasks.filter(task => {
                if (!task.day) {
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    if (task.deadline) {
                        const deadlineDate = new Date(task.deadline);
                        return dayNames[deadlineDate.getDay()] === currentDayFilter;
                    }
                    return false;
                }
                return task.day === currentDayFilter;
            });
        }

        // Filter by class
        if (currentClassFilter !== 'all') {
            tasks = tasks.filter(task => task.className === currentClassFilter);
        }

        // Filter by search term
        if (currentSearchTerm) {
            tasks = tasks.filter(task => {
                const title = (task.title || task.text || '').toLowerCase();
                const className = (task.className || '').toLowerCase();
                const notes = (task.notes || '').toLowerCase();
                return title.includes(currentSearchTerm) || 
                       className.includes(currentSearchTerm) || 
                       notes.includes(currentSearchTerm);
            });
        }
        
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error', error.message || 'Failed to load tasks');
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        const emptyMsg = currentDayFilter !== 'all'
            ? `No tasks for ${currentDayFilter.charAt(0).toUpperCase() + currentDayFilter.slice(1)}.`
            : 'No tasks yet. Click "Add" to create one!';
        taskList.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
        return;
    }
    
    // Sort: Pinned first, then pending first, then by priority (high first), then by deadline (soonest first)
    tasks.sort((a, b) => {
        // Pinned tasks go to top
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        // Completed tasks go to bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        // Priority score (high = 3, medium = 2, low = 1, none = 0)
        const priorityScore = { 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityScore[a.priority] || 0;
        const bPriority = priorityScore[b.priority] || 0;
        
        // Sort by priority first (higher priority first)
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        // Then sort by deadline (soonest first)
        if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
        }
        // Tasks with deadline before tasks without
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        
        return 0;
    });
    
    tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item-popup';
        if (task.completed) taskEl.classList.add('completed');
        if (task.pinned) taskEl.classList.add('pinned');
        if (task.priority) taskEl.classList.add(`priority-${task.priority}`);
        
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
        if (isOverdue) taskEl.classList.add('overdue');
        
        const deadlineFormatted = task.deadline ? formatDate(task.deadline) : '';
        
        const priorityIcons = {
            'high': 'fa-exclamation-circle',
            'medium': 'fa-minus-circle',
            'low': 'fa-check-circle'
        };
        
        taskEl.innerHTML = `
            <div class="task-checkbox-wrapper">
                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-content">
                <div class="task-header-row">
                    <span class="task-title">${task.title || task.text}</span>
                    <span class="task-type-badge task-type-${(task.text || '').toLowerCase().replace(' ', '-')}">${task.text || ''}</span>
                    ${task.priority ? `<span class="priority-tag priority-${task.priority}">${task.priority}</span>` : ''}
                </div>
                <div class="task-meta-row">
                    ${task.className ? `<span class="task-meta-item"><i class="fas fa-chalkboard-teacher"></i> ${task.className}</span>` : ''}
                    ${deadlineFormatted ? `<span class="task-meta-item ${isOverdue ? 'overdue' : ''}"><i class="fas fa-clock"></i> ${deadlineFormatted}</span>` : ''}
                </div>
                ${task.link ? `<div class="task-attachment-row"><a href="${task.link}" target="_blank" class="task-link"><i class="fas fa-link"></i> ${task.link.length > 40 ? task.link.substring(0, 40) + '...' : task.link}</a></div>` : ''}
                ${task.file ? `<div class="task-attachment-row"><a href="${task.file.content}" download="${task.file.name}" class="task-file"><i class="fas fa-paperclip"></i> ${task.file.name}</a></div>` : ''}
                ${task.notes ? `<div class="task-notes-preview"><i class="fas fa-sticky-note"></i> ${task.notes.substring(0, 50)}${task.notes.length > 50 ? '...' : ''}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-pin-task ${task.pinned ? 'active' : ''}" data-id="${task.id}" title="${task.pinned ? 'Unpin task' : 'Pin task'}">
                    <i class="fas fa-thumbtack"></i>
                </button>
                <button class="btn-edit-task" data-id="${task.id}" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-task" data-id="${task.id}" title="Delete task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(taskEl);
        
        // Checkbox event
        taskEl.querySelector('.task-checkbox').addEventListener('change', function() {
            toggleTaskCompletion(task.id, this.checked);
        });
        
        // Edit event
        taskEl.querySelector('.btn-edit-task').addEventListener('click', function() {
            window.location.href = `edit-task-popup.html?id=${task.id}`;
        });
        
        // Pin event
        taskEl.querySelector('.btn-pin-task').addEventListener('click', function() {
            toggleTaskPin(task.id, !task.pinned);
        });
        
        // Delete event
        taskEl.querySelector('.btn-delete-task').addEventListener('click', function() {
            showConfirmModal('Delete Task', 'Are you sure you want to delete this task?', function() {
                deleteTask(task.id);
            });
        });
    });
}

async function toggleTaskCompletion(taskId, isCompleted) {
    try {
        await syncService.updateTask(taskId, {
            completed: isCompleted
        });
        
        loadTasks();
        chrome.runtime.sendMessage({ action: 'updateBadge' });
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Error', error.message || 'Failed to update task');
    }
}

async function toggleTaskPin(taskId, isPinned) {
    try {
        await syncService.updateTask(taskId, {
            pinned: isPinned
        });
        
        loadTasks();
        // showNotification(isPinned ? 'Pinned' : 'Unpinned', isPinned ? 'Task pinned to top.' : 'Task unpinned.');
    } catch (error) {
        console.error('Error pinning task:', error);
        showNotification('Error', error.message || 'Failed to update task pin status');
    }
}

async function deleteTask(taskId) {
    try {
        await syncService.deleteTask(taskId);
        
        loadTasks();
        chrome.runtime.sendMessage({ action: 'updateBadge' });
        showNotification('Deleted', 'Task has been deleted.');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error', error.message || 'Failed to delete task');
    }
}

async function clearCompletedTasks() {
    showConfirmModal('Clear Completed', 'Delete all completed tasks?', async function() {
        try {
            const tasks = await syncService.getTasks();
            const completedTasks = tasks.filter(task => task.completed);
            
            // Delete all completed tasks
            for (const task of completedTasks) {
                await syncService.deleteTask(task.id);
            }
            
            loadTasks();
            chrome.runtime.sendMessage({ action: 'updateBadge' });
            showNotification('Cleaned Up!', 'Completed tasks removed.');
        } catch (error) {
            console.error('Error clearing completed tasks:', error);
            showNotification('Error', error.message || 'Failed to clear tasks');
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
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
        position: fixed; top: 10px; right: 10px; background: #38a169; color: white;
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

function populateClassFilter(tasks) {
    const classFilter = document.getElementById('task-class-filter');
    if (!classFilter) return;

    // Get current selection to preserve it if possible
    const currentSelection = classFilter.value;

    // Extract unique class names
    const classNames = [...new Set(tasks.map(t => t.className).filter(Boolean))].sort();

    // Reset options
    classFilter.innerHTML = '<option value="all">All Classes</option>';

    classNames.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classFilter.appendChild(option);
    });

    // Restore selection if it still exists
    if (classNames.includes(currentSelection)) {
        classFilter.value = currentSelection;
    } else {
        classFilter.value = 'all';
        currentClassFilter = 'all'; // Reset filter if class no longer exists
    }
}
