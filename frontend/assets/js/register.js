// frontend/js/register.js
const form = document.getElementById("register-form");
const msgEl = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const role = document.getElementById("role").value;

  const passwordRequirements =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  if (!passwordRequirements.test(password)) {
    msgEl.textContent =
      "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.";
    msgEl.style.color = "red";
    return;
  }

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

    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");

    msgEl.textContent = data.message;
    msgEl.style.color = "green";
    form.reset();
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.style.color = "red";
  }
});
