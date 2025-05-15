document.addEventListener("DOMContentLoaded", () => {
  loadHeaderFooter();
  initTogglePassword();
  initCustomDNS();
  initPortManagement();

  // Fungsi yang hanya dijalankan jika elemen ada
  setupDeviceFields();
});

// === MODULE 1: HEADER & FOOTER ===
function loadHeaderFooter() {
  const loadComponent = (id, path) => {
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat ${path}`);
        return res.text();
      })
      .then((data) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = data;
      })
      .catch((error) => console.error(`Error loading ${path}:`, error));
  };

  loadComponent("header-placeholder", "../../frontend/component/header.html");
  loadComponent("footer-placeholder", "../../frontend/component/footer.html");
}

// === MODULE 2: TOGGLE PASSWORD ===
function initTogglePassword() {
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
      const targetSelector = this.getAttribute("toggle");
      const input = document.querySelector(targetSelector);
      if (input) {
        const newType = input.type === "password" ? "text" : "password";
        input.type = newType;
        this.classList.toggle("bx-show");
        this.classList.toggle("bx-hide");
      }
    });
  });
}

// === MODULE 3: Menampilkan Fieldset Berdasarkan Perangkat ===
function setupDeviceFields() {
  const deviceTypeElement = document.getElementById("device-type");

  if (!deviceTypeElement) return; // Hanya jalankan jika elemen ada

  const deviceType = deviceTypeElement.value;
  const switchFields = document.getElementById("switch-fields");
  // const routerFields = document.getElementById("router-fields");
  // const apFields = document.getElementById("ap-fields");

  // Sembunyikan semua fieldset terlebih dahulu
  if (switchFields) switchFields.style.display = "none";
  // if (routerFields) routerFields.style.display = "none";
  // if (apFields) apFields.style.display = "none";

  // Tampilkan fieldset berdasarkan jenis perangkat yang dipilih
  if (deviceType === "switch" && switchFields) {
    switchFields.style.display = "block";
  }
  // else if (deviceType === "router" && routerFields) {
  //   routerFields.style.display = "block";
  // } else if (deviceType === "ap" && apFields) {
  //   apFields.style.display = "block";
  // }

  deviceTypeElement.addEventListener("change", () => {
    setupDeviceFields(); // Update fieldset saat perangkat dipilih
  });
}

// === MODULE 4: CUSTOM DNS FIELD ===
function initCustomDNS() {
  const dnsSelect = document.getElementById("dns-option");
  const customField = document.getElementById("custom-dns-field");

  if (dnsSelect && customField) {
    dnsSelect.addEventListener("change", () => {
      customField.style.display = dnsSelect.value === "custom" ? "block" : "none";
    });
  }
}

// === MODULE 5: DINAMIS PORT MANAGEMENT ===
function initPortManagement() {
  const addPortButton = document.getElementById("add-port-button");
  const portContainer = document.getElementById("port-container");

  if (!addPortButton || !portContainer) return;

  addPortButton.addEventListener("click", () => {
    const portIndex = portContainer.querySelectorAll(".port-block").length + 1;
    const newBlock = createPortBlock(portIndex);
    portContainer.appendChild(newBlock);
  });
}

function createPortBlock(index) {
  const block = document.createElement("div");
  block.classList.add("port-block");

  block.innerHTML = `
    <div class="input-group">
      <label for="port-${index}-id">Port ${index}</label>
      <input type="text" name="port-id[]" placeholder="contoh: GE1/0/${index}" required />
    </div>

    <div class="input-group">
      <label for="port-${index}-mode">Mode Port</label>
      <select name="port-mode[]">
        <option value="access">Access</option>
        <option value="trunk">Trunk</option>
        <option value="route">Route</option>
      </select>
    </div>

    <div class="input-group">
      <label>
        <input type="checkbox" name="port-poe[]" />
        Aktifkan POE
      </label>
    </div>

    <button type="button" class="remove-port-button">Hapus Port</button>
    <hr />
  `;

  // Event listener untuk hapus block
  const removeBtn = block.querySelector(".remove-port-button");
  removeBtn.addEventListener("click", () => {
    if (confirm("Hapus port ini?")) {
      block.remove();
    }
  });

  return block;
}
