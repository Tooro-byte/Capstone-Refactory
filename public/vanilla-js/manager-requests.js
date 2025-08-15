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
        // Use broader selectors but with better validation
        const requestRows = document.querySelectorAll('tr[data-request-id], .request-row, .request-card, tbody tr, .request-item');
        this.allRequests = Array.from(requestRows).filter(row => this.isValidRequestRow(row));
        this.filteredRequests = [...this.allRequests];
        this.updatePagination();
        
        console.log('Found valid requests:', this.allRequests.length);
        this.allRequests.forEach((row, index) => {
            const status = this.getRowStatus(row);
            const requestId = this.getRequestIdFromRow(row);
            console.log(`Request ${index + 1}: ID = "${requestId}", status = "${status}"`);
        });
    }

    // More flexible validation that works with different HTML structures
    isValidRequestRow(row) {
        // Check if row has request-related content
        const hasRequestId = this.getRequestIdFromRow(row) !== null;
        const hasRequestContent = row.textContent.toLowerCase().includes('chick') || 
                                 row.querySelector('.farmer-name, .request-details, .btn-approve, .btn-reject') !== null;
        const hasStatus = this.getRowStatus(row) !== 'unknown';
        
        // Exclude header rows and empty rows
        const isNotHeader = !row.textContent.toLowerCase().includes('farmer name') && 
                           !row.textContent.toLowerCase().includes('request id') &&
                           !row.classList.contains('table-header');
        
        return (hasRequestId || hasRequestContent) && hasStatus && isNotHeader && row.textContent.trim().length > 10;
    }

    getRequestIdFromRow(row) {
        // Try multiple ways to get request ID
        return row.dataset.requestId || 
               row.getAttribute('data-request-id') ||
               row.querySelector('[data-request-id]')?.getAttribute('data-request-id') ||
               row.querySelector('.btn-approve, .btn-reject')?.getAttribute('data-request-id') ||
               row.querySelector('a[href*="/requests/"]')?.href?.match(/\/requests\/([^\/\?]+)/)?.[1] ||
               null;
    }

    getRowStatus(row) {
        // Try multiple ways to get the status
        let status = row.dataset.status || 
                    row.getAttribute('data-status') ||
                    row.querySelector('[data-status]')?.dataset.status ||
                    row.querySelector('[data-status]')?.getAttribute('data-status');
        
        // If still no status, try to find it from status badge or text
        if (!status) {
            const statusBadge = row.querySelector('.status-badge, .status, [class*="status"], .badge');
            if (statusBadge) {
                status = statusBadge.textContent?.trim() ||
                        statusBadge.dataset.status ||
                        statusBadge.getAttribute('data-status');
                
                // Check class names for status
                if (!status) {
                    const classList = Array.from(statusBadge.classList);
                    status = classList.find(cls => 
                        ['pending', 'approved', 'dispatched', 'canceled', 'rejected'].includes(cls.toLowerCase())
                    );
                }
            }
        }
        
        // Try to extract from text content as last resort
        if (!status) {
            const text = row.textContent.toLowerCase();
            if (text.includes('pending')) status = 'pending';
            else if (text.includes('approved')) status = 'approved';
            else if (text.includes('dispatched')) status = 'dispatched';
            else if (text.includes('canceled') || text.includes('cancelled')) status = 'canceled';
            else if (text.includes('rejected')) status = 'rejected';
        }
        
        return status ? status.toLowerCase().trim() : 'unknown';
    }

    isPendingStatus(status) {
        const pendingStatuses = ['pending', 'new', 'submitted', 'waiting', 'awaiting'];
        return pendingStatuses.includes(status?.toLowerCase());
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

    getRequestIdFromButton(button) {
        // Try multiple ways to extract request ID
        let requestId = button.dataset.requestId || 
                       button.getAttribute('data-request-id') || 
                       button.closest('[data-request-id]')?.getAttribute('data-request-id');
        
        // Try to extract from href if it's a link
        if (!requestId && button.href) {
            const match = button.href.match(/\/requests\/([^\/\?]+)/);
            requestId = match ? match[1] : null;
        }
        
        // Try to find in parent row
        if (!requestId) {
            const row = button.closest('tr, .request-row, .request-card, .request-item');
            if (row) {
                requestId = this.getRequestIdFromRow(row);
            }
        }
        
        return requestId;
    }

    getFarmerNameFromButton(button) {
        const row = button.closest('tr, .request-row, .request-card, .request-item');
        if (!row) return 'Farmer';
        
        return button.dataset.farmerName || 
               button.getAttribute('data-farmer-name') || 
               row.querySelector('.farmer-name')?.textContent?.trim() ||
               row.querySelector('td:first-child')?.textContent?.trim() ||
               'Farmer';
    }

    async handleApproveRequest(button) {
        const requestId = this.getRequestIdFromButton(button);
        const farmerName = this.getFarmerNameFromButton(button);

        if (!requestId) {
            this.showNotification('Invalid request ID. Please refresh the page and try again.', 'error');
            console.error('No request ID found on button:', button);
            return;
        }

        console.log('Attempting to approve request:', requestId);

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
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Approve response:', data);

            if (data.success) {
                this.showNotification(data.message || `Request approved for ${farmerName}`, 'success');
                this.updateRequestStatus(requestId, 'approved');
                this.updateRequestCounts();
                this.showApprovalAnimation(farmerName);
            } else {
                this.showNotification(data.message || 'Failed to approve request', 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification(`Failed to approve request: ${error.message}`, 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleRejectRequest(button) {
        const requestId = this.getRequestIdFromButton(button);
        const farmerName = this.getFarmerNameFromButton(button);

        if (!requestId) {
            this.showNotification('Invalid request ID. Please refresh the page and try again.', 'error');
            console.error('No request ID found on button:', button);
            return;
        }

        console.log('Attempting to reject request:', requestId);

        // Show rejection reason modal
        try {
            const reason = await this.showRejectModal(farmerName);
            if (!reason) {
                console.log('User cancelled rejection');
                return; // User cancelled
            }

            // Show loading state
            const originalText = button.innerHTML;
            button.innerHTML = '<span>⏳ Rejecting...</span>';
            button.disabled = true;
            button.classList.add('loading');

            const response = await fetch(`/api/requests/${requestId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ rejectionReason: reason })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Reject response:', data);

            if (data.success) {
                this.showNotification(data.message || `Request rejected for ${farmerName}`, 'success');
                this.updateRequestStatus(requestId, 'rejected', reason);
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message || 'Failed to reject request', 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification(`Failed to reject request: ${error.message}`, 'error');
            // Restore button state if it was modified
            if (button.classList.contains('loading')) {
                button.innerHTML = button.dataset.originalText || 'Reject';
                button.disabled = false;
                button.classList.remove('loading');
            }
        }
    }

    async handleDispatchRequest(button) {
        const requestId = this.getRequestIdFromButton(button);

        if (!requestId) {
            this.showNotification('Invalid request ID. Please refresh the page and try again.', 'error');
            return;
        }

        console.log('Attempting to dispatch request:', requestId);

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
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Dispatch response:', data);

            if (data.success) {
                this.showNotification(data.message || 'Request dispatched successfully', 'success');
                this.updateRequestStatus(requestId, 'dispatched');
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message || 'Failed to dispatch request', 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error dispatching request:', error);
            this.showNotification(`Failed to dispatch request: ${error.message}`, 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleCancelRequest(button) {
        const requestId = this.getRequestIdFromButton(button);

        if (!requestId) {
            this.showNotification('Invalid request ID. Please refresh the page and try again.', 'error');
            return;
        }

        const confirmed = await this.showConfirmModal('Cancel Request', 'Are you sure you want to cancel this approved request?');
        if (!confirmed) return;

        console.log('Attempting to cancel request:', requestId);

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
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Cancel response:', data);

            if (data.success) {
                this.showNotification(data.message || 'Request canceled successfully', 'success');
                this.updateRequestStatus(requestId, 'canceled');
                this.updateRequestCounts();
            } else {
                this.showNotification(data.message || 'Failed to cancel request', 'error');
                // Restore button state
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error canceling request:', error);
            this.showNotification(`Failed to cancel request: ${error.message}`, 'error');
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showRejectModal(farmerName) {
        return new Promise((resolve) => {
            const modalId = 'rejectModal_' + Date.now();
            const modalHTML = `
                <div class="reject-modal-overlay" id="${modalId}">
                    <div class="reject-modal">
                        <div class="modal-header">
                            <h3>Reject Request from ${farmerName}</h3>
                            <button class="modal-close" type="button">&times;</button>
                        </div>
                        <div class="modal-body">
                            <label for="rejectionReason_${modalId}">Reason for rejection:</label>
                            <textarea id="rejectionReason_${modalId}" placeholder="Please provide a clear reason for rejecting this request..." rows="4"></textarea>
                            <div class="quick-reasons">
                                <p>Quick reasons:</p>
                                <button type="button" class="reason-btn" data-reason="Insufficient stock available">Insufficient stock</button>
                                <button type="button" class="reason-btn" data-reason="Invalid request details">Invalid details</button>
                                <button type="button" class="reason-btn" data-reason="Farmer not verified">Not verified</button>
                                <button type="button" class="reason-btn" data-reason="Request exceeds limit">Exceeds limit</button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-modal-cancel">Cancel</button>
                            <button type="button" class="btn-modal-confirm">Reject Request</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById(modalId);
            const cancelBtn = modal.querySelector('.btn-modal-cancel');
            const confirmBtn = modal.querySelector('.btn-modal-confirm');
            const closeBtn = modal.querySelector('.modal-close');
            const textarea = modal.querySelector(`#rejectionReason_${modalId}`);
            const reasonBtns = modal.querySelectorAll('.reason-btn');

            // Focus on textarea
            setTimeout(() => textarea.focus(), 100);

            // Handle quick reason buttons
            reasonBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    textarea.value = btn.dataset.reason;
                    textarea.focus();
                });
            });

            // Handle modal actions
            const closeModal = (reason = null) => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                resolve(reason);
            };

            // Event listeners
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(null);
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(null);
                });
            }
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const reason = textarea.value.trim() || 'No reason provided';
                    closeModal(reason);
                });
            }

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(null);
                }
            });

            // Handle Enter key
            if (textarea) {
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        confirmBtn.click();
                    }
                });
            }
        });
    }

    showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const modalId = 'confirmModal_' + Date.now();
            const modalHTML = `
                <div class="confirm-modal-overlay" id="${modalId}">
                    <div class="confirm-modal">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="modal-close" type="button">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-modal-cancel">Cancel</button>
                            <button type="button" class="btn-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById(modalId);
            const cancelBtn = modal.querySelector('.btn-modal-cancel');
            const confirmBtn = modal.querySelector('.btn-modal-confirm');
            const closeBtn = modal.querySelector('.modal-close');

            const closeModal = (confirmed = false) => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                resolve(confirmed);
            };

            // Event listeners
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(false);
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(false);
                });
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(true);
                });
            }

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });
        });
    }

    updateRequestStatus(requestId, newStatus, rejectionReason = null) {
        // Find request row using multiple selectors
        const requestRow = document.querySelector(`[data-request-id="${requestId}"]`) ||
                          document.querySelector(`tr[data-id="${requestId}"]`) ||
                          document.querySelector(`.request-row[data-id="${requestId}"]`) ||
                          this.allRequests.find(row => this.getRequestIdFromRow(row) === requestId);
        
        if (!requestRow) {
            console.warn(`Could not find request row for ID: ${requestId}`);
            this.showNotification('Status updated successfully, but page display may be outdated. Please refresh.', 'info');
            return;
        }

        // Update status badge
        const statusBadge = requestRow.querySelector('.status-badge, .status, .badge, [class*="status"]');
        if (statusBadge) {
            statusBadge.className = `status-badge ${newStatus}`;
            statusBadge.textContent = newStatus.toUpperCase();
        }

        // Update actions cell
        const actionsCell = requestRow.querySelector('.actions-cell, .actions, td:last-child, .request-actions');
        if (actionsCell) {
            let actionsHTML = '';
            
            switch (newStatus) {
                case 'approved':
                    actionsHTML = `
                        <div class="action-buttons">
                            <button class="btn-dispatch btn btn-success" data-request-id="${requestId}">
                                <span class="btn-icon">🚚</span>
                                <span>Mark Dispatched</span>
                            </button>
                            <button class="btn-cancel btn btn-danger" data-request-id="${requestId}">
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
                case 'rejected':
                case 'canceled':
                    actionsHTML = `
                        <div class="status-text canceled">❌ ${newStatus === 'rejected' ? 'Rejected' : 'Canceled'}</div>
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
                        const statusCell = requestRow.querySelector('.status-cell, td:nth-child(5)');
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
        if (requestRow.dataset) {
            requestRow.dataset.status = newStatus;
        }
        requestRow.setAttribute('data-status', newStatus);

        // Add animation
        requestRow.classList.add('status-updated');
        setTimeout(() => {
            requestRow.classList.remove('status-updated');
        }, 1000);

        // Re-initialize requests to update our internal arrays
        this.initializeRequests();
    }

    updateRequestCounts() {
        console.log('Updating request counts...');
        
        const counts = {
            pending: 0,
            approved: 0,
            dispatched: 0,
            canceled: 0,
            rejected: 0,
            total: 0
        };

        // Count from our validated requests
        this.allRequests.forEach((row, index) => {
            const status = this.getRowStatus(row);
            const requestId = this.getRequestIdFromRow(row);
            console.log(`Counting - Request ${index + 1}: ID = "${requestId}", status = "${status}"`);
            
            if (status === 'unknown') return;
            
            counts.total++;
            
            if (this.isPendingStatus(status)) {
                counts.pending++;
            } else if (status === 'approved') {
                counts.approved++;
            } else if (status === 'dispatched') {
                counts.dispatched++;
            } else if (['canceled', 'cancelled', 'rejected'].includes(status)) {
                counts.canceled++;
                counts.rejected++; // Some systems separate these
            }
        });

        console.log('Final counts:', counts);

        // Update summary cards
        this.updateCountElement('pending', counts.pending);
        this.updateCountElement('approved', counts.approved);
        this.updateCountElement('dispatched', counts.dispatched);
        this.updateCountElement('canceled', counts.canceled);
        this.updateCountElement('rejected', counts.rejected);
        this.updateCountElement('total', counts.total);
    }

    updateCountElement(status, count) {
        // Try multiple selector patterns to find count elements
        const possibleSelectors = [
            `.summary-card.${status} .summary-number`,
            `.summary-card.${status} .stat-number`,
            `.stat-card.${status} .stat-number`,
            `.card.${status} .number`,
            `.${status}-card .number`,
            `.${status}-count`,
            `#${status}Count`,
            `[data-status="${status}"] .summary-number`,
            `[data-status="${status}"] .stat-number`,
            `[data-status="${status}"] .number`
        ];
        
        let summaryElement = null;
        for (const selector of possibleSelectors) {
            try {
                summaryElement = document.querySelector(selector);
                if (summaryElement) {
                    console.log(`Found element for ${status} using selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Skip invalid selectors
                continue;
            }
        }
        
        // If still not found, try a more flexible approach
        if (!summaryElement) {
            const allCards = document.querySelectorAll('.summary-card, .stat-card, .card, [class*="card"]');
            for (const card of allCards) {
                const text = card.textContent.toLowerCase();
                if (text.includes(status.toLowerCase()) || 
                    card.classList.contains(status) ||
                    card.dataset.status === status) {
                    summaryElement = card.querySelector('.summary-number, .stat-number, .number, [class*="number"]');
                    if (summaryElement) {
                        console.log(`Found element for ${status} via text matching`);
                        break;
                    }
                }
            }
        }
        
        if (summaryElement) {
            this.animateNumberChange(summaryElement, count);
        } else {
            console.warn(`Could not find summary element for status: ${status}`);
        }
    }

    filterRequests(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        let visibleCount = 0;

        this.allRequests.forEach(row => {
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

        this.updateFilteredCount(visibleCount);
    }

    filterByStatus(status) {
        let visibleCount = 0;

        this.allRequests.forEach(row => {
            const rowStatus = this.getRowStatus(row);
            let isVisible = false;
            
            if (status === 'all') {
                isVisible = true;
            } else if (status === 'pending' && this.isPendingStatus(rowStatus)) {
                isVisible = true;
            } else if (rowStatus === status.toLowerCase()) {
                isVisible = true;
            }
            
            if (isVisible) {
                row.style.display = '';
                row.classList.remove('status-filtered');
                visibleCount++;
            } else {
                row.style.display = 'none';
                row.classList.add('status-filtered');
            }
        });

        this.updateFilteredCount(visibleCount);
    }

    updateFilteredCount(count = null) {
        if (count === null) {
            const visibleRows = this.allRequests.filter(row => 
                row.style.display !== 'none' && 
                !row.classList.contains('filtered-out') && 
                !row.classList.contains('status-filtered')
            );
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
        const visibleCheckboxes = this.allRequests
            .filter(row => row.style.display !== 'none')
            .map(row => row.querySelector('.request-checkbox'))
            .filter(checkbox => checkbox !== null);

        visibleCheckboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
            if (container) {
                container.classList.toggle('selected', checked);
            }
        });
        
        this.updateBulkActionButtons();
    }

    handleCheckboxChange() {
        const allVisibleCheckboxes = this.allRequests
            .filter(row => row.style.display !== 'none')
            .map(row => row.querySelector('.request-checkbox'))
            .filter(checkbox => checkbox !== null);
            
        const checkedVisibleBoxes = allVisibleCheckboxes.filter(cb => cb.checked);
        const selectAllCheckbox = document.getElementById('selectAll');

        // Update select all checkbox
        if (selectAllCheckbox && allVisibleCheckboxes.length > 0) {
            selectAllCheckbox.checked = checkedVisibleBoxes.length === allVisibleCheckboxes.length;
            selectAllCheckbox.indeterminate = checkedVisibleBoxes.length > 0 && checkedVisibleBoxes.length < allVisibleCheckboxes.length;
        }

        // Update row selection
        allVisibleCheckboxes.forEach(checkbox => {
            const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
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
        console.log(`Total checked boxes: ${checkedBoxes.length}`);
        
        if (checkedBoxes.length === 0) {
            this.showNotification('No requests selected', 'warning');
            return;
        }

        // Filter only pending requests
        const pendingRequests = Array.from(checkedBoxes).filter(checkbox => {
            const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
            const status = this.getRowStatus(container);
            console.log(`Checkbox container status: "${status}", isPending: ${this.isPendingStatus(status)}`);
            return this.isPendingStatus(status);
        });

        console.log(`Pending requests found: ${pendingRequests.length}`);

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
            const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
            const requestId = this.getRequestIdFromRow(container);
            
            if (!requestId) {
                errorCount++;
                continue;
            }

            try {
                const response = await fetch(`/api/requests/${requestId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.updateRequestStatus(requestId, 'approved');
                        successCount++;
                        checkbox.checked = false;
                    } else {
                        errorCount++;
                        console.error(`Failed to approve request ${requestId}:`, data.message);
                    }
                } else {
                    errorCount++;
                    console.error(`HTTP error approving request ${requestId}:`, response.status);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error approving request ${requestId}:`, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        this.updateRequestCounts();
        this.updateBulkActionButtons();
        
        if (successCount > 0) {
            this.showNotification(`Successfully approved ${successCount} requests`, 'success');
        }
        if (errorCount > 0) {
            this.showNotification(`Failed to approve ${errorCount} requests. Please check the console for details.`, 'error');
        }
    }

    async handleBulkReject() {
        const checkedBoxes = document.querySelectorAll('.request-checkbox:checked');
        console.log(`Total checked boxes: ${checkedBoxes.length}`);
        
        if (checkedBoxes.length === 0) {
            this.showNotification('No requests selected', 'warning');
            return;
        }

        // Filter only pending requests
        const pendingRequests = Array.from(checkedBoxes).filter(checkbox => {
            const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
            const status = this.getRowStatus(container);
            console.log(`Checkbox container status: "${status}", isPending: ${this.isPendingStatus(status)}`);
            return this.isPendingStatus(status);
        });

        console.log(`Pending requests found: ${pendingRequests.length}`);

        if (pendingRequests.length === 0) {
            this.showNotification('No pending requests selected', 'warning');
            return;
        }

        try {
            const reason = await this.showRejectModal(`${pendingRequests.length} Farmers`);
            if (!reason) return;

            this.showNotification(`Processing ${pendingRequests.length} rejections...`, 'info');

            let successCount = 0;
            let errorCount = 0;

            for (const checkbox of pendingRequests) {
                const container = checkbox.closest('tr, .request-row, .request-card, .request-item');
                const requestId = this.getRequestIdFromRow(container);
                
                if (!requestId) {
                    errorCount++;
                    continue;
                }

                try {
                    const response = await fetch(`/api/requests/${requestId}/reject`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ rejectionReason: reason })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            this.updateRequestStatus(requestId, 'rejected', reason);
                            successCount++;
                            checkbox.checked = false;
                        } else {
                            errorCount++;
                            console.error(`Failed to reject request ${requestId}:`, data.message);
                        }
                    } else {
                        errorCount++;
                        console.error(`HTTP error rejecting request ${requestId}:`, response.status);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Error rejecting request ${requestId}:`, error);
                }
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            this.updateRequestCounts();
            this.updateBulkActionButtons();
            
            if (successCount > 0) {
                this.showNotification(`Successfully rejected ${successCount} requests`, 'success');
            }
            if (errorCount > 0) {
                this.showNotification(`Failed to reject ${errorCount} requests. Please check the console for details.`, 'error');
            }
        } catch (error) {
            console.error('Error in bulk reject:', error);
            this.showNotification('Failed to process bulk rejection', 'error');
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
            if (tableContainer) tableContainer.style.display = 'block';
            if (cardsContainer) cardsContainer.style.display = 'none';
        } else {
            if (tableContainer) tableContainer.style.display = 'none';
            if (cardsContainer) cardsContainer.style.display = 'block';
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
        box-sizing: border-box;
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
        border: 2px solid #0ea5e9 !important;
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
    .request-card.selected,
    tr.selected {
        background: rgba(59, 130, 246, 0.05) !important;
        border-color: #3b82f6 !important;
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
    
    /* Rejection reason styling */
    .rejection-reason {
        font-size: 12px;
        color: #ef4444;
        font-style: italic;
        margin-top: 4px;
        padding: 4px 8px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 4px;
    }
`;

document.head.appendChild(additionalStyles);