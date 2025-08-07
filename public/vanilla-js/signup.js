class SignupValidator {
    constructor() {
        this.form = document.getElementById('signupForm');
        this.fields = {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            phone: document.getElementById('phone'),
            nin: document.getElementById('nin'),
            role: document.getElementById('role'),
            recommenderName: document.getElementById('recommenderName'),
            recommenderNIN: document.getElementById('recommenderNIN'),
            terms: document.getElementById('terms')
        };
        this.errors = {};
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPasswordToggle();
        this.setupRoleHandler();
        this.showWelcomeAnimation();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldName));
                field.addEventListener('input', () => this.clearFieldError(fieldName));
                
                // Special handling for password
                if (fieldName === 'password') {
                    field.addEventListener('input', () => this.updatePasswordStrength());
                }
            }
        });

        // Phone number formatting
        this.fields.phone.addEventListener('input', (e) => this.formatPhoneNumber(e));
        
        // NIN formatting
        this.fields.nin.addEventListener('input', (e) => this.formatNIN(e));
        this.fields.recommenderNIN.addEventListener('input', (e) => this.formatNIN(e));
    }

    setupPasswordToggle() {
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordField = this.fields.password;

        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordField.type === 'password';
            passwordField.type = isPassword ? 'text' : 'password';
            passwordToggle.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    setupRoleHandler() {
        const roleField = this.fields.role;
        const recommenderSection = document.getElementById('recommenderSection');

        roleField.addEventListener('change', (e) => {
            const selectedRole = e.target.value;
            
            if (selectedRole === 'farmer') {
                this.showRecommenderSection();
            } else {
                this.hideRecommenderSection();
            }
        });
    }

    showRecommenderSection() {
        const recommenderSection = document.getElementById('recommenderSection');
        recommenderSection.style.display = 'block';
        
        // Make recommender fields required
        this.fields.recommenderName.required = true;
        this.fields.recommenderNIN.required = true;
        
        // Add animation
        setTimeout(() => {
            recommenderSection.style.opacity = '1';
            recommenderSection.style.transform = 'translateY(0)';
        }, 10);
        
        this.showNotification('Recommender information is required for farmers', 'info');
    }

    hideRecommenderSection() {
        const recommenderSection = document.getElementById('recommenderSection');
        recommenderSection.style.display = 'none';
        
        // Make recommender fields not required
        this.fields.recommenderName.required = false;
        this.fields.recommenderNIN.required = false;
        
        // Clear recommender field values and errors
        this.fields.recommenderName.value = '';
        this.fields.recommenderNIN.value = '';
        this.clearFieldError('recommenderName');
        this.clearFieldError('recommenderNIN');
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearFieldError(fieldName);

        switch (fieldName) {
            case 'name':
                if (!value) {
                    errorMessage = 'Full name is required';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Name must be at least 2 characters';
                    isValid = false;
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    errorMessage = 'Name can only contain letters and spaces';
                    isValid = false;
                }
                break;

            case 'email':
                if (!value) {
                    errorMessage = 'Email address is required';
                    isValid = false;
                } else if (!this.isValidEmail(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'password':
                if (!value) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (value.length < 8) {
                    errorMessage = 'Password must be at least 8 characters';
                    isValid = false;
                } else if (!this.isStrongPassword(value)) {
                    errorMessage = 'Password must contain uppercase, lowercase, number and special character';
                    isValid = false;
                }
                break;

            case 'phone':
                if (!value) {
                    errorMessage = 'Phone number is required';
                    isValid = false;
                } else if (!this.isValidPhone(value)) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'nin':
                if (!value) {
                    errorMessage = 'NIN number is required';
                    isValid = false;
                } else if (!this.isValidNIN(value)) {
                    errorMessage = 'NIN must be exactly 11 digits';
                    isValid = false;
                }
                break;

            case 'role':
                if (!value) {
                    errorMessage = 'Please select your role';
                    isValid = false;
                }
                break;

            case 'recommenderName':
                if (this.fields.role.value === 'farmer') {
                    if (!value) {
                        errorMessage = 'Recommender name is required for farmers';
                        isValid = false;
                    } else if (value.length < 2) {
                        errorMessage = 'Recommender name must be at least 2 characters';
                        isValid = false;
                    }
                }
                break;

            case 'recommenderNIN':
                if (this.fields.role.value === 'farmer') {
                    if (!value) {
                        errorMessage = 'Recommender NIN is required for farmers';
                        isValid = false;
                    } else if (!this.isValidNIN(value)) {
                        errorMessage = 'Recommender NIN must be exactly 11 digits';
                        isValid = false;
                    }
                }
                break;

            case 'terms':
                if (!field.checked) {
                    errorMessage = 'You must agree to the terms and conditions';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(fieldName, errorMessage);
            field.classList.add('error');
            field.classList.remove('success');
        } else {
            field.classList.remove('error');
            field.classList.add('success');
        }

        this.errors[fieldName] = !isValid;
        return isValid;
    }

    validateAllFields() {
        let isFormValid = true;
        const fieldsToValidate = ['name', 'email', 'password', 'phone', 'nin', 'role', 'terms'];
        
        // Add recommender fields if role is farmer
        if (this.fields.role.value === 'farmer') {
            fieldsToValidate.push('recommenderName', 'recommenderNIN');
        }

        fieldsToValidate.forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;

        // Validate all fields
        if (!this.validateAllFields()) {
            this.showError('Please fix the errors above before submitting');
            this.scrollToFirstError();
            return;
        }

        this.isSubmitting = true;
        this.showLoadingState();

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create form data
            const formData = new FormData(this.form);
            
            // Submit form
            const response = await fetch('/signup', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                const errorData = await response.json();
                this.showError(errorData.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.isSubmitting = false;
            this.hideLoadingState();
        }
    }

    // Validation helper methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    isValidNIN(nin) {
        const ninRegex = /^\d{11}$/;
        return ninRegex.test(nin);
    }

    isStrongPassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    // Password strength indicator
    updatePasswordStrength() {
        const password = this.fields.password.value;
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        let strength = 0;
        let strengthLabel = 'Weak';
        
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        
        // Remove all strength classes
        strengthBar.className = 'strength-fill';
        strengthText.className = 'strength-text';
        
        if (strength >= 4) {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthLabel = 'Strong';
        } else if (strength >= 3) {
            strengthBar.classList.add('good');
            strengthText.classList.add('good');
            strengthLabel = 'Good';
        } else if (strength >= 2) {
            strengthBar.classList.add('fair');
            strengthText.classList.add('fair');
            strengthLabel = 'Fair';
        } else {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthLabel = 'Weak';
        }
        
        strengthText.textContent = strengthLabel;
    }

    // Formatting methods
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        // Format as: 0803 123 4567
        if (value.length > 7) {
            value = value.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
        } else if (value.length > 4) {
            value = value.replace(/(\d{4})(\d{3})/, '$1 $2');
        }
        
        e.target.value = value;
    }

    formatNIN(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        e.target.value = value;
    }

    // UI helper methods
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        const successContainer = document.getElementById('successContainer');
        
        successContainer.style.display = 'none';
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successContainer = document.getElementById('successContainer');
        const successMessage = document.getElementById('successMessage');
        const errorContainer = document.getElementById('errorContainer');
        
        errorContainer.style.display = 'none';
        successMessage.textContent = message;
        successContainer.style.display = 'flex';
    }

    showLoadingState() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }

    hideLoadingState() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }

    scrollToFirstError() {
        const firstError = document.querySelector('.field-error.show');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
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
            .notification.info { border-left: 4px solid #3b82f6; }
            .notification.success { border-left: 4px solid #10b981; }
            .notification.error { border-left: 4px solid #ef4444; }
            .notification.warning { border-left: 4px solid #f59e0b; }
            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            .notification-message { flex: 1; font-weight: 500; }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.5;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        if (!document.querySelector('#notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    showWelcomeAnimation() {
        // Add welcome animation to logo
        const logo = document.querySelector('.logo-icon');
        if (logo) {
            setTimeout(() => {
                logo.style.animation = 'bounce 2s infinite';
            }, 500);
        }

        // Progressive form reveal
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                group.style.transition = 'all 0.5s ease';
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Modal functions for terms and privacy
function openTermsModal() {
    const modalHTML = `
        <div class="modal-overlay" id="termsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Terms of Service</h3>
                    <button class="modal-close" onclick="closeModal('termsModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>1. Acceptance of Terms</h4>
                    <p>By using Young4Chicks services, you agree to these terms...</p>
                    
                    <h4>2. User Responsibilities</h4>
                    <p>Users must provide accurate information and comply with all applicable laws...</p>
                    
                    <h4>3. Service Availability</h4>
                    <p>We strive to maintain service availability but cannot guarantee uninterrupted access...</p>
                    
                    <h4>4. Privacy and Data Protection</h4>
                    <p>Your privacy is important to us. Please review our Privacy Policy...</p>
                    
                    <h4>5. Limitation of Liability</h4>
                    <p>Young4Chicks shall not be liable for any indirect, incidental, or consequential damages...</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="closeModal('termsModal')">I Understand</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openPrivacyModal() {
    const modalHTML = `
        <div class="modal-overlay" id="privacyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Privacy Policy</h3>
                    <button class="modal-close" onclick="closeModal('privacyModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>Information We Collect</h4>
                    <p>We collect information you provide directly to us, such as when you create an account...</p>
                    
                    <h4>How We Use Your Information</h4>
                    <p>We use the information we collect to provide, maintain, and improve our services...</p>
                    
                    <h4>Information Sharing</h4>
                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties...</p>
                    
                    <h4>Data Security</h4>
                    <p>We implement appropriate security measures to protect your personal information...</p>
                    
                    <h4>Contact Us</h4>
                    <p>If you have questions about this Privacy Policy, please contact us at privacy@young4chicks.com</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="closeModal('privacyModal')">I Understand</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.signupValidator = new SignupValidator();
});

// Add modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-overlay {
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
    
    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: modalSlideIn 0.3s ease;
    }
    
    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
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
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-body h4 {
        color: #374151;
        margin: 20px 0 10px 0;
    }
    
    .modal-body h4:first-child {
        margin-top: 0;
    }
    
    .modal-body p {
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 15px;
    }
    
    .modal-footer {
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: right;
    }
    
    .btn-primary {
        padding: 10px 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
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
`;

document.head.appendChild(modalStyles);