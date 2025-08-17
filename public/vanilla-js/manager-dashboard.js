class ManagerDashboard {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    init() {
        console.log('Manager Dashboard initialized');
        this.showNotification('Dashboard loaded successfully', 'success');
        this.updateLastRefreshTime();
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

        // Handle manual refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Handle search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterRequests(e.target.value);
            });
        }
    }

    async handleApproveRequest(button) {
        const requestId = this.extractRequestId(button.href);
        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        // Show loading state
        const originalText = button.textContent;
        button.textContent = 'Approving...';
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
                this.updateDashboardStats(data.updatedStats);
                this.removeRequestFromUI(requestId);
                this.animateStatsUpdate();
                
                // Update revenue with animation
                this.animateRevenueUpdate(data.updatedStats.chickSales.totalChickSales);
                
                // Show success animation
                this.showApprovalAnimation(data.approvedOrder);
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.textContent = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async handleRejectRequest(button) {
        const requestId = this.extractRequestId(button.href);
        if (!requestId) {
            this.showNotification('Invalid request ID', 'error');
            return;
        }

        // Show rejection reason modal
        const reason = await this.showRejectModal();
        if (!reason) return; // User cancelled

        // Show loading state
        const originalText = button.textContent;
        button.textContent = 'Rejecting...';
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
                this.updateDashboardStats(data.updatedStats);
                this.removeRequestFromUI(requestId);
                this.animateStatsUpdate();
            } else {
                this.showNotification(data.message, 'error');
                // Restore button state
                button.textContent = originalText;
                button.disabled = false;
                button.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification('Network error. Please try again.', 'error');
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showRejectModal() {
        return new Promise((resolve) => {
            // Create modal HTML
            const modalHTML = `
                <div class="reject-modal-overlay" id="rejectModal">
                    <div class="reject-modal">
                        <div class="modal-header">
                            <h3>Reject Request</h3>
                            <button class="modal-close" onclick="document.getElementById('rejectModal').remove(); resolve(null);">&times;</button>
                        </div>
                        <div class="modal-body">
                            <label for="rejectionReason">Reason for rejection:</label>
                            <textarea id="rejectionReason" placeholder="Please provide a reason for rejecting this request..." rows="4"></textarea>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-cancel" onclick="document.getElementById('rejectModal').remove(); resolve(null);">Cancel</button>
                            <button class="btn-confirm" onclick="const reason = document.getElementById('rejectionReason').value; document.getElementById('rejectModal').remove(); resolve(reason || 'No reason provided');">Reject Request</button>
                        </div>
                    </div>
                </div>
            `;

            // Insert modal into page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Focus on textarea
            setTimeout(() => {
                document.getElementById('rejectionReason').focus();
            }, 100);

            // Handle modal actions
            const modal = document.getElementById('rejectModal');
            const cancelBtn = modal.querySelector('.btn-cancel');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const textarea = modal.querySelector('#rejectionReason');

            cancelBtn.onclick = () => {
                modal.remove();
                resolve(null);
            };

            confirmBtn.onclick = () => {
                const reason = textarea.value.trim() || 'No reason provided';
                modal.remove();
                resolve(reason);
            };

            // Close on overlay click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(null);
                }
            };

            // Handle Enter key in textarea
            textarea.onkeydown = (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    confirmBtn.click();
                }
            };
        });
    }

    updateDashboardStats(stats) {
        // Update pending requests
        const pendingElement = document.querySelector('.stat-card.warning .stat-number');
        if (pendingElement) {
            this.animateNumberChange(pendingElement, stats.pendingRequests);
        }

        // Update approved requests
        const approvedElement = document.querySelector('.stat-card.success .stat-number');
        if (approvedElement) {
            this.animateNumberChange(approvedElement, stats.approvedRequests);
        }

        // Update total stock
        const stockElement = document.querySelector('.stat-card.primary .stat-number');
        if (stockElement) {
            this.animateNumberChange(stockElement, stats.totalStock.totalChicks);
        }

        // Update revenue
        const revenueElement = document.querySelector('.stat-card.revenue .stat-number');
        if (revenueElement) {
            this.animateNumberChange(revenueElement, `UGX ${stats.chickSales.totalChickSales.toLocaleString()}`);
        }

        // Update trendsS
        this.updateTrends(stats);

        // Update pending requests list
        this.updatePendingRequestsList(stats.pendingRequestsList);

        // Update stock alerts
        this.updateStockAlerts(stats.stock);

        // Update last refresh time
        this.updateLastRefreshTime();
    }

    updateTrends(stats) {
        const pendingTrend = document.querySelector('.stat-card.warning .stat-trend');
        if (pendingTrend) {
            pendingTrend.textContent = stats.pendingRequests > 0 
                ? `${stats.pendingRequests} requests awaiting approval` 
                : "All caught up";
        }

        const approvedTrend = document.querySelector('.stat-card.success .stat-trend');
        if (approvedTrend) {
            approvedTrend.textContent = stats.approvedRequests > 0 
                ? `${stats.approvedRequests} approvals completed` 
                : "No approvals today";
        }

        const stockTrend = document.querySelector('.stat-card.primary .stat-trend');
        if (stockTrend) {
            stockTrend.textContent = stats.totalStock.totalChicks > 100 
                ? "Good inventory level" 
                : "Low inventory - Restock needed";
        }

        const revenueTrend = document.querySelector('.stat-card.revenue .stat-trend');
        if (revenueTrend) {
            revenueTrend.textContent = stats.chickSales.totalChickSales > 0 
                ? `${stats.chickSales.totalNumChicks} chicks sold` 
                : "Start earning today";
        }
    }

    updatePendingRequestsList(requests) {
        const container = document.querySelector('.pending-requests .card-content');
        if (!container) return;

        if (requests && requests.length > 0) {
            const requestsHTML = requests.map(request => `
                <div class="request-item" data-request-id="${request._id}">
                    <div class="request-info">
                        <div class="request-details">${request.user ? request.user.name : 'Unknown'} - ${request.numChicks} ${request.chickType} chicks</div>
                        <div class="request-date">Requested: ${new Date(request.requestDate).toLocaleDateString()}</div>
                        <div class="request-cost">Cost: UGX ${(request.totalCost || 0).toLocaleString()}</div>
                    </div>
                    <div class="request-actions">
                        <a class="btn-approve" href="/requests/${request._id}">Approve</a>
                        <a class="btn-reject" href="/requests/reject/${request._id}">Reject</a>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = requestsHTML;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">No pending requests</div>
                    <div class="empty-subtitle">All requests processed</div>
                </div>
            `;
        }
    }

    updateStockAlerts(stock) {
        const alertsContainer = document.querySelector('.alerts-card .card-content');
        if (!alertsContainer || !stock) return;

        const lowStockItems = stock.filter(item => item.number < 50);
        
        if (lowStockItems.length > 0) {
            const alertsHTML = lowStockItems.map(item => `
                <div class="alert-item warning">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-content">
                        <div class="alert-title">Low Stock Alert</div>
                        <div class="alert-desc">${item.type} stock is low (${item.number} remaining)</div>
                    </div>
                    <div class="alert-action">
                        <a class="btn-small" href="/addchicks">Restock</a>
                    </div>
                </div>
            `).join('');
            
            alertsContainer.innerHTML = alertsHTML;
        } else if (stock.length > 0) {
            alertsContainer.innerHTML = `
                <div class="alert-item success">
                    <div class="alert-icon">✅</div>
                    <div class="alert-content">
                        <div class="alert-title">All Good!</div>
                        <div class="alert-desc">No stock alerts at this time</div>
                    </div>
                </div>
            `;
        }
    }

    animateNumberChange(element, newValue) {
        element.classList.add('stat-updating');
        
        setTimeout(() => {
            element.textContent = newValue;
            element.classList.remove('stat-updating');
            element.classList.add('stat-updated');
            
            setTimeout(() => {
                element.classList.remove('stat-updated');
            }, 1000);
        }, 300);
    }

    animateRevenueUpdate(newRevenue) {
        const revenueCard = document.querySelector('.stat-card.revenue');
        if (revenueCard) {
            revenueCard.classList.add('revenue-pulse');
            setTimeout(() => {
                revenueCard.classList.remove('revenue-pulse');
            }, 2000);
        }
    }

    animateStatsUpdate() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('card-highlight');
                setTimeout(() => {
                    card.classList.remove('card-highlight');
                }, 1000);
            }, index * 200);
        });
    }

    showApprovalAnimation(approvedOrder) {
        // Create a temporary success notification with order details
        const successHTML = `
            <div class="approval-success-animation">
                <div class="success-icon">✅</div>
                <div class="success-details">
                    <h4>Request Approved!</h4>
                    <p>${approvedOrder.farmerName} - ${approvedOrder.numChicks} ${approvedOrder.chickType} chicks</p>
                    <p>Revenue: UGX ${approvedOrder.totalCost.toLocaleString()}</p>
                </div>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = successHTML;
        tempDiv.className = 'approval-animation-container';
        
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
            tempDiv.remove();
        }, 3000);
    }

    removeRequestFromUI(requestId) {
        const requestElement = document.querySelector(`[data-request-id="${requestId}"]`);
        if (requestElement) {
            requestElement.classList.add('request-removing');
            setTimeout(() => {
                requestElement.remove();
            }, 500);
        }
    }

    extractRequestId(href) {
        const matches = href.match(/\/requests\/([^\/]+)$/);
        return matches ? matches[1] : null;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.dashboard-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `dashboard-notification ${type}`;
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

    filterRequests(searchTerm) {
        const requestItems = document.querySelectorAll('.request-item');
        const searchLower = searchTerm.toLowerCase();

        requestItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchLower)) {
                item.style.display = 'block';
                item.classList.remove('filtered-out');
            } else {
                item.style.display = 'none';
                item.classList.add('filtered-out');
            }
        });
    }

    async refreshDashboard() {
        this.showNotification('Refreshing dashboard...', 'info');
        
        try {
            const response = await fetch('/api/dashboard-stats', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDashboardStats(data.data);
                this.updateFeedsRequestsStats(data.data.feedsStats);
                this.showNotification('Dashboard refreshed successfully', 'success');
            } else {
                this.showNotification('Failed to refresh dashboard', 'error');
            }
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showNotification('Network error while refreshing', 'error');
        }
    }

    updateFeedsRequestsStats(feedsStats) {
        if (!feedsStats) return;
        
        // Update feeds requests badge
        const feedsRequestsLink = document.querySelector('a[href="/manager/feeds-requests"]');
        if (feedsRequestsLink) {
            let badge = feedsRequestsLink.querySelector('.badge');
            
            if (feedsStats.pendingRequests > 0) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'badge highlight';
                    feedsRequestsLink.appendChild(badge);
                }
                badge.textContent = feedsStats.pendingRequests;
            } else if (badge) {
                badge.remove();
            }
        }
        
        // Add feeds stats to dashboard if needed
        this.addFeedsStatsCard(feedsStats);
    }

    addFeedsStatsCard(feedsStats) {
        // Check if feeds stats card already exists
        let feedsStatsCard = document.querySelector('.feeds-stats-card');
        
        if (!feedsStatsCard) {
            // Show the existing feeds stats card that was hidden
            feedsStatsCard = document.querySelector('.feeds-stats-card');
            if (feedsStatsCard) {
                feedsStatsCard.style.display = 'block';
            }
        } else {
            // Show the card if it was hidden
            feedsStatsCard.style.display = 'block';
        }
        
        // Update the feeds stats card with current data
        if (feedsStatsCard) {
            // Update existing feeds stats
            const feedsPending = feedsStatsCard.querySelector('#feedsPending');
            const feedsApproved = feedsStatsCard.querySelector('#feedsApproved');
            const feedsTotal = feedsStatsCard.querySelector('#feedsTotal');
            const feedsRevenue = feedsStatsCard.querySelector('#feedsRevenue');
            
            if (feedsPending) this.animateNumberChange(feedsPending, feedsStats.pendingRequests || 0);
            if (feedsApproved) this.animateNumberChange(feedsApproved, feedsStats.approvedRequests || 0);
            if (feedsTotal) this.animateNumberChange(feedsTotal, feedsStats.totalRequests || 0);
            if (feedsRevenue) this.animateNumberChange(feedsRevenue, `UGX ${(feedsStats.totalRevenue || 0).toLocaleString()}`);
        }
    }

    startAutoRefresh() {
        // Auto refresh every 30 seconds
        setInterval(() => {
            this.refreshDashboard();
        }, 100000);
    }

    updateLastRefreshTime() {
        const lastUpdateElement = document.querySelector('.last-update');
        if (lastUpdateElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            lastUpdateElement.textContent = `Last updated: ${timeString}`;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.managerDashboard = new ManagerDashboard();
});

// Add some CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    .stat-updating {
        opacity: 0.5;
        transform: scale(0.95);
        transition: all 0.3s ease;
    }
    
    .stat-updated {
        color: #10b981;
        transform: scale(1.05);
        transition: all 0.3s ease;
    }
    
    .card-highlight {
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        transform: translateY(-2px);
        transition: all 0.5s ease;
    }
    
    .revenue-pulse {
        animation: revenuePulse 2s ease-in-out;
    }
    
    @keyframes revenuePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(34, 197, 94, 0.4); }
    }
    
    .request-removing {
        opacity: 0;
        transform: translateX(-100%);
        transition: all 0.5s ease;
    }
    
    .dashboard-notification {
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
    
    .dashboard-notification.success {
        border-left: 4px solid #10b981;
    }
    
    .dashboard-notification.error {
        border-left: 4px solid #ef4444;
    }
    
    .dashboard-notification.warning {
        border-left: 4px solid #f59e0b;
    }
    
    .dashboard-notification.info {
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
    
    .reject-modal-overlay {
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
    
    .reject-modal {
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
    }
    
    .modal-body textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    
    .loading {
        opacity: 0.6;
        pointer-events: none;
    }
    
    .btn-approve.loading,
    .btn-reject.loading {
        background: #9ca3af !important;
        cursor: not-allowed;
    }

    .feeds-stats-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        transition: all 0.3s ease;
    }

    .feeds-stats-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .feeds-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        padding: 16px 0;
    }

    .feeds-stat-item {
        text-align: center;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .feeds-stat-item .stat-number {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
    }

    .feeds-stat-item .stat-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge {
        background: #ef4444;
        color: white;
        border-radius: 50%;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: -8px;
        right: -8px;
    }

    .badge.highlight {
        animation: badgePulse 2s infinite;
    }

    @keyframes badgePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

document.head.appendChild(style);