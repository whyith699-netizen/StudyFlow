/**
 * Show custom confirmation modal (better than browser confirm for extensions)
 */
function showConfirmModal(title, message, onConfirm, iconClass = 'fa-exclamation-triangle') {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="confirm-modal-title">${title}</div>
            <div class="confirm-modal-message">${message}</div>
            <div class="confirm-modal-buttons">
                <button class="btn btn-cancel">Cancel</button>
                <button class="btn btn-confirm-delete">Confirm</button>
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
