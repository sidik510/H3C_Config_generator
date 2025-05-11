document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupEventListeners();
  loadHistory();
});

function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "./login.html";
  } else {
    document.getElementById("user-name").textContent = user.name;
  }
}

function setupEventListeners() {
  const logoutBtn = document.getElementById("logout-btn");
  const configForm = document.getElementById("config-form");
  const copyBtn = document.getElementById("copy-btn");
  const saveBtn = document.getElementById("save-btn");
  const exportBtn = document.getElementById("export-btn");

  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (configForm) configForm.addEventListener("submit", generateConfig);
  if (copyBtn) copyBtn.addEventListener("click", copyConfig);
  if (saveBtn) saveBtn.addEventListener("click", saveConfig);
  if (exportBtn) exportBtn.addEventListener("click", exportConfig);
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "./login.html";
}

function generateConfig(e) {
  e.preventDefault();

  let config = `system-view\n`;

  const device = document.getElementById("device-type").value;

  if (device === "switch") {
    const dhcpEnable = document.getElementById("dhcp-enable-global").value;
    const trunkPort = document.getElementById("trunk-port").value;
    const accessPort = document.getElementById("access-port").value;
    const vlanId = document.getElementById("vlan-id").value;
    const vlanIp = document.getElementById("vlan-ip").value;
    const vlanSubnet = document.getElementById("vlan-subnet").value;
    const dhcpStart = document.getElementById("dhcp-range-start").value;
    const dhcpEnd = document.getElementById("dhcp-range-end").value;
    const dhcpGateway = document.getElementById("dhcp-gateway").value;
    const dnsOption = document.getElementById("dns-option").value;
    const customDns = document.getElementById("custom-dns").value;

    // DHCP global
    if (dhcpEnable === "yes") config += "dhcp enable\n";

    // VLAN dan IP Interface
    if (vlanId && vlanIp && vlanSubnet) {
      config += `vlan ${vlanId}\n`;
      config += `interface Vlan-interface${vlanId}\n ip address ${vlanIp} ${cidrToNetmask(vlanSubnet)}\n`;
    }

    // Port config
    if (accessPort && vlanId) {
      config += `interface ${accessPort}\n port link-type access\n port default vlan ${vlanId}\n`;
    }

    if (trunkPort) {
      config += `interface ${trunkPort}\n port link-type trunk\n`;
    }

    // DHCP Pool
    if (vlanId && dhcpStart && dhcpEnd && dhcpGateway) {
      config += `dhcp server ip-pool vlan${vlanId}\n network ${vlanIp} ${cidrToNetmask(vlanSubnet)}\n gateway-list ${dhcpGateway}\n excluded-ip-address ${dhcpGateway}\n ip range ${dhcpStart} ${dhcpEnd}\n`;
      const dns = dnsOption === "custom" ? customDns : dnsOption;
      config += ` dns-list ${dns}\n`;
    }
  }

  config += `exit`;

  document.getElementById("config-output").value = config;
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

function copyConfig() {
  const textarea = document.getElementById("config-output");
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert("Konfigurasi disalin ke clipboard!");
  });
}

async function saveConfig() {
  const user = JSON.parse(localStorage.getItem("user"));
  const config = document.getElementById("config-output").value;

  const payload = {
    user_id: user.id,
    device_type: document.getElementById("device-type").value,
    hostname: document.getElementById("hostname").value,
    ip: document.getElementById("ip").value,
    vlan: document.getElementById("vlan").value || "",
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

function exportConfig() {
  const text = document.getElementById("config-output").value;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "konfigurasi.txt";
  link.click();
}

async function loadHistory() {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(
      `http://localhost:3000/api/configs/history/${user.id}`
    );
    const history = await res.json();

    const listContainer = document.getElementById("history-list");
    listContainer.innerHTML = "";

    if (history.length === 0) {
      listContainer.innerHTML = "<p>Belum ada konfigurasi yang disimpan.</p>";
      return;
    }

    history.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("history-item");
      div.innerHTML = `
          <p><strong>${item.device_type.toUpperCase()}</strong> - ${
        item.hostname
      } (${item.ip_address})</p>
          <pre>${item.config_text}</pre>
          <small>Dibuat pada: ${new Date(
            item.created_at
          ).toLocaleString()}</small>
          <hr />
        `;
      listContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Gagal memuat riwayat konfigurasi:", err);
  }
}
