// Simple client-side validation for signup form
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the signup page by looking for the signup form
  const form = document.querySelector('form[action="/signup"]');

  if (!form) {
    // If signup form doesn't exist, don't initialize
    console.log("Signup form not found on this page");
    return;
  }

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const phoneInput = document.getElementById("phone");
  const ninInput = document.getElementById("nin");
  const roleSelect = document.getElementById("role");
  const recommenderNameInput = document.getElementById("recommenderName");
  const recommenderNINInput = document.getElementById("recommenderNIN");
  const submitButton = document.querySelector('button[type="submit"]');
  const formMessage = document.createElement("div");
  formMessage.className = "form-message";
  form.parentNode.insertBefore(formMessage, form);

  // If any critical elements are missing, don't proceed
  if (
    !nameInput ||
    !emailInput ||
    !passwordInput ||
    !phoneInput ||
    !roleSelect ||
    !submitButton
  ) {
    console.error("Required form elements not found");
    return;
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Phone validation regex (basic international format)
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;

  // NIN validation regex (numbers and capital letters only)
  const ninRegex = /^[A-Z0-9]+$/;

  // Create error display function
  function showError(input, message) {
    if (!input || !input.parentNode) return;

    removeError(input);
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.color = "#dc3545";
    errorDiv.style.fontSize = "0.875rem";
    errorDiv.style.marginTop = "0.25rem";
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = "#dc3545";
  }

  function removeError(input) {
    if (!input || !input.parentNode) return;

    const existingError = input.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }
    input.style.borderColor = "";
  }

  function showSuccess(input) {
    if (!input) return;

    removeError(input);
    input.style.borderColor = "#28a745";
  }

  function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.style.color = type === "success" ? "#28a745" : "#dc3545";
    formMessage.style.marginTop = "1rem";
    formMessage.style.textAlign = "center";
  }

  // Individual field validators
  function validateName() {
    if (!nameInput) return false;

    const value = nameInput.value.trim();
    if (value === "") {
      showError(nameInput, "Full name is required");
      return false;
    } else if (value.length < 2) {
      showError(nameInput, "Name must be at least 2 characters");
      return false;
    }
    showSuccess(nameInput);
    return true;
  }

  function validateEmail() {
    if (!emailInput) return false;

    const value = emailInput.value.trim();
    if (value === "") {
      showError(emailInput, "Email is required");
      return false;
    } else if (!emailRegex.test(value)) {
      showError(emailInput, "Please enter a valid email address");
      return false;
    }
    showSuccess(emailInput);
    return true;
  }

  function validatePassword() {
    if (!passwordInput) return false;

    const value = passwordInput.value;
    if (value === "") {
      showError(passwordInput, "Password is required");
      return false;
    } else if (value.length < 6) {
      showError(passwordInput, "Password must be at least 6 characters");
      return false;
    }
    showSuccess(passwordInput);
    return true;
  }

  function validatePhone() {
    if (!phoneInput) return false;

    const value = phoneInput.value.trim();
    if (value === "") {
      showError(phoneInput, "Phone number is required");
      return false;
    } else if (!phoneRegex.test(value)) {
      showError(phoneInput, "Please enter a valid phone number");
      return false;
    }
    showSuccess(phoneInput);
    return true;
  }

  function validateNIN() {
    if (!ninInput) return true; // NIN might not exist for all roles

    const value = ninInput.value.trim();
    if (value === "") {
      showError(ninInput, "NIN number is required");
      return false;
    } else if (value.length < 8) {
      showError(ninInput, "NIN must be at least 8 characters");
      return false;
    }
    showSuccess(ninInput);
    return true;
  }

  function validateRole() {
    if (!roleSelect) return false;

    const value = roleSelect.value;
    if (value === "") {
      showError(roleSelect, "Please select a role");
      return false;
    }
    showSuccess(roleSelect);
    return true;
  }

  function validateRecommenderFields() {
    if (!roleSelect) return true;

    const roleValue = roleSelect.value;
    const recommenderName = recommenderNameInput
      ? recommenderNameInput.value.trim()
      : "";
    const recommenderNIN = recommenderNINInput
      ? recommenderNINInput.value.trim()
      : "";
    const ninValue = ninInput ? ninInput.value.trim() : "";

    // Only validate NIN and recommender fields if role is farmer
    if (roleValue === "farmer") {
      let isValid = true;

      // Validate NIN field
      if (ninInput) {
        if (ninValue === "") {
          showError(ninInput, "NIN is required for farmers");
          isValid = false;
        } else if (ninValue.length < 8) {
          showError(ninInput, "NIN must be at least 8 characters");
          isValid = false;
        } else if (!ninRegex.test(ninValue)) {
          showError(
            ninInput,
            "NIN must contain only numbers and capital letters"
          );
          isValid = false;
        } else {
          showSuccess(ninInput);
        }
      }

      // Validate recommender name
      if (recommenderNameInput) {
        if (recommenderName === "") {
          showError(
            recommenderNameInput,
            "Recommender name is required for farmers"
          );
          isValid = false;
        } else {
          showSuccess(recommenderNameInput);
        }
      }

      // Validate recommender NIN
      if (recommenderNINInput) {
        if (recommenderNIN === "") {
          showError(
            recommenderNINInput,
            "Recommender NIN is required for farmers"
          );
          isValid = false;
        } else if (recommenderNIN.length < 8) {
          showError(
            recommenderNINInput,
            "Recommender NIN must be at least 8 characters"
          );
          isValid = false;
        } else if (!ninRegex.test(recommenderNIN)) {
          showError(
            recommenderNINInput,
            "Recommender NIN must contain only numbers and capital letters"
          );
          isValid = false;
        } else {
          showSuccess(recommenderNINInput);
        }
      }

      return isValid;
    } else {
      // Clear any existing errors if role is not farmer
      if (ninInput) removeError(ninInput);
      if (recommenderNameInput) removeError(recommenderNameInput);
      if (recommenderNINInput) removeError(recommenderNINInput);
      return true;
    }
  }

  // Show/hide recommender fields based on role selection
  function toggleRecommenderFields() {
    if (!roleSelect) return;

    const roleValue = roleSelect.value;
    const conditionalFields = [];

    // Collect existing conditional field elements
    if (ninInput && ninInput.parentNode)
      conditionalFields.push(ninInput.parentNode);
    if (recommenderNameInput && recommenderNameInput.parentNode)
      conditionalFields.push(recommenderNameInput.parentNode);
    if (recommenderNINInput && recommenderNINInput.parentNode)
      conditionalFields.push(recommenderNINInput.parentNode);

    if (roleValue === "farmer") {
      conditionalFields.forEach((field) => {
        field.style.display = "block";
      });
    } else {
      conditionalFields.forEach((field) => {
        field.style.display = "none";
      });
      // Clear the fields and any errors when hidden
      if (ninInput) {
        ninInput.value = "";
        removeError(ninInput);
      }
      if (recommenderNameInput) {
        recommenderNameInput.value = "";
        removeError(recommenderNameInput);
      }
      if (recommenderNINInput) {
        recommenderNINInput.value = "";
        removeError(recommenderNINInput);
      }
    }
  }

  // Add real-time validation
  nameInput.addEventListener("blur", validateName);
  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);
  phoneInput.addEventListener("blur", validatePhone);
  roleSelect.addEventListener("change", function () {
    validateRole();
    toggleRecommenderFields();
  });

  if (ninInput) {
    ninInput.addEventListener("blur", validateRecommenderFields);
  }
  if (recommenderNameInput) {
    recommenderNameInput.addEventListener("blur", validateRecommenderFields);
  }
  if (recommenderNINInput) {
    recommenderNINInput.addEventListener("blur", validateRecommenderFields);
  }

  // Clear errors on input
  const inputFields = [nameInput, emailInput, passwordInput, phoneInput];
  if (ninInput) inputFields.push(ninInput);
  if (recommenderNameInput) inputFields.push(recommenderNameInput);
  if (recommenderNINInput) inputFields.push(recommenderNINInput);

  inputFields.forEach((input) => {
    if (input) {
      input.addEventListener("input", function () {
        if (this.style.borderColor === "rgb(220, 53, 69)") {
          // If there's an error
          removeError(this);
        }
      });
    }
  });

  // Initialize recommender fields visibility
  toggleRecommenderFields();

  // Form submission validation & handling with fetch API
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Stop the default form submission

    const validations = [
      validateName(),
      validateEmail(),
      validatePassword(),
      validatePhone(),
      validateRole(),
      validateRecommenderFields(),
    ];

    const isFormValid = validations.every((validation) => validation === true);

    if (!isFormValid) {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Please fix errors above";
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.textContent = "Create Account";
        }, 2000);
      }
      const firstErrorField = form.querySelector(
        'input[style*="rgb(220, 53, 69)"], select[style*="rgb(220, 53, 69)"]'
      );
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return; // Exit if validation fails
    }

    if (isFormValid && submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating Account...";
    }

    // ⭐ THIS IS THE CORRECTED SECTION ⭐
    // Collect all form data
    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      phone: phoneInput.value.trim(),
      role: roleSelect.value,
    };

    // Only add these fields if the role is 'farmer'
    if (formData.role === "farmer") {
      formData.nin = ninInput.value.trim();
      formData.recommenderName = recommenderNameInput.value.trim();
      formData.recommenderNIN = recommenderNINInput.value.trim();
    }
    // ⭐ END OF CORRECTED SECTION ⭐

    // Send the data to the server using the fetch API
    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Handle successful signup
        showFormMessage(
          "Account created successfully! Redirecting to login...",
          "success"
        );
        // Store the token and user data
        localStorage.setItem("userToken", result.token);
        // Redirect the user
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        // Handle server-side errors
        showFormMessage(
          result.message || "Signup failed. Please try again.",
          "error"
        );
        console.error("Signup error:", result);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Create Account";
        }
      }
    } catch (error) {
      // Handle network or other errors
      showFormMessage(
        "An error occurred. Please check your connection and try again.",
        "error"
      );
      console.error("Fetch error:", error);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
      }
    }
  });
});
// // Simple client-side validation for signup form
// document.addEventListener('DOMContentLoaded', function() {
//     // Check if we're on the signup page by looking for the signup form
//     const form = document.querySelector('form[action="/signup"]');

//     if (!form) {
//         // If signup form doesn't exist, don't initialize
//         console.log('Signup form not found on this page');
//         return;
//     }

//     const nameInput = document.getElementById('name');
//     const emailInput = document.getElementById('email');
//     const passwordInput = document.getElementById('password');
//     const phoneInput = document.getElementById('phone');
//     const ninInput = document.getElementById('nin');
//     const roleSelect = document.getElementById('role');
//     const recommenderNameInput = document.getElementById('recommenderName');
//     const recommenderNINInput = document.getElementById('recommenderNIN');
//     const submitButton = document.querySelector('button[type="submit"]');

//     // If any critical elements are missing, don't proceed
//     if (!nameInput || !emailInput || !passwordInput || !phoneInput || !roleSelect || !submitButton) {
//         console.error('Required form elements not found');
//         return;
//     }

//     // Email validation regex
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     // Phone validation regex (basic international format)
//     const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;

//     // NIN validation regex (numbers and capital letters only)
//     const ninRegex = /^[A-Z0-9]+$/;

//     // Create error display function
//     function showError(input, message) {
//         if (!input || !input.parentNode) return;

//         removeError(input);
//         const errorDiv = document.createElement('div');
//         errorDiv.className = 'error-message';
//         errorDiv.style.color = '#dc3545';
//         errorDiv.style.fontSize = '0.875rem';
//         errorDiv.style.marginTop = '0.25rem';
//         errorDiv.textContent = message;
//         input.parentNode.appendChild(errorDiv);
//         input.style.borderColor = '#dc3545';
//     }

//     function removeError(input) {
//         if (!input || !input.parentNode) return;

//         const existingError = input.parentNode.querySelector('.error-message');
//         if (existingError) {
//             existingError.remove();
//         }
//         input.style.borderColor = '';
//     }

//     function showSuccess(input) {
//         if (!input) return;

//         removeError(input);
//         input.style.borderColor = '#28a745';
//     }

//     // Individual field validators
//     function validateName() {
//         if (!nameInput) return false;

//         const value = nameInput.value.trim();
//         if (value === '') {
//             showError(nameInput, 'Full name is required');
//             return false;
//         } else if (value.length < 2) {
//             showError(nameInput, 'Name must be at least 2 characters');
//             return false;
//         }
//         showSuccess(nameInput);
//         return true;
//     }

//     function validateEmail() {
//         if (!emailInput) return false;

//         const value = emailInput.value.trim();
//         if (value === '') {
//             showError(emailInput, 'Email is required');
//             return false;
//         } else if (!emailRegex.test(value)) {
//             showError(emailInput, 'Please enter a valid email address');
//             return false;
//         }
//         showSuccess(emailInput);
//         return true;
//     }

//     function validatePassword() {
//         if (!passwordInput) return false;

//         const value = passwordInput.value;
//         if (value === '') {
//             showError(passwordInput, 'Password is required');
//             return false;
//         } else if (value.length < 6) {
//             showError(passwordInput, 'Password must be at least 6 characters');
//             return false;
//         }
//         showSuccess(passwordInput);
//         return true;
//     }

//     function validatePhone() {
//         if (!phoneInput) return false;

//         const value = phoneInput.value.trim();
//         if (value === '') {
//             showError(phoneInput, 'Phone number is required');
//             return false;
//         } else if (!phoneRegex.test(value)) {
//             showError(phoneInput, 'Please enter a valid phone number');
//             return false;
//         }
//         showSuccess(phoneInput);
//         return true;
//     }

//     function validateNIN() {
//         if (!ninInput) return true; // NIN might not exist for all roles

//         const value = ninInput.value.trim();
//         if (value === '') {
//             showError(ninInput, 'NIN number is required');
//             return false;
//         } else if (value.length < 8) {
//             showError(ninInput, 'NIN must be at least 8 characters');
//             return false;
//         }
//         showSuccess(ninInput);
//         return true;
//     }

//     function validateRole() {
//         if (!roleSelect) return false;

//         const value = roleSelect.value;
//         if (value === '') {
//             showError(roleSelect, 'Please select a role');
//             return false;
//         }
//         showSuccess(roleSelect);
//         return true;
//     }

//     function validateRecommenderFields() {
//         if (!roleSelect) return true;

//         const roleValue = roleSelect.value;
//         const recommenderName = recommenderNameInput ? recommenderNameInput.value.trim() : '';
//         const recommenderNIN = recommenderNINInput ? recommenderNINInput.value.trim() : '';
//         const ninValue = ninInput ? ninInput.value.trim() : '';

//         // Only validate NIN and recommender fields if role is farmer
//         if (roleValue === 'farmer') {
//             let isValid = true;

//             // Validate NIN field
//             if (ninInput) {
//                 if (ninValue === '') {
//                     showError(ninInput, 'NIN is required for farmers');
//                     isValid = false;
//                 } else if (ninValue.length < 8) {
//                     showError(ninInput, 'NIN must be at least 8 characters');
//                     isValid = false;
//                 } else if (!ninRegex.test(ninValue)) {
//                     showError(ninInput, 'NIN must contain only numbers and capital letters');
//                     isValid = false;
//                 } else {
//                     showSuccess(ninInput);
//                 }
//             }

//             // Validate recommender name
//             if (recommenderNameInput) {
//                 if (recommenderName === '') {
//                     showError(recommenderNameInput, 'Recommender name is required for farmers');
//                     isValid = false;
//                 } else {
//                     showSuccess(recommenderNameInput);
//                 }
//             }

//             // Validate recommender NIN
//             if (recommenderNINInput) {
//                 if (recommenderNIN === '') {
//                     showError(recommenderNINInput, 'Recommender NIN is required for farmers');
//                     isValid = false;
//                 } else if (recommenderNIN.length < 8) {
//                     showError(recommenderNINInput, 'Recommender NIN must be at least 8 characters');
//                     isValid = false;
//                 } else if (!ninRegex.test(recommenderNIN)) {
//                     showError(recommenderNINInput, 'Recommender NIN must contain only numbers and capital letters');
//                     isValid = false;
//                 } else {
//                     showSuccess(recommenderNINInput);
//                 }
//             }

//             return isValid;
//         } else {
//             // Clear any existing errors if role is not farmer
//             if (ninInput) removeError(ninInput);
//             if (recommenderNameInput) removeError(recommenderNameInput);
//             if (recommenderNINInput) removeError(recommenderNINInput);
//             return true;
//         }
//     }

//     // Show/hide recommender fields based on role selection
//     function toggleRecommenderFields() {
//         if (!roleSelect) return;

//         const roleValue = roleSelect.value;
//         const conditionalFields = [];

//         // Collect existing conditional field elements
//         if (ninInput && ninInput.parentNode) conditionalFields.push(ninInput.parentNode);
//         if (recommenderNameInput && recommenderNameInput.parentNode) conditionalFields.push(recommenderNameInput.parentNode);
//         if (recommenderNINInput && recommenderNINInput.parentNode) conditionalFields.push(recommenderNINInput.parentNode);

//         if (roleValue === 'farmer') {
//             conditionalFields.forEach(field => {
//                 field.style.display = 'block';
//             });
//         } else {
//             conditionalFields.forEach(field => {
//                 field.style.display = 'none';
//             });
//             // Clear the fields and any errors when hidden
//             if (ninInput) {
//                 ninInput.value = '';
//                 removeError(ninInput);
//             }
//             if (recommenderNameInput) {
//                 recommenderNameInput.value = '';
//                 removeError(recommenderNameInput);
//             }
//             if (recommenderNINInput) {
//                 recommenderNINInput.value = '';
//                 removeError(recommenderNINInput);
//             }
//         }
//     }

//     // Add real-time validation
//     nameInput.addEventListener('blur', validateName);
//     emailInput.addEventListener('blur', validateEmail);
//     passwordInput.addEventListener('blur', validatePassword);
//     phoneInput.addEventListener('blur', validatePhone);
//     roleSelect.addEventListener('change', function() {
//         validateRole();
//         toggleRecommenderFields();
//     });

//     if (ninInput) {
//         ninInput.addEventListener('blur', validateRecommenderFields);
//     }
//     if (recommenderNameInput) {
//         recommenderNameInput.addEventListener('blur', validateRecommenderFields);
//     }
//     if (recommenderNINInput) {
//         recommenderNINInput.addEventListener('blur', validateRecommenderFields);
//     }

//     // Clear errors on input
//     const inputFields = [nameInput, emailInput, passwordInput, phoneInput];
//     if (ninInput) inputFields.push(ninInput);
//     if (recommenderNameInput) inputFields.push(recommenderNameInput);
//     if (recommenderNINInput) inputFields.push(recommenderNINInput);

//     inputFields.forEach(input => {
//         if (input) {
//             input.addEventListener('input', function() {
//                 if (this.style.borderColor === 'rgb(220, 53, 69)') { // If there's an error
//                     removeError(this);
//                 }
//             });
//         }
//     });

//     // Initialize recommender fields visibility
//     toggleRecommenderFields();

//     // Form submission validation
//     form.addEventListener('submit', function(e) {
//         const validations = [
//             validateName(),
//             validateEmail(),
//             validatePassword(),
//             validatePhone(),
//             validateRole(),
//             validateRecommenderFields()
//         ];

//         const isFormValid = validations.every(validation => validation === true);

//         if (!isFormValid) {
//             e.preventDefault();

//             if (submitButton) {
//                 // Disable submit button temporarily to prevent spam
//                 submitButton.disabled = true;
//                 submitButton.textContent = 'Please fix errors above';

//                 setTimeout(() => {
//                     submitButton.disabled = false;
//                     submitButton.textContent = 'Create Account';
//                 }, 2000);
//             }

//             // Focus on first invalid field
//             const firstErrorField = form.querySelector('input[style*="rgb(220, 53, 69)"], select[style*="rgb(220, 53, 69)"]');
//             if (firstErrorField) {
//                 firstErrorField.focus();
//             }
//         }
//     });

//     // Add loading state on successful submission
//     form.addEventListener('submit', function(e) {
//         const validations = [
//             validateName(),
//             validateEmail(),
//             validatePassword(),
//             validatePhone(),
//             validateRole(),
//             validateRecommenderFields()
//         ];

//         const isFormValid = validations.every(validation => validation === true);

//         if (isFormValid && submitButton) {
//             submitButton.disabled = true;
//             submitButton.textContent = 'Creating Account...';
//         }
//     });
// });
