class ManagerRequests {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupSearch();
        this.setupFilters();
        this.setupBulkActions();
        this.setupViewToggle();
    }

    init() {
        console.log('Manager Requests page initialized');
        this.showNotification('Requests page loaded successfully', 'success');
        this.updateRequestCounts();
    }

    setupEventListeners() {
        // Handle approve buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-approve') || e.target.closest('.btn-approve')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-approve') ? e.target : e.target.closest('.btn-approve');
                this.handleApproveRequest(button);
            }
        });

        // Handle reject buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-reject') || e.target.closest('.btn-reject')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-reject') ? e.target : e.target.closest('.btn-reject');
                this.handleRejectRequest(button);
            }
        });

        // Handle dispatch buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-dispatch') || e.target.closest('.btn-dispatch')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-dispatch') ? e.target : e.target.closest('.btn-dispatch');
                this.handleDispatchRequest(button);
            }
        });

        // Handle cancel buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-cancel') || e.target.closest('.btn-cancel')) {
                e.preventDefault();
                const button = e.target.classList.contains('btn-cancel') ? e.target : e.target.closest('.btn-cancel');
                this.handleCancelRequest(button);
            }
        });

        // Handle menu buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-btn')) {
                e.preventDefault();
                this.toggleActionMenu(e.target);
            }
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu')) {
                this.closeAllMenus();
            }
        });

        // Handle select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }

        // Handle individual checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('request-checkbox')) {
                this.handleCheckboxChange();
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('searchRequests');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterRequests(e.target.value);
                }, 300);
            });
        }
    }

    setupFilters() {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
    }

    setupBulkActions() {
        const approveSelectedBtn = document.querySelector('.bulk-btn.approve-selected');
        const rejectSelectedBtn = document.querySelector('.bulk-btn.reject-selected');

        if (approveSelectedBtn) {
            approveSelectedBtn.addEventListener('click', () => {
                this.handleBulkApprove();
            });
        }

        if (rejectSelectedBtn) {
            rejectSelectedBtn.addEventListener('click', () => {
                this.handleBulkReject();
            });
        }
    }

    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.toggleView(view);
            });
        });
    }

    async handleApproveRequest(button) {
        const requestId = button.dataset.requestId;
        const farmerName = button.dataset.farmerName;

        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⏳ Approving...</span>';
        button.disabled = true;
        button.classList.add('loading');

        try {
            const response = await fetch(`/api/requests/${requestId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(data.message, 'success');
                this.updateRequestStatus(requestId, 'approved');
                this.updateRequestCounts();
                this.showApprovalAnimation(farmerName);
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleRejectRequest(button) {
        const requestId = button.dataset.requestId;
        const farmerName = button.dataset.farmerName;

        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        // Show rejection reason modal
        const reason = await this.showRejectModal(farmerName);
        if (!reason) return; // User cancelled

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⏳ Rejecting...</span>';
        button.disabled = true;
        button.classList.add('loading');

        try {
            const response = await fetch(`/api/requests/${requestId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ rejectionReason: reason })
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(data.message, 'success');
                this.updateRequestStatus(requestId, 'canceled', reason);
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleDispatchRequest(button) {
        const requestId = button.dataset.requestId;

        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⏳ Dispatching...</span>';
        button.disabled = true;
        button.classList.add('loading');

        try {
            const response = await fetch(`/api/requests/${requestId}/dispatch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(data.message, 'success');
                this.updateRequestStatus(requestId, 'dispatched');
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error dispatching request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleCancelRequest(button) {
        const requestId = button.dataset.requestId;

        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        const confirmed = await this.showConfirmModal('Cancel Request', 'Are you sure you want to cancel this approved request?');
        if (!confirmed) return;

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⏳ Canceling...</span>';
        button.disabled = true;
        button.classList.add('loading');

        try {
            const response = await fetch(`/api/requests/${requestId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(data.message, 'success');
                this.updateRequestStatus(requestId, 'canceled');
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error canceling request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showRejectModal(farmerName) {
        return new Promise((resolve) => {
            const modalHTML = `
                <div class="reject-modal-overlay" id="rejectModal">
                    <div class="reject-modal">
                        <div class="modal-header">
                            <h3>Reject Request from ${farmerName}</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <label for="rejectionReason">Reason for rejection:</label>
                            <textarea id="rejectionReason" placeholder="Please provide a clear reason for rejecting this request..." rows="4"></textarea>
                            <div class="quick-reasons">
                                <p>Quick reasons:</p>
                                <button class="reason-btn" data-reason="Insufficient stock available">Insufficient stock</button>
                                <button class="reason-btn" data-reason="Invalid request details">Invalid details</button>
                                <button class="reason-btn" data-reason="Farmer not verified">Not verified</button>
                                <button class="reason-btn" data-reason="Request exceeds limit">Exceeds limit</button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-confirm">Reject Request</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('rejectModal');
            const cancelBtn = modal.querySelector('.btn-cancel');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const closeBtn = modal.querySelector('.modal-close');
            const textarea = modal.querySelector('#rejectionReason');
            const reasonBtns = modal.querySelectorAll('.reason-btn');

            // Focus on textarea
            setTimeout(() => textarea.focus(), 100);

            // Handle quick reason buttons
            reasonBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    textarea.value = btn.dataset.reason;
                    textarea.focus();
                });
            });

            // Handle modal actions
            const closeModal = (reason = null) => {
                modal.remove();
                resolve(reason);
            };

            cancelBtn.onclick = () => closeModal(null);
            closeBtn.onclick = () => closeModal(null);
            
            confirmBtn.onclick = () => {
                const reason = textarea.value.trim() || 'No reason provided';
                closeModal(reason);
            };

            // Close on overlay click
            modal.onclick = (e) => {
                if (e.target === modal) closeModal(null);
            };

            // Handle Enter key
            textarea.onkeydown = (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    confirmBtn.click();
                }
            };
        });
    }

    showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const modalHTML = `
                <div class="confirm-modal-overlay" id="confirmModal">
                    <div class="confirm-modal">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('confirmModal');
            const cancelBtn = modal.querySelector('.btn-cancel');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const closeBtn = modal.querySelector('.modal-close');

            const closeModal = (confirmed = false) => {
                modal.remove();
                resolve(confirmed);
            };

            cancelBtn.onclick = () => closeModal(false);
            closeBtn.onclick = () => closeModal(false);
            confirmBtn.onclick = () => closeModal(true);

            modal.onclick = (e) => {
                if (e.target === modal) closeModal(false);
            };
        });
    }

    updateRequestStatus(requestId, newStatus, rejectionReason = null) {
        const requestRow = document.querySelector(`[data-request-id="${requestId}"]`);
        if (!requestRow) return;

        // Update status badge
        const statusBadge = requestRow.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge ${newStatus}`;
            statusBadge.textContent = newStatus.toUpperCase();
        }

        // Update actions
        const actionsCell = requestRow.querySelector('.actions-cell');
        if (actionsCell) {
            let actionsHTML = '';
            
            switch (newStatus) {
                case 'approved':
                    actionsHTML = `
                        <div class="action-buttons">
                            <button class="btn-dispatch" data-request-id="${requestId}">
                                <span class="btn-icon">🚚</span>
                                <span>Mark Dispatched</span>
                            </button>
                            <button class="btn-cancel" data-request-id="${requestId}">
                                <span class="btn-icon">❌</span>
                                <span>Cancel</span>
                            </button>
                        </div>
                    `;
                    break;
                case 'dispatched':
                    actionsHTML = '<div class="status-text">✅ Completed</div>';
                    break;
                case 'canceled':
                    actionsHTML = '<div class="status-text">❌ Canceled</div>';
                    if (rejectionReason) {
                        const statusCell = requestRow.querySelector('.status-cell');
                        if (statusCell) {
                            statusCell.insertAdjacentHTML('beforeend', `
                                <div class="rejection-reason">Reason: ${rejectionReason}</div>
                            `);
                        }
                    }
                    break;
            }
            
            actionsCell.innerHTML = actionsHTML;
        }

        // Update row data attribute
        requestRow.dataset.status = newStatus;

        // Add animation
        requestRow.classList.add('status-updated');
        setTimeout(() => {
            requestRow.classList.remove('status-updated');
        }, 1000);
    }

    updateRequestCounts() {
        const allRows = document.querySelectorAll('.request-row');
        const counts = {
            pending: 0,
            approved: 0,
            dispatched: 0,
            canceled: 0
        };

        allRows.forEach(row => {
            const status = row.dataset.status;
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            }
        });

        // Update summary cards
        Object.keys(counts).forEach(status => {
            const summaryCard = document.querySelector(`.summary-card.${status} .summary-number`);
            if (summaryCard) {
                this.animateNumberChange(summaryCard, counts[status]);
            }
        });
    }

    filterRequests(searchTerm) {
        const requestRows = document.querySelectorAll('.request-row');
        const requestCards = document.querySelectorAll('.request-card');
        const searchLower = searchTerm.toLowerCase();

        // Filter table rows
        requestRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchLower)) {
                row.style.display = '';
                row.classList.remove('filtered-out');
            } else {
                row.style.display = 'none';
                row.classList.add('filtered-out');
            }
        });

        // Filter cards
        requestCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchLower)) {
                card.style.display = '';
                card.classList.remove('filtered-out');
            } else {
                card.style.display = 'none';
                card.classList.add('filtered-out');
            }
        });

        this.updateFilteredCount();
    }

    filterByStatus(status) {
        const requestRows = document.querySelectorAll('.request-row');
        const requestCards = document.querySelectorAll('.request-card');

        // Filter table rows
        requestRows.forEach(row => {
            const rowStatus = row.dataset.status;
            if (status === 'all' || rowStatus === status) {
                row.style.display = '';
                row.classList.remove('status-filtered');
            } else {
                row.style.display = 'none';
                row.classList.add('status-filtered');
            }
        });

        // Filter cards
        requestCards.forEach(card => {
            const cardStatus = card.dataset.status;
            if (status === 'all' || cardStatus === status) {
                card.style.display = '';
                card.classList.remove('status-filtered');
            } else {
                card.style.display = 'none';
                card.classList.add('status-filtered');
            }
        });

        this.updateFilteredCount();
    }

    updateFilteredCount() {
        const visibleRows = document.querySelectorAll('.request-row:not([style*="display: none"])');
        const totalCount = document.querySelector('.total-count');
        if (totalCount) {
            totalCount.textContent = `(${visibleRows.length} showing)`;
        }
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.request-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const row = checkbox.closest('.request-row');
            if (row) {
                row.classList.toggle('selected', checked);
            }
        });
        this.updateBulkActionButtons();
    }

    handleCheckboxChange() {
        const checkboxes = document.querySelectorAll('.request-checkbox');
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        const selectAllCheckbox = document.getElementById('selectAll');

        // Update select all checkbox
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = checkedBoxes.length === checkboxes.length;
            selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
        }

        // Update row selection
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('.request-row');
            if (row) {
                row.classList.toggle('selected', checkbox.checked);
            }
        });

        this.updateBulkActionButtons();
    }

    updateBulkActionButtons() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        const approveBtn = document.querySelector('.bulk-btn.approve-selected');
        const rejectBtn = document.querySelector('.bulk-btn.reject-selected');

        const hasSelection = checkedBoxes.length > 0;
        
        if (approveBtn) {
            approveBtn.disabled = !hasSelection;
            approveBtn.textContent = hasSelection ? `Approve Selected (${checkedBoxes.length})` : 'Approve Selected';
        }
        
        if (rejectBtn) {
            rejectBtn.disabled = !hasSelection;
            rejectBtn.textContent = hasSelection ? `Reject Selected (${checkedBoxes.length})` : 'Reject Selected';
        }
    }

    async handleBulkApprove() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        if (checkedBoxes.length === 0) return;

        const confirmed = await this.showConfirmModal(
            'Bulk Approve Requests',
            `Are you sure you want to approve ${checkedBoxes.length} selected requests?`
        );
        
        if (!confirmed) return;

        this.showNotification(`Processing ${checkedBoxes.length} approvals...`, 'info');

        for (const checkbox of checkedBoxes) {
            const requestId = checkbox.value;
            const approveBtn = document.querySelector(`[data-request-id="${requestId}"].btn-approve`);
            if (approveBtn) {
                await this.handleApproveRequest(approveBtn);
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        this.showNotification('Bulk approval completed', 'success');
    }

    async handleBulkReject() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        if (checkedBoxes.length === 0) return;

        const reason = await this.showRejectModal('Multiple Farmers');
        if (!reason) return;

        this.showNotification(`Processing ${checkedBoxes.length} rejections...`, 'info');

        for (const checkbox of checkedBoxes) {
            const requestId = checkbox.value;
            try {
                const response = await fetch(`/api/requests/${requestId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ rejectionReason: reason })
                });

                const data = await response.json();
                if (data.success) {
                    this.updateRequestStatus(requestId, 'canceled', reason);
                }
            } catch (error) {
                console.error(`Error rejecting request ${requestId}:`, error);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.updateRequestCounts();
        this.showNotification('Bulk rejection completed', 'success');
    }

    toggleView(view) {
        const viewButtons = document.querySelectorAll('.view-btn');
        const tableContainer = document.querySelector('.requests-table-container');
        const cardsContainer = document.querySelector('.requests-cards-container');

        // Update active button
        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Toggle containers
        if (view === 'table') {
            tableContainer.style.display = 'block';
            cardsContainer.style.display = 'none';
        } else {
            tableContainer.style.display = 'none';
            cardsContainer.style.display = 'block';
        }
    }

    toggleActionMenu(button) {
        const menu = button.nextElementSibling;
        const isOpen = menu.style.display === 'block';
        
        // Close all menus first
        this.closeAllMenus();
        
        // Toggle current menu
        if (!isOpen) {
            menu.style.display = 'block';
        }
    }

    closeAllMenus() {
        const menus = document.querySelectorAll('.menu-dropdown');
        menus.forEach(menu => {
            menu.style.display = 'none';
        });
    }

    showApprovalAnimation(farmerName) {
        const animationHTML = `
            <div class="approval-animation-container">
                <div class="approval-success-animation">
                    <div class="success-icon">✅</div>
                    <div class="success-details">
                        <h4>Request Approved!</h4>
                        <p>${farmerName}'s request has been approved successfully</p>
                    </div>
                </div>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = animationHTML;
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
            tempDiv.remove();
        }, 3000);
    }

    animateNumberChange(element, newValue) {
        element.classList.add('number-updating');
        
        setTimeout(() => {
            element.textContent = newValue;
            element.classList.remove('number-updating');
            element.classList.add('number-updated');
            
            setTimeout(() => {
                element.classList.remove('number-updated');
            }, 1000);
        }, 300);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.requests-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `requests-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('notification-fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.managerRequests = new ManagerRequests();
});

// Add CSS for additional styles
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .reject-modal-overlay,
    .confirm-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    }
    
    .reject-modal,
    .confirm-modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: 500px;
        width: 90%;
        animation: modalSlideIn 0.3s ease;
    }
    
    .modal-header {
        padding: 20px 20px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #1f2937;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
    }
    
    .modal-close:hover {
        opacity: 1;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-body label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #374151;
    }
    
    .modal-body textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        margin-bottom: 16px;
    }
    
    .modal-body textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .quick-reasons {
        margin-top: 16px;
    }
    
    .quick-reasons p {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
    }
    
    .reason-btn {
        display: inline-block;
        padding: 4px 8px;
        margin: 2px 4px 2px 0;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .reason-btn:hover {
        background: #e5e7eb;
        border-color: #9ca3af;
    }
    
    .modal-footer {
        padding: 0 20px 20px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }
    
    .btn-cancel, .btn-confirm {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .btn-cancel {
        background: #f3f4f6;
        color: #374151;
    }
    
    .btn-cancel:hover {
        background: #e5e7eb;
    }
    
    .btn-confirm {
        background: #ef4444;
        color: white;
    }
    
    .btn-confirm:hover {
        background: #dc2626;
    }
    
    .status-updated {
        background: #f0f9ff !important;
        animation: statusUpdatePulse 1s ease;
    }
    
    @keyframes statusUpdatePulse {
        0%, 100% { background: #f0f9ff; }
        50% { background: #dbeafe; }
    }
    
    .number-updating {
        opacity: 0.5;
        transform: scale(0.95);
        transition: all 0.3s ease;
    }
    
    .number-updated {
        color: #10b981;
        transform: scale(1.05);
        transition: all 0.3s ease;
    }
    
    .requests-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    }
    
    .requests-notification.success {
        border-left: 4px solid #10b981;
    }
    
    .requests-notification.error {
        border-left: 4px solid #ef4444;
    }
    
    .requests-notification.warning {
        border-left: 4px solid #f59e0b;
    }
    
    .requests-notification.info {
        border-left: 4px solid #3b82f6;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        padding: 16px;
        gap: 12px;
    }
    
    .notification-icon {
        font-size: 20px;
    }
    
    .notification-message {
        flex: 1;
        font-weight: 500;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    .notification-fade-out {
        animation: slideOutRight 0.3s ease forwards;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .approval-animation-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 3000;
        animation: approvalAnimation 3s ease forwards;
    }
    
    .approval-success-animation {
        background: white;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        text-align: center;
        border: 2px solid #10b981;
    }
    
    .success-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .success-details h4 {
        color: #10b981;
        margin: 0 0 12px 0;
        font-size: 20px;
    }
    
    .success-details p {
        margin: 6px 0;
        color: #374151;
    }
    
    @keyframes approvalAnimation {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
        }
        80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
    }
`;
sss
document.head.appendChild(additionalStyles);