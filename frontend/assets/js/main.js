document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("../../frontend/component/header.html")
    .then((res) => {
      if (!res.ok) throw new Error("Gagal memuat header");
      return res.text();
    })
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;
    })
    .catch((error) => {
      console.error("Error loading header:", error);
    });

  // Load footer
  fetch("../../frontend/component/footer.html")
    .then((res) => {
      if (!res.ok) throw new Error("Gagal memuat footer");
      return res.text();
    })
    .then((data) => {
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });

    document.querySelectorAll(".toggle-password").forEach(icon => {
      icon.addEventListener("click", function () {
        const input = document.querySelector(this.getAttribute("toggle"));
        const type = input.getAttribute("type") === "password" ? "text" : "password";
        input.setAttribute("type", type);
    
        // Toggle icon class
        this.classList.toggle("bx-show");
        this.classList.toggle("bx-hide");
      });
    });
});