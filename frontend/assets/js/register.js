class RegisterFormHandler {
  constructor() {
    this.form = document.getElementById("register-form");
    this.msgEl = document.getElementById("message");

    this.passwordInput = document.getElementById("password");
    this.confirmPasswordInput = document.getElementById("confirm-password");
    this.matchMessage = document.getElementById("match-message");
    this.passwordRules = document.getElementById("password-rules");

    this.ruleLength = document.getElementById("rule-length");
    this.ruleUppercase = document.getElementById("rule-uppercase");
    this.ruleLowercase = document.getElementById("rule-lowercase");
    this.ruleNumber = document.getElementById("rule-number");
    this.ruleSymbol = document.getElementById("rule-symbol");

    this.passwordRequirements =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    this.initEventListeners();
  }

  initEventListeners() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.passwordInput.addEventListener("input", () =>
      this.updatePasswordRules()
    );
    this.confirmPasswordInput.addEventListener("input", () =>
      this.checkPasswordMatch()
    );
  }

  updatePasswordRules() {
    const value = this.passwordInput.value;
    
    this.passwordRules.style.display = "block";
    

    this.ruleLength.textContent =
      value.length >= 8 ? "✅ Minimal 8 karakter" : "❌ Minimal 8 karakter";
    this.ruleUppercase.textContent = /[A-Z]/.test(value)
      ? "✅ Minimal 1 huruf besar"
      : "❌ Minimal 1 huruf besar";
    this.ruleLowercase.textContent = /[a-z]/.test(value)
      ? "✅ Minimal 1 huruf kecil"
      : "❌ Minimal 1 huruf kecil";
    this.ruleNumber.textContent = /\d/.test(value)
      ? "✅ Minimal 1 angka"
      : "❌ Minimal 1 angka";
    this.ruleSymbol.textContent = /[^A-Za-z0-9]/.test(value)
      ? "✅ Minimal 1 simbol khusus"
      : "❌ Minimal 1 simbol khusus";
  }

  checkPasswordMatch() {
  const value = this.confirmPasswordInput.value;

  if (!value) {
    this.matchMessage.textContent = "";
    return;
  }

  if (value !== this.passwordInput.value) {
    this.matchMessage.textContent = "❌ Password tidak cocok";
    this.matchMessage.style.color = "red";
  } else {
    this.matchMessage.textContent = "✅ Password cocok";
    this.matchMessage.style.color = "green";
  }
}


  async handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    const role = document.getElementById("role").value;

    if (!this.passwordRequirements.test(password)) {
      this.msgEl.textContent =
        "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.";
      this.msgEl.style.color = "red";
      return;
    }

    if (password !== confirmPassword) {
      this.msgEl.textContent = "Konfirmasi password tidak cocok.";
      this.msgEl.style.color = "red";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      console.log("Response from server:", JSON.stringify(data, null, 2));

      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");

      this.msgEl.textContent = data.message;
      this.msgEl.style.color = "green";
      this.form.reset();
      this.matchMessage.textContent = "";
      this.passwordRules.style.display = "none";
    } catch (err) {
      this.msgEl.textContent = err.message;
      this.msgEl.style.color = "red";
    }
  }
}

// Inisialisasi handler saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
  new RegisterFormHandler();
});
