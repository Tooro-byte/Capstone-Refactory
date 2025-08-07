document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const passwordToggle = document.querySelector('.password-toggle i');

  // Email validation regex based on Mongoose schema (lowercase, valid email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Toggle password visibility
  passwordToggle.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    passwordToggle.classList.toggle('fa-eye');
    passwordToggle.classList.toggle('fa-eye-slash');
  });

  // Input focus handling
  const inputWrappers = document.querySelectorAll('.input-wrapper');
  inputWrappers.forEach(wrapper => {
    const input = wrapper.querySelector('.custom-input');
    input.addEventListener('focus', () => wrapper.classList.add('focused'));
    input.addEventListener('blur', () => wrapper.classList.remove('focused'));
  });

  // Form validation
  form.addEventListener('submit', (e) => {
    let valid = true;

    // Reset error messages
    emailError.textContent = '';
    passwordError.textContent = '';

    // Email validation
    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
      emailError.textContent = 'Email is required';
      valid = false;
    } else if (!emailRegex.test(email)) {
      emailError.textContent = 'Please enter a valid email address';
      valid = false;
    }

    // Password validation
    const password = passwordInput.value;
    if (!password) {
      passwordError.textContent = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
    }
  });
});