class GlobalUI {
  constructor() {
    document.addEventListener("DOMContentLoaded", () => {
      this.loadHeaderFooter();
      this.initTogglePassword();
      this.setupDeviceFields(); // Optional: dipakai jika halaman umum butuh
    });
  }

// === MODULE 1: HEADER & FOOTER ===
loadHeaderFooter() {
    const loadComponent = (id, path) => {
      const container = document.getElementById(id);
      if (!container) return;

      fetch(path)
        .then((res) => {
          if (!res.ok) throw new Error(`Gagal memuat ${path}`);
          return res.text();
        })
        .then((html) => {
          container.innerHTML = html;
        })
        .catch((err) => console.error(`Error loading ${path}:`, err));
    };

    loadComponent("header-placeholder", "../../frontend/component/header.html");
    loadComponent("footer-placeholder", "../../frontend/component/footer.html");
  }

// === MODULE 2: TOGGLE PASSWORD ===
initTogglePassword() {
    const toggles = document.querySelectorAll(".toggle-password");
    toggles.forEach((icon) => {
      icon.addEventListener("click", function () {
        const targetSelector = this.getAttribute("toggle");
        const input = document.querySelector(targetSelector);
        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        this.classList.toggle("bx-show", !isPassword);
        this.classList.toggle("bx-hide", isPassword);
      });
    });
  }

// === MODULE 3: Menampilkan Fieldset Berdasarkan Perangkat ===
setupDeviceFields() {
    const deviceTypeEl = document.getElementById("device-type");
    const switchFields = document.getElementById("switch-fields");

    if (!deviceTypeEl || !switchFields) return;

    const updateFields = () => {
      switchFields.style.display = deviceTypeEl.value === "switch" ? "block" : "none";
    };

    updateFields(); // Initial call
    deviceTypeEl.addEventListener("change", updateFields);
  }
}

// Inisialisasi class
new GlobalUI();

// // === MODULE 4: CUSTOM DNS FIELD ===
// function initCustomDNS() {
//   const dnsSelect = document.getElementById("dns-option");
//   const customField = document.getElementById("custom-dns-field");

//   if (dnsSelect && customField) {
//     dnsSelect.addEventListener("change", () => {
//       customField.style.display = dnsSelect.value === "custom" ? "block" : "none";
//     });
//   }
// }


