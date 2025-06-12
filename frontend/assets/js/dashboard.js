class NetworkConfigApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/configs";
    this.user = this.getUserData();
    this.dom = {}; // To store frequently accessed DOM elements
    this.getDOMElements();
    this.init();
  }

  // === INITIALIZATION ===
  async init() {
    try {
      if (!this.checkAuth()) return;
      this.updateUserUI(this.user);
      await this.loadConfigHistory(); // Load active configs initially
      this.bindUIEvents();
      this.setupValidation();
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showError("Failed to initialize application");
    }
  }

  getDOMElements() {
    this.dom.nameSpan = document.getElementById("name");
    this.dom.addPortButton = document.getElementById("add-port-button");
    this.dom.logoutBtn = document.getElementById("logout-btn");
    this.dom.configForm = document.getElementById("config-form");
    this.dom.copyBtn = document.getElementById("copy-btn");
    this.dom.dnsOption = document.getElementById("dns-option");
    this.dom.saveBtn = document.getElementById("save-btn");
    this.dom.exportBtn = document.getElementById("export-btn");
    this.dom.tabActive = document.getElementById("tab-active");
    this.dom.tabDeleted = document.getElementById("tab-deleted");
    this.dom.configOutput = document.getElementById("config-output");
    this.dom.portGrid = document.getElementById("port-grid");
    this.dom.customDnsField = document.getElementById("custom-dns-field");
    this.dom.historyList = document.getElementById("history-list");

    // Form elements
    this.dom.deviceType = document.getElementById("device-type");
    this.dom.hostname = document.getElementById("hostname");
    this.dom.dhcpEnableGlobal = document.getElementById("dhcp-enable-global");
    this.dom.vlanId = document.getElementById("vlan-id");
    this.dom.vlanIp = document.getElementById("vlan-ip");
    this.dom.vlanSubnet = document.getElementById("vlan-subnet");
    this.dom.vlanNetwork = document.getElementById("vlan-network");
    this.dom.dhcpRangeStart = document.getElementById("dhcp-range-start");
    this.dom.dhcpRangeEnd = document.getElementById("dhcp-range-end");
    this.dom.dhcpGateway = document.getElementById("dhcp-gateway");
    this.dom.customDns = document.getElementById("custom-dns");
  }

  // === AUTHENTICATION ===
  checkAuth() {
    if (!this.user || !localStorage.getItem("token")) {
      alert("Please login first");
      window.location.href = "./login.html";
      return false;
    }
    return true;
  }

  getUserData() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "./login.html";
  }

  // === IP NETWORK UTILITIES ===
  ipToInt(ip) {
    return ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  }

  intToIp(int) {
    return [
      (int >>> 24) & 0xff,
      (int >>> 16) & 0xff,
      (int >>> 8) & 0xff,
      int & 0xff,
    ].join(".");
  }

  getSubnetMask(cidr) {
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      console.warn("Invalid CIDR provided to getSubnetMask:", cidr);
      return 0;
    }
    return (0xffffffff << (32 - cidr)) >>> 0;
  }

  getNetworkAddress(ip, cidr) {
    if (!this.validateIPv4(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
      console.warn(
        "Invalid IP or CIDR provided to getNetworkAddress:",
        ip,
        cidr
      );
      return null;
    }
    const ipInt = this.ipToInt(ip);
    const mask = this.getSubnetMask(cidr);
    return ipInt & mask;
  }

  getBroadcastAddress(ip, cidr) {
    if (!this.validateIPv4(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
      console.warn(
        "Invalid IP or CIDR provided to getBroadcastAddress:",
        ip,
        cidr
      );
      return null;
    }
    const ipInt = this.ipToInt(ip);
    const mask = this.getSubnetMask(cidr);
    const networkAddressInt = ipInt & mask;
    const invertedMask = ~mask >>> 0;
    return (networkAddressInt | invertedMask) >>> 0;
  }

  isSameSubnet(ip1, ip2, cidr) {
    if (
      !this.validateIPv4(ip1) ||
      !this.validateIPv4(ip2) ||
      isNaN(cidr) ||
      cidr < 0 ||
      cidr > 32
    ) {
      console.warn(
        "Invalid IP(s) or CIDR provided to isSameSubnet:",
        ip1,
        ip2,
        cidr
      );
      return false;
    }
    return (
      this.getNetworkAddress(ip1, cidr) === this.getNetworkAddress(ip2, cidr)
    );
  }

  validateIPv4(ip) {
    return (
      /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) &&
      ip.split(".").every((n) => +n >= 0 && +n <= 255)
    );
  }

  // FUNGSI BARU UNTUK SUGGESTION CIDR
  getSuggestedCidr(ip) {
    if (!this.validateIPv4(ip)) {
      return null; // Not a valid IP, no suggestion
    }
    const octets = ip.split(".").map(Number);
    // Suggest common CIDRs based on IP classes/private ranges
    if (octets[0] >= 192 && octets[0] <= 223) {
      // Class C (e.g., 192.168.x.x)
      return 24; // /24
    } else if (octets[0] >= 128 && octets[0] <= 191) {
      // Class B (e.g., 172.16.x.x)
      return 16; // /16
    } else if (octets[0] >= 1 && octets[0] <= 126) {
      // Class A (e.g., 10.x.x.x)
      return 8; // /8
    }
    return null; // For other IPs (multicast, experimental, etc.), no strong suggestion
  }

  // === FORM VALIDATION ===
  setupValidation() {
    const rules = {
      hostname: (val) => {
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9\- ]*[a-zA-Z0-9])?$/.test(val)) {
            return "Invalid hostname (letters, numbers, spaces, hyphens allowed; must not start or end with space/hyphen).";
        }

        if (val.length > 64) {
            return "Hostname must be at most 64 characters.";
        }

        return true;
      },

      "vlan-id": (val) => {
        const num = parseInt(val, 10);
        return /^\d+$/.test(val) && num >= 1 && num <= 4094
          ? true
          : "VLAN ID must be a number between 1 and 4094.";
      },

      // VALIDASI YANG DIPERBARUI UNTUK vlan-ip
      "vlan-ip": (val) => {
        if (!this.validateIPv4(val)) return "Invalid VLAN IP address.";

        const cidrStr = this.getValue("vlan-subnet");
        const cidr = parseInt(cidrStr, 10);

        if (cidrStr && !isNaN(cidr) && cidr >= 0 && cidr <= 32) {
          const ipInt = this.ipToInt(val);
          const networkAddressInt = this.getNetworkAddress(val, cidr);
          const broadcastAddressInt = this.getBroadcastAddress(val, cidr);

          if (ipInt === networkAddressInt) {
            if (cidr < 31) {
              return `VLAN IP cannot be the network address (${this.intToIp(
                networkAddressInt
              )}) for /${cidr}.`;
            }
          }
          if (ipInt === broadcastAddressInt) {
            if (cidr < 31) {
              return `VLAN IP cannot be the broadcast address (${this.intToIp(
                broadcastAddressInt
              )}) for /${cidr}.`;
            }
          }
        } else if (cidrStr.trim() !== "") {
          return "Please enter a valid Subnet CIDR first.";
        }
        return true;
      },

      "vlan-subnet": (val) => {
        const num = parseInt(val, 10);
        return /^\d{1,2}$/.test(val) && num >= 0 && num <= 32
          ? true
          : "Subnet CIDR must be between 0 and 32.";
      },

      "vlan-network": (val) => {
        const ip = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (!this.validateIPv4(val)) return "Invalid network IP address.";

        // Only further validate if VLAN IP and CIDR are already valid
        if (this.validateIPv4(ip) && !isNaN(cidr) && cidr >= 0 && cidr <= 32) {
          const expected = this.getNetworkAddress(ip, cidr);
          const actual = this.getNetworkAddress(val, cidr);
          if (expected === null || actual === null || expected !== actual) {
            return "Network IP does not match VLAN IP and subnet.";
          }
        } else if (ip && cidr) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },

      "dhcp-range-start": (val) => {
        const vlanIp = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (!this.validateIPv4(val)) return "Invalid DHCP range start IP.";

        if (
          this.validateIPv4(vlanIp) &&
          !isNaN(cidr) &&
          cidr >= 0 &&
          cidr <= 32
        ) {
          if (!this.isSameSubnet(val, vlanIp, cidr)) {
            return "Start IP is not within the same subnet as VLAN IP.";
          }
        } else if (vlanIp && cidr) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },

      "dhcp-range-end": (val) => {
        const vlanIp = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (!this.validateIPv4(val)) return "Invalid DHCP range end IP.";

        if (
          this.validateIPv4(vlanIp) &&
          !isNaN(cidr) &&
          cidr >= 0 &&
          cidr <= 32
        ) {
          if (!this.isSameSubnet(val, vlanIp, cidr)) {
            return "End IP is not within the same subnet as VLAN IP.";
          }
        } else if (vlanIp && cidr) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },

      "dhcp-gateway": (val) =>
        this.validateIPv4(val) || "Invalid gateway IP address.",

      "custom-dns": (val) =>
        this.validateIPv4(val) || "Invalid DNS IP address.",
    };

    this.rules = rules;

    Object.entries(rules).forEach(([id, rule]) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => {
          const isValid = rule(input.value);
          this.updateValidationState(input, isValid);
        });
      }
    });

    const triggerValidation = (id) => {
      const input = document.getElementById(id);
      const rule = this.rules[id];
      if (input && rule) {
        const isValid = rule(input.value);
        this.updateValidationState(input, isValid);
      }
    };

    ["vlan-ip", "vlan-subnet"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          // LOGIKA BARU UNTUK AUTO-FILL SUBNET
          if (id === "vlan-ip") {
            const vlanIp = el.value;
            const currentSubnet = this.getValue("vlan-subnet").trim();
            // Auto-fill hanya jika IP valid dan field subnet masih kosong
            if (this.validateIPv4(vlanIp) && currentSubnet === "") {
              const suggestedCidr = this.getSuggestedCidr(vlanIp);
              if (suggestedCidr !== null) {
                this.setValue("vlan-subnet", suggestedCidr);
                // Penting: Picu validasi untuk vlan-subnet setelah diisi otomatis
                triggerValidation("vlan-subnet");
              }
            }
          }

          // Existing triggers for dependent fields
          // Re-validate vlan-ip if vlan-subnet changes
          if (id === "vlan-subnet") {
            triggerValidation("vlan-ip");
          }
          triggerValidation("vlan-network");
          triggerValidation("dhcp-range-start");
          triggerValidation("dhcp-range-end");
        });
      }
    });
  }

  updateValidationState(input, isValid) {
    const errorMessageSpan = document.getElementById(`${input.id}-error`); // Dapatkan elemen span error yang sesuai

    if (typeof isValid === "string") {
      input.classList.add("invalid");
      input.setCustomValidity(isValid); // Ini tetap diperlukan untuk validasi submit form browser

      if (errorMessageSpan) {
        errorMessageSpan.textContent = isValid; // Tampilkan pesan error
        errorMessageSpan.style.display = "block"; // Jadikan terlihat
      }
    } else {
      input.classList.remove("invalid");
      input.setCustomValidity(""); // Hapus validasi kustom browser

      if (errorMessageSpan) {
        errorMessageSpan.textContent = ""; // Hapus pesan error
        errorMessageSpan.style.display = "none"; // Sembunyikan
      }
    }
  }

  // === PORT MANAGEMENT ===
  initPortManagement = () => {
    if (!this.dom.portGrid) return;

    const portControls = document.createElement("div");
    portControls.className = "port-controls";
    // Pastikan ID untuk span error juga unik saat elemen dinamis dibuat
    const uniquePortId = `port-id-${Date.now()}`;
    portControls.innerHTML = `
        <input type="text" name="port-id" id="${uniquePortId}" placeholder="port ID (E.g.: GE1/0/1)" required />
        <span class="error-message" id="${uniquePortId}-error"></span>
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

    // Tambahkan event listener untuk input port-id yang baru dibuat
    const newPortIdInput = portControls.querySelector('input[name="port-id"]');
    if (newPortIdInput) {
      newPortIdInput.addEventListener("input", () => {
        // Contoh validasi untuk port-id: tidak kosong dan format dasar (misal: GE1/0/1)
        const isValid =
          (newPortIdInput.value.trim() !== "" &&
            /^([A-Za-z]+)\d+\/\d+\/\d+$/.test(newPortIdInput.value)) ||
          "Format Port ID tidak valid (E.g.: GE1/0/1)";
        this.updateValidationState(newPortIdInput, isValid);
      });
    }

    portControls.querySelector(".remove-port").addEventListener("click", () => {
      this.dom.portGrid.removeChild(portControls);
    });

    this.dom.portGrid.appendChild(portControls);
  };

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

  // === UI EVENT HANDLING ===
  bindUIEvents() {
    this.dom.addPortButton?.addEventListener("click", this.initPortManagement);
    this.dom.logoutBtn?.addEventListener("click", this.logout.bind(this));
    this.dom.configForm?.addEventListener(
      "submit",
      this.generateConfig.bind(this)
    );
    this.dom.copyBtn?.addEventListener("click", this.copyConfig.bind(this));
    this.dom.dnsOption?.addEventListener(
      "change",
      this.toggleCustomDNSField.bind(this)
    );
    this.dom.saveBtn?.addEventListener("click", this.saveConfig.bind(this));
    this.dom.exportBtn?.addEventListener("click", this.exportConfig.bind(this));
    this.dom.tabActive?.addEventListener(
      "click",
      this.loadConfigHistory.bind(this)
    );
    this.dom.tabDeleted?.addEventListener(
      "click",
      this.loadDeletedHistory.bind(this)
    );

    // Delegated event for delete and restore buttons in history list
    this.dom.historyList?.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const configId = e.target.dataset.configId;
        this.deleteConfig(configId);
      } else if (e.target.classList.contains("restore-btn")) {
        const configId = e.target.dataset.configId;
        this.restoreConfig(configId);
      }
    });
  }

  updateUserUI(user) {
    if (this.dom.nameSpan) {
      this.dom.nameSpan.textContent = user?.name || "User";
    }
  }

  toggleCustomDNSField(event) {
    const selectedValue = event.target.value;
    if (this.dom.customDnsField) {
      this.dom.customDnsField.style.display =
        selectedValue === "custom" ? "block" : "none";
      // Clear custom DNS field validation when hidden
      if (selectedValue !== "custom") {
        this.dom.customDns.value = "";
        this.updateValidationState(this.dom.customDns, true); // Clear error message
      }
    }
  }

  // === CONFIGURATION GENERATION ===
  generateConfig(e) {
    e.preventDefault();

    const form = this.dom.configForm;
    let formIsValid = true;

    // Iterate through all tracked form elements (those with rules defined)
    Object.entries(this.rules).forEach(([id, rule]) => {
      const element = document.getElementById(id);
      if (element) {
        const isValid = rule(element.value);
        this.updateValidationState(element, isValid);
        if (typeof isValid === "string") {
          // If isValid is a string, it means there's an error message
          formIsValid = false;
        }
      }
    });

    // Also check validity for dynamically added port inputs
    const portInputs = document.querySelectorAll(
      '.port-controls input[name="port-id"]'
    );
    portInputs.forEach((input) => {
      const isValid =
        (input.value.trim() !== "" &&
          /^([A-Za-z]+)\d+\/\d+\/\d+$/.test(input.value)) ||
        "Format Port ID tidak valid (E.g.: GE1/0/1)";
      this.updateValidationState(input, isValid);
      if (typeof isValid === "string") {
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      // Jika ada input yang tidak valid, jangan lanjutkan
      return;
    }

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
    if (this.getChecked("dhcp-enable-global")) {
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
    const dhcpRangeStart = this.getValue("dhcp-range-start");
    const dhcpRangeEnd = this.getValue("dhcp-range-end");

    if (dhcpRangeStart && dhcpRangeEnd) {
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
      config += ` address range ${dhcpRangeStart} ${dhcpRangeEnd}\n`;
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
      config += `exit\n`; // Add exit for each interface configuration
    });

    return config;
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

      await this.apiRequest("/", "POST", {
        device_type: deviceType,
        hostname: hostname,
        dhcp_enable_global: this.getChecked("dhcp-enable-global"),
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

      await this.apiRequest(`/${configId}`, "DELETE");
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
      await this.loadDeletedHistory(); // Reload deleted history after restore
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
    if (!this.dom.historyList) return;

    this.dom.historyList.innerHTML = ""; // Clear existing content

    if (history.length === 0) {
      const noHistory = document.createElement("div");
      noHistory.className = "no-history";
      noHistory.textContent = "No configurations saved yet";
      this.dom.historyList.appendChild(noHistory);
      return;
    }

    history.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "history-item";

      const header = document.createElement("div");
      header.className = "history-header";

      const deviceTypeSpan = document.createElement("span");
      deviceTypeSpan.className = "device-type";
      deviceTypeSpan.textContent = this.escapeHtml(
        item.device_type || "Unknown"
      );

      const hostnameSpan = document.createElement("span");
      hostnameSpan.className = "hostname";
      hostnameSpan.textContent = this.escapeHtml(
        item.hostname || "No hostname"
      );

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Hapus Riwayat";
      deleteBtn.dataset.configId = item.id; // Data attribute for config ID

      header.appendChild(deviceTypeSpan);
      header.appendChild(hostnameSpan);
      header.appendChild(deleteBtn);

      const pre = document.createElement("pre");
      pre.className = "config-text";
      pre.textContent = item.config_text;

      const footer = document.createElement("div");
      footer.className = "history-footer";
      const smallTimestamp = document.createElement("small");
      smallTimestamp.className = "timestamp";
      smallTimestamp.textContent = `Saved: ${new Date(
        item.created_at
      ).toLocaleString()}`;
      footer.appendChild(smallTimestamp);

      itemElement.appendChild(header);
      itemElement.appendChild(pre);
      itemElement.appendChild(footer);

      this.dom.historyList.appendChild(itemElement);
    });
  }

  renderDeletedList(history) {
    if (!this.dom.historyList) return;

    this.dom.historyList.innerHTML = ""; // Clear existing content

    if (history.length === 0) {
      const noHistory = document.createElement("div");
      noHistory.className = "no-history";
      noHistory.textContent = "No deleted configurations";
      this.dom.historyList.appendChild(noHistory);
      return;
    }

    history.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "history-item deleted";

      const header = document.createElement("div");
      header.className = "history-header";

      const deviceTypeSpan = document.createElement("span");
      deviceTypeSpan.className = "device-type";
      deviceTypeSpan.textContent = this.escapeHtml(item.device_type);

      const hostnameSpan = document.createElement("span");
      hostnameSpan.className = "hostname";
      hostnameSpan.textContent = this.escapeHtml(item.hostname);

      const restoreBtn = document.createElement("button");
      restoreBtn.className = "restore-btn";
      restoreBtn.textContent = "Pulihkan";
      restoreBtn.dataset.configId = item.id;

      header.appendChild(deviceTypeSpan);
      header.appendChild(hostnameSpan);
      header.appendChild(restoreBtn);

      const pre = document.createElement("pre");
      pre.className = "config-text";
      pre.textContent = item.config_text;

      const footer = document.createElement("div");
      footer.className = "history-footer";
      const smallTimestamp = document.createElement("small");
      smallTimestamp.textContent = `Saved: ${new Date(
        item.created_at
      ).toLocaleString()}`;
      footer.appendChild(smallTimestamp);

      itemElement.appendChild(header);
      itemElement.appendChild(pre);
      itemElement.appendChild(footer);

      this.dom.historyList.appendChild(itemElement);
    });
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

    let data;
    try {
      data = await response.json();
    } catch {
      data = null; // Response might not be JSON, e.g., on DELETE
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
    return element ? element.value : "";
  }

  setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
  }

  getChecked(id) {
    const el = document.getElementById(id);
    return el?.checked ?? false;
  }

  cidrToNetmask(cidr) {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [24, 16, 8, 0].map((s) => (mask >>> s) & 255).join(".");
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

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // === UI HELPERS ===
  showSuccess(message) {
    alert(message);
  }

  showError(message) {
    alert(message);
  }

  destroy() {}
}

// Initialize the application
const app = new NetworkConfigApp();
