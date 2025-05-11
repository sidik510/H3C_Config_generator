document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  bindUIEvents();
  loadConfigHistory();
});

// === AUTH MODULE ===
function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "./login.html";
  } else {
    document.getElementById("user-name").textContent = user.name;
  }
}

// === UI EVENTS MODULE ===
function bindUIEvents() {
  addClick("add-port-button", initPortManagement);
  addClick("logout-btn", logout);
  addSubmit("config-form", generateConfig);
  addClick("copy-btn", copyConfig);
  addClick("save-btn", saveConfig);
  addClick("export-btn", exportConfig);
}

function addClick(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", handler);
}

function addSubmit(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("submit", handler);
}

// === LOGOUT ===
function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}

// === CONFIG GENERATOR MODULE ===
function generateConfig(e) {
  e.preventDefault();
  let config = `system-view\n`;

  const device = getValue("device-type");
  if (device === "switch") config += generateSwitchConfig();

  config += `exit`;
  setValue("config-output", config);
}

function generateSwitchConfig() {
  let config = "";

  const vlanId = getValue("vlan-id");
  const vlanIp = getValue("vlan-ip");
  const vlanSubnet = getValue("vlan-subnet");

  if (getValue("dhcp-enable-global") === "yes") config += "dhcp enable\n";
  if (vlanId && vlanIp && vlanSubnet) {
    config += `vlan ${vlanId}\n`;
    config += `interface Vlan-interface${vlanId}\n ip address ${vlanIp} ${cidrToNetmask(vlanSubnet)}\n`;
  }

  if (vlanId && getValue("vlan-network") && getValue("dhcp-range-start") && getValue("dhcp-range-end") && getValue("dhcp-gateway")) {
    config += `dhcp server ip-pool vlan${vlanId}\n`;
    config += ` network ${vlanIp} ${cidrToNetmask(vlanSubnet)}\n`;
    config += ` gateway-list ${getValue("dhcp-gateway")}\n`;
    config += ` excluded-ip-address ${getValue("dhcp-gateway")}\n`;
    config += ` ip range ${getValue("dhcp-range-start")} ${getValue("dhcp-range-end")}\n`;
    const dns = getValue("dns-option") === "custom" ? getValue("custom-dns") : getValue("dns-option");
    config += ` dns-list ${dns}\n`;
    config += ` interface Vlan-interface${vlanId}\n dhcp server apply ip-pool vlan${vlanId}\n`;
  }

  document.querySelectorAll("#port-container .port-block").forEach((entry) => {
    const portName = entry.querySelector('input[name="port-id"]').value;
    const portType = entry.querySelector('select[name="port-mode"]').value;
    const portPoe = entry.querySelector('input[name="port-poe"]').checked;

    config += `interface ${portName}\n`;
    if (portType === "access" && vlanId) {
      config += ` port link-type access\n port default vlan ${vlanId}\n`;
    } else if (portType === "trunk") {
      config += ` port link-type trunk\n port trunk permit vlan ${vlanId}\n`;
    }
    if (portPoe) config += ` poe enable\n`;
  });

  return config;
}

function cidrToNetmask(cidr) {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const n = Math.min(cidr, 8);
    mask.push(256 - Math.pow(2, 8 - n));
    cidr -= n;
  }
  return mask.join(".");
}

// === UTILITIES ===
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// === CLIPBOARD MODULE ===
function copyConfig() {
  const textarea = document.getElementById("config-output");
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert("Konfigurasi disalin ke clipboard!");
  });
}

// === SAVE MODULE ===
async function saveConfig() {
  const user = JSON.parse(localStorage.getItem("user"));
  const config = getValue("config-output");

  const payload = {
    user_id: user.id,
    device_type: getValue("device-type"),
    hostname: getValue("hostname"),
    ip: getValue("ip"),
    vlan: getValue("vlan"),
    config_text: config,
  };

  try {
    const res = await fetch("http://localhost:3000/api/configs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Gagal menyimpan");
  } catch (err) {
    alert("Server tidak dapat dihubungi");
  }
}

// === EXPORT MODULE ===
function exportConfig() {
  const text = getValue("config-output");
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "konfigurasi.txt";
  link.click();
}

// === HISTORY MODULE ===
async function loadConfigHistory() {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(`http://localhost:3000/api/configs/history/${user.id}`);
    const history = await res.json();
    renderHistoryList(history);
  } catch (err) {
    console.error("Gagal memuat riwayat konfigurasi:", err);
  }
}

function renderHistoryList(history) {
  const listContainer = document.getElementById("history-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";

  if (!history.length) {
    listContainer.innerHTML = "<p>Belum ada konfigurasi yang disimpan.</p>";
    return;
  }

  history.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("history-item");
    div.innerHTML = `
      <p><strong>${item.device_type.toUpperCase()}</strong> - ${item.hostname} (${item.ip_address})</p>
      <pre>${item.config_text}</pre>
      <small>Dibuat pada: ${new Date(item.created_at).toLocaleString()}</small>
      <hr />
    `;
    listContainer.appendChild(div);
  });
}
