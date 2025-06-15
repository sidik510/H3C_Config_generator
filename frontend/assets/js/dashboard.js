// dashboard.js

/**
 * @class NetworkConfigApp
 * @description Manages the network configuration generation, validation, and history.
 */
class NetworkConfigApp {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api/configs";
    this.user = this.getUserData();
    this.dom = {}; // Cache for DOM elements
    this.ports = []; // Array to store dynamically added port data
    this.validationRules = {}; // Stores validation rules for form fields

    this.getDOMElements(); // Get all necessary DOM elements once
    this.init(); // Initialize the application
  }

  // === Private Initialization Methods ===

  /**
   * @private
   * @description Initializes the application by checking auth, loading UI, and binding events.
   */
  async init() {
    try {
      if (!this.checkAuth()) return;
      this.updateUserUI(this.user);
      this.setupValidationRules(); // Define all validation rules
      this.bindUIEvents(); // Bind all event listeners
      this.toggleDeviceFields(); // Set initial visibility for device-specific fields
      await this.loadConfigHistory(); // Load active configs initially
    } catch (error) {
      console.error("App initialization failed:", error);
      this.showError("Failed to initialize application");
    }
  }

  /**
   * @private
   * @description Caches frequently accessed DOM elements.
   */
  getDOMElements() {
    // User & Global
    this.dom.nameSpan = document.getElementById("name");
    this.dom.logoutBtn = document.getElementById("logout-btn");
    this.dom.configForm = document.getElementById("config-form");
    this.dom.configOutput = document.getElementById("config-output");
    this.dom.copyBtn = document.getElementById("copy-btn");
    this.dom.saveBtn = document.getElementById("save-btn");
    this.dom.exportBtn = document.getElementById("export-btn");

    // Form Specific
    this.dom.deviceType = document.getElementById("device-type");
    this.dom.switchFields = document.getElementById("switch-fields"); // Fieldset for switch configs

    this.dom.hostname = document.getElementById("hostname");
    this.dom.dhcpEnableGlobal = document.getElementById("dhcp-enable-global");
    this.dom.vlanId = document.getElementById("vlan-id");
    this.dom.vlanIp = document.getElementById("vlan-ip");
    this.dom.vlanSubnet = document.getElementById("vlan-subnet");
    this.dom.vlanNetwork = document.getElementById("vlan-network");
    this.dom.dhcpRangeStart = document.getElementById("dhcp-range-start");
    this.dom.dhcpRangeEnd = document.getElementById("dhcp-range-end");
    this.dom.dhcpGateway = document.getElementById("dhcp-gateway");
    this.dom.dnsOption = document.getElementById("dns-option");
    this.dom.customDnsField = document.getElementById("custom-dns-field");
    this.dom.customDns = document.getElementById("custom-dns");

    // Port Management
    this.dom.portGrid = document.getElementById("port-grid");
    this.dom.addPortButton = document.getElementById("add-port-button");

    // History
    this.dom.historyList = document.getElementById("history-list");
    this.dom.tabActive = document.getElementById("tab-active");
    this.dom.tabDeleted = document.getElementById("tab-deleted");
  }

  /**
   * @private
   * @description Binds all UI event listeners.
   */
  bindUIEvents() {
    this.dom.logoutBtn?.addEventListener("click", this.logout.bind(this));
    this.dom.configForm?.addEventListener(
      "submit",
      this.generateConfig.bind(this)
    );
    this.dom.copyBtn?.addEventListener("click", this.copyConfig.bind(this));
    this.dom.saveBtn?.addEventListener("click", this.saveConfig.bind(this));
    this.dom.exportBtn?.addEventListener("click", this.exportConfig.bind(this));

    // Device type specific fields visibility
    this.dom.deviceType?.addEventListener(
      "change",
      this.toggleDeviceFields.bind(this)
    );
    this.dom.dnsOption?.addEventListener(
      "change",
      this.toggleCustomDNSField.bind(this)
    );

    // Port management
    this.dom.addPortButton?.addEventListener(
      "click",
      this.addPortRow.bind(this)
    );
    // Use event delegation for dynamically added remove port buttons
    this.dom.portGrid?.addEventListener(
      "click",
      this.handlePortRemoval.bind(this)
    );

    // History tabs
    this.dom.tabActive.addEventListener('click', () => {
    this.loadConfigHistory(false);
    this.setActiveTab('tab-active');
  }); // false for not deleted
    this.dom.tabDeleted.addEventListener('click', () => {
    this.loadConfigHistory(true);
    this.setActiveTab('tab-deleted');
  }); // true for deleted

    // Event delegation for delete/restore buttons in history list
    this.dom.historyList?.addEventListener(
      "click",
      this.handleHistoryAction.bind(this)
    );

    // Input event listeners for validation and auto-fill
    Object.keys(this.validationRules).forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () =>
          this.validateInput(input.id, input.value)
        );
      }
    });

    // Specific listeners for interrelated IP/subnet fields
    this.dom.vlanIp?.addEventListener(
      "input",
      this.handleVlanIpInput.bind(this)
    );
    this.dom.vlanSubnet?.addEventListener(
      "input",
      this.handleVlanSubnetInput.bind(this)
    );
  }

  // === Private Authentication Methods ===

  /**
   * @private
   * @description Checks if a user is authenticated.
   * @returns {boolean} True if authenticated, false otherwise.
   */
  checkAuth() {
    if (!this.user || !localStorage.getItem("token")) {
      alert("Please login first");
      window.location.href = "./login.html";
      return false;
    }
    return true;
  }

  /**
   * @private
   * @description Retrieves user data from local storage.
   * @returns {Object|null} User data or null if not found/invalid.
   */
  getUserData() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  /**
   * @private
   * @description Logs the user out and redirects to the login page.
   */
  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "./login.html";
  }

  // === Private UI Update Methods ===

  /**
   * @private
   * @description Updates the user's name in the UI.
   * @param {Object} user - The user object.
   */
  updateUserUI(user) {
    if (this.dom.nameSpan) {
      this.dom.nameSpan.textContent = user?.name || "User";
    }
  }

  /**
   * @private
   * @description Toggles visibility of device-specific input fields.
   */
  toggleDeviceFields() {
    const selectedDevice = this.dom.deviceType.value;
    if (this.dom.switchFields) {
      this.dom.switchFields.style.display =
        selectedDevice === "switch" ? "grid" : "none";
      this.toggleRequiredAttributes(selectedDevice === "switch"); // Toggle required attributes
    }
    // Add logic for other device types here
  }

  /**
   * @private
   * @description Toggles the 'required' attribute on switch-specific inputs.
   * @param {boolean} enable - True to enable, false to disable.
   */
  toggleRequiredAttributes(enable) {
    const switchInputs = this.dom.switchFields.querySelectorAll(
      'input[type="text"], input[type="number"], select'
    );
    switchInputs.forEach((input) => {
      // Exclude dynamically added port-id inputs, they are handled separately
      if (
        input.name === "port-id" &&
        input.parentElement.classList.contains("port-controls")
      ) {
        return;
      }
      if (enable) {
        input.setAttribute("required", "");
      } else {
        input.removeAttribute("required");
        // Clear value and error message if hidden and not required
        input.value = "";
        this.updateValidationState(input, true); // Clear error
      }
    });

    // Handle initial port-id input which might be required by default
    const initialPortIdInput = document.getElementById("port-id");
    if (initialPortIdInput) {
      if (enable) {
        initialPortIdInput.setAttribute("required", "");
      } else {
        initialPortIdInput.removeAttribute("required");
        initialPortIdInput.value = "";
        this.updateValidationState(initialPortIdInput, true);
      }
    }

    // Clear and remove required from custom-dns if custom is not selected
    if (this.dom.dnsOption.value !== "custom") {
      this.dom.customDns?.removeAttribute("required");
      this.dom.customDns.value = "";
      this.updateValidationState(this.dom.customDns, true);
    }
  }

  /**
   * @private
   * @description Toggles the visibility of the custom DNS input field.
   */
  toggleCustomDNSField() {
    const selectedValue = this.dom.dnsOption.value;
    if (this.dom.customDnsField) {
      this.dom.customDnsField.style.display =
        selectedValue === "custom" ? "block" : "none";
      // Clear custom DNS field validation when hidden and remove required
      if (selectedValue !== "custom") {
        this.dom.customDns.value = "";
        this.dom.customDns?.removeAttribute("required");
        this.updateValidationState(this.dom.customDns, true); // Clear error message
      } else {
        this.dom.customDns?.setAttribute("required", "");
      }
    }
  }

  /**
   * @private
   * @description Sets the active tab visually in the history section.
   * @param {string} tabId - The ID of the tab to make active.
   */
  setActiveTab(tabId) {
    this.dom.tabActive?.classList.remove("active");
    this.dom.tabDeleted?.classList.remove("active");
    const activeBtn = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add("active");
  }

  // === Private Validation Methods ===

  /**
   * @private
   * @description Defines all validation rules for form fields.
   */
  setupValidationRules() {
    this.validationRules = {
      hostname: (val) => {
        if (val.trim() === "") return "Hostname cannot be empty.";
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9\- ]*[a-zA-Z0-9])?$/.test(val)) {
          return "Invalid hostname (letters, numbers, spaces, hyphens allowed; must not start or end with space/hyphen).";
        }
        if (val.length > 64) {
          return "Hostname must be at most 64 characters.";
        }
        return true;
      },
      "vlan-id": (val) => {
        if (val.trim() === "") return "VLAN ID cannot be empty.";
        const num = parseInt(val, 10);
        return /^\d+$/.test(val) && num >= 1 && num <= 4094
          ? true
          : "VLAN ID must be a number between 1 and 4094.";
      },
      "vlan-ip": (val) => {
        if (val.trim() === "") return "VLAN IP cannot be empty.";
        if (!this.validateIPv4(val)) return "Invalid VLAN IP address.";

        const cidrStr = this.getValue("vlan-subnet");
        const cidr = parseInt(cidrStr, 10);

        if (cidrStr && !isNaN(cidr) && cidr >= 0 && cidr <= 32) {
          const ipInt = this.ipToInt(val);
          const networkAddressInt = this.getNetworkAddress(val, cidr);
          const broadcastAddressInt = this.getBroadcastAddress(val, cidr);

          if (ipInt === networkAddressInt && cidr < 31) {
            return `VLAN IP cannot be the network address (${this.intToIp(
              networkAddressInt
            )}) for /${cidr}.`;
          }
          if (ipInt === broadcastAddressInt && cidr < 31) {
            return `VLAN IP cannot be the broadcast address (${this.intToIp(
              broadcastAddressInt
            )}) for /${cidr}.`;
          }
        } else if (cidrStr.trim() !== "") {
          return "Please enter a valid Subnet CIDR first.";
        }
        return true;
      },
      "vlan-subnet": (val) => {
        if (val.trim() === "") return "Subnet CIDR cannot be empty.";
        const num = parseInt(val, 10);
        return /^\d{1,2}$/.test(val) && num >= 0 && num <= 32
          ? true
          : "Subnet CIDR must be between 0 and 32.";
      },
      "vlan-network": (val) => {
        if (val.trim() === "") return "Network IP cannot be empty.";
        const ip = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (!this.validateIPv4(val)) return "Invalid network IP address.";

        if (this.validateIPv4(ip) && !isNaN(cidr) && cidr >= 0 && cidr <= 32) {
          const expected = this.getNetworkAddress(ip, cidr);
          const actual = this.getNetworkAddress(val, cidr);
          if (expected === null || actual === null || expected !== actual) {
            return `Network IP (${val}) does not match the network address derived from VLAN IP (${ip}) and Subnet CIDR (/${cidr}). Expected: ${this.intToIp(
              expected
            )}`;
          }
        } else if (ip || !isNaN(cidr)) {
          // Only if VLAN IP or CIDR is filled
          return "Please ensure VLAN IP and Subnet CIDR are valid first.";
        }
        return true;
      },
      "dhcp-range-start": (val) => {
        if (this.dom.dhcpEnableGlobal.value === "yes" && val.trim() === "")
          return "DHCP Range Start cannot be empty when DHCP is enabled globally.";
        if (val.trim() === "") return true; // Optional if DHCP is not enabled

        if (!this.validateIPv4(val)) return "Invalid DHCP range start IP.";

        const vlanIp = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (
          this.validateIPv4(vlanIp) &&
          !isNaN(cidr) &&
          cidr >= 0 &&
          cidr <= 32
        ) {
          if (!this.isSameSubnet(val, vlanIp, cidr)) {
            return "Start IP is not within the same subnet as VLAN IP.";
          }
          const startInt = this.ipToInt(val);
          const networkInt = this.getNetworkAddress(vlanIp, cidr);
          const broadcastInt = this.getBroadcastAddress(vlanIp, cidr);

          if (startInt <= networkInt || startInt >= broadcastInt) {
            return `Start IP must be within the usable range of the subnet (not network or broadcast address).`;
          }
        } else if (vlanIp || !isNaN(cidr)) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },
      "dhcp-range-end": (val) => {
        if (this.dom.dhcpEnableGlobal.value === "yes" && val.trim() === "")
          return "DHCP Range End cannot be empty when DHCP is enabled globally.";
        if (val.trim() === "") return true; // Optional if DHCP is not enabled

        if (!this.validateIPv4(val)) return "Invalid DHCP range end IP.";

        const vlanIp = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);
        const startIp = this.getValue("dhcp-range-start");

        if (
          this.validateIPv4(vlanIp) &&
          !isNaN(cidr) &&
          cidr >= 0 &&
          cidr <= 32
        ) {
          if (!this.isSameSubnet(val, vlanIp, cidr)) {
            return "End IP is not within the same subnet as VLAN IP.";
          }
          const endInt = this.ipToInt(val);
          const networkInt = this.getNetworkAddress(vlanIp, cidr);
          const broadcastInt = this.getBroadcastAddress(vlanIp, cidr);

          if (endInt <= networkInt || endInt >= broadcastInt) {
            return `End IP must be within the usable range of the subnet (not network or broadcast address).`;
          }
          // Compare with start IP
          if (this.validateIPv4(startIp) && endInt < this.ipToInt(startIp)) {
            return "End IP must be greater than or equal to Start IP.";
          }
        } else if (vlanIp || !isNaN(cidr)) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },
      "dhcp-gateway": (val) => {
        if (this.dom.dhcpEnableGlobal.value === "yes" && val.trim() === "")
          return "DHCP Gateway cannot be empty when DHCP is enabled globally.";
        if (val.trim() === "") return true; // Optional if DHCP is not enabled

        if (!this.validateIPv4(val)) return "Invalid gateway IP address.";

        const vlanIp = this.getValue("vlan-ip");
        const cidr = parseInt(this.getValue("vlan-subnet"), 10);

        if (
          this.validateIPv4(vlanIp) &&
          !isNaN(cidr) &&
          cidr >= 0 &&
          cidr <= 32
        ) {
          if (!this.isSameSubnet(val, vlanIp, cidr)) {
            return "Gateway IP is not within the same subnet as VLAN IP.";
          }
          const gatewayInt = this.ipToInt(val);
          const networkInt = this.getNetworkAddress(vlanIp, cidr);
          const broadcastInt = this.getBroadcastAddress(vlanIp, cidr);

          if (gatewayInt === networkInt || gatewayInt === broadcastInt) {
            return `Gateway IP cannot be the network or broadcast address.`;
          }
        } else if (vlanIp || !isNaN(cidr)) {
          return "Please check VLAN IP or Subnet CIDR first.";
        }
        return true;
      },
      "custom-dns": (val) => {
        if (this.dom.dnsOption.value === "custom" && val.trim() === "")
          return "Custom DNS cannot be empty.";
        if (val.trim() === "") return true; // Optional if custom is not selected
        return this.validateIPv4(val) || "Invalid DNS IP address.";
      },
      "port-id": (val) => {
        // This rule is for the initial port input
        const selectedDevice = this.dom.deviceType.value;
        if (selectedDevice === "switch" && val.trim() === "") {
          // Only require if it's the first port and device is switch
          // Dynamically added ports are handled in validateForm()
          const existingPorts =
            this.dom.portGrid.querySelectorAll(".port-controls");
          if (
            existingPorts.length === 1 &&
            existingPorts[0].querySelector('input[name="port-id"]') ===
              document.getElementById("port-id")
          ) {
            return "Port ID cannot be empty.";
          }
        }
        if (val.trim() !== "" && !/^([A-Za-z]+)\d+\/\d+\/\d+$/.test(val)) {
          return "Port ID is not valid (E.g.: GE1/0/1).";
        }
        return true;
      },
    };
  }

  /**
   * @private
   * @description Validates a single input field and updates its UI state.
   * @param {string} id - The ID of the input element.
   * @param {string} value - The current value of the input.
   * @returns {boolean} True if valid, false otherwise.
   */
  validateInput(id, value) {
    const inputElement = document.getElementById(id);
    const rule = this.validationRules[id];

    if (!inputElement || !rule) {
      console.warn(`Validation rule or element not found for ID: ${id}`);
      return true; // Assume valid if no rule/element
    }

    const isValid = rule(value);
    this.updateValidationState(inputElement, isValid);
    return typeof isValid === "boolean" ? isValid : false; // Return boolean validity
  }

  /**
   * @private
   * @description Updates the visual validation state of an input element.
   * @param {HTMLElement} input - The input element.
   * @param {boolean|string} isValid - True if valid, or an error message string.
   */
  updateValidationState(input, isValid) {
    const errorMessageSpan = document.getElementById(`${input.id}-error`);

    if (typeof isValid === "string") {
      input.classList.add("invalid");
      input.setCustomValidity(isValid); // Set custom validity for HTML5 validation pop-up

      if (errorMessageSpan) {
        errorMessageSpan.textContent = isValid;
        errorMessageSpan.style.display = "block";
      }
    } else {
      input.classList.remove("invalid");
      input.setCustomValidity(""); // Clear custom validity

      if (errorMessageSpan) {
        errorMessageSpan.textContent = "";
        errorMessageSpan.style.display = "none";
      }
    }
  }

  /**
   * @private
   * @description Validates the entire form before submission.
   * @returns {boolean} True if the entire form is valid, false otherwise.
   */
  validateForm() {
    let formIsValid = true;

    // Validate all standard form fields based on defined rules
    // Only validate fields visible for the selected device type
    const selectedDevice = this.dom.deviceType.value;
    if (selectedDevice === "switch") {
      // Validate all required inputs within switch-fields
      const switchInputs = this.dom.switchFields.querySelectorAll(
        'input[type="text"], input[type="number"], select'
      );
      switchInputs.forEach((input) => {
        if (input.hasAttribute("required") || input.value.trim() !== "") {
          // Only validate if required or has value
          const isValid = this.validationRules[input.id]
            ? this.validationRules[input.id](input.value)
            : true;
          this.updateValidationState(input, isValid);
          if (typeof isValid === "string") {
            formIsValid = false;
          }
        }
      });
    } else {
      // For other device types, only validate device-type selection if needed
      if (selectedDevice === "") {
        // Handle error for unselected device type
        const deviceTypeErrorSpan =
          document.getElementById("device-type-error"); // Assuming you add this span in HTML
        if (deviceTypeErrorSpan) {
          deviceTypeErrorSpan.textContent = "Please choose a device type.";
          deviceTypeErrorSpan.style.display = "block";
        }
        formIsValid = false;
      }
    }

    // Validate dynamically added port inputs
    const portInputs = document.querySelectorAll(
      '.port-controls input[name="port-id"]'
    );
    portInputs.forEach((input) => {
      const isValid = this.validationRules["port-id"](input.value); // Use the general port-id rule
      this.updateValidationState(input, isValid);
      if (typeof isValid === "string") {
        formIsValid = false;
      }
    });

    return formIsValid;
  }

  // === Private IP Network Utilities ===

  /**
   * @private
   * @description Converts an IPv4 address string to an integer.
   * @param {string} ip - The IPv4 address.
   * @returns {number} The integer representation of the IP.
   */
  ipToInt(ip) {
    return ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  }

  /**
   * @private
   * @description Converts an integer to an IPv4 address string.
   * @param {number} int - The integer representation of the IP.
   * @returns {string} The IPv4 address string.
   */
  intToIp(int) {
    return [
      (int >>> 24) & 0xff,
      (int >>> 16) & 0xff,
      (int >>> 8) & 0xff,
      int & 0xff,
    ].join(".");
  }

  /**
   * @private
   * @description Calculates the subnet mask from a CIDR value.
   * @param {number} cidr - The CIDR value (0-32).
   * @returns {number} The integer representation of the subnet mask.
   */
  getSubnetMask(cidr) {
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      console.warn("Invalid CIDR provided to getSubnetMask:", cidr);
      return 0;
    }
    return (0xffffffff << (32 - cidr)) >>> 0;
  }

  /**
   * @private
   * @description Calculates the network address from an IP and CIDR.
   * @param {string} ip - The IPv4 address.
   * @param {number} cidr - The CIDR value.
   * @returns {number|null} The integer representation of the network address, or null if invalid input.
   */
  getNetworkAddress(ip, cidr) {
    if (!this.validateIPv4(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
      return null;
    }
    const ipInt = this.ipToInt(ip);
    const mask = this.getSubnetMask(cidr);
    return ipInt & mask;
  }

  /**
   * @private
   * @description Calculates the broadcast address from an IP and CIDR.
   * @param {string} ip - The IPv4 address.
   * @param {number} cidr - The CIDR value.
   * @returns {number|null} The integer representation of the broadcast address, or null if invalid input.
   */
  getBroadcastAddress(ip, cidr) {
    if (!this.validateIPv4(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
      return null;
    }
    const ipInt = this.ipToInt(ip);
    const mask = this.getSubnetMask(cidr);
    const networkAddressInt = ipInt & mask;
    const invertedMask = ~mask >>> 0;
    return (networkAddressInt | invertedMask) >>> 0;
  }

  /**
   * @private
   * @description Checks if two IPs are within the same subnet.
   * @param {string} ip1 - First IPv4 address.
   * @param {string} ip2 - Second IPv4 address.
   * @param {number} cidr - The CIDR value.
   * @returns {boolean} True if they are in the same subnet, false otherwise.
   */
  isSameSubnet(ip1, ip2, cidr) {
    if (
      !this.validateIPv4(ip1) ||
      !this.validateIPv4(ip2) ||
      isNaN(cidr) ||
      cidr < 0 ||
      cidr > 32
    ) {
      return false;
    }
    return (
      this.getNetworkAddress(ip1, cidr) === this.getNetworkAddress(ip2, cidr)
    );
  }

  /**
   * @private
   * @description Validates if a string is a valid IPv4 address.
   * @param {string} ip - The IP address string.
   * @returns {boolean} True if valid, false otherwise.
   */
  validateIPv4(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ip
    );
  }

  /**
   * @private
   * @description Suggests a common CIDR based on an IPv4 address.
   * @param {string} ip - The IPv4 address.
   * @returns {number|null} Suggested CIDR or null.
   */
  getSuggestedCidr(ip) {
    if (!this.validateIPv4(ip)) {
      return null;
    }
    const octets = ip.split(".").map(Number);
    if (octets[0] >= 192 && octets[0] <= 223) return 24;
    if (octets[0] >= 128 && octets[0] <= 191) return 16;
    if (octets[0] >= 1 && octets[0] <= 126) return 8;
    return null;
  }

  /**
   * @private
   * @description Handles input change for VLAN IP, triggering CIDR suggestion and related validations.
   */
  handleVlanIpInput() {
    const vlanIp = this.dom.vlanIp.value;
    const currentSubnet = this.dom.vlanSubnet.value.trim();

    // Auto-fill subnet if IP is valid and subnet is empty
    if (this.validateIPv4(vlanIp) && currentSubnet === "") {
      const suggestedCidr = this.getSuggestedCidr(vlanIp);
      if (suggestedCidr !== null) {
        this.setValue("vlan-subnet", String(suggestedCidr));
        this.validateInput("vlan-subnet", String(suggestedCidr)); // Re-validate subnet after auto-fill
      }
    }
    // Re-validate dependent fields
    this.validateInput("vlan-ip", vlanIp);
    this.validateInput("vlan-network", this.getValue("vlan-network"));
    this.validateInput("dhcp-range-start", this.getValue("dhcp-range-start"));
    this.validateInput("dhcp-range-end", this.getValue("dhcp-range-end"));
    this.validateInput("dhcp-gateway", this.getValue("dhcp-gateway"));
  }

  /**
   * @private
   * @description Handles input change for VLAN Subnet, triggering related validations.
   */
  handleVlanSubnetInput() {
    // Re-validate dependent fields
    this.validateInput("vlan-subnet", this.getValue("vlan-subnet"));
    this.validateInput("vlan-ip", this.getValue("vlan-ip")); // Re-validate VLAN IP if subnet changes
    this.validateInput("vlan-network", this.getValue("vlan-network"));
    this.validateInput("dhcp-range-start", this.getValue("dhcp-range-start"));
    this.validateInput("dhcp-range-end", this.getValue("dhcp-range-end"));
    this.validateInput("dhcp-gateway", this.getValue("dhcp-gateway"));
  }

  // === Private Port Management Methods ===

  /**
   * @private
   * @description Adds a new row for port configuration.
   */
  addPortRow() {
    if (!this.dom.portGrid) return;

    const portControls = document.createElement("div");
    portControls.className = "port-controls";
    const uniqueId = `port-id-${Date.now()}`; // Ensure unique ID for new port inputs

    portControls.innerHTML = `
        <input type="text" name="port-id" id="${uniqueId}" placeholder="port ID (E.g.: GE1/0/1)" required />
        <span class="error-message" id="${uniqueId}-error"></span>
        <select name="port-mode">
          <option value="access">Access</option>
          <option value="trunk">Trunk</option>
        </select>
        <label class="poe-toggle">
          <input type="checkbox" name="port-poe" />
          <span>POE</span>
        </label>
        <button type="button" class="remove-port">Remove</button>
    `;

    const newPortIdInput = portControls.querySelector('input[name="port-id"]');
    if (newPortIdInput) {
      // Bind validation to the new port ID input
      newPortIdInput.addEventListener("input", () => {
        this.validateInput("port-id", newPortIdInput.value); // Use the generic port-id rule
      });
    }

    this.dom.portGrid.appendChild(portControls);
  }

  /**
   * @private
   * @description Handles click events for dynamically added port removal buttons.
   * @param {Event} e - The click event.
   */
  handlePortRemoval(e) {
    if (e.target.classList.contains("remove-port")) {
      const portRow = e.target.closest(".port-controls");
      if (portRow && this.dom.portGrid) {
        this.dom.portGrid.removeChild(portRow);
      }
    }
  }

  /**
   * @private
   * @description Collects data from all dynamically added port rows.
   * @returns {Array<Object>} An array of port configuration objects.
   */
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

  // === Private Configuration Generation Methods ===

  /**
   * @private
   * @description Generates the configuration based on form inputs.
   * @param {Event} e - The submit event.
   */
  generateConfig(e) {
    e.preventDefault();

    // Re-validate the entire form on submit
    if (!this.validateForm()) {
      this.showError("Please correct the errors in the form.");
      return;
    }

    try {
      const device = this.getValue("device-type");
      const hostname = this.getValue("hostname") || "device"; // Default hostname

      let config = `system-view\n`;
      config += `sysname ${hostname}\n`;

      if (device === "switch") {
        config += this.generateSwitchConfig();
      } else if (device === "router") {
        config += "! Router configuration placeholder\n";
      } else if (device === "ap") {
        config += "! Access Point configuration placeholder\n";
      } else {
        this.showError("Please select a device type.");
        return;
      }

      config += "exit\nsave force\n";
      this.setValue("config-output", config);
    } catch (error) {
      console.error("Error generating config:", error);
      this.showError("Failed to generate configuration: " + error.message);
    }
  }

  /**
   * @private
   * @description Generates H3C specific configuration for a switch.
   * @returns {string} The switch configuration commands.
   */
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
      config += this.generateVlanInterfaceConfig(vlanId, vlanIp, vlanSubnet);
      // DHCP Pool depends on VLAN interface config
      const dhcpRangeStart = this.getValue("dhcp-range-start");
      const dhcpRangeEnd = this.getValue("dhcp-range-end");
      const dhcpGateway = this.getValue("dhcp-gateway");
      const vlanNetwork = this.getValue("vlan-network");

      // Only generate DHCP pool if all required fields are filled and DHCP is globally enabled
      if (
        this.getValue("dhcp-enable-global") === "yes" &&
        dhcpRangeStart &&
        dhcpRangeEnd &&
        dhcpGateway &&
        vlanNetwork
      ) {
        config += this.generateDhcpPoolConfig(
          vlanId,
          vlanNetwork,
          vlanSubnet,
          dhcpGateway,
          dhcpRangeStart,
          dhcpRangeEnd
        );
      }
    }

    // Port Configs
    config += this.generatePortConfigs(vlanId);

    return config;
  }

  /**
   * @private
   * @description Generates VLAN interface configuration.
   * @param {string} vlanId - The VLAN ID.
   * @param {string} vlanIp - The VLAN interface IP.
   * @param {string} vlanSubnet - The VLAN subnet CIDR.
   * @returns {string} VLAN interface commands.
   */
  generateVlanInterfaceConfig(vlanId, vlanIp, vlanSubnet) {
    let config = `vlan ${vlanId}\nexit\n`;
    config += `interface Vlan-interface${vlanId}\n`;
    config += ` ip address ${vlanIp} ${this.cidrToNetmask(vlanSubnet)}\n`;
    config += `exit\n`;
    return config;
  }

  /**
   * @private
   * @description Generates DHCP server pool configuration.
   * @param {string} vlanId - The VLAN ID for the pool name.
   * @param {string} network - The network address.
   * @param {string} subnet - The subnet CIDR.
   * @param {string} gateway - The DHCP gateway IP.
   * @param {string} rangeStart - The start of the DHCP range.
   * @param {string} rangeEnd - The end of the DHCP range.
   * @returns {string} DHCP pool commands.
   */
  generateDhcpPoolConfig(
    vlanId,
    network,
    subnet,
    gateway,
    rangeStart,
    rangeEnd
  ) {
    const dns =
      this.getValue("dns-option") === "custom"
        ? this.getValue("custom-dns")
        : this.getValue("dns-option");

    let config = `dhcp server ip-pool VLAN${vlanId}\n`;
    config += ` network ${network} mask ${this.cidrToNetmask(subnet)}\n`;
    config += ` gateway-list ${gateway}\n`;
    if (dns) {
      // Only add DNS if a value exists
      config += ` dns-list ${dns}\n`;
    }
    config += ` address range ${rangeStart} ${rangeEnd}\n`;
    config += `exit\n`;

    config += `interface Vlan-interface${vlanId}\n`;
    config += ` dhcp select server ip-pool VLAN${vlanId}\nexit\n`; // Correct command for H3C
    return config;
  }

  /**
   * @private
   * @description Generates port configurations.
   * @param {string} vlanId - The default VLAN ID for access ports.
   * @returns {string} Port configuration commands.
   */
  generatePortConfigs(vlanId) {
    let config = "";
    const portBlocks = document.querySelectorAll(".port-controls"); // Re-query to get all current ports

    portBlocks.forEach((block) => {
      const portId = block.querySelector('input[name="port-id"]').value;
      if (!portId) return; // Skip if port ID is empty

      const portMode = block.querySelector('select[name="port-mode"]').value;
      const portPoe = block.querySelector('input[name="port-poe"]').checked;

      config += `interface ${portId}\n`;

      if (portMode === "access" && vlanId) {
        config += ` port link-type access\n port access vlan ${vlanId}\n`;
      } else if (portMode === "trunk" && vlanId) {
        config += ` port link-type trunk\n port trunk permit vlan ${vlanId}\n`;
      }

      if (portPoe) config += ` poe enable\n`;
      config += `exit\n`;
    });

    return config;
  }

  // === Private Configuration Management Methods (API Calls) ===

  /**
   * @private
   * @description Saves the generated configuration to the database.
   */
  async saveConfig() {
    try {
      const configText = this.getValue("config-output");
      const deviceType = this.getValue("device-type");
      const hostname = this.getValue("hostname") || "unnamed-device";
      const ports = this.collectPortData(); // Ensure ports are collected

      if (!configText) {
        throw new Error("No configuration to save");
      }

      const payload = {
        device_type: deviceType,
        hostname: hostname,
        dhcp_enable_global: this.getValue("dhcp-enable-global") === "yes", // Convert to boolean
        vlan_id: this.getValue("vlan-id")
          ? parseInt(this.getValue("vlan-id"), 10)
          : null,
        vlan_ip: this.getValue("vlan-ip") || null,
        vlan_subnet: this.getValue("vlan-subnet")
          ? parseInt(this.getValue("vlan-subnet"), 10)
          : null,
        vlan_network: this.getValue("vlan-network") || null,
        dhcp_range_start: this.getValue("dhcp-range-start") || null,
        dhcp_range_end: this.getValue("dhcp-range-end") || null,
        dhcp_gateway: this.getValue("dhcp-gateway") || null,
        dns_option: this.getValue("dns-option") || null,
        custom_dns: this.getValue("custom-dns") || null,
        config_text: configText,
        ports: ports, // Array of port objects
      };

      await this.apiRequest("/", "POST", payload);

      this.showSuccess("Configuration saved successfully");
      await this.loadConfigHistory(); // Reload active configs
    } catch (error) {
      console.error("Error saving config:", error);
      this.showError(error.message || "Failed to save configuration");
    }
  }

  /**
   * @private
   * @description Deletes a configuration from the database.
   * @param {string} configId - The ID of the configuration to delete.
   */
  async deleteConfig(configId) {
    try {
      if (!confirm("Are you sure you want to delete this configuration?"))
        return;

      await this.apiRequest(`/${configId}`, "DELETE");
      this.showSuccess("Configuration deleted successfully");
      await this.loadConfigHistory(); // Reload active configs
    } catch (error) {
      console.error("Error deleting config:", error);
      this.showError(error.message || "Failed to delete configuration");
    }
  }

  /**
   * @private
   * @description Restores a soft-deleted configuration.
   * @param {string} configId - The ID of the configuration to restore.
   */
  async restoreConfig(configId) {
    try {
      if (!confirm("Pulihkan konfigurasi ini?")) return;

      await this.apiRequest(`/restore/${configId}`, "PATCH");
      this.showSuccess("Configuration restored successfully");
      await this.loadConfigHistory(true); // Reload deleted history (or active if it moves back)
    } catch (error) {
      console.error("Error restoring config:", error);
      this.showError(error.message || "Failed to restore configuration");
    }
  }

  // === Private History Management Methods ===

  /**
   * @private
   * @description Loads configuration history from the API.
   * @param {boolean} showDeleted - If true, loads deleted history.
   */
  async loadConfigHistory(showDeleted = false) {
    try {
      this.showLoader(true);
      this.setActiveTab(showDeleted ? "tab-deleted" : "tab-active");
      const endpoint = showDeleted ? "/deleted" : "/history";
      const history = await this.apiRequest(endpoint);
      
      if (!Array.isArray(history)) {
        throw new Error('Invalid history data format');
      }
      
      this.renderHistoryList(history, showDeleted);
    } catch (error) {
      console.error('Error loading history:', error);
      this.showError(`Failed to load history: ${error.message}`);
      this.dom.historyList.innerHTML = `
        <div class="error-history">
          Failed to load history. Please try again.
        </div>
      `;
    } finally {
      this.showLoader(false);
    }
  }

  /**
   * @private
   * @description Shows or hides loading state
   * @param {boolean} show - Whether to show loader
   */
  showLoader(show) {
    if (show) {
      this.dom.historyList.innerHTML = `
        <div class="loading-history">
          <div class="loading-spinner"></div>
          Loading history...
        </div>
      `;
    }
  }

  /**
   * @private
   * @description Renders history list to DOM
   * @param {Array} history - Array of history items
   * @param {boolean} isDeletedView - Whether showing deleted items
   */
  renderHistoryList(history, isDeletedView) {
    this.dom.historyList.innerHTML = "";

    if (history.length === 0) {
      this.dom.historyList.innerHTML = `
        <div class="empty-history">
          No ${isDeletedView ? "deleted" : "saved"} configurations
        </div>
      `;
      return;
    }

    history.forEach((item) => {
      const itemEl = this.createHistoryItem(item, isDeletedView);
      this.dom.historyList.appendChild(itemEl);
    });
  }

  /**
   * @private
   * @description Creates a single history item DOM element
   * @param {Object} item - History item data
   * @param {boolean} isDeleted - Whether item is deleted
   * @returns {HTMLElement} - Constructed DOM element
   */
  createHistoryItem(item, isDeleted) {
    const itemEl = document.createElement("div");
    itemEl.className = `history-item ${isDeleted ? "deleted" : ""}`;
    
    const createdAt = new Date(item.created_at);
    const formattedDate = createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    itemEl.innerHTML = `
      <div class="history-header">
      <span class="device-type-label">Device : </span>
        <span class="device-type">${this.escapeHtml(item.device_type || 'Unknown')}</span>
        <span class="hostname-label">Hostname : </span>
        <span class="hostname">${this.escapeHtml(item.hostname || 'No hostname')}</span>
        <button class="${isDeleted ? 'restore-btn' : 'delete-btn'}" 
                data-config-id="${item.id}">
          ${isDeleted ? 'Restore' : 'Delete'}
        </button>
      </div>
      <pre class="config-text">${this.escapeHtml(item.config_text)}</pre>
      <div class="history-footer">
        <small class="timestamp">Saved: ${formattedDate}</small>
      </div>
    `;

    return itemEl;
  }

  /**
   * @private
   * @description Handles history item actions (delete/restore)
   * @param {Event} e - Click event
   */
  handleHistoryAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const configId = btn.dataset.configId;
    
    if (btn.classList.contains('delete-btn')) {
      if (confirm('Are you sure you want to delete this configuration?')) {
        this.deleteConfig(configId);
      }
    } else if (btn.classList.contains('restore-btn')) {
      if (confirm('Restore this configuration?')) {
        this.restoreConfig(configId);
      }
    }
  }

  /**
   * @private
   * @description Sets active history tab visually
   * @param {string} tabId - ID of tab to activate
   */
  setActiveTab(tabId) {
    this.dom.tabActive.classList.remove('active');
    this.dom.tabDeleted.classList.remove('active');
    document.getElementById(tabId).classList.add('active');
  }

  // === Private Utility Methods ===

  /**
   * @private
   * @description Makes an API request to the backend.
   * @param {string} endpoint - The API endpoint.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH).
   * @param {Object} body - Request body for POST/PUT/PATCH.
   * @returns {Promise<Object>} The JSON response data.
   * @throws {Error} If the request fails or token is missing.
   */
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

  /**
   * @private
   * @description Gets the value of a form element by its ID.
   * @param {string} id - The ID of the element.
   * @returns {string} The value of the element, or an empty string if not found.
   */
  getValue(id) {
    const element = this.dom[id] || document.getElementById(id); // Check cached DOM first
    return element ? element.value : "";
  }

  /**
   * @private
   * @description Sets the value of a form element by its ID.
   * @param {string} id - The ID of the element.
   * @param {string} value - The value to set.
   */
  setValue(id, value) {
    const element = this.dom[id] || document.getElementById(id); // Check cached DOM first
    if (element) element.value = value;
  }

  /**
   * @private
   * @description Converts a CIDR value to a subnet mask string.
   * @param {number} cidr - The CIDR value.
   * @returns {string} The subnet mask string (e.g., "255.255.255.0").
   */
  cidrToNetmask(cidr) {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [24, 16, 8, 0].map((s) => (mask >>> s) & 255).join(".");
  }

  /**
   * @private
   * @description Copies the generated configuration text to the clipboard.
   */
  async copyConfig() {
    try {
      const text = this.getValue("config-output");
      if (!text) throw new Error("No configuration to copy");

      await navigator.clipboard.writeText(text);
      this.showSuccess("Configuration copied to clipboard");
    } catch (error) {
      console.error("Error copying config:", error);
      this.showError(error.message || "Failed to copy configuration");
    }
  }

  /**
   * @private
   * @description Exports the generated configuration to a TXT file.
   */
  exportConfig() {
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
  }

  /**
   * @private
   * @description Escapes HTML special characters to prevent XSS.
   * @param {string} unsafe - The unsafe string.
   * @returns {string} The escaped string.
   */
  escapeHtml(unsafe) {
    if (typeof unsafe !== "string") return unsafe; // Handle non-string inputs
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * @private
   * @description Displays a success message to the user.
   * @param {string} message - The success message.
   */
  showSuccess(message) {
    alert(message);
  }

  /**
   * @private
   * @description Displays an error message to the user.
   * @param {string} message - The error message.
   */
  showError(message) {
    alert(message);
  }

  // No explicit destroy method needed for this app's lifecycle,
  // but included for completeness if resources needed cleanup.
  destroy() {
    // Clean up event listeners if necessary
  }
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new NetworkConfigApp();
});
