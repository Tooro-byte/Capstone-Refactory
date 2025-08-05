// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.data = {
            stats: {
                totalStock: 0,
                pendingRequests: 0,
                approvedToday: 0,
                activeFarmers: 0,
                totalRevenue: 0
            },
            stock: [],
            requests: [],
            activities: []
        };
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.loadDashboardData();
        this.initializeLucideIcons();
    }

    initializeLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initializeEventListeners() {
        // Navigation event listeners
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNavigation(e, item);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Quick action buttons
        const quickBtns = document.querySelectorAll('.quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e);
            });
        });

        // Action items
        const actionItems = document.querySelectorAll('.action-item');
        actionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleActionClick(e, item);
            });
        });

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Notification button
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.handleNotifications();
            });
        }

        // Card actions
        const cardActions = document.querySelectorAll('.card-action');
        cardActions.forEach(action => {
            action.addEventListener('click', (e) => {
                this.handleCardAction(e);
            });
        });

        // Request action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) {
                this.handleRequestAction(e);
            }
        });
    }

    async loadDashboardData() {
        try {
            // Simulate API call - replace with actual API endpoints
            await this.fetchDashboardStats();
            await this.fetchStockData();
            await this.fetchRequestsData();
            await this.fetchActivitiesData();
            
            this.updateUI();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchDashboardStats() {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.stats = {
                    totalStock: 1250,
                    pendingRequests: 8,
                    approvedToday: 12,
                    activeFarmers: 45,
                    totalRevenue: 125000
                };
                resolve();
            }, 1000);
        });
    }

    async fetchStockData() {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.stock = [
                    {
                        id: 1,
                        category: 'Broiler',
                        type: 'Cobb 500',
                        age: 7,
                        quantity: 500,
                        date: '2024-01-15'
                    },
                    {
                        id: 2,
                        category: 'Layer',
                        type: 'Lohmann Brown',
                        age: 14,
                        quantity: 300,
                        date: '2024-01-14'
                    },
                    {
                        id: 3,
                        category: 'Broiler',
                        type: 'Ross 308',
                        age: 21,
                        quantity: 450,
                        date: '2024-01-13'
                    }
                ];
                resolve();
            }, 1200);
        });
    }

    async fetchRequestsData() {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.requests = [
                    {
                        id: 1,
                        farmer: 'John Doe',
                        chicks: 100,
                        type: 'Broiler',
                        cost: 16500,
                        date: '2024-01-16',
                        status: 'pending'
                    },
                    {
                        id: 2,
                        farmer: 'Jane Smith',
                        chicks: 50,
                        type: 'Layer',
                        cost: 8250,
                        date: '2024-01-15',
                        status: 'pending'
                    },
                    {
                        id: 3,
                        farmer: 'Mike Johnson',
                        chicks: 75,
                        type: 'Broiler',
                        cost: 12375,
                        date: '2024-01-14',
                        status: 'approved'
                    }
                ];
                resolve();
            }, 1500);
        });
    }

    async fetchActivitiesData() {
        // Simulate API call - replace with actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.activities = [
                    {
                        id: 1,
                        text: 'John Doe requested 100 Broiler chicks',
                        time: '2 hours ago',
                        type: 'request'
                    },
                    {
                        id: 2,
                        text: 'Stock updated: 300 Layer chicks added',
                        time: '4 hours ago',
                        type: 'stock'
                    },
                    {
                        id: 3,
                        text: 'Jane Smith\'s request approved',
                        time: '6 hours ago',
                        type: 'approval'
                    }
                ];
                resolve();
            }, 1800);
        });
    }

    updateUI() {
        this.updateStats();
        this.updateStockList();
        this.updateRequestsList();
        this.updateActivitiesList();
        this.updateAlerts();
        this.updatePerformanceStats();
        this.updateBadges();
    }

    updateStats() {
        const { stats } = this.data;
        
        // Update stat numbers
        document.getElementById('total-stock').textContent = stats.totalStock.toLocaleString();
        document.getElementById('pending-requests').textContent = stats.pendingRequests;
        document.getElementById('approved-today').textContent = stats.approvedToday;
        document.getElementById('active-farmers').textContent = stats.activeFarmers;
        document.getElementById('total-revenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;

        // Update trends
        document.getElementById('stock-trend').textContent = 
            stats.totalStock > 1000 ? 'Good inventory level' : 'Low inventory - Restock needed';
        document.getElementById('pending-trend').textContent = 
            stats.pendingRequests > 0 ? `${stats.pendingRequests} requests awaiting approval` : 'All caught up';
        document.getElementById('approved-trend').textContent = 
            stats.approvedToday > 0 ? `${stats.approvedToday} approvals completed` : 'No approvals today';
        document.getElementById('farmers-trend').textContent = 
            stats.activeFarmers > 10 ? 'Growing community' : 'Building farmer network';
        document.getElementById('revenue-trend').textContent = 'Strong performance';
    }

    updateStockList() {
        const stockList = document.getElementById('stock-list');
        if (!stockList) return;

        if (this.data.stock.length === 0) {
            stockList.innerHTML = '<div class="loading">No stock data available</div>';
            return;
        }

        stockList.innerHTML = this.data.stock.map(item => `
            <div class="stock-item">
                <div class="stock-info">
                    <h4>${item.category} - ${item.type}</h4>
                    <div class="stock-details">Age: ${item.age} days | Quantity: ${item.quantity}</div>
                    <div class="stock-date">Added: ${new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div class="stock-status ${item.quantity > 100 ? 'good' : 'low'}">
                    ${item.quantity > 100 ? 'Good Stock' : 'Low Stock'}
                </div>
            </div>
        `).join('');
    }

    updateRequestsList() {
        const requestsList = document.getElementById('pending-requests-list');
        if (!requestsList) return;

        const pendingRequests = this.data.requests.filter(req => req.status === 'pending').slice(0, 3);

        if (pendingRequests.length === 0) {
            requestsList.innerHTML = '<div class="loading">No pending requests</div>';
            return;
        }

        requestsList.innerHTML = pendingRequests.map(request => `
            <div class="request-item">
                <div class="request-info">
                    <h4>${request.farmer}</h4>
                    <div class="request-details">${request.chicks} ${request.type} chicks</div>
                    <div class="request-cost">Cost: $${request.cost.toLocaleString()}</div>
                </div>
                <div class="request-actions">
                    <button class="action-btn approve" data-id="${request.id}" data-action="approve">
                        Approve
                    </button>
                    <button class="action-btn reject" data-id="${request.id}" data-action="reject">
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateActivitiesList() {
        const activitiesList = document.getElementById('activities-list');
        if (!activitiesList) return;

        if (this.data.activities.length === 0) {
            activitiesList.innerHTML = '<div class="loading">No recent activities</div>';
            return;
        }

        activitiesList.innerHTML = this.data.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-dot ${activity.type}"></div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    updateAlerts() {
        const alertsList = document.getElementById('alerts-list');
        if (!alertsList) return;

        const lowStockItems = this.data.stock.filter(item => item.quantity < 100);

        if (lowStockItems.length === 0) {
            alertsList.innerHTML = `
                <div class="alert-item success">
                    <i data-lucide="check-circle"></i>
                    <div class="alert-content">
                        <div class="alert-title">All Good!</div>
                        <div class="alert-desc">No stock alerts at this time</div>
                    </div>
                </div>
            `;
        } else {
            alertsList.innerHTML = lowStockItems.map(item => `
                <div class="alert-item warning">
                    <i data-lucide="alert-triangle"></i>
                    <div class="alert-content">
                        <div class="alert-title">Low Stock Alert</div>
                        <div class="alert-desc">${item.type} stock is low (${item.quantity} remaining)</div>
                    </div>
                </div>
            `).join('');
        }

        // Re-initialize icons for new content
        this.initializeLucideIcons();
    }

    updatePerformanceStats() {
        const { stats } = this.data;
        
        document.getElementById('total-chicks-sold').textContent = stats.totalStock;
        document.getElementById('monthly-revenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        document.getElementById('completed-orders').textContent = stats.approvedToday;
    }

    updateBadges() {
        const pendingBadge = document.getElementById('pending-badge');
        const notificationBadge = document.getElementById('notification-badge');
        
        if (pendingBadge) {
            pendingBadge.textContent = this.data.stats.pendingRequests;
        }
        
        if (notificationBadge) {
            notificationBadge.textContent = '3'; // Static for demo
        }
    }

    handleNavigation(e, item) {
        e.preventDefault();
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.classList.remove('active');
        });
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Handle navigation logic here
        const section = item.dataset.section;
        if (section) {
            this.navigateToSection(section);
        }
    }

    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        // Implement section navigation logic
    }

    handleSearch(query) {
        console.log(`Searching for: ${query}`);
        // Implement search functionality
        if (query.length > 2) {
            this.performSearch(query);
        }
    }

    performSearch(query) {
        // Filter data based on search query
        const filteredRequests = this.data.requests.filter(request => 
            request.farmer.toLowerCase().includes(query.toLowerCase()) ||
            request.type.toLowerCase().includes(query.toLowerCase())
        );
        
        const filteredStock = this.data.stock.filter(stock => 
            stock.type.toLowerCase().includes(query.toLowerCase()) ||
            stock.category.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log('Search results:', { requests: filteredRequests, stock: filteredStock });
        // Update UI with filtered results
    }

    handleQuickAction(e) {
        e.preventDefault();
        const action = e.currentTarget.textContent.trim();
        console.log(`Quick action clicked: ${action}`);
        
        if (action.includes('Add Stock')) {
            this.navigateToAddStock();
        } else if (action.includes('Review Requests')) {
            this.navigateToRequests();
        }
    }

    handleActionClick(e, item) {
        e.preventDefault();
        const actionTitle = item.querySelector('.action-title').textContent;
        console.log(`Action clicked: ${actionTitle}`);
        
        switch (actionTitle) {
            case 'Add New Stock':
                this.navigateToAddStock();
                break;
            case 'Update Stock':
                this.navigateToUpdateStock();
                break;
            case 'Generate Report':
                this.generateReport();
                break;
        }
    }

    handleRequestAction(e) {
        e.preventDefault();
        const action = e.target.dataset.action;
        const requestId = e.target.dataset.id;
        
        if (action === 'approve') {
            this.approveRequest(requestId);
        } else if (action === 'reject') {
            this.rejectRequest(requestId);
        }
    }

    async approveRequest(requestId) {
        try {
            console.log(`Approving request: ${requestId}`);
            
            // Show loading state
            const button = document.querySelector(`[data-id="${requestId}"][data-action="approve"]`);
            const originalText = button.textContent;
            button.textContent = 'Approving...';
            button.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update local data
            const request = this.data.requests.find(r => r.id == requestId);
            if (request) {
                request.status = 'approved';
                this.data.stats.pendingRequests--;
                this.data.stats.approvedToday++;
            }
            
            // Refresh UI
            this.updateUI();
            this.showSuccess('Request approved successfully');
            
        } catch (error) {
            console.error('Error approving request:', error);
            this.showError('Failed to approve request');
        }
    }

    async rejectRequest(requestId) {
        try {
            console.log(`Rejecting request: ${requestId}`);
            
            // Show confirmation dialog
            if (!confirm('Are you sure you want to reject this request?')) {
                return;
            }
            
            // Show loading state
            const button = document.querySelector(`[data-id="${requestId}"][data-action="reject"]`);
            const originalText = button.textContent;
            button.textContent = 'Rejecting...';
            button.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update local data
            const request = this.data.requests.find(r => r.id == requestId);
            if (request) {
                request.status = 'rejected';
                this.data.stats.pendingRequests--;
            }
            
            // Refresh UI
            this.updateUI();
            this.showSuccess('Request rejected successfully');
            
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showError('Failed to reject request');
        }
    }

    handleCardAction(e) {
        e.preventDefault();
        const action = e.target.textContent.trim();
        console.log(`Card action clicked: ${action}`);
        
        switch (action) {
            case 'Manage Stock':
                this.navigateToStockManagement();
                break;
            case 'View All':
                this.navigateToAllRequests();
                break;
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('Logging out...');
            // Implement logout logic
            window.location.href = '/logout';
        }
    }

    handleNotifications() {
        console.log('Opening notifications...');
        // Implement notifications panel
        this.showNotifications();
    }

    // Navigation methods
    navigateToAddStock() {
        console.log('Navigating to Add Stock page');
        window.location.href = '/addchicks';
    }

    navigateToRequests() {
        console.log('Navigating to Requests page');
        window.location.href = '/requests';
    }

    navigateToUpdateStock() {
        console.log('Navigating to Update Stock page');
        window.location.href = '/updatechick';
    }

    navigateToStockManagement() {
        console.log('Navigating to Stock Management page');
        window.location.href = '/chickslist';
    }

    navigateToAllRequests() {
        console.log('Navigating to All Requests page');
        window.location.href = '/manager/requests/all';
    }

    generateReport() {
        console.log('Generating report...');
        // Implement report generation
        this.showSuccess('Report generation started. You will be notified when ready.');
    }

    showNotifications() {
        // Create and show notifications panel
        const notifications = [
            { id: 1, text: 'Low stock alert: Broiler chicks running low', time: '5 min ago', type: 'warning' },
            { id: 2, text: 'New request from John Doe', time: '10 min ago', type: 'info' },
            { id: 3, text: 'Stock updated successfully', time: '1 hour ago', type: 'success' }
        ];
        
        console.log('Notifications:', notifications);
        // Implement notification panel UI
    }

    // Utility methods
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardManager();
    
    // Make dashboard globally available for debugging
    window.dashboard = dashboard;
});

// Handle window resize
window.addEventListener('resize', () => {
    // Handle responsive adjustments if needed
    console.log('Window resized');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing data...');
        if (window.dashboard) {
            window.dashboard.loadDashboardData();
        }
    }
});