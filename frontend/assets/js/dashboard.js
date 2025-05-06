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
    document.getElementById("logout-btn").addEventListener("click", logout);
    document.getElementById("config-form").addEventListener("submit", generateConfig);
    document.getElementById("copy-btn").addEventListener("click", copyConfig);
    document.getElementById("save-btn").addEventListener("click", saveConfig);
    document.getElementById("export-btn").addEventListener("click", exportConfig);
  }
  
  function logout() {
    localStorage.removeItem("user");
    window.location.href = "./login.html";
  }
  
  function generateConfig(e) {
    e.preventDefault();
    const device = document.getElementById("device-type").value;
    const hostname = document.getElementById("hostname").value;
    const ip = document.getElementById("ip").value;
    const vlan = document.getElementById("vlan").value;
  
    let config = `system-view\nsysname ${hostname}\n`;
    config += `interface Vlan-interface1\n ip address ${ip} 255.255.255.0\n`;
  
    if (vlan) {
      config += `vlan ${vlan}\n`;
      config += `interface GigabitEthernet1/0/1\n port link-type access\n port default vlan ${vlan}\n`;
    }
  
    config += `return`;
  
    document.getElementById("config-output").value = config;
  }
  
  function copyConfig() {
    const textarea = document.getElementById("config-output");
    textarea.select();
    document.execCommand("copy");
    alert("Konfigurasi disalin ke clipboard!");
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
      const res = await fetch(`http://localhost:3000/api/configs/history/${user.id}`);
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
          <p><strong>${item.device_type.toUpperCase()}</strong> - ${item.hostname} (${item.ip_address})</p>
          <pre>${item.config_text}</pre>
          <small>Dibuat pada: ${new Date(item.created_at).toLocaleString()}</small>
          <hr />
        `;
        listContainer.appendChild(div);
      });
    } catch (err) {
      console.error("Gagal memuat riwayat konfigurasi:", err);
    }
  }
  