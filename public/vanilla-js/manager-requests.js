class ManagerRequests {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredRequests = [];
        this.allRequests = [];
        this.init();
        this.setupEventListeners();
        this.setupSearch();
        this.setupFilters();
        this.setupBulkActions();
        this.setupViewToggle();
        this.initializeRequests();
    }

    init() {
        console.log('Manager Requests page initialized');
        this.showNotification('Requests page loaded successfully', 'success');
        this.updateRequestCounts();
    }

    initializeRequests() {
        // Get all request rows and store them
        const requestRows = document.querySelectorAll('.request-row');
        this.allRequests = Array.from(requestRows);
        this.filteredRequests = [...this.allRequests];
        this.updatePagination();
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

        // Add global functions for menu actions
        window.viewRequestDetails = this.viewRequestDetails.bind(this);
        window.printReceipt = this.printReceipt.bind(this);
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
        const approveRequestBtn = document.getElementById('approveRequest');
        const rejectRequestBtn = document.getElementById('rejectRequest');

        if (approveRequestBtn) {
            approveRequestBtn.addEventListener('click', () => {
                this.handleBulkApprove();
            });
        }

        if (rejectRequestBtn) {
            rejectRequestBtn.addEventListener('click', () => {
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
                            <button class="btn-modal-cancel">Cancel</button>
                            <button class="btn-modal-confirm">Reject Request</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('rejectModal');
            const cancelBtn = modal.querySelector('.btn-modal-cancel');
            const confirmBtn = modal.querySelector('.btn-modal-confirm');
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
                            <button class="btn-modal-cancel">Cancel</button>
                            <button class="btn-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('confirmModal');
            const cancelBtn = modal.querySelector('.btn-modal-cancel');
            const confirmBtn = modal.querySelector('.btn-modal-confirm');
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
                            <div class="action-menu">
                                <button class="menu-btn">⋮</button>
                                <div class="menu-dropdown">
                                    <a class="menu-item" href="javascript:void(0)" onclick="viewRequestDetails('${requestId}')">View Details</a>
                                    <a class="menu-item" href="mailto:">Contact Farmer</a>
                                    <a class="menu-item" href="javascript:void(0)" onclick="printReceipt('${requestId}')">Print Receipt</a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'dispatched':
                    actionsHTML = `
                        <div class="status-text completed">✅ Completed</div>
                        <div class="action-menu">
                            <button class="menu-btn">⋮</button>
                            <div class="menu-dropdown">
                                <a class="menu-item" href="javascript:void(0)" onclick="viewRequestDetails('${requestId}')">View Details</a>
                                <a class="menu-item" href="mailto:">Contact Farmer</a>
                                <a class="menu-item" href="javascript:void(0)" onclick="printReceipt('${requestId}')">Print Receipt</a>
                            </div>
                        </div>
                    `;
                    break;
                case 'canceled':
                    actionsHTML = `
                        <div class="status-text canceled">❌ Canceled</div>
                        <div class="action-menu">
                            <button class="menu-btn">⋮</button>
                            <div class="menu-dropdown">
                                <a class="menu-item" href="javascript:void(0)" onclick="viewRequestDetails('${requestId}')">View Details</a>
                                <a class="menu-item" href="mailto:">Contact Farmer</a>
                                <a class="menu-item" href="javascript:void(0)" onclick="printReceipt('${requestId}')">Print Receipt</a>
                            </div>
                        </div>
                    `;
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
        let visibleCount = 0;

        // Filter table rows
        requestRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchLower);
            
            if (isVisible) {
                row.style.display = '';
                row.classList.remove('filtered-out');
                visibleCount++;
            } else {
                row.style.display = 'none';
                row.classList.add('filtered-out');
            }
        });

        // Filter cards
        requestCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const isVisible = text.includes(searchLower);
            
            if (isVisible) {
                card.style.display = '';
                card.classList.remove('filtered-out');
            } else {
                card.style.display = 'none';
                card.classList.add('filtered-out');
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    filterByStatus(status) {
        const requestRows = document.querySelectorAll('.request-row');
        const requestCards = document.querySelectorAll('.request-card');
        let visibleCount = 0;

        // Filter table rows
        requestRows.forEach(row => {
            const rowStatus = row.dataset.status;
            const isVisible = status === 'all' || rowStatus === status;
            
            if (isVisible) {
                row.style.display = '';
                row.classList.remove('status-filtered');
                visibleCount++;
            } else {
                row.style.display = 'none';
                row.classList.add('status-filtered');
            }
        });

        // Filter cards
        requestCards.forEach(card => {
            const cardStatus = card.dataset.status;
            const isVisible = status === 'all' || cardStatus === status;
            
            if (isVisible) {
                card.style.display = '';
                card.classList.remove('status-filtered');
            } else {
                card.style.display = 'none';
                card.classList.add('status-filtered');
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count = null) {
        if (count === null) {
            const visibleRows = document.querySelectorAll('.request-row:not([style*="display: none"])');
            count = visibleRows.length;
        }
        
        const totalCountElement = document.querySelector('.total-count');
        const showingCountElement = document.getElementById('showingCount');
        
        if (totalCountElement) {
            totalCountElement.textContent = `(${count} showing)`;
        }
        
        if (showingCountElement) {
            showingCountElement.textContent = count;
        }
    }

    updatePagination() {
        const totalCount = this.filteredRequests.length;
        const totalPages = Math.ceil(totalCount / this.itemsPerPage);
        
        const showingCountElement = document.getElementById('showingCount');
        const totalCountElement = document.getElementById('totalCount');
        
        if (showingCountElement) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalCount);
            showingCountElement.textContent = totalCount > 0 ? `${startIndex}-${endIndex}` : '0';
        }
        
        if (totalCountElement) {
            totalCountElement.textContent = totalCount;
        }
    }

    handleSelectAll(checked) {
        const visibleCheckboxes = document.querySelectorAll('.request-checkbox:not(.filtered-out):not(.status-filtered)');
        visibleCheckboxes.forEach(checkbox => {
            if (checkbox.closest('.request-row') && !checkbox.closest('.request-row').style.display === 'none') {
                checkbox.checked = checked;
                const row = checkbox.closest('.request-row') || checkbox.closest('.request-card');
                if (row) {
                    row.classList.toggle('selected', checked);
                }
            }
        });
        this.updateBulkActionButtons();
    }

    handleCheckboxChange() {
        const allCheckboxes = document.querySelectorAll('.request-checkbox');
        const visibleCheckboxes = Array.from(allCheckboxes).filter(cb => {
            const container = cb.closest('.request-row') || cb.closest('.request-card');
            return container && container.style.display !== 'none';
        });
        const checkedVisibleBoxes = visibleCheckboxes.filter(cb => cb.checked);
        const selectAllCheckbox = document.getElementById('selectAll');

        // Update select all checkbox
        if (selectAllCheckbox && visibleCheckboxes.length > 0) {
            selectAllCheckbox.checked = checkedVisibleBoxes.length === visibleCheckboxes.length;
            selectAllCheckbox.indeterminate = checkedVisibleBoxes.length > 0 && checkedVisibleBoxes.length < visibleCheckboxes.length;
        }

        // Update row selection
        allCheckboxes.forEach(checkbox => {
            const container = checkbox.closest('.request-row') || checkbox.closest('.request-card');
            if (container) {
                container.classList.toggle('selected', checkbox.checked);
            }
        });

        this.updateBulkActionButtons();
    }

    updateBulkActionButtons() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        const approveBtn = document.getElementById('approveRequest');
        const rejectBtn = document.getElementById('rejectRequest');

        const hasSelection = checkedBoxes.length > 0;
        
        if (approveBtn) {
            approveBtn.disabled = !hasSelection;
        }
        
        if (rejectBtn) {
            rejectBtn.disabled = !hasSelection;
        }
    }

    async handleBulkApprove() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        if (checkedBoxes.length === 0) return;

        // Filter only pending requests
        const pendingRequests = Array.from(checkedBoxes).filter(checkbox => {
            const container = checkbox.closest('.request-row') || checkbox.closest('.request-card');
            return container && container.dataset.status === 'pending';
        });

        if (pendingRequests.length === 0) {
            this.showNotification('No pending requests selected', 'warning');
            return;
        }

        const confirmed = await this.showConfirmModal(
            'Bulk Approve Requests',
            `Are you sure you want to approve ${pendingRequests.length} selected pending requests?`
        );
        
        if (!confirmed) return;

        this.showNotification(`Processing ${pendingRequests.length} approvals...`, 'info');

        let successCount = 0;
        let errorCount = 0;

        for (const checkbox of pendingRequests) {
            const requestId = checkbox.value;
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
                    this.updateRequestStatus(requestId, 'approved');
                    successCount++;
                    checkbox.checked = false; // Uncheck after processing
                } else {
                    errorCount++;
                    console.error(`Failed to approve request ${requestId}:`, data.message);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error approving request ${requestId}:`, error);
            }
            
            // Small delay between requests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.updateRequestCounts();
        this.updateBulkActionButtons();
        
        if (successCount > 0) {
            this.showNotification(`Successfully approved ${successCount} requests`, 'success');
        }
        if (errorCount > 0) {
            this.showNotification(`Failed to approve ${errorCount} requests`, 'error');
        }
    }

    async handleBulkReject() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        if (checkedBoxes.length === 0) return;

        // Filter only pending requests
        const pendingRequests = Array.from(checkedBoxes).filter(checkbox => {
            const container = checkbox.closest('.request-row') || checkbox.closest('.request-card');
            return container && container.dataset.status === 'pending';
        });

        if (pendingRequests.length === 0) {
            this.showNotification('No pending requests selected', 'warning');
            return;
        }

        const reason = await this.showRejectModal(`${pendingRequests.length} Farmers`);
        if (!reason) return;

        this.showNotification(`Processing ${pendingRequests.length} rejections...`, 'info');

        let successCount = 0;
        let errorCount = 0;

        for (const checkbox of pendingRequests) {
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
                    successCount++;
                    checkbox.checked = false; // Uncheck after processing
                } else {
                    errorCount++;
                    console.error(`Failed to reject request ${requestId}:`, data.message);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error rejecting request ${requestId}:`, error);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.updateRequestCounts();
        this.updateBulkActionButtons();
        
        if (successCount > 0) {
            this.showNotification(`Successfully rejected ${successCount} requests`, 'success');
        }
        if (errorCount > 0) {
            this.showNotification(`Failed to reject ${errorCount} requests`, 'error');
        }
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
        if (!menu) return;
        
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

    viewRequestDetails(requestId) {
        this.showNotification('Request details feature coming soon!', 'info');
        console.log('View details for request:', requestId);
    }

    printReceipt(requestId) {
        this.showNotification('Print receipt feature coming soon!', 'info');
        console.log('Print receipt for request:', requestId);
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

// Enhanced CSS for better responsiveness and styling
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Modal Styling Improvements */
    .reject-modal-overlay,
    .confirm-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
        backdrop-filter: blur(4px);
    }
    
    .reject-modal,
    .confirm-modal {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .modal-header {
        padding: 24px 24px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f3f4f6;
        margin-bottom: 20px;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #1f2937;
        font-size: 20px;
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.3s ease;
        padding: 4px 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
    }
    
    .modal-close:hover {
        opacity: 1;
        background: #f3f4f6;
    }
    
    .modal-body {
        padding: 0 24px 20px;
    }
    
    .modal-body label {
        display: block;
        margin-bottom: 12px;
        font-weight: 600;
        color: #374151;
        font-size: 15px;
    }
    
    .modal-body textarea {
        width: 100%;
        padding: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        min-height: 100px;
    }
    
    .modal-body textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
    
    .quick-reasons {
        margin-top: 20px;
    }
    
    .quick-reasons p {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    .reason-btn {
        display: inline-block;
        padding: 8px 16px;
        margin: 4px 8px 4px 0;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .reason-btn:hover {
        background: #f3f4f6;
        border-color: #3b82f6;
        transform: translateY(-1px);
    }
    
    .reason-btn:active {
        transform: translateY(0);
    }
    
    .modal-footer {
        padding: 20px 24px 24px;
        display: flex;
        gap: 16px;
        justify-content: flex-end;
        border-top: 1px solid #f3f4f6;
        margin-top: 20px;
    }
    
    .btn-modal-cancel, 
    .btn-modal-confirm {
        padding: 12px 24px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        min-width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn-modal-cancel {
        background: #f9fafb;
        color: #374151;
        border: 2px solid #e5e7eb;
    }
    
    .btn-modal-cancel:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        transform: translateY(-1px);
    }
    
    .btn-modal-confirm {
        background: #ef4444;
        color: white;
        border: 2px solid #ef4444;
    }
    
    .btn-modal-confirm:hover {
        background: #dc2626;
        border-color: #dc2626;
        transform: translateY(-1px);
    }
    
    .btn-modal-cancel:active,
    .btn-modal-confirm:active {
        transform: translateY(0);
    }
    
    /* Status Update Animations */
    .status-updated {
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe) !important;
        animation: statusUpdatePulse 1.5s ease;
        border: 2px solid #0ea5e9;
    }
    
    @keyframes statusUpdatePulse {
        0% { 
            background: #f0f9ff;
            transform: scale(1);
        }
        50% { 
            background: #e0f2fe;
            transform: scale(1.02);
        }
        100% { 
            background: #f0f9ff;
            transform: scale(1);
        }
    }
    
    /* Number Animation */
    .number-updating {
        opacity: 0.6;
        transform: scale(0.9);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .number-updated {
        color: #10b981;
        transform: scale(1.1);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }
    
    /* Notification Improvements */
    .requests-notification {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 3000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        min-width: 320px;
        animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid #e5e7eb;
    }
    
    .requests-notification.success {
        border-left: 4px solid #10b981;
        background: linear-gradient(135deg, #ffffff, #f0fdf4);
    }
    
    .requests-notification.error {
        border-left: 4px solid #ef4444;
        background: linear-gradient(135deg, #ffffff, #fef2f2);
    }
    
    .requests-notification.warning {
        border-left: 4px solid #f59e0b;
        background: linear-gradient(135deg, #ffffff, #fffbeb);
    }
    
    .requests-notification.info {
        border-left: 4px solid #3b82f6;
        background: linear-gradient(135deg, #ffffff, #eff6ff);
    }
    
    .notification-content {
        display: flex;
        align-items: flex-start;
        padding: 20px;
        gap: 16px;
    }
    
    .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .notification-message {
        flex: 1;
        font-weight: 500;
        color: #374151;
        font-size: 15px;
        line-height: 1.5;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.3s ease;
        padding: 4px 8px;
        border-radius: 6px;
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
    }
    
    .notification-fade-out {
        animation: slideOutRight 0.4s ease forwards;
    }
    
    /* Menu Dropdown Improvements */
    .menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        min-width: 160px;
        z-index: 1000;
        display: none;
        animation: menuSlideIn 0.2s ease;
    }
    
    .menu-item {
        display: block;
        padding: 12px 16px;
        text-decoration: none;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.2s ease;
    }
    
    .menu-item:last-child {
        border-bottom: none;
    }
    
    .menu-item:hover {
        background: #f9fafb;
        color: #1f2937;
        transform: translateX(4px);
    }
    
    /* Approval Animation Enhancement */
    .approval-animation-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 4000;
        animation: approvalAnimation 3.5s ease forwards;
    }
    
    .approval-success-animation {
        background: linear-gradient(135deg, #ffffff, #f0fdf4);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
        text-align: center;
        border: 3px solid #10b981;
        backdrop-filter: blur(10px);
    }
    
    .success-icon {
        font-size: 56px;
        margin-bottom: 20px;
        animation: bounce 0.6s ease infinite alternate;
    }
    
    .success-details h4 {
        color: #10b981;
        margin: 0 0 16px 0;
        font-size: 24px;
        font-weight: 700;
    }
    
    .success-details p {
        margin: 8px 0;
        color: #374151;
        font-size: 16px;
        font-weight: 500;
    }
    
    /* Enhanced Animations */
    @keyframes slideInRight {
        from {
            transform: translateX(120%);
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
            transform: translateX(120%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
        from {
            transform: translateY(-60px) scale(0.9);
            opacity: 0;
        }
        to {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes menuSlideIn {
        from {
            transform: translateY(-10px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
    }
    
    @keyframes approvalAnimation {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.7) rotate(-10deg);
        }
        20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1) rotate(2deg);
        }
        80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8) rotate(5deg);
        }
    }
    
    /* Loading State Improvements */
    .loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .loading span {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    /* Responsive Improvements */
    @media (max-width: 768px) {
        .reject-modal,
        .confirm-modal {
            width: 95%;
            margin: 16px;
        }
        
        .modal-header {
            padding: 20px 20px 0;
        }
        
        .modal-body {
            padding: 0 20px 16px;
        }
        
        .modal-footer {
            padding: 16px 20px 20px;
            flex-direction: column-reverse;
        }
        
        .btn-modal-cancel,
        .btn-modal-confirm {
            width: 100%;
            margin: 4px 0;
        }
        
        .requests-notification {
            right: 16px;
            left: 16px;
            min-width: auto;
        }
        
        .approval-success-animation {
            padding: 30px 20px;
        }
        
        .success-icon {
            font-size: 48px;
        }
        
        .success-details h4 {
            font-size: 20px;
        }
        
        .success-details p {
            font-size: 14px;
        }
    }
    
    /* Table Row Selection */
    .request-row.selected,
    .request-card.selected {
        background: rgba(59, 130, 246, 0.05);
        border-color: #3b82f6;
    }
    
    /* Improved Status Text */
    .status-text.completed {
        color: #10b981;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .status-text.canceled {
        color: #ef4444;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    /* Better Button Hover Effects */
    .btn-approve:hover,
    .btn-dispatch:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .btn-reject:hover,
    .btn-cancel:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    
    .menu-btn:hover {
        background: #f3f4f6;
        border-radius: 4px;
    }
`;

document.head.appendChild(additionalStyles);