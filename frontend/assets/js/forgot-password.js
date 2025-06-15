// forgot-password.js

/**
 * @class ForgotPasswordApp
 * @description Manages the forgot password functionality, including form submission and API requests.
 */
class ForgotPasswordApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/users/forgot-password";
    this.dom = {}; // Cache for DOM elements
    this.getDOMElements(); // Get all necessary DOM elements once
    this.bindUIEvents(); // Bind all event listeners
  }

  /**
   * @private
   * @description Caches frequently accessed DOM elements.
   */
  getDOMElements() {
    this.dom.forgotForm = document.getElementById("forgot-form");
    this.dom.emailInput = document.getElementById("email");
  }

  /**
   * @private
   * @description Binds all UI event listeners.
   */
  bindUIEvents() {
    this.dom.forgotForm?.addEventListener("submit", this.handleSubmit.bind(this));
  }

  /**
   * @private
   * @description Handles the form submission for password reset request.
   * @param {Event} e - The submit event.
   */
  async handleSubmit(e) {
    e.preventDefault();
    const email = this.dom.emailInput.value.trim();

    if (!email) {
      this.showAlert("Please enter your email address.", "error");
      return;
    }

    try {
      const res = await fetch(this.API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        this.showAlert(data.message, "success");
      } else {
        this.showAlert(data.error || "Failed to send reset request.", "error");
      }
    } catch (err) {
      console.error("Error sending reset request:", err);
      this.showAlert("Server is unreachable or an error occurred.", "error");
    }
  }

  /**
   * @private
   * @description Displays an alert message to the user.
   * @param {string} message - The message to display.
   * @param {'success'|'error'} type - The type of message (for styling/context).
   */
  showAlert(message, type) {
    // For simplicity, using alert. In a real app, you'd use a more sophisticated UI notification.
    alert(message);
    console.log(`${type.toUpperCase()}: ${message}`); // Log for debugging
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new ForgotPasswordApp();
});