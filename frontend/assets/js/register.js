class RegisterApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/users/register";
    this.elements = {};
    this.passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.elements = {
      form: document.getElementById('register-form'),
      nameInput: document.getElementById('name'),
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password'),
      confirmPasswordInput: document.getElementById('confirm-password'),
      roleSelect: document.getElementById('role'),
      messageDisplay: document.getElementById('message'),
      matchMessage: document.getElementById('match-message'),
      emailValidationMessage: document.getElementById('email-validation-message'),
      nameValidationMessage: document.getElementById('name-validation-message'),
      passwordRules: document.getElementById('password-rules'),
      strengthBar: document.querySelector('.strength-bar'),
      submitButton: document.querySelector('.btn-primary'),
      btnText: document.querySelector('.btn-text'),
      btnLoader: document.querySelector('.btn-loader'),
      ruleElements: {
        length: document.getElementById('rule-length'),
        uppercase: document.getElementById('rule-uppercase'),
        lowercase: document.getElementById('rule-lowercase'),
        number: document.getElementById('rule-number'),
        symbol: document.getElementById('rule-symbol')
      }
    };
  }

  initEventListeners() {
    this.elements.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.elements.passwordInput.addEventListener('input', this.handlePasswordInput.bind(this));
    this.elements.confirmPasswordInput.addEventListener('input', this.checkPasswordMatch.bind(this));
    this.elements.emailInput.addEventListener('input', () => this.validateEmail(this.elements.emailInput.value));
    this.elements.nameInput.addEventListener('input', () => this.validateName(this.elements.nameInput.value));
    
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', this.togglePasswordVisibility.bind(this));
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const { nameInput, emailInput, passwordInput, confirmPasswordInput, roleSelect } = this.elements;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const role = roleSelect.value;

    this.clearMessages();

    // Validate form
    if (!this.validateName(name, true) || 
        !this.validateEmail(email, true) || 
        !this.validatePassword(password, true) || 
        !this.checkPasswordMatch(true) || 
        !role) {
      return;
    }

    this.setLoading(true);

    try {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        this.showMessage(data.message || 'Registration successful!', 'success');
        this.resetForm();
      } else {
        this.showMessage(data.error || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage('Network error. Please try again later.', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  handlePasswordInput() {
    const password = this.elements.passwordInput.value;
    this.updatePasswordStrength(password);
    this.updatePasswordRules(password);
    this.checkPasswordMatch();
  }

  updatePasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^A-Za-z\d\s]/.test(password)) strength += 10;
    
    // Cap at 100
    strength = Math.min(strength, 100);
    
    // Update UI
    this.elements.strengthBar.style.width = `${strength}%`;
    
    // Color based on strength
    if (strength < 40) {
      this.elements.strengthBar.style.backgroundColor = 'var(--danger)';
    } else if (strength < 70) {
      this.elements.strengthBar.style.backgroundColor = 'var(--warning)';
    } else {
      this.elements.strengthBar.style.backgroundColor = 'var(--success)';
    }
  }

  updatePasswordRules(password) {
    Object.entries({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z\d\s]/.test(password)
    }).forEach(([key, isValid]) => {
      this.elements.ruleElements[key].classList.toggle('valid', isValid);
    });
  }

  checkPasswordMatch(isSubmit = false) {
    const password = this.elements.passwordInput.value;
    const confirmPassword = this.elements.confirmPasswordInput.value;
    
    if (!isSubmit && (!password || !confirmPassword)) {
      this.elements.matchMessage.textContent = '';
      this.elements.matchMessage.className = 'match-message';
      return false;
    }
    
    const isValid = password === confirmPassword && confirmPassword.length > 0;
    
    if (isValid) {
      this.elements.matchMessage.textContent = 'Passwords match!';
      this.elements.matchMessage.className = 'match-message success';
    } else if (confirmPassword.length > 0) {
      this.elements.matchMessage.textContent = 'Passwords do not match';
      this.elements.matchMessage.className = 'match-message error';
    } else {
      this.elements.matchMessage.textContent = '';
      this.elements.matchMessage.className = 'match-message';
    }
    
    return isValid;
  }

  validateName(name, isSubmit = false) {
    if (!name && !isSubmit) {
      this.elements.nameValidationMessage.textContent = '';
      this.elements.nameValidationMessage.className = 'validation-message';
      return false;
    }
    
    if (name.length < 3) {
      this.elements.nameValidationMessage.textContent = 'Name must be at least 3 characters';
      this.elements.nameValidationMessage.className = 'validation-message error';
      return false;
    }
    
    this.elements.nameValidationMessage.textContent = '';
    this.elements.nameValidationMessage.className = 'validation-message';
    return true;
  }

  validateEmail(email, isSubmit = false) {
    if (!email && !isSubmit) {
      this.elements.emailValidationMessage.textContent = '';
      this.elements.emailValidationMessage.className = 'validation-message';
      return false;
    }
    
    if (!this.emailRegex.test(email)) {
      this.elements.emailValidationMessage.textContent = 'Please enter a valid email address';
      this.elements.emailValidationMessage.className = 'validation-message error';
      return false;
    }
    
    this.elements.emailValidationMessage.textContent = '';
    this.elements.emailValidationMessage.className = 'validation-message';
    return true;
  }

  validatePassword(password, isSubmit = false) {
    if (!password && !isSubmit) return false;
    
    if (!this.passwordRegex.test(password)) {
      if (isSubmit) {
        this.showMessage('Password does not meet requirements', 'error');
      }
      return false;
    }
    
    return true;
  }

  showMessage(message, type) {
    this.elements.messageDisplay.textContent = message;
    this.elements.messageDisplay.className = `message ${type}`;
  }

  clearMessages() {
    this.elements.messageDisplay.textContent = '';
    this.elements.messageDisplay.className = 'message';
  }

  setLoading(isLoading) {
    this.elements.form.querySelector('button').disabled = isLoading;
    this.elements.submitButton.classList.toggle('loading', isLoading);
  }

  resetForm() {
    this.elements.form.reset();
    this.elements.strengthBar.style.width = '0';
    Object.values(this.elements.ruleElements).forEach(el => {
      el.classList.remove('valid');
    });
    this.clearMessages();
    this.elements.matchMessage.textContent = '';
    this.elements.matchMessage.className = 'match-message';
  }

  togglePasswordVisibility(e) {
    const icon = e.target;
    const input = document.querySelector(icon.getAttribute('toggle'));
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('bx-hide', 'bx-show');
    } else {
      input.type = 'password';
      icon.classList.replace('bx-show', 'bx-hide');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new RegisterApp());