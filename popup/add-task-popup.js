let attachedFile = null;
let attachedLink = null;

document.addEventListener('DOMContentLoaded', async function() {
    updateClockPopup();
    setInterval(updateClockPopup, 1000);
    
    // Check authentication before allowing access
    const isAuthenticated = await requireAuth(() => {
        loadClassesForTaskForm();
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown
    
    // Event listeners
    document.getElementById('add-task-form-popup').addEventListener('submit', addTaskFromPopup);
    document.getElementById('back-to-popup').addEventListener('click', goBackToPopup);
    document.getElementById('task-file-upload').addEventListener('change', handleFileUpload);
    document.getElementById('attach-link-btn').addEventListener('click', toggleLinkInput);
    document.getElementById('task-link-input').addEventListener('blur', handleLinkInput);
    
    // Custom select for class
    const customSelectButton = document.querySelector('.custom-select-button');
    const classSelectPanel = document.getElementById('class-select-panel');
    const classSearchInput = document.getElementById('task-class-search-popup');
    
    if (customSelectButton) {
        customSelectButton.addEventListener('click', function(e) {
            e.stopPropagation();
            classSelectPanel.classList.toggle('show');
        });
    }
    
    if (classSearchInput) {
        classSearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const options = classSelectPanel.querySelectorAll('.custom-select-option');
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                option.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
    
    // Close select panel when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select-wrapper')) {
            classSelectPanel.classList.remove('show');
        }
    });
});

function goBackToPopup() {
    window.location.href = 'popup.html';
}

async function loadClassesForTaskForm() {
    try {
        const classes = await syncService.getClasses();
        const classSelectPanel = document.getElementById('class-select-panel');
        const hiddenInput = document.getElementById('task-class-popup');
        const selectedClassName = document.getElementById('selected-class-name');
        
        if (!classSelectPanel) return;
        
        const optionsContainer = classSelectPanel.querySelector('.custom-select-options-container');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';

        const noneOption = document.createElement('div');
        noneOption.className = 'custom-select-option';
        noneOption.textContent = 'Select Class';
        noneOption.dataset.value = '';
        noneOption.addEventListener('click', function() {
            hiddenInput.value = '';
            selectedClassName.textContent = 'Select Class';
            classSelectPanel.classList.remove('show');
        });
        optionsContainer.appendChild(noneOption);

        classes.forEach(cls => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.textContent = cls.name;
            option.dataset.value = cls.name;
            option.addEventListener('click', function() {
                hiddenInput.value = cls.name;
                selectedClassName.textContent = cls.name;
                classSelectPanel.classList.remove('show');
            });
            optionsContainer.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function toggleTaskTextInput() {
    // No longer needed since "Other" option is removed
}

function toggleLinkInput() {
    const linkInput = document.getElementById('task-link-input');
    linkInput.style.display = linkInput.style.display === 'none' ? 'block' : 'none';
    if (linkInput.style.display === 'block') {
        linkInput.focus();
    }
}

function handleLinkInput(e) {
    const linkValue = e.target.value.trim();
    const linkIcon = document.querySelector('#attach-link-btn i');

    if (linkValue) {
        attachedLink = linkValue;
        linkIcon.classList.remove('fa-link');
        linkIcon.classList.add('fa-check-circle', 'color-success');
    } else {
        attachedLink = null;
        linkIcon.classList.remove('fa-check-circle', 'color-success');
        linkIcon.classList.add('fa-link');
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    const uploadIcon = document.querySelector('label[for="task-file-upload"] i');

    if (!file) {
        attachedFile = null;
        uploadIcon.classList.remove('fa-check-circle', 'color-success');
        uploadIcon.classList.add('fa-paperclip');
        return;
    }

    attachedFile = file;
    uploadIcon.classList.remove('fa-paperclip');
    uploadIcon.classList.add('fa-check-circle', 'color-success');
}

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function addTaskFromPopup(e) {
    e.preventDefault();
    const taskTitleInput = document.getElementById('task-title-popup');
    const taskType = document.getElementById('task-type-popup').value;
    const taskDeadlineInput = document.getElementById('task-deadline-popup');
    const taskPriorityInput = document.getElementById('task-priority-popup');
    const taskClassInput = document.getElementById('task-class-popup');
    const taskNotesInput = document.getElementById('task-notes-popup');
    
    const title = taskTitleInput.value.trim();
    const text = taskType;
    const deadline = taskDeadlineInput.value;
    const priority = taskPriorityInput.value;
    const className = taskClassInput.value;
    const notes = taskNotesInput.value.trim();

    if (title === '') {
        taskTitleInput.focus();
        return;
    }

    try {
        let fileContent = null;
        if (attachedFile) {
            fileContent = await readFileAsDataURL(attachedFile);
        }

        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const createdDay = dayNames[now.getDay()];
        
        // Determine task day - use deadline day if available, otherwise use created day
        let taskDay = createdDay;
        if (deadline) {
            const deadlineDate = new Date(deadline);
            taskDay = dayNames[deadlineDate.getDay()];
        }
        
        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            text: text,
            deadline: deadline,
            priority: priority,
            className: className,
            completed: false,
            dateAdded: now.toISOString(),
            createdDay: createdDay,
            day: taskDay,
            file: fileContent ? { name: attachedFile.name, content: fileContent } : null,
            link: attachedLink,
            notes: notes || null
        };
        
        await syncService.addTask(newTask);
        
        // Trigger deadline check and badge update
        chrome.runtime.sendMessage({ action: 'checkDeadlines' });
        chrome.runtime.sendMessage({ action: 'updateBadge' });
        
        // Reset form
        taskTitleInput.value = '';
        taskDeadlineInput.value = '';
        document.getElementById('task-type-popup').value = 'Exam';
        taskNotesInput.value = '';

        taskClassInput.value = '';
        document.getElementById('selected-class-name').textContent = 'Select Class';
        
        attachedFile = null;
        document.getElementById('task-file-upload').value = '';
        const uploadIcon = document.querySelector('label[for="task-file-upload"] i');
        uploadIcon.classList.remove('fa-check-circle', 'color-success');
        uploadIcon.classList.add('fa-paperclip');

        attachedLink = null;
        const linkInput = document.getElementById('task-link-input');
        linkInput.value = '';
        linkInput.style.display = 'none';
        const linkIcon = document.querySelector('#attach-link-btn i');
        linkIcon.classList.remove('fa-check-circle', 'color-success');
        linkIcon.classList.add('fa-link');

        showNotification('Task Added!', title);
        
        // Go back to popup after a short delay
        setTimeout(() => {
            goBackToPopup();
        }, 1000);
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error', error.message || 'Failed to add task');
    }
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

// Dark mode functions
function initializeDarkMode() {
    chrome.storage.local.get(['darkMode'], function(result) {
        const isDarkMode = result.darkMode || false;
        applyDarkMode(isDarkMode);
        updateDarkModeIcon(isDarkMode);
    });
    
    chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local' && changes.darkMode) {
            const isDarkMode = changes.darkMode.newValue || false;
            applyDarkMode(isDarkMode);
            updateDarkModeIcon(isDarkMode);
        }
    });
}

function toggleDarkMode() {
    chrome.storage.local.get(['darkMode'], function(result) {
        const currentMode = result.darkMode || false;
        const newMode = !currentMode;
        
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

// Clock functions
function updateClockPopup() {
    const now = new Date();
    const dateEl = document.getElementById('current-date-popup');
    const timeEl = document.getElementById('current-time-popup');
    
    if (dateEl) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = dayNames[now.getDay()];
        const date = now.getDate();
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        dateEl.textContent = `${day}, ${date} ${month} ${year}`;
    }
    
    if (timeEl) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
