// Simple client-side validation for signup form
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="/signup"]');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const phoneInput = document.getElementById('phone');
    const ninInput = document.getElementById('nin');
    const roleSelect = document.getElementById('role');
    const recommenderNameInput = document.getElementById('recommenderName');
    const recommenderNINInput = document.getElementById('recommenderNIN');
    const submitButton = document.querySelector('button[type="submit"]');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone validation regex (basic international format)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    
    // NIN validation regex (numbers and capital letters only)
    const ninRegex = /^[A-Z0-9]+$/;

    // Create error display function
    function showError(input, message) {
        removeError(input);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
        input.style.borderColor = '#dc3545';
    }

    function removeError(input) {
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        input.style.borderColor = '';
    }

    function showSuccess(input) {
        removeError(input);
        input.style.borderColor = '#28a745';
    }

    // Individual field validators
    function validateName() {
        const value = nameInput.value.trim();
        if (value === '') {
            showError(nameInput, 'Full name is required');
            return false;
        } else if (value.length < 2) {
            showError(nameInput, 'Name must be at least 2 characters');
            return false;
        }
        showSuccess(nameInput);
        return true;
    }

    function validateEmail() {
        const value = emailInput.value.trim();
        if (value === '') {
            showError(emailInput, 'Email is required');
            return false;
        } else if (!emailRegex.test(value)) {
            showError(emailInput, 'Please enter a valid email address');
            return false;
        }
        showSuccess(emailInput);
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value;
        if (value === '') {
            showError(passwordInput, 'Password is required');
            return false;
        } else if (value.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            return false;
        }
        showSuccess(passwordInput);
        return true;
    }

    function validatePhone() {
        const value = phoneInput.value.trim();
        if (value === '') {
            showError(phoneInput, 'Phone number is required');
            return false;
        } else if (!phoneRegex.test(value)) {
            showError(phoneInput, 'Please enter a valid phone number');
            return false;
        }
        showSuccess(phoneInput);
        return true;
    }

    function validateNIN() {
        const value = ninInput.value.trim();
        if (value === '') {
            showError(ninInput, 'NIN number is required');
            return false;
        } else if (value.length < 8) {
            showError(ninInput, 'NIN must be at least 8 characters');
            return false;
        }
        showSuccess(ninInput);
        return true;
    }

    function validateRole() {
        const value = roleSelect.value;
        if (value === '') {
            showError(roleSelect, 'Please select a role');
            return false;
        }
        showSuccess(roleSelect);
        return true;
    }

    function validateRecommenderFields() {
        const roleValue = roleSelect.value;
        const recommenderName = recommenderNameInput.value.trim();
        const recommenderNIN = recommenderNINInput.value.trim();
        const ninValue = ninInput.value.trim();

        // Only validate NIN and recommender fields if role is farmer
        if (roleValue === 'farmer') {
            let isValid = true;
            
            // Validate NIN field
            if (ninValue === '') {
                showError(ninInput, 'NIN is required for farmers');
                isValid = false;
            } else if (ninValue.length < 8) {
                showError(ninInput, 'NIN must be at least 8 characters');
                isValid = false;
            } else if (!ninRegex.test(ninValue)) {
                showError(ninInput, 'NIN must contain only numbers and capital letters');
                isValid = false;
            } else {
                showSuccess(ninInput);
            }

            // Validate recommender name
            if (recommenderName === '') {
                showError(recommenderNameInput, 'Recommender name is required for farmers');
                isValid = false;
            } else {
                showSuccess(recommenderNameInput);
            }

            // Validate recommender NIN
            if (recommenderNIN === '') {
                showError(recommenderNINInput, 'Recommender NIN is required for farmers');
                isValid = false;
            } else if (recommenderNIN.length < 8) {
                showError(recommenderNINInput, 'Recommender NIN must be at least 8 characters');
                isValid = false;
            } else if (!ninRegex.test(recommenderNIN)) {
                showError(recommenderNINInput, 'Recommender NIN must contain only numbers and capital letters');
                isValid = false;
            } else {
                showSuccess(recommenderNINInput);
            }

            return isValid;
        } else {
            // Clear any existing errors if role is not farmer
            removeError(ninInput);
            removeError(recommenderNameInput);
            removeError(recommenderNINInput);
            return true;
        }
    }

    // Show/hide recommender fields based on role selection
    function toggleRecommenderFields() {
        const roleValue = roleSelect.value;
        const conditionalFields = [
            ninInput.parentNode, 
            recommenderNameInput.parentNode, 
            recommenderNINInput.parentNode
        ];
        
        if (roleValue === 'farmer') {
            conditionalFields.forEach(field => {
                field.style.display = 'block';
            });
        } else {
            conditionalFields.forEach(field => {
                field.style.display = 'none';
            });
            // Clear the fields and any errors when hidden
            ninInput.value = '';
            recommenderNameInput.value = '';
            recommenderNINInput.value = '';
            removeError(ninInput);
            removeError(recommenderNameInput);
            removeError(recommenderNINInput);
        }
    }

    // Add real-time validation
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    phoneInput.addEventListener('blur', validatePhone);
    roleSelect.addEventListener('change', function() {
        validateRole();
        toggleRecommenderFields();
    });
    ninInput.addEventListener('blur', validateRecommenderFields);
    recommenderNameInput.addEventListener('blur', validateRecommenderFields);
    recommenderNINInput.addEventListener('blur', validateRecommenderFields);

    // Clear errors on input
    [nameInput, emailInput, passwordInput, phoneInput, ninInput, recommenderNameInput, recommenderNINInput].forEach(input => {
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(220, 53, 69)') { // If there's an error
                removeError(this);
            }
        });
    });

    // Initialize recommender fields visibility
    toggleRecommenderFields();

    // Form submission validation
    form.addEventListener('submit', function(e) {
        const validations = [
            validateName(),
            validateEmail(),
            validatePassword(),
            validatePhone(),
            validateRole(),
            validateRecommenderFields()
        ];

        const isFormValid = validations.every(validation => validation === true);

        if (!isFormValid) {
            e.preventDefault();
            
            // Disable submit button temporarily to prevent spam
            submitButton.disabled = true;
            submitButton.textContent = 'Please fix errors above';
            
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Account';
            }, 2000);

            // Focus on first invalid field
            const firstErrorField = form.querySelector('input[style*="rgb(220, 53, 69)"], select[style*="rgb(220, 53, 69)"]');
            if (firstErrorField) {
                firstErrorField.focus();
            }
        }
    });

    // Add loading state on successful submission
    form.addEventListener('submit', function(e) {
        const validations = [
            validateName(),
            validateEmail(),
            validatePassword(),
            validatePhone(),
            validateRole(),
            validateRecommenderFields()
        ];

        const isFormValid = validations.every(validation => validation === true);

        if (isFormValid) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
        }
    });
});