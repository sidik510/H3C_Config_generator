// login.js

/**
 * @class LoginApp
 * @description Manages user login functionality, including form submission, API requests, and token/user storage.
 */
class LoginApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/users/login";
    this.dom = {}; // Cache for DOM elements
    this.getDOMElements(); // Get all necessary DOM elements once
    this.bindUIEvents(); // Bind all event listeners
  }

  /**
   * @private
   * @description Caches frequently accessed DOM elements.
   */
  getDOMElements() {
    this.dom.loginForm = document.getElementById("login-form");
    this.dom.emailInput = document.getElementById("email");
    this.dom.passwordInput = document.getElementById("password");
    this.dom.loginMessage = document.getElementById("login-message");
  }

  /**
   * @private
   * @description Binds all UI event listeners.
   */
  bindUIEvents() {
    this.dom.loginForm?.addEventListener("submit", this.handleSubmit.bind(this));
  }

  /**
   * @private
   * @description Handles the login form submission.
   * @param {Event} e - The submit event.
   */
  async handleSubmit(e) {
    e.preventDefault();

    const email = this.dom.emailInput.value.trim();
    const password = this.dom.passwordInput.value;

    if (!email || !password) {
      this.showMessage("Email and password cannot be empty.", "red");
      return;
    }

    try {
      const res = await fetch(this.API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        this.showMessage(data.message, "green");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard after a short delay to show success message
        setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 500);
      } else {
        this.showMessage(data.error || "Login failed.", "red");
      }
    } catch (err) {
      console.error("Error during login:", err);
      this.showMessage("Server is unreachable or an error occurred.", "red");
    }
  }

  /**
   * @private
   * @description Displays a message to the user in the UI.
   * @param {string} message - The message content.
   * @param {string} color - The text color for the message (e.g., 'green', 'red').
   */
  showMessage(message, color) {
    if (this.dom.loginMessage) {
      this.dom.loginMessage.textContent = message;
      this.dom.loginMessage.style.color = color;
    }
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new LoginApp();
});