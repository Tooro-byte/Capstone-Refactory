// Feeds Request Form Handler
class FeedsRequestForm {
    constructor() {
        this.currentSection = 1;
        this.totalSections = 3;
        this.formData = {};
        this.feedPrices = {
            starter: 45000,
            grower: 42000,
            layer: 40000,
            broiler: 43000
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProgress();
        this.updateNavigation();
        console.log('Feeds Request Form initialized');
    }

    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSection());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSection());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
        }

        // Form inputs for real-time validation
        const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Feed type checkboxes
        const feedCheckboxes = document.querySelectorAll('.feed-checkbox');
        feedCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFeedSelection());
        });

        // Quantity and urgency selects
        const quantitySelect = document.getElementById('feedQuantity');
        const urgencySelect = document.getElementById('urgency');

        if (quantitySelect) {
            quantitySelect.addEventListener('change', () => this.updateCostCalculation());
        }

        // Phone number formatting
        const phoneInput = document.getElementById('farmerPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }

        // NIN formatting
        const ninInput = document.getElementById('farmerNIN');
        if (ninInput) {
            ninInput.addEventListener('input', (e) => this.formatNIN(e));
        }

        // Farmer type change
        const farmerTypeSelect = document.getElementById('farmerType');
        if (farmerTypeSelect) {
            farmerTypeSelect.addEventListener('change', () => this.handleFarmerTypeChange());
        }

        // Form submission
        const form = document.getElementById('feedsRequestForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    nextSection() {
        if (this.validateCurrentSection()) {
            if (this.currentSection < this.totalSections) {
                this.hideSection(this.currentSection);
                this.currentSection++;
                this.showSection(this.currentSection);
                this.updateProgress();
                this.updateNavigation();
                
                if (this.currentSection === 3) {
                    this.updateConfirmationSummary();
                }
                
                this.scrollToTop();
            }
        }
    }

    previousSection() {
        if (this.currentSection > 1) {
            this.hideSection(this.currentSection);
            this.currentSection--;
            this.showSection(this.currentSection);
            this.updateProgress();
            this.updateNavigation();
            this.scrollToTop();
        }
    }

    showSection(sectionNumber) {
        const section = document.querySelector(`[data-section="${sectionNumber}"]`);
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
    }

    hideSection(sectionNumber) {
        const section = document.querySelector(`[data-section="${sectionNumber}"]`);
        if (section) {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    }

    updateProgress() {
        const progressSteps = document.querySelectorAll('.progress-step');
        
        progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentSection) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentSection) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentSection > 1 ? 'flex' : 'none';
        }

        // Next/Submit buttons
        if (this.currentSection < this.totalSections) {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (submitBtn) submitBtn.style.display = 'none';
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'flex';
        }
    }

    validateCurrentSection() {
        let isValid = true;
        const currentSectionElement = document.querySelector(`[data-section="${this.currentSection}"]`);
        
        if (!currentSectionElement) return false;

        const requiredFields = currentSectionElement.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional validation for section 2 (feed selection)
        if (this.currentSection === 2) {
            const selectedFeeds = document.querySelectorAll('.feed-checkbox:checked');
            if (selectedFeeds.length === 0) {
                const feedGrid = document.querySelector('.feed-types-grid');
                if (feedGrid) {
                    this.showFieldError(feedGrid, 'Please select at least one feed type');
                }
                isValid = false;
            }
        }

        // Additional validation for section 3 (terms agreement)
        if (this.currentSection === 3) {
            const termsCheckbox = document.getElementById('agreeTerms');
            if (termsCheckbox && !termsCheckbox.checked) {
                const termsAgreement = termsCheckbox.closest('.terms-agreement');
                if (termsAgreement) {
                    this.showFieldError(termsAgreement, 'You must agree to the terms and conditions');
                }
                isValid = false;
            }
        }

        return isValid;
    }

    validateField(field) {
        if (!field) return false;
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = 'This field is required';
            isValid = false;
        }

        // Specific field validations
        switch (field.id) {
            case 'farmerPhone':
                if (value && !this.isValidPhoneNumber(value)) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'farmerNIN':
                if (value && !this.isValidNIN(value)) {
                    errorMessage = 'Please enter a valid NIN number';
                    isValid = false;
                }
                break;

            case 'currentChicks':
                if (value && (isNaN(value) || parseInt(value) < 0)) {
                    errorMessage = 'Please enter a valid number of chicks';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        if (!field) return;
        
        this.clearFieldError(field);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        `;
        errorElement.innerHTML = `<span>⚠️</span> ${message}`;

        const wrapper = field.closest('.form-group') || field.closest('.feed-types-grid') || field.closest('.terms-agreement');
        if (wrapper) {
            wrapper.appendChild(errorElement);
            wrapper.classList.add('has-error');
        }

        // Add error styling to field
        if (field.classList && (field.classList.contains('form-input') || field.classList.contains('form-select') || field.classList.contains('form-textarea'))) {
            field.style.borderColor = '#ef4444';
            field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        }
    }

    clearFieldError(field) {
        if (!field) return;
        
        const wrapper = field.closest('.form-group') || field.closest('.feed-types-grid') || field.closest('.terms-agreement');
        if (wrapper) {
            const errorElement = wrapper.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
            wrapper.classList.remove('has-error');
        }

        // Remove error styling
        if (field.classList && (field.classList.contains('form-input') || field.classList.contains('form-select') || field.classList.contains('form-textarea'))) {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }
    }

    updateFeedSelection() {
        const selectedFeeds = document.querySelectorAll('.feed-checkbox:checked');
        const feedTypesGrid = document.querySelector('.feed-types-grid');
        
        // Clear any previous errors
        if (feedTypesGrid) {
            this.clearFieldError(feedTypesGrid);
        }
        
        // Update cost calculation
        this.updateCostCalculation();
    }

    updateCostCalculation() {
        const selectedFeeds = document.querySelectorAll('.feed-checkbox:checked');
        const quantitySelect = document.getElementById('feedQuantity');
        const quantity = parseInt(quantitySelect?.value || 0);
        
        let totalCost = 0;
        
        selectedFeeds.forEach(checkbox => {
            const feedType = checkbox.value;
            const feedPrice = this.feedPrices[feedType] || 0;
            totalCost += feedPrice * quantity;
        });

        // Update confirmation summary if on section 3
        if (this.currentSection === 3) {
            const confirmCost = document.getElementById('confirmCost');
            if (confirmCost) {
                confirmCost.textContent = `UGX ${totalCost.toLocaleString()}`;
            }
        }

        return totalCost;
    }

    updateConfirmationSummary() {
        // Farmer details
        const confirmName = document.getElementById('confirmName');
        const confirmPhone = document.getElementById('confirmPhone');
        const confirmType = document.getElementById('confirmType');
        const confirmChicks = document.getElementById('confirmChicks');

        const farmerName = document.getElementById('farmerName');
        const farmerPhone = document.getElementById('farmerPhone');
        const farmerType = document.getElementById('farmerType');
        const currentChicks = document.getElementById('currentChicks');

        if (confirmName && farmerName) confirmName.textContent = farmerName.value || '-';
        if (confirmPhone && farmerPhone) confirmPhone.textContent = farmerPhone.value || '-';
        if (confirmType && farmerType) confirmType.textContent = farmerType.value || '-';
        if (confirmChicks && currentChicks) confirmChicks.textContent = currentChicks.value || '-';

        // Feed details
        const selectedFeeds = document.querySelectorAll('.feed-checkbox:checked');
        const feedTypes = Array.from(selectedFeeds).map(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"] .feed-name`);
            return label ? label.textContent : checkbox.value;
        });

        const confirmFeedTypes = document.getElementById('confirmFeedTypes');
        const confirmQuantity = document.getElementById('confirmQuantity');
        const confirmUrgency = document.getElementById('confirmUrgency');

        if (confirmFeedTypes) {
            confirmFeedTypes.textContent = feedTypes.length > 0 ? feedTypes.join(', ') : '-';
        }
        
        if (confirmQuantity) {
            const quantitySelect = document.getElementById('feedQuantity');
            const quantity = quantitySelect ? quantitySelect.value : '';
            confirmQuantity.textContent = quantity ? `${quantity} bag${quantity > 1 ? 's' : ''}` : '-';
        }
        
        if (confirmUrgency) {
            const urgencySelect = document.getElementById('urgency');
            const urgency = urgencySelect ? urgencySelect.value : '';
            confirmUrgency.textContent = urgency || '-';
        }

        // Update total cost
        this.updateCostCalculation();
    }

    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        // Uganda phone number formatting
        if (value.startsWith('256')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+256' + value.substring(1);
        } else if (value.length > 0 && !value.startsWith('+')) {
            value = '+256' + value;
        }
        
        event.target.value = value;
    }

    formatNIN(event) {
        let value = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // Uganda NIN format: 2 letters + 12 digits
        if (value.length > 14) {
            value = value.substring(0, 14);
        }
        
        event.target.value = value;
    }

    handleFarmerTypeChange() {
        const farmerTypeSelect = document.getElementById('farmerType');
        const quantitySelect = document.getElementById('feedQuantity');
        
        if (farmerTypeSelect && quantitySelect && farmerTypeSelect.value === 'starter') {
            // Starter farmers might have different restrictions
            // This is where you could implement business logic
        }
    }

    isValidPhoneNumber(phone) {
        // Uganda phone number validation
        const phoneRegex = /^\+256[0-9]{9}$/;
        return phoneRegex.test(phone);
    }

    isValidNIN(nin) {
        // Uganda NIN validation: 2 letters followed by 12 digits
        const ninRegex = /^[A-Z]{2}[0-9]{12}$/;
        return ninRegex.test(nin);
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateCurrentSection()) {
            return;
        }

        // Get selected feeds and quantity for cost calculation
        const selectedFeeds = document.querySelectorAll('.feed-checkbox:checked');
        const quantitySelect = document.getElementById('feedQuantity');
        const quantity = parseInt(quantitySelect?.value || 0);
        
        let totalCost = 0;
        
        if (selectedFeeds.length > 0 && quantity > 0) {
            // Distribute bags evenly among selected feed types (matching backend logic)
            selectedFeeds.forEach((checkbox, index) => {
                const feedType = checkbox.value;
                const feedPrice = this.feedPrices[feedType] || 0;
                
                // Calculate quantity per feed type (same logic as backend)
                const baseQuantityPerType = Math.floor(quantity / selectedFeeds.length);
                const remainder = index < (quantity % selectedFeeds.length) ? 1 : 0;
                const actualQuantity = baseQuantityPerType + remainder;
                
                totalCost += feedPrice * actualQuantity;
            });
        }

        const submitBtn = document.getElementById('submitBtn');
        const form = document.getElementById('feedsRequestForm');
        
        if (!form) {
            console.error('Form not found');
            return;
        }
        
        // Show loading state
        this.setLoadingState(submitBtn, true);
        
        try {
            // Collect form data - use URLSearchParams for better compatibility
            const formData = new URLSearchParams();
            
            // Add all form fields
            const formElements = form.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                if (element.type === 'checkbox') {
                    // Skip checkboxes, we'll handle feed types separately
                    return;
                } else if (element.name && element.value) {
                    formData.append(element.name, element.value);
                }
            });
            
            // Handle feed types checkboxes
            const feedTypes = Array.from(selectedFeeds).map(checkbox => checkbox.value);
            
            // Add each feed type as separate form field (traditional form approach)
            feedTypes.forEach(feedType => {
                formData.append('feedTypes', feedType);
            });
            
            // Calculate total cost
            formData.append('totalCost', totalCost);
            
            // Submit form
            const response = await fetch('/feedsReq', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
                credentials: 'include'
            });
            
            let result;
            try {
                result = await response.json();
            } catch (e) {
                // If response is not JSON, handle as error
                throw new Error('Invalid server response');
            }
            
            if (result.success) {
                this.showSuccessMessage(result.message, result.requestId);
            } else {
                this.showErrorMessage(result.message || 'Failed to submit request');
            }
            
        } catch (error) {
            console.error('Error submitting form:', error);
            if (error.message === 'Invalid server response') {
                this.showErrorMessage('Server error. Please try again or contact support.');
            } else {
                this.showErrorMessage('Network error. Please check your connection and try again.');
            }
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    showSuccessMessage(message, requestId) {
        const formContainer = document.querySelector('.feeds-form-container');
        
        if (!formContainer) {
            console.error('Form container not found');
            return;
        }
        
        const successHTML = `
            <div class="form-success">
                <div class="success-icon">🎉</div>
                <h2 class="success-title">Request Submitted Successfully!</h2>
                <p class="success-message">${message}</p>
                <div class="success-details">
                    <p><strong>Request ID:</strong> ${requestId}</p>
                    <p>You will receive a confirmation SMS shortly.</p>
                    <p>Expected processing time: 2-3 business days</p>
                </div>
                <div class="success-actions">
                    <a href="/dashboard" class="success-btn">Go to Dashboard</a>
                    <a href="/feeds" class="success-btn">Make Another Request</a>
                </div>
            </div>
        `;
        
        formContainer.innerHTML = successHTML;
        this.scrollToTop();
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.form-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            min-width: 300px;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        `;

        const notificationContent = notification.querySelector('.notification-content');
        if (notificationContent) {
            notificationContent.style.cssText = `
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            `;
        }

        const notificationIcon = notification.querySelector('.notification-icon');
        if (notificationIcon) {
            notificationIcon.style.fontSize = '20px';
        }

        const notificationMessage = notification.querySelector('.notification-message');
        if (notificationMessage) {
            notificationMessage.style.cssText = `
                flex: 1;
                font-weight: 500;
                color: #1a202c;
            `;
        }

        const notificationClose = notification.querySelector('.notification-close');
        if (notificationClose) {
            notificationClose.style.cssText = `
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
            `;
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the feeds page and the form exists
    if (document.getElementById('feedsRequestForm')) {
        window.feedsRequestForm = new FeedsRequestForm();
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
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
    
    .has-error .form-input,
    .has-error .form-select,
    .has-error .form-textarea {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .has-error .feed-type-card {
        border-color: #ef4444 !important;
    }
`;

if (document.head) {
    document.head.appendChild(style);
}