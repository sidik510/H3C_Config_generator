class NetworkConfigApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/configs";
    this.user = this.getUserData();
    this.init();
  }

  // === INITIALIZATION ===
  async init() {
    try {
      this.checkAuth();
      this.bindUIEvents();
      await this.loadConfigHistory();
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showError("Failed to initializa application");
    }
  }

  // === AUTHENTICATION ===
  checkAuth() {
    if (!this.user || !localStorage.getItem("token")) {
      alert("Please login first");
      window.location.href = "./login.html";
    }
    this.updateUserUI();
  }

  getUserData() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  }

  updateUserUI(user) {
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) userNameEl.textContent = this.user?.name || "User";
  }

  logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "./login.html";
  };

  // === UI EVENT HANDLING ===
  bindUIEvents() {
    const eventMap = {
      "add-port-button": { event: this.initPortManagement },
      "logout-btn": { event: this.logout },
      "config-form": { event: this.generateConfig },
      "copy-btn": { event: this.copyConfig },
      "save-btn": { event: this.saveConfig },
      "export-btn": { event: this.exportConfig },
      "tab-active": { event: this.loadConfigHistory },
      "tab-deleted": { event: this.loadDeletedHistory },
    };

    Object.entries(eventMap).forEach(([id, { event: handler }]) => {
      const el = document.getElementById(id);
      if (el) {
        const event = id === "config-form" ? "submit" : "click";
        el.addEventListener(event, handler.bind(this));
      } else {
        console.warn(`Element with ID ${id} not found.`);
      }
    });
  }

  // === CONFIGURATION GENERATION ===
  generateConfig(e) {
  e.preventDefault();

  try {
    const device = this.getValue("device-type");
    const hostname = this.getValue("hostname") || "switch";
    let config = `system-view\nsysname ${hostname}\n`;

    if (device === "switch") {
      config += this.generateSwitchConfig();
    }

    config += "exit\nsave force\n";
    this.setValue("config-output", config);
  } catch (error) {
    console.error("Error generating config:", error);
    this.showError("Failed to generate configuration");
  }
}

generateSwitchConfig() {
  let config = "";

  // DHCP Global
  if (this.getValue("dhcp-enable-global") === "yes") {
    config += "dhcp enable\n";
  }

  // VLAN Config
  const vlanId = this.getValue("vlan-id");
  const vlanIp = this.getValue("vlan-ip");
  const vlanSubnet = this.getValue("vlan-subnet");

  if (vlanId && vlanIp && vlanSubnet) {
    config += this.generateVlanConfig(vlanId, vlanIp, vlanSubnet);
  }

  // Port Configs
  config += this.generatePortConfigs(vlanId);

  return config;
}

generateVlanConfig(vlanId, vlanIp, vlanSubnet) {
  let config = `vlan ${vlanId}\nexit\n`;
  config += `interface Vlan-interface${vlanId}\n`;
  config += ` ip address ${vlanIp} ${this.cidrToNetmask(vlanSubnet)}\n`;
  config += `exit\n`;

  // DHCP Server Pool
  if (this.getValue("dhcp-range-start") && this.getValue("dhcp-range-end")) {
    const dns = this.getValue("dns-option") === "custom"
      ? this.getValue("custom-dns")
      : this.getValue("dns-option");

    config += `dhcp server ip-pool VLAN${vlanId}\n`;
    config += ` network ${this.getValue("vlan-network")} mask ${this.cidrToNetmask(vlanSubnet)}\n`;
    config += ` gateway-list ${this.getValue("dhcp-gateway") || vlanIp}\n`;
    config += ` dns-list ${dns}\n`;
    config += ` address range ${this.getValue("dhcp-range-start")} ${this.getValue("dhcp-range-end")}\n`;
    config += `exit\n`;

    config += `interface Vlan-interface${vlanId}\n`;
    config += ` dhcp server apply ip-pool VLAN${vlanId}\nexit\n`;
  }

  return config;
}

generatePortConfigs(vlanId) {
  let config = "";
  const portBlocks = document.querySelectorAll("#port-container .port-block");

  portBlocks.forEach((block) => {
    const portId = block.querySelector('input[name="port-id"]').value;
    if (!portId) return;

    const portMode = block.querySelector('select[name="port-mode"]').value;
    const portPoe = block.querySelector('input[name="port-poe"]').checked;

    config += `interface ${portId}\n`;

    if (portMode === "access" && vlanId) {
      config += ` port link-type access\n port access vlan ${vlanId}\n`;
    } else if (portMode === "trunk" && vlanId) {
      config += ` port link-type trunk\n port trunk permit vlan ${vlanId}\n`;
    }

    if (portPoe) config += ` poe enable\n`;
  });

  return config;
}


  // === CONFIG MANAGEMENT ===
  async saveConfig() {
    try {
      const configText = this.getValue("config-output");
      const deviceType = this.getValue("device-type");
      const hostname = this.getValue("hostname") || "unnamed-device";

      if (!configText) {
        throw new Error("No configuration to save");
      }

      const response = await this.apiRequest("/", "POST", {
        device_type: deviceType,
        hostname: hostname,
        config_text: configText,
      });

      this.showSuccess("Configuration saved successfully");
      await this.loadConfigHistory();
    } catch (error) {
      console.error("Error saving config:", error);
      this.showError(error.message || "Failed to save configuration");
    }
  }

  async deleteConfig(configId) {
    try {
      if (!confirm("Are you sure you want to delete this configuration?"))
        return;

      const response = await this.apiRequest(`/${configId}`, "DELETE");
      this.showSuccess("Configuration deleted successfully");
      await this.loadConfigHistory();
    } catch (error) {
      console.error("Error deleting config:", error);
      this.showError(error.message || "Failed to delete configuration");
    }
  }

  async restoreConfig(configId) {
    try {
      const confirmed = confirm("Pulihkan konfigurasi ini?");
      if (!confirmed) return;

      await this.apiRequest(`/restore/${configId}`, "PATCH");
      this.showSuccess("Configuration restored successfully");
      this.loadDeletedHistory(); // Refresh daftar terhapus
    } catch (error) {
      console.error("Error restoring config:", error);
      this.showError(error.message || "Failed to restore configuration");
    }
  }

  // === HISTORY MANAGEMENT ===
  async loadConfigHistory() {
    try {
      this.setActiveTab("tab-active"); // 🔥 tandai tab aktif
      const history = await this.apiRequest("/history");
      this.lastHistory = history;
      this.renderHistoryList(history);
    } catch (error) {
      console.error("Error loading history:", error);
      this.showError(error.message || "Failed to load configuration history");
    }
  }

  async loadDeletedHistory() {
    try {
      this.setActiveTab("tab-deleted"); // tandai tab aktif
      const history = await this.apiRequest("/deleted");
      this.renderDeletedList(history);
    } catch (error) {
      console.error("Error loading deleted history:", error);
      this.showError(error.message || "Failed to load deleted configurations");
    }
  }

  renderHistoryList(history) {
    const listContainer = document.getElementById("history-list");
    if (!listContainer) return;

    listContainer.innerHTML =
      history.length > 0
        ? history.map((item) => this.createHistoryItem(item)).join("")
        : '<div class="no-history">No configurations saved yet</div>';

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const configId = e.target.dataset.configId;
        this.deleteConfig(configId); // pastikan ada fungsi deleteConfig()
      });
    });
  }

  renderDeletedList(history) {
    const listContainer = document.getElementById("history-list");
    if (!listContainer) return;

    listContainer.innerHTML =
      history.length > 0
        ? history.map((item) => this.createDeletedItem(item)).join("")
        : '<div class="no-history">No deleted configurations';

    document.querySelectorAll(".restore-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const configId = e.target.dataset.configId;
        this.restoreConfig(configId);
      });
    });
  }

  createDeletedItem(item) {
    const date = new Date(item.created_at).toLocaleString();
    return `
      <div class="history-item deleted">
        <div class="history-header">
          <span class="device-type">${item.device_type}</span>
          <span class="hostname">${item.hostname}</span>
          <button class="restore-btn" data-config-id="${item.id}">Pulihkan</button>
        </div>
        <pre class="config-text">${item.config_text}</pre>
        <div class="history-footer">
          <small>Saved: ${date}</small>
        </div>
      </div>
    `;
  }

  createHistoryItem(item) {
    const date = new Date(item.created_at).toLocaleString();
    return `
      <div class="history-item">
        <div class="history-header">
          <span class="device-type">${item.device_type || "Unknown"}</span>
          <span class="hostname">${item.hostname || "No hostname"}</span>
          <button class="delete-btn" data-config-id="${item.id}">Delete</button>
        </div>
        <pre class="config-text">${item.config_text}</pre>
        <div class="history-footer">
          <small class="timestamp">Saved: ${date}</small>
        </div>
      </div>
    `;
  }

  // === UTILITY METHODS ===
  async apiRequest(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    return data;
  }

  getValue(id) {
    const element = document.getElementById(id);
    if (!element) return "";
    return element.value;
  }

  setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
  }

  cidrToNetmask(cidr) {
    cidr = parseInt(cidr);
    if (isNaN(cidr)) return "255.255.255.0";

    const mask = [];
    for (let i = 0; i < 4; i++) {
      const bits = Math.min(cidr, 8);
      mask.push(256 - Math.pow(2, 8 - bits));
      cidr -= bits;
    }
    return mask.join(".");
  }

  setActiveTab(tabId) {
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    const activeBtn = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add("active");
  }

  copyConfig = async () => {
    try {
      const text = this.getValue("config-output");
      if (!text) throw new Error("No configuration to copy");

      await navigator.clipboard.writeText(text);
      this.showSuccess("Configuration copied to clipboard");
    } catch (error) {
      console.error("Error copying config:", error);
      this.showError("Failed to copy configuration");
    }
  };

  exportConfig = () => {
    const text = this.getValue("config-output");
    if (!text) {
      this.showError("No configuration to export");
      return;
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "network-config.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // === UI HELPERS ===
  showSuccess(message) {
    alert(message); // Replace with a proper notification system
  }

  showError(message) {
    alert(message); // Replace with a proper notification system
  }

  // === PORT MANAGEMENT ===
  initPortManagement = () => {
    const portContainer = document.getElementById("port-container");
    if (!portContainer) return;

    const portBlock = document.createElement("div");
    portBlock.className = "port-block";
    portBlock.innerHTML = `
      <div class="port-controls">
        <input type="text" name="port-id" placeholder="Port ID (e.g., Gig1/0/1)" required />
        <select name="port-mode">
          <option value="access">Access</option>
          <option value="trunk">Trunk</option>
        </select>
        <label class="poe-toggle">
          <input type="checkbox" name="port-poe" />
          <span>POE</span>
        </label>
        <button class="remove-port">×</button>
      </div>
    `;

    portBlock.querySelector(".remove-port").addEventListener("click", () => {
      portContainer.removeChild(portBlock);
    });

    portContainer.appendChild(portBlock);
  };
}

// Initialize the application
const app = new NetworkConfigApp();
window.app = app; // Make available for inline event handlers
