const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const rulesBox = document.getElementById("password-rules");
const matchMessage = document.getElementById("match-message");

const ruleLength = document.getElementById("rule-length");
const ruleUppercase = document.getElementById("rule-uppercase");
const ruleLowercase = document.getElementById("rule-lowercase");
const ruleNumber = document.getElementById("rule-number");
const ruleSymbol = document.getElementById("rule-symbol");

passwordInput.addEventListener("focus", () => {
  rulesBox.style.display = "block";
});

passwordInput.addEventListener("blur", () => {
  rulesBox.style.display = "none";
});

passwordInput.addEventListener("input", () => {
  const val = passwordInput.value;
  validateRules(val);
  checkPasswordMatch();
});

confirmInput.addEventListener("input", () => {
  checkPasswordMatch();
});

function validateRules(val) {
  toggleRule(ruleLength, val.length >= 8);
  toggleRule(ruleUppercase, /[A-Z]/.test(val));
  toggleRule(ruleLowercase, /[a-z]/.test(val));
  toggleRule(ruleNumber, /\d/.test(val));
  toggleRule(ruleSymbol, /[^A-Za-z0-9]/.test(val));
};

function toggleRule(element, isValid) {
  element.className = isValid ? "valid" : "invalid";
  element.textContent =
    (isValid ? "✅" : "❌") + " " + element.textContent.slice(2);
}

function checkPasswordMatch() {
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  matchMessage.className = ""; // Reset class

  if (confirm === "") {
    matchMessage.textContent = "";
    return;
  }

  if (password === confirm) {
    matchMessage.textContent = "✅ Password cocok";
    matchMessage.classList.add("success");
  } else {
    matchMessage.textContent = "❌ Password tidak cocok";
    matchMessage.classList.add("error");
  }
}

document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const role = document.getElementById("role").value;

    const msgEl = document.getElementById("message");

    // Validasi password strength
    const passwordRequirements =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordRequirements.test(password)) {
      msgEl.textContent =
        "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.";
      msgEl.style.color = "red";
      return;
    }

    // Validasi konfirmasi password
    if (password !== confirmPassword) {
      msgEl.textContent = "Konfirmasi password tidak cocok.";
      msgEl.style.color = "red";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        msgEl.textContent = data.message;
        msgEl.style.color = "green";
        document.getElementById("register-form").reset();
      } else {
        msgEl.textContent = data.error || "Terjadi kesalahan";
        msgEl.style.color = "red";
      }
    } catch (error) {
      msgEl.textContent = "Gagal menghubungi server.";
      msgEl.style.color = "red";
    }
  });
