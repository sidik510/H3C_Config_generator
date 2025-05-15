document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      const msgEl = document.getElementById("login-message");

      if (res.ok) {
        msgEl.textContent = data.message;
        msgEl.style.color = "green";
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "./dashboard.html";
      } else {
        msgEl.textContent = data.error || "Gagal login.";
        msgEl.style.color = "red";
      }
    } catch (err) {
      const msgEl = document.getElementById("login-message");
      msgEl.textContent = "Server tidak dapat dihubungi.";
      msgEl.style.color = "red";
    }
  });
});
