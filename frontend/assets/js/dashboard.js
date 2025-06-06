class NetworkConfigApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/configs";
    this.user = this.getUserData();
    this.init();
  }

  // === INITIALIZATION ===
  async init() {
    try {
      await this.checkAuth();
      this.updateUserUI(this.user);
      await this.loadConfigHistory();
      this.bindUIEvents();
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showError("Failed to initialize application");
    }
  }

  // === AUTHENTICATION ===
  checkAuth() {
    if (!this.user || !localStorage.getItem("token")) {
      alert("Please login first");
      window.location.href = "./login.html";
    }
    this.updateUserUI(this.user);
  }

  getUserData() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  }

  // === PORT MANAGEMENT ===
  initPortManagement = () => {
    const portGrid = document.getElementById("port-grid");
    if (!portGrid) return;

    const portControls = document.createElement("div");
    portControls.className = "port-controls";
    portControls.innerHTML = `
        <input type="text" name="port-id" placeholder="port ID (E.g.: GE1/0/1)" required />
        <select name="port-mode">
          <option value="access">Access</option>
          <option value="trunk">Trunk</option>
        </select>
        <label class="poe-toggle">
          <input type="checkbox" name="port-poe" />
          <span>POE</span>
        </label>
        <button class="remove-port">Remove</button>
    `;

    portControls.querySelector(".remove-port").addEventListener("click", () => {
      portGrid.removeChild(portControls);
    });

    portGrid.appendChild(portControls);
  };

  toggleCustomDNSField(event) {
    const selectedValue = event.target.value;
    const customField = document.getElementById("custom-dns-field");
    customField.style.display = selectedValue === "custom" ? "block" : "none";
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
      "dns-option": { event: this.toggleCustomDNSField, type: "change" },
      "save-btn": { event: this.saveConfig },
      "export-btn": { event: this.exportConfig },
      "tab-active": { event: this.loadConfigHistory },
      "tab-deleted": { event: this.loadDeletedHistory },
    };

    Object.entries(eventMap).forEach(([id, { event: handler }]) => {
      const el = document.getElementById(id);
      if (el) {
        // event submit untuk form, click untuk tombol
        const eventType = id === "config-form" ? "submit" : "click";
        el.addEventListener(eventType, handler.bind(this));
      } else {
        console.warn(`Element with ID ${id} not found.`);
      }
    });
  }

  updateUserUI(user) {
    const nameSpan = document.getElementById("name");
    if (nameSpan) {
      nameSpan.textContent = user?.name || "User";
    }
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
      const dns =
        this.getValue("dns-option") === "custom"
          ? this.getValue("custom-dns")
          : this.getValue("dns-option");

      config += `dhcp server ip-pool VLAN${vlanId}\n`;
      config += ` network ${this.getValue(
        "vlan-network"
      )} mask ${this.cidrToNetmask(vlanSubnet)}\n`;
      config += ` gateway-list ${this.getValue("dhcp-gateway") || vlanIp}\n`;
      config += ` dns-list ${dns}\n`;
      config += ` address range ${this.getValue(
        "dhcp-range-start"
      )} ${this.getValue("dhcp-range-end")}\n`;
      config += `exit\n`;

      config += `interface Vlan-interface${vlanId}\n`;
      config += ` dhcp server apply ip-pool VLAN${vlanId}\nexit\n`;
    }

    return config;
  }

  generatePortConfigs(vlanId) {
    let config = "";
    const portBlocks = document.querySelectorAll(".port-controls");

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

  collectPortData() {
    const portBlocks = document.querySelectorAll(".port-controls");
    return Array.from(portBlocks).map((block) => {
      return {
        port_id: block.querySelector('input[name="port-id"]').value,
        port_mode: block.querySelector('select[name="port-mode"]').value,
        port_poe: block.querySelector('input[name="port-poe"]').checked,
      };
    });
  }

  // === CONFIG MANAGEMENT ===
  async saveConfig() {
    try {
      const configText = this.getValue("config-output");
      const deviceType = this.getValue("device-type");
      const hostname = this.getValue("hostname") || "unnamed-device";
      const ports = this.collectPortData();

      if (!configText) {
        throw new Error("No configuration to save");
      }

      const response = await this.apiRequest("/", "POST", {
        // user_id: this.user.id,
        device_type: deviceType,
        hostname: hostname,
        dhcp_enable_global: this.getValue("dhcp-enable-global"),
        vlan_id: this.getValue("vlan-id"),
        vlan_ip: this.getValue("vlan-ip"),
        vlan_subnet: this.getValue("vlan-subnet"),
        vlan_network: this.getValue("vlan-network"),
        dhcp_range_start: this.getValue("dhcp-range-start"),
        dhcp_range_end: this.getValue("dhcp-range-end"),
        dhcp_gateway: this.getValue("dhcp-gateway"),
        dns_option: this.getValue("dns-option"),
        custom_dns: this.getValue("custom-dns"),
        config_text: configText,
        // config_hash: this.generateConfigHash(configText),
        ports: ports,
      });

      this.showSuccess("Configuration saved successfully");
      await this.loadConfigHistory();
    } catch (error) {
      console.error("Error saving config:", error);
      this.showError(error.message || "Failed to save configuration");
    }
  }

  async deleteConfig(configId) {
    console.log("Deleting configId:", configId);
    try {
      if (!confirm("Are you sure you want to delete this configuration?"))
        return;

      const response = await this.apiRequest(`/${configId}`, "DELETE");
      this.showSuccess("Configuration deleted successfully");
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
      this.loadDeletedHistory();
    } catch (error) {
      console.error("Error restoring config:", error);
      this.showError(error.message || "Failed to restore configuration");
    }
  }

  // === HISTORY MANAGEMENT ===
  async loadConfigHistory() {
    try {
      this.setActiveTab("tab-active");
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
      this.setActiveTab("tab-deleted");
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

    listContainer.textContent = "";

    if (history.length === 0) {
      const noHistory = document.createElement("div");
      noHistory.className = "no-history";
      noHistory.textContent = "No configurations saved yet";
      listContainer.appendChild(noHistory);
      return;
    }

    history.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "history-item";

      // Gunakan textContent untuk teks biasa
      const header = document.createElement("div");
      header.className = "history-header";
      header.innerHTML = `
      <span class="device-type">${this.escapeHtml(
        item.device_type || "Unknown"
      )}</span>
      <span class="hostname">${this.escapeHtml(
        item.hostname || "No hostname"
      )}</span>
    `;

      // Tambahkan method escapeHtml di class
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Hapus Riwayat";
      deleteBtn.dataset.configId = item.id;
      deleteBtn.addEventListener("click", () => this.deleteConfig(item.id));

      header.appendChild(deleteBtn);
      itemElement.appendChild(header);

      const pre = document.createElement("pre");
      pre.className = "config-text";
      pre.textContent = item.config_text;
      itemElement.appendChild(pre);

      listContainer.appendChild(itemElement);
    });
  }

  // Tambahkan method escape
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });

    const options = {
      method,
      headers,
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);

    // Untuk menghindari error jika response bukan JSON:
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        (data && data.message) ||
          `Request failed with status ${response.status}`
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
      this.showError(error.message || "Failed to copy configuration");
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
    alert(message);
  }

  showError(message) {
    alert(message);
  }

  destroy() {
    // Hapus semua event listeners
    const events = ["click", "submit"];
    events.forEach((type) => {
      document.body.removeEventListener(type, this.boundHandlers[type]);
    });

    // Hapus height sync jika ada
    if (this.heightSync) {
      this.heightSync.destroy();
    }

    // Hapus reference
    window.app = null;
  }
}

// Initialize the application
const app = new NetworkConfigApp();
const sync = new HeightSynchronizer(".form-group", ".result-box");
sync.destroy();
window.app = app;
