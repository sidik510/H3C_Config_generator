import dashboardService from "../services/dashboardService.js";

const dashboardController = {
  getConfigHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await dashboardService.getConfigHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      console.error("Error loading config history:", error);
      res.status(500).json({ message: "Error loading config history" });
    }
  },

  saveConfig: async (req, res) => {
    try {
      const configData = {
        user_id: req.user.id,
        device_type: req.body.device_type,
        hostname: req.body.hostname,
        dhcp_enable_global: req.body.dhcp_enable_global || "no",
        vlan_id: req.body.vlan_id,
        vlan_ip: req.body.vlan_ip,
        vlan_subnet: req.body.vlan_subnet,
        vlan_network: req.body.vlan_network,
        dhcp_range_start: req.body.dhcp_range_start,
        dhcp_range_end: req.body.dhcp_range_end,
        dhcp_gateway: req.body.dhcp_gateway,
        dns_option: req.body.dns_option,
        custom_dns: req.body.custom_dns,
        config_text: req.body.config_text,
      };

      const ports = req.body.ports || [];

      const savedConfig = await dashboardService.saveConfig(configData, ports);

      res.status(201).json({
        message: "Configuration and ports saved successfully",
        config: savedConfig,
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      res.status(500).json({
        message: error.message || "Error saving configuration",
      });
    }
  },

  deleteConfig: async (req, res) => {
    console.log("req.user:", req.user);
    try {
      const configId = req.params.configId;
      const userId = req.user?.id;

      if (!configId || !userId) {
        return res.status(400).json({ message: "Invalid configId or userId" });
      }

      const affectedRows = await dashboardService.deleteConfig(
        configId,
        userId
      );

      if (affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Configuration not found or already deleted" });
      }

      res.json({ message: "Configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting configuration:", error);
      res
        .status(500)
        .json({ message: error.message || "Error deleting configuration" });
    }
  },

  getDeletedHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await dashboardService.getDeletedHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ message: "Error loading deleted history" });
    }
  },

  restoreConfig: async (req, res) => {
    try {
      const configId = req.params.configId;
      const userId = req.user.id;

      await dashboardService.restoreConfig(configId, userId);
      res.status(200).json({ message: "Configuration restored successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Error restoring configuration" });
    }
  },
};

export default dashboardController;
