let currentTaskId = null;
let attachedFile = null;
let attachedLink = null;
let originalTask = null;

document.addEventListener('DOMContentLoaded', async function() {
    updateClockPopup();
    setInterval(updateClockPopup, 1000);
    
    // Get task ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTaskId = urlParams.get('id');
    
    if (!currentTaskId) {
        showNotification('Error', 'No task ID provided.');
        setTimeout(() => window.location.href = 'my-tasks-popup.html', 1500);
        return;
    }
    
    // Check authentication before allowing access
    const isAuthenticated = await requireAuth(() => {
        loadTaskData();
        loadClassesForForm();
    });
    
    if (!isAuthenticated) return; // Auth required overlay shown
    
    // Back button
    document.getElementById('back-to-popup').addEventListener('click', function() {
        window.location.href = 'my-tasks-popup.html';
    });
    
    // Form submit
    document.getElementById('edit-task-form').addEventListener('submit', saveTask);
    
    // Delete button
    document.getElementById('delete-task-btn').addEventListener('click', function() {
        showConfirmModal('Delete Task', 'Are you sure you want to delete this task?', function() {
            deleteTask();
        });
    });
    
    // File upload
    document.getElementById('task-file-upload').addEventListener('change', handleFileUpload);
    
    // Link button
    document.getElementById('attach-link-btn').addEventListener('click', toggleLinkInput);
    document.getElementById('task-link-input').addEventListener('blur', handleLinkInput);
    
    // Custom select for class
    const customSelectButton = document.querySelector('.custom-select-button');
    const classSelectPanel = document.getElementById('class-select-panel');
    const classSearchInput = document.getElementById('task-class-search');
    
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

async function loadTaskData() {
    try {
        const tasks = await syncService.getTasks();
        const task = tasks.find(t => t.id === currentTaskId);
        
        if (!task) {
            showNotification('Error', 'Task not found.');
            setTimeout(() => window.location.href = 'my-tasks-popup.html', 1500);
            return;
        }
        
        originalTask = task;
        
        // Populate form
        document.getElementById('task-title').value = task.title || task.text || '';
        document.getElementById('task-type').value = task.text || 'Exam';
        document.getElementById('task-deadline').value = task.deadline || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-notes').value = task.notes || '';
        
        // Set class
        if (task.className) {
            document.getElementById('task-class').value = task.className;
            document.getElementById('selected-class-name').textContent = task.className;
        }
        
        // Set link
        if (task.link) {
            attachedLink = task.link;
            document.getElementById('task-link-input').value = task.link;
            document.getElementById('task-link-input').style.display = 'block';
            document.getElementById('attach-link-btn').classList.add('active');
        }
        
        // Set file indicator
        if (task.file) {
            attachedFile = task.file;
            document.querySelector('label[for="task-file-upload"]').classList.add('has-file');
        }
    } catch (error) {
        console.error('Error loading task:', error);
        showNotification('Error', error.message || 'Failed to load task');
    }
}

async function loadClassesForForm() {
    try {
        const classes = await syncService.getClasses();
        const classSelectPanel = document.getElementById('class-select-panel');
        const hiddenInput = document.getElementById('task-class');
        const selectedClassName = document.getElementById('selected-class-name');
        
        if (!classSelectPanel) return;
        
        const optionsContainer = classSelectPanel.querySelector('.custom-select-options-container');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';

        const noneOption = document.createElement('div');
        noneOption.className = 'custom-select-option';
        noneOption.textContent = 'No Class';
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

function toggleLinkInput() {
    const linkInput = document.getElementById('task-link-input');
    const linkBtn = document.getElementById('attach-link-btn');
    
    if (linkInput.style.display === 'none') {
        linkInput.style.display = 'block';
        linkInput.focus();
    } else {
        linkInput.style.display = 'none';
    }
}

function handleLinkInput(e) {
    const linkValue = e.target.value.trim();
    const linkBtn = document.getElementById('attach-link-btn');

    if (linkValue) {
        attachedLink = linkValue;
        linkBtn.classList.add('active');
    } else {
        attachedLink = null;
        linkBtn.classList.remove('active');
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    const uploadLabel = document.querySelector('label[for="task-file-upload"]');

    if (!file) {
        attachedFile = null;
        uploadLabel.classList.remove('has-file');
        return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = function(event) {
        attachedFile = {
            name: file.name,
            content: event.target.result
        };
        uploadLabel.classList.add('has-file');
    };
    reader.readAsDataURL(file);
}

async function saveTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const taskType = document.getElementById('task-type').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;
    const className = document.getElementById('task-class').value;
    const notes = document.getElementById('task-notes').value.trim();

    if (!title) {
        document.getElementById('task-title').focus();
        return;
    }

    try {
        // Determine task day from deadline
        let taskDay = originalTask.day;
        if (deadline) {
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const deadlineDate = new Date(deadline);
            taskDay = dayNames[deadlineDate.getDay()];
        }
        
        // Update task in cloud
        await syncService.updateTask(currentTaskId, {
            title: title,
            text: taskType,
            deadline: deadline,
            priority: priority,
            className: className,
            notes: notes || null,
            day: taskDay,
            file: attachedFile,
            link: attachedLink
        });
        
        chrome.runtime.sendMessage({ action: 'updateBadge' });
        showNotification('Task Updated!', title);
        setTimeout(() => window.location.href = 'my-tasks-popup.html', 1000);
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Error', error.message || 'Failed to update task');
    }
}

async function deleteTask() {
    try {
        await syncService.deleteTask(currentTaskId);
        
        chrome.runtime.sendMessage({ action: 'updateBadge' });
        showNotification('Task Deleted', 'Task has been removed.');
        setTimeout(() => window.location.href = 'my-tasks-popup.html', 1000);
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error', error.message || 'Failed to delete task');
    }
}

function showNotification(title, message) {
    const notification = document.createElement('div');
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

function showConfirmModal(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="confirm-modal-title">${title}</h3>
            <p class="confirm-modal-message">${message}</p>
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
        onConfirm();
    });
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Clock function
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
